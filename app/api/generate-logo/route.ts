import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { integrateDualGeneration, prepareDualGenerationData, type UniversalDualRequest } from "@/lib/dual-generation/integration-utils"

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

interface NormalizedResponse {
  url: string
  status: "success" | "fail"
  metadata: {
    provider: string
    model: string
    refinedPrompt: string
  }
}

function normalizeResponse(
  imageUrl: string,
  provider: string,
  model: string,
  refinedPrompt: string,
): NormalizedResponse {
  return {
    url: imageUrl,
    status: "success",
    metadata: {
      provider,
      model,
      refinedPrompt,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Sanitize and parse JSON inputs with proper error handling
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

    let imageUrl: string = ""
    let refinedPrompt = prompt
    let autoSaved = false

    try {
      if (advancedOptions.enhancePrompt !== false) {
        console.log("[v0] Starting prompt enhancement...")

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
          console.log("[v0] Enhancement response received:", {
            hasRefinedPromptData: !!enhanceData.refinedPromptData,
            hasPrompt: !!enhanceData.refinedPromptData?.prompt,
            isFallback: !!enhanceData.fallback,
          })

          if (enhanceData.refinedPromptData?.prompt) {
            refinedPrompt = enhanceData.refinedPromptData.prompt
            console.log("[v0] Using enhanced prompt:", refinedPrompt.substring(0, 100) + "...")
          } else {
            console.log("[v0] Enhancement failed, using original prompt")
          }
        } else {
          const errorText = await enhanceResponse.text()
          console.error("[v0] Enhancement request failed:", {
            status: enhanceResponse.status,
            statusText: enhanceResponse.statusText,
            error: errorText,
          })
          console.log("[v0] Continuing with original prompt due to enhancement failure")
        }
      }

      const providers = [
        { name: "primary", condition: model === "dall-e-3" && apiKeys.openaiApiKey },
        { name: "blackforest", condition: model.startsWith("flux-") && apiKeys.blackforestApiKey },
      ]

      let lastError: Error | null = null
      let usedProvider = ""

      for (const provider of providers) {
        if (!provider.condition) continue

        try {
          if (provider.name === "primary" && model === "dall-e-3") {
            console.log("[v0] Attempting DALL-E-3 generation...")
            usedProvider = "OpenAI DALL-E-3"

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
            imageUrl = data.data[0].url
            break
          } else if (provider.name === "blackforest" && model.startsWith("flux-")) {
            console.log("[v0] Attempting BlackForest generation...")
            usedProvider = `BlackForest ${model}`

            const modelEndpoints: Record<string, string> = {
              "flux-schnell": "/v1/flux-dev",
              "flux-dev": "/v1/flux-dev",
              "flux-pro": "/v1/flux-pro",
              "flux-pro-1.1": "/v1/flux-pro-1.1",
              "flux-pro-1.1-ultra": "/v1/flux-pro-1.1-ultra",
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
              const errorText = await submitResponse.text()
              throw new Error(`BlackForest API request failed: ${submitResponse.status} - ${errorText}`)
            }

            const submitData = await submitResponse.json()

            if (!submitData.id || !submitData.polling_url) {
              throw new Error("Invalid response from BlackForest API - missing id or polling_url")
            }

            const pollingUrl = submitData.polling_url

            let attempts = 0
            let delay = 2000 // Start with 2 seconds
            const maxAttempts = 30 // Reduced attempts but with exponential backoff
            const maxDelay = 10000 // Max 10 seconds between attempts

            while (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, delay))
              attempts++

              try {
                const resultResponse = await fetch(pollingUrl, {
                  method: "GET",
                  headers: {
                    accept: "application/json",
                    "x-key": String(apiKeys.blackforestApiKey || ""),
                  },
                })

                if (!resultResponse.ok) {
                  console.error(`[v0] Polling failed (attempt ${attempts}):`, resultResponse.status)
                  delay = Math.min(delay * 1.5, maxDelay)
                  continue
                }

                const resultData = await resultResponse.json()

                if (resultData.status === "Ready" && resultData.result?.sample) {
                  imageUrl = resultData.result.sample
                  console.log("[v0] BlackForest generation complete!")
                  break
                } else if (resultData.status === "Error" || resultData.status === "Failed") {
                  throw new Error(`Generation failed: ${resultData.error || "Unknown error"}`)
                }

                delay = Math.min(delay * 1.2, maxDelay)
              } catch (pollError) {
                console.error(`[v0] Polling error (attempt ${attempts}):`, pollError)
                if (attempts >= maxAttempts) {
                  throw new Error("Polling timeout - generation may still be in progress")
                }
              }
            }

            if (!imageUrl) {
              throw new Error("Generation timeout - no result received")
            }
            break
          }
        } catch (providerError) {
          console.error(`[v0] Provider ${provider.name} failed:`, providerError)
          lastError = providerError instanceof Error ? providerError : new Error("Provider failed")
          continue
        }
      }

      if (!imageUrl) {
        throw lastError || new Error("All providers failed - no valid API key found for the selected model")
      }

      // Generate SVG content for the editor
      let svgContent: string | undefined
      let svgFallback = false

      try {
        console.log("[v0] Starting dual generation for SVG content...")
        
        const dualRequest: UniversalDualRequest = {
          prompt: refinedPrompt,
          type: "logo",
          colors,
          brandVoice,
          advancedOptions,
          eventDetails,
          width: 400,
          height: 400
        }

        const { svgContent: generatedSvg, fallback } = await integrateDualGeneration(
          apiKeys.openaiApiKey || "",
          dualRequest,
          imageUrl
        )

        svgContent = generatedSvg
        svgFallback = fallback || false

        console.log("[v0] SVG generation completed:", {
          hasSvg: !!svgContent,
          svgLength: svgContent?.length || 0,
          fallback: svgFallback
        })

      } catch (svgError) {
        console.error("[v0] SVG generation failed:", svgError)
        // Continue without SVG content
      }

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
              imageUrl,
              svg: svgContent || null
            },
            colors,
            brandVoice,
            advancedOptions,
            eventDetails,
            aspectRatio: "1:1",
            tags: ["logo", "branding"],
          }),
        })

        autoSaved = autoSaveResponse.ok
        if (!autoSaved) {
          console.warn("[v0] Auto-save failed but continuing with generation")
        }
      } catch (autoSaveError) {
        console.warn("[v0] Auto-save error:", autoSaveError)
        autoSaved = false
      }

      const normalizedResult = normalizeResponse(imageUrl, usedProvider, model, refinedPrompt)

      return NextResponse.json({
        success: true,
        imageUrl: normalizedResult.url,
        svgContent,
        svgFallback,
        refinedPrompt: normalizedResult.metadata.refinedPrompt,
        provider: normalizedResult.metadata.provider,
        resultType: "image",
        saved: autoSaved,
        message: autoSaved
          ? "Logo generated and auto-saved successfully"
          : "Logo generated successfully (auto-save failed - you can manually save from the gallery)",
        metadata: {
          hasSvg: !!svgContent,
          svgLength: svgContent?.length || 0,
          svgFallback,
          generatedAt: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error("[v0] Logo generation error:", error)

      let errorMessage = "Generation failed"
      const suggestions: string[] = []

      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "API configuration issue"
          suggestions.push("Check your API keys in project settings")
          suggestions.push("Try a different model if available")
        } else if (error.message.includes("timeout")) {
          errorMessage = "Generation timeout"
          suggestions.push("Try again - the service may be busy")
          suggestions.push("Consider using a different model")
        } else if (error.message.includes("content policy")) {
          errorMessage = "Content policy violation"
          suggestions.push("Modify your prompt to be more appropriate")
          suggestions.push("Remove any potentially sensitive content")
        } else {
          errorMessage = error.message
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          suggestions,
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Request processing error:", error)
    return NextResponse.json(
      {
        error: "Invalid request format",
        details: error instanceof Error ? error.message : "Request parsing failed",
      },
      { status: 400 },
    )
  }
}
