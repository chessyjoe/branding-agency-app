import { type NextRequest, NextResponse } from "next/server"
import { createPromptEnhancer } from "@/lib/prompt-enhancement/enhancer"
import { PromptEnhancementRequest } from "@/lib/prompt-enhancement/types"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Prompt enhancement API called")

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.error("[v0] OPENAI_API_KEY environment variable is missing")
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          fallback: true,
          refinedPromptData: {
            prompt: "Professional design with modern aesthetics",
            style: "modern professional",
            colors: ["#1a1a1a", "#ffffff", "#0066cc"],
            mood: "professional and engaging",
          },
        },
        { status: 400 },
      )
    }

    let requestData: any = {}
    try {
      requestData = await request.json()
      console.log("[v0] Request JSON parsed successfully")
    } catch (jsonError) {
      console.error("[v0] Failed to parse request JSON:", jsonError)
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          details: jsonError instanceof Error ? jsonError.message : "JSON parsing failed",
        },
        { status: 400 },
      )
    }

    const { prompt, type = "poster", eventDetails, colors, brandVoice, advancedOptions, customContext } = requestData

    console.log("[v0] Enhancement request details:", {
      promptLength: prompt?.length || 0,
      type,
      hasEventDetails: !!eventDetails,
      hasColors: !!(colors && colors.length > 0),
      hasBrandVoice: !!brandVoice,
      hasAdvancedOptions: !!advancedOptions,
      hasCustomContext: !!customContext,
    })

    if (!prompt) {
      console.log("[v0] Error: No prompt provided")
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Create prompt enhancer instance
    const enhancer = createPromptEnhancer(openaiApiKey)

    // Build enhancement request
    const enhancementRequest: PromptEnhancementRequest = {
      prompt,
      type: type as any,
      colors,
      brandVoice,
      advancedOptions,
      eventDetails,
      customContext
    }

    console.log(`[v0] Enhancing ${type} prompt using modular system`)

    // Enhance the prompt
    const result = await enhancer.enhancePrompt(enhancementRequest)

    if (result.success && result.data) {
      console.log("[v0] Prompt enhancement successful")
      console.log("[v0] Enhanced prompt length:", result.data.prompt.length)
      
      return NextResponse.json({ 
        refinedPromptData: result.data,
        success: true
      })
    } else {
      console.log("[v0] Prompt enhancement failed, using fallback")
      console.error("[v0] Enhancement error:", result.error)
      
      // Return fallback response using the enhancer's fallback
      const fallbackData = result.data || {
        prompt: `${prompt}. Professional ${type} design with modern aesthetics and clean composition.`,
        style: advancedOptions?.style || "modern",
        colors: colors || ["#1a1a1a", "#ffffff", "#0066cc"],
        mood: brandVoice?.tone || "professional",
        composition: "balanced hierarchical layout",
        technicalSpecs: {
          aspectRatio: advancedOptions?.aspectRatio || "16:9",
          resolution: "high resolution"
        }
      }

      return NextResponse.json({ 
        refinedPromptData: fallbackData,
        fallback: true,
        error: result.error
      })
    }

  } catch (error) {
    console.error("[v0] Prompt refinement error details:", error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    // Emergency fallback - create a basic fallback using the enhancer
    const emergencyEnhancer = createPromptEnhancer(process.env.OPENAI_API_KEY || "")
    const emergencyFallback = emergencyEnhancer.createFallbackResponse({
      prompt: "Professional design with modern aesthetics and clean composition",
      type: "poster"
    })

    console.log("[v0] Emergency fallback response created")
    return NextResponse.json({ 
      refinedPromptData: emergencyFallback,
      fallback: true,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}