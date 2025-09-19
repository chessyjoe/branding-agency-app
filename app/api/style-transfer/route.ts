import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const contentImageFile = formData.get("contentImage") as File
    const styleImageFile = formData.get("styleImage") as File
    const userId = formData.get("userId") as string
    const strength = (formData.get("strength") as string) || "0.7"

    if (!contentImageFile || !styleImageFile) {
      return NextResponse.json({ error: "Both content and style images are required" }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    try {
      // For style transfer, we'll use a creative approach with OpenAI's image editing
      // First, we need to analyze the style image and create a descriptive prompt
      const styleAnalysisPrompt =
        "artistic style transfer, blend the artistic style and visual characteristics from the reference image, maintain the content structure while adopting the color palette, brushwork, and aesthetic qualities"

      const contentImageBuffer = await contentImageFile.arrayBuffer()

      // Create a mask for style transfer (full image with varying opacity)
      const maskCanvas = new OffscreenCanvas(1024, 1024)
      const maskCtx = maskCanvas.getContext("2d")
      if (maskCtx) {
        const alpha = Number.parseFloat(strength)
        maskCtx.fillStyle = `rgba(255,255,255,${alpha})`
        maskCtx.fillRect(0, 0, 1024, 1024)
      }
      const maskBlob = await maskCanvas.convertToBlob()

      const openaiFormData = new FormData()
      openaiFormData.append("image", new Blob([contentImageBuffer]), "content.png")
      openaiFormData.append("mask", maskBlob, "mask.png")
      openaiFormData.append("prompt", styleAnalysisPrompt)
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
      const styledImageUrl = data.data[0].url

      // Auto-save the styled image
      try {
        await fetch(`${request.nextUrl.origin}/api/auto-save-generation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId || "demo-user",
            type: "ai-edit",
            prompt: "Style Transfer",
            refinedPrompt: "Artistic style transfer applied",
            model: "dall-e-2",
            result: { imageUrl: styledImageUrl },
            colors: [],
            brandVoice: {},
            advancedOptions: { editType: "style-transfer", strength },
            aspectRatio: "1:1",
            tags: ["ai-edit", "style-transfer", "artistic"],
          }),
        })
      } catch (autoSaveError) {
        console.warn("Auto-save failed:", autoSaveError)
      }

      return NextResponse.json({
        success: true,
        imageUrl: styledImageUrl,
        message: "Style transfer completed successfully",
      })
    } catch (error) {
      console.error("Style transfer error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Style transfer failed" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Request processing error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
