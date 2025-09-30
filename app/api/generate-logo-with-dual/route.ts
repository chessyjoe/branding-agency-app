import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { integrateDualGeneration, prepareDualGenerationData, type UniversalDualRequest } from "@/lib/dual-generation"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Logo generation with dual content API called")

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
      model = "dall-e-3",
      colors = [], 
      brandVoice = {}, 
      advancedOptions = {},
      width = 400,
      height = 400
    } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[v0] Generating logo with dual content:", { promptLength: prompt.length, colors })

    // First, generate the display image using existing logo generation logic
    // This is a simplified version - in practice, you'd call the existing logo generation
    let displayImageUrl = ""
    
    try {
      // Simulate logo generation (replace with actual logo generation call)
      displayImageUrl = await generateLogoImage(prompt, model, colors, brandVoice, advancedOptions)
      console.log("[v0] Display image generated:", displayImageUrl)
    } catch (error) {
      console.error("[v0] Display image generation failed:", error)
      return NextResponse.json({ error: "Failed to generate display image" }, { status: 500 })
    }

    // Now generate SVG content for the editor
    const dualRequest: UniversalDualRequest = {
      prompt,
      type: "logo",
      colors,
      brandVoice,
      advancedOptions,
      width,
      height
    }

    try {
      const { svgContent, fallback } = await integrateDualGeneration(
        openaiApiKey,
        dualRequest,
        displayImageUrl
      )

      console.log("[v0] SVG content generated:", !!svgContent, "Fallback:", fallback)

      // Prepare data for database storage
      const generationData = prepareDualGenerationData(displayImageUrl, svgContent, fallback)

      // Save to database
      const { data: savedGeneration, error: saveError } = await supabase
        .from('generated_images')
        .insert({
          user_id: user.id,
          type: 'logo',
          prompt,
          image_url: displayImageUrl,
          svg_content: svgContent,
          generation_data: generationData.generation_data,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (saveError) {
        console.error("[v0] Failed to save generation:", saveError)
        // Continue without saving to database
      }

      return NextResponse.json({
        success: true,
        imageUrl: displayImageUrl,
        svgContent,
        fallback,
        generationId: savedGeneration?.id,
        metadata: {
          hasSvg: !!svgContent,
          svgLength: svgContent?.length || 0,
          generatedAt: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error("[v0] Dual generation failed:", error)
      
      // Return just the display image if SVG generation fails
      return NextResponse.json({
        success: true,
        imageUrl: displayImageUrl,
        svgContent: null,
        fallback: true,
        error: "SVG generation failed, display image only"
      })
    }

  } catch (error) {
    console.error("[v0] Logo dual generation error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Logo generation failed",
        success: false
      }, 
      { status: 500 }
    )
  }
}

/**
 * Simulate logo image generation
 * In practice, this would call the actual logo generation API
 */
async function generateLogoImage(
  prompt: string, 
  model: string, 
  colors: string[], 
  brandVoice: any, 
  advancedOptions: any
): Promise<string> {
  // This is a placeholder - in practice, you'd call the existing logo generation logic
  // or make an internal API call to /api/generate-logo
  
  console.log("[v0] Simulating logo generation with:", { model, promptLength: prompt.length })
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Return a placeholder URL
  return `https://placeholder.com/logo-${Date.now()}.jpg`
}
