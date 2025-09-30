import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createUniversalDualService, type UniversalDualRequest } from "@/lib/dual-generation/universal-service"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Universal dual generation API called")

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      prompt, 
      type = "logo", 
      colors = [], 
      brandVoice = {}, 
      advancedOptions = {},
      eventDetails = {},
      customContext = {},
      width = 400,
      height = 400,
      // Display generation options
      model = "dall-e-3",
      apiKeys = {}
    } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[v0] Generating dual content for:", { type, promptLength: prompt.length, colors })

    // Create dual generation service
    const dualService = createUniversalDualService(openaiApiKey)

    // Create display content generator based on type
    const displayContentGenerator = async (prompt: string, options: any): Promise<string> => {
      // This would call the appropriate generation API based on type
      // For now, we'll simulate this with a placeholder
      return await generateDisplayContent(type, prompt, options, model, apiKeys)
    }

    // Generate dual content
    const result = await dualService.generateDualContent(
      {
        prompt,
        type,
        colors,
        brandVoice,
        advancedOptions,
        eventDetails,
        customContext,
        width,
        height
      },
      displayContentGenerator
    )

    if (result.success) {
      console.log("[v0] Dual generation successful")
      console.log("[v0] Has display image:", result.metadata?.hasDisplayImage)
      console.log("[v0] Has SVG:", result.metadata?.hasSvg)
      console.log("[v0] SVG length:", result.metadata?.svgLength)

      return NextResponse.json({
        success: true,
        displayImage: result.displayImage,
        svgContent: result.svgContent,
        fallback: result.fallback,
        metadata: result.metadata
      })
    } else {
      console.error("[v0] Dual generation failed:", result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error("[v0] Universal dual generation error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Dual generation failed",
        success: false
      }, 
      { status: 500 }
    )
  }
}

/**
 * Generate display content based on type
 * This would integrate with existing generation APIs
 */
async function generateDisplayContent(
  type: string, 
  prompt: string, 
  options: any, 
  model: string, 
  apiKeys: any
): Promise<string> {
  // This is a placeholder - in practice, this would call the appropriate generation API
  // For example:
  // - For logos: call /api/generate-logo
  // - For banners: call /api/generate-banner
  // - For posters: call /api/generate-poster
  // etc.
  
  console.log(`[v0] Would generate ${type} display content with model ${model}`)
  
  // For now, return a placeholder URL
  return `https://placeholder.com/${type}-${Date.now()}.jpg`
}
