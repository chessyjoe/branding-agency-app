import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const method = (formData.get("method") as string) || "ai" // "ai" or "api"

    if (!imageFile) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 })
    }

    let processedImageUrl: string

    if (method === "api") {
      // Use Remove.bg API (if available)
      const removeBgApiKey = process.env.REMOVE_BG_API_KEY

      if (!removeBgApiKey) {
        return NextResponse.json({ error: "Remove.bg API key not configured" }, { status: 500 })
      }

      try {
        const removeBgFormData = new FormData()
        removeBgFormData.append("image_file", imageFile)
        removeBgFormData.append("size", "auto")

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": removeBgApiKey,
          },
          body: removeBgFormData,
        })

        if (!response.ok) {
          throw new Error("Remove.bg API error")
        }

        const processedImageBuffer = await response.arrayBuffer()

        // Convert to base64 data URL for immediate use
        const base64Image = Buffer.from(processedImageBuffer).toString("base64")
        processedImageUrl = `data:image/png;base64,${base64Image}`
      } catch (error) {
        console.error("Remove.bg API error:", error)
        return NextResponse.json({ error: "Background removal failed" }, { status: 500 })
      }
    } else {
      // Use AI-based background removal (OpenAI or custom implementation)
      const openaiApiKey = process.env.OPENAI_API_KEY

      if (!openaiApiKey) {
        return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
      }

      try {
        // Create a mask for background removal using AI
        const imageBuffer = await imageFile.arrayBuffer()

        // Create a white mask (remove everything except the main subject)
        const maskCanvas = new OffscreenCanvas(1024, 1024)
        const maskCtx = maskCanvas.getContext("2d")
        if (maskCtx) {
          maskCtx.fillStyle = "white"
          maskCtx.fillRect(0, 0, 1024, 1024)
        }
        const maskBlob = await maskCanvas.convertToBlob()

        const openaiFormData = new FormData()
        openaiFormData.append("image", new Blob([imageBuffer]), "image.png")
        openaiFormData.append("mask", maskBlob, "mask.png")
        openaiFormData.append("prompt", "transparent background, isolated subject, clean cutout")
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
        processedImageUrl = data.data[0].url
      } catch (error) {
        console.error("AI background removal error:", error)
        return NextResponse.json({ error: "AI background removal failed" }, { status: 500 })
      }
    }

    // Auto-save the processed image
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
          // userId derived from session in auto-save
          type: "ai-edit",
          prompt: "Background Removal",
          refinedPrompt: "Background removed using AI",
          model: method === "api" ? "remove-bg" : "dall-e-2",
          result: { imageUrl: processedImageUrl },
          colors: [],
          brandVoice: {},
          advancedOptions: { editType: "background-removal", method },
          aspectRatio: "1:1",
          tags: ["ai-edit", "background-removal", "cutout"],
        }),
      })
    } catch (autoSaveError) {
      console.warn("Auto-save failed:", autoSaveError)
    }

    return NextResponse.json({
      success: true,
      imageUrl: processedImageUrl,
      message: "Background removed successfully",
    })
  } catch (error) {
    console.error("Background removal error:", error)
    return NextResponse.json({ error: "Background removal failed" }, { status: 500 })
  }
}
