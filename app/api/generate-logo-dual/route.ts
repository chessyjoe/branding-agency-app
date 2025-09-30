import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createDualGenerationService, DualGenerationRequest } from "@/lib/dual-generation"

interface LogoGenerationRequest {
  prompt: string
  model: string
  userId?: string
  colors?: string[]
  brandVoice?: any
  advancedOptions?: any
  eventDetails?: any
}

function validateApiKeys(model: string) {
  const openaiApiKey = process.env.OPENAI_API_KEY
  const blackforestApiKey = process.env.BLACKFOREST_API_KEY

  if (model === "dall-e-3" && !openaiApiKey) {
    throw new Error("Missing API key for DALL-E-3. Please configure OPENAI_API_KEY.")
  }

  if (model.startsWith("flux-") && !blackforestApiKey) {
    throw new Error("Missing API key for FLUX models. Please configure BLACKFOREST_API_KEY.")
  }

  return { openaiApiKey, blackforestApiKey }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Dual logo generation API called")

    const formData = await request.formData()

    const prompt = formData.get("prompt") as string
    const model = formData.get("model") as string
    
    // Derive user from session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate required fields
    if (!prompt || !model) {
      return NextResponse.json(
        {
          error: "Missing required fields: prompt and model are required",
        },
        { status: 400 },
      )
    }

    // Parse JSON inputs
    let colors: string[] = []
    let brandVoice: any = {}
    let advancedOptions: any = {}
    let eventDetails: any = {}

    try {
      colors = JSON.parse((formData.get("colors") as string) || "[]")
      brandVoice = JSON.parse((formData.get("brandVoice") as string) || "{}")
      advancedOptions = JSON.parse((formData.get("advancedOptions") as string) || "{}")
      eventDetails = JSON.parse((formData.get("eventDetails") as string) || "{}")
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request parameters",
        },
        { status: 400 },
      )
    }

    let apiKeys
    try {
      apiKeys = validateApiKeys(model)
    } catch (keyError) {
      return NextResponse.json(
        {
          error: keyError instanceof Error ? keyError.message : "API key validation failed",
        },
        { status: 400 },
      )
    }

    let refinedPrompt = prompt

    // Enhance prompt if enabled
    if (advancedOptions.enhancePrompt !== false) {
      console.log("[v0] Starting prompt enhancement...")

      try {
        const enhanceResponse = await fetch(`${request.nextUrl.origin}/api/refine-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            type: "logo",
            colors,
            brandVoice,
            advancedOptions,
            eventDetails,
          }),
        })

        if (enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json()
          if (enhanceData.refinedPromptData?.prompt) {
            refinedPrompt = enhanceData.refinedPromptData.prompt
            console.log("[v0] Using enhanced prompt:", refinedPrompt.substring(0, 100) + "...")
          }
        } else {
          console.log("[v0] Enhancement failed, using original prompt")
        }
      } catch (enhanceError) {
        console.warn("[v0] Prompt enhancement error:", enhanceError)
      }
    }

    // Create dual generation service
    const dualService = createDualGenerationService(apiKeys.openaiApiKey || "")

    // Create display image generator function
    const displayImageGenerator = async (prompt: string, options: any): Promise<string> => {
      if (model === "dall-e-3" && apiKeys.openaiApiKey) {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKeys.openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: refinedPrompt,
            n: 1,
            size: advancedOptions.customDimensions || "1024x1024",
            quality: advancedOptions.highResolution ? "hd" : "standard",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || "OpenAI API error")
        }

        const data = await response.json()
        return data.data[0].url
      } else if (model.startsWith("flux-") && apiKeys.blackforestApiKey) {
        // BlackForest implementation (simplified)
        const modelEndpoints: Record<string, string> = {
          "flux-schnell": "/v1/flux-dev",
          "flux-dev": "/v1/flux-dev",
          "flux-pro": "/v1/flux-pro",
        }

        const endpoint = modelEndpoints[model] || "/v1/flux-dev"
        const baseUrl = "https://api.bfl.ai"
        const fullUrl = `${baseUrl}${endpoint}`

        const submitResponse = await fetch(fullUrl, {
          method: "POST",
          headers: {
            accept: "application/json",
            "x-key": String(apiKeys.blackforestApiKey || ""),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: refinedPrompt,
            aspect_ratio: "1:1",
          }),
        })

        if (!submitResponse.ok) {
          throw new Error("BlackForest API request failed")
        }

        const submitData = await submitResponse.json()
        const pollingUrl = submitData.polling_url

        // Poll for result (simplified)
        let attempts = 0
        const maxAttempts = 30

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          attempts++

          const resultResponse = await fetch(pollingUrl, {
            method: "GET",
            headers: {
              accept: "application/json",
              "x-key": String(apiKeys.blackforestApiKey || ""),
            },
          })

          if (resultResponse.ok) {
            const resultData = await resultResponse.json()
            if (resultData.status === "Ready" && resultData.result?.sample) {
              return resultData.result.sample
            } else if (resultData.status === "Error" || resultData.status === "Failed") {
              throw new Error(`Generation failed: ${resultData.error || "Unknown error"}`)
            }
          }
        }

        throw new Error("Generation timeout")
      }

      throw new Error("No valid API key found for the selected model")
    }

    // Generate dual content
    const dualRequest: DualGenerationRequest = {
      prompt: refinedPrompt,
      type: "logo",
      colors,
      brandVoice,
      advancedOptions,
      eventDetails,
      width: 400,
      height: 400
    }

    console.log("[v0] Starting dual generation...")
    const dualResult = await dualService.generateDualContent(dualRequest, displayImageGenerator)

    if (!dualResult.success) {
      return NextResponse.json({
        error: dualResult.error || "Dual generation failed",
        success: false
      }, { status: 500 })
    }

    // Auto-save the generated content
    let autoSaved = false
    try {
      const autoSaveResponse = await fetch(`${request.nextUrl.origin}/api/auto-save-generation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: "logo",
          prompt,
          refinedPrompt,
          model,
          result: { 
            imageUrl: dualResult.displayImage,
            svg: dualResult.svgContent
          },
          colors,
          brandVoice,
          advancedOptions,
          eventDetails,
          aspectRatio: "1:1",
          tags: ["logo", "branding", "dual-generation"],
        }),
      })

      autoSaved = autoSaveResponse.ok
    } catch (autoSaveError) {
      console.warn("[v0] Auto-save error:", autoSaveError)
    }

    console.log("[v0] Dual generation completed successfully")

    return NextResponse.json({
      success: true,
      imageUrl: dualResult.displayImage, // For display
      svg: dualResult.svgContent, // For editor
      refinedPrompt,
      provider: model.startsWith("flux-") ? "BlackForest" : "OpenAI",
      resultType: "dual", // Indicates both formats available
      saved: autoSaved,
      fallback: dualResult.fallback,
      metadata: dualResult.metadata,
      message: autoSaved
        ? "Logo generated with both display and editor versions, auto-saved successfully"
        : "Logo generated with both display and editor versions (auto-save failed)"
    })

  } catch (error) {
    console.error("[v0] Dual logo generation error:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Dual generation failed",
        success: false
      },
      { status: 500 }
    )
  }
}
