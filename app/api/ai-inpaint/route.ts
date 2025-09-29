import { type NextRequest, NextResponse } from "next/server"
import { validateAuthentication, rateLimiter } from "@/lib/auth-utils"
import { validateFileType, validateFileSize } from "@/lib/encryption"
import { validateString } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await validateAuthentication(request)
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimiter.checkLimit(`inpaint-${user.id}-${clientIP}`, 5, 300000)) {
      // 5 requests per 5 minutes
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const maskFile = formData.get("mask") as File
    const prompt = formData.get("prompt") as string
    const model = (formData.get("model") as string) || "dall-e-2"

    if (!imageFile || !maskFile || !prompt) {
      return NextResponse.json({ error: "Missing required fields: image, mask, and prompt" }, { status: 400 })
    }

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validateFileType(imageFile, allowedImageTypes) || !validateFileType(maskFile, allowedImageTypes)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 })
    }

    const maxFileSizeMB = 10
    if (!validateFileSize(imageFile, maxFileSizeMB) || !validateFileSize(maskFile, maxFileSizeMB)) {
      return NextResponse.json({ error: `File size must be less than ${maxFileSizeMB}MB` }, { status: 400 })
    }

    // Validate and sanitize inputs using central utility
    const sanitizedPrompt = validateString(prompt, 500)
    const sanitizedModel = validateString(model, 50, /^[\w-]+$/)

    // user.id from the authenticated session is the source of truth

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    try {
      // Convert files to the format expected by OpenAI
      const imageBuffer = await imageFile.arrayBuffer()
      const maskBuffer = await maskFile.arrayBuffer()

      // Create form data for OpenAI API
      const openaiFormData = new FormData()
      openaiFormData.append("image", new Blob([imageBuffer]), "image.png")
      openaiFormData.append("mask", new Blob([maskBuffer]), "mask.png")
      openaiFormData.append("prompt", sanitizedPrompt)
      openaiFormData.append("n", "1")
      openaiFormData.append("size", "1024x1024")

      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: openaiFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API error:", errorData)
        return NextResponse.json({ error: "Image processing failed" }, { status: 500 })
      }

      const data = await response.json()
      const editedImageUrl = data.data[0].url

      // Auto-save the edited image
      try {
        await fetch(`${request.nextUrl.origin}/api/auto-save-generation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            type: "ai-edit",
            prompt: `AI Inpainting: ${sanitizedPrompt}`,
            refinedPrompt: sanitizedPrompt,
            model: sanitizedModel, // Use sanitizedModel if needed for downstream API calls
            result: { imageUrl: editedImageUrl },
            colors: [],
            brandVoice: {},
            advancedOptions: { editType: "inpaint" },
            aspectRatio: "1:1",
            tags: ["ai-edit", "inpainting", "edited"],
          }),
        })
      } catch (autoSaveError) {
        console.warn("Auto-save failed:", autoSaveError)
      }

      return NextResponse.json({
        success: true,
        imageUrl: editedImageUrl,
        message: "Image inpainting completed successfully",
      })
    } catch (error) {
      console.error("AI inpainting error:", error)
      return NextResponse.json({ error: "Image processing failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Request processing error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
