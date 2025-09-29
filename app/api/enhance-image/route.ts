import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const enhancementType = (formData.get("type") as string) || "quality" // "quality", "upscale", "colorize"

    if (!imageFile) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    try {
      let enhancementPrompt: string

      switch (enhancementType) {
        case "upscale":
          enhancementPrompt =
            "high resolution, ultra detailed, sharp, crisp, enhanced quality, 4K, professional photography"
          break
        case "colorize":
          enhancementPrompt =
            "vibrant colors, enhanced saturation, natural color grading, professional color correction"
          break
        case "quality":
        default:
          enhancementPrompt =
            "enhanced quality, improved clarity, noise reduction, professional photo enhancement, sharp details"
          break
      }

      const imageBuffer = await imageFile.arrayBuffer()

      // Create a subtle mask for enhancement
      const maskCanvas = new OffscreenCanvas(1024, 1024)
      const maskCtx = maskCanvas.getContext("2d")
      if (maskCtx) {
        // Create a gradient mask for subtle enhancement
        const gradient = maskCtx.createRadialGradient(512, 512, 0, 512, 512, 512)
        gradient.addColorStop(0, "rgba(255,255,255,0.3)")
        gradient.addColorStop(1, "rgba(255,255,255,0.1)")
        maskCtx.fillStyle = gradient
        maskCtx.fillRect(0, 0, 1024, 1024)
      }
      const maskBlob = await maskCanvas.convertToBlob()

      const openaiFormData = new FormData()
      openaiFormData.append("image", new Blob([imageBuffer]), "image.png")
      openaiFormData.append("mask", maskBlob, "mask.png")
      openaiFormData.append("prompt", enhancementPrompt)
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
        throw new Error(errorData.error?.message || "OpenAI API error")
      }

      const data = await response.json()
      const enhancedImageUrl = data.data[0].url

      // Auto-save the enhanced image
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        await fetch(`${request.nextUrl.origin}/api/auto-save-generation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // userId is derived inside auto-save using session
            type: "ai-edit",
            prompt: `Image Enhancement: ${enhancementType}`,
            refinedPrompt: enhancementPrompt,
            model: "dall-e-2",
            result: { imageUrl: enhancedImageUrl },
            colors: [],
            brandVoice: {},
            advancedOptions: { editType: "enhancement", enhancementType },
            aspectRatio: "1:1",
            tags: ["ai-edit", "enhancement", enhancementType],
          }),
        })
      } catch (autoSaveError) {
        console.warn("Auto-save failed:", autoSaveError)
      }

      return NextResponse.json({
        success: true,
        imageUrl: enhancedImageUrl,
        message: `Image ${enhancementType} completed successfully`,
      })
    } catch (error) {
      console.error("Image enhancement error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Enhancement failed" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Request processing error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
