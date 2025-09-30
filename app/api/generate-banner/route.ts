import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { integrateDualGeneration, type UniversalDualRequest } from "@/lib/dual-generation/integration-utils"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get("prompt") as string
    const model = formData.get("model") as string
    const colors = JSON.parse((formData.get("colors") as string) || "[]")
    const brandVoice = JSON.parse((formData.get("brandVoice") as string) || "{}")
    const advancedOptions = JSON.parse((formData.get("advancedOptions") as string) || "{}")
    const eventDetails = JSON.parse((formData.get("eventDetails") as string) || "{}")

    if (!prompt || !model) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get API keys from environment
    const openaiApiKey = process.env.OPENAI_API_KEY
    const blackforestApiKey = process.env.BLACKFOREST_API_KEY

    let imageUrl: string = ""
    let refinedPrompt = prompt

    try {
      // Enhance the prompt for banner generation
      if (advancedOptions.enhancePrompt !== false) {
        const enhanceResponse = await fetch(`${request.nextUrl.origin}/api/refine-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            type: "banner",
            colors,
            brandVoice,
            advancedOptions,
            eventDetails,
          }),
        })

        if (enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json()
          if (typeof enhanceData.refinedPrompt === "object") {
            refinedPrompt = enhanceData.refinedPrompt.prompt || prompt
          } else {
            refinedPrompt = enhanceData.refinedPrompt || prompt
          }
        }
      }

      // Generate the banner based on the selected model
      if (model === "dall-e-3" && openaiApiKey) {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: refinedPrompt,
            n: 1,
            size: "1792x1024", // Wide format for banners
            quality: advancedOptions.highResolution ? "hd" : "standard",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || "OpenAI API error")
        }

        const data = await response.json()
        imageUrl = data.data[0].url
      } else if (model.startsWith("flux-") && blackforestApiKey) {
        // BlackForest Labs API for FLUX models
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

        // Submit generation request
        const submitResponse = await fetch(fullUrl, {
          method: "POST",
          headers: {
            accept: "application/json",
            "x-key": String(blackforestApiKey || ""),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: refinedPrompt,
            aspect_ratio: advancedOptions.aspectRatio || "16:9", // Wide format for banners
          }),
        })

        if (!submitResponse.ok) {
          const errorText = await submitResponse.text()
          throw new Error(`BlackForest API request failed: ${submitResponse.status} - ${errorText}`)
        }

        const submitData = await submitResponse.json()

        if (!submitData.id || !submitData.polling_url) {
          throw new Error("Invalid response from BlackForest API")
        }

        // Poll for results
        const pollingUrl = submitData.polling_url
        let attempts = 0
        const maxAttempts = 60

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          attempts++

          const resultResponse = await fetch(pollingUrl, {
            method: "GET",
            headers: {
              accept: "application/json",
              "x-key": String(blackforestApiKey || ""),
            },
          })

          if (resultResponse.ok) {
            const resultData = await resultResponse.json()

            if (resultData.status === "Ready" && resultData.result?.sample) {
              imageUrl = resultData.result.sample
              break
            } else if (resultData.status === "Error" || resultData.status === "Failed") {
              throw new Error(`Generation failed: ${resultData.error || "Unknown error"}`)
            }
          }
        }

        if (!imageUrl) {
          throw new Error("Generation timeout")
        }
      } else {
        throw new Error("No valid API key found for the selected model")
      }

      // Generate SVG content for the editor
      let svgContent: string | undefined
      let svgFallback = false

      try {
        console.log("[v0] Starting dual generation for banner SVG content...")
        
        const dualRequest: UniversalDualRequest = {
          prompt: refinedPrompt,
          type: "banner",
          colors,
          brandVoice,
          advancedOptions,
          eventDetails,
          width: 800,
          height: 450
        }

        const { svgContent: generatedSvg, fallback } = await integrateDualGeneration(
          openaiApiKey || "",
          dualRequest,
          imageUrl
        )

        svgContent = generatedSvg
        svgFallback = fallback || false

        console.log("[v0] Banner SVG generation completed:", {
          hasSvg: !!svgContent,
          svgLength: svgContent?.length || 0,
          fallback: svgFallback
        })

      } catch (svgError) {
        console.error("[v0] Banner SVG generation failed:", svgError)
        // Continue without SVG content
      }

      // Auto-save the generated banner
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
            type: "banner",
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
            aspectRatio: advancedOptions.aspectRatio || "16:9",
            tags: ["banner", "marketing"],
          }),
        })
      } catch (autoSaveError) {
        console.warn("Auto-save failed:", autoSaveError)
      }

      return NextResponse.json({
        success: true,
        imageUrl,
        svgContent,
        svgFallback,
        refinedPrompt,
        resultType: "image",
        message: "Banner generated and auto-saved successfully",
        metadata: {
          hasSvg: !!svgContent,
          svgLength: svgContent?.length || 0,
          svgFallback,
          generatedAt: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error("Banner generation error:", error)
      return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Request processing error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
