import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get("prompt") as string
    const model = formData.get("model") as string
    const userId = formData.get("userId") as string
    const colors = JSON.parse((formData.get("colors") as string) || "[]")
    const brandVoice = JSON.parse((formData.get("brandVoice") as string) || "{}")
    const advancedOptions = JSON.parse((formData.get("advancedOptions") as string) || "{}")
    const eventDetails = JSON.parse((formData.get("eventDetails") as string) || "{}")

    if (!prompt || !model) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get API keys from environment
    const openaiApiKey = process.env.OPENAI_API_KEY
    const togetherApiKey = process.env.TOGETHER_API_KEY
    const blackforestApiKey = process.env.BLACKFOREST_API_KEY

    console.log("[v0] Available API keys:", {
      openai: !!openaiApiKey,
      together: !!togetherApiKey,
      blackforest: !!blackforestApiKey,
      selectedModel: model,
    })

    let imageUrl: string
    let refinedPrompt = prompt

    try {
      // Enhance the prompt for poster generation
      if (advancedOptions.enhancePrompt !== false) {
        console.log("[v0] Prompt enhancement input:", {
          originalPrompt: prompt,
          eventDetails,
          colors,
          brandVoice,
          advancedOptions,
        })

        const enhanceResponse = await fetch(`${request.nextUrl.origin}/api/refine-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            type: "poster",
            eventDetails,
            colors,
            brandVoice,
            advancedOptions,
          }),
        })

        if (enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json()
          if (enhanceData.refinedPromptData) {
            // Use the enhanced prompt from JSON structure
            refinedPrompt = enhanceData.refinedPromptData.prompt || prompt

            console.log("[v0] Prompt enhancement output:", {
              originalPrompt: prompt,
              enhancedPrompt: refinedPrompt,
              fullRefinedData: enhanceData.refinedPromptData,
              style: enhanceData.refinedPromptData.style,
              colors: enhanceData.refinedPromptData.colors,
              mood: enhanceData.refinedPromptData.mood,
              composition: enhanceData.refinedPromptData.composition,
            })
          } else {
            // Fallback for backward compatibility
            refinedPrompt = enhanceData.refinedPrompt || prompt
            console.log("[v0] Using fallback refined prompt:", refinedPrompt)
          }
        } else {
          console.log("[v0] Prompt enhancement failed:", enhanceResponse.status, await enhanceResponse.text())
        }
      }

      let generationAttempted = false
      let lastError: string | null = null

      // Try OpenAI DALL-E-3 first if requested and key is available
      if (model === "dall-e-3" && openaiApiKey) {
        try {
          console.log("[v0] Attempting OpenAI DALL-E-3 generation")
          generationAttempted = true

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
              size: "1024x1792", // Portrait format for posters
              quality: advancedOptions.highResolution ? "hd" : "standard",
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.log("[v0] OpenAI API error:", errorData)
            lastError = `OpenAI: ${errorData.error?.message || "API error"}`
            throw new Error(errorData.error?.message || "OpenAI API error")
          }

          const data = await response.json()
          imageUrl = data.data[0].url
          console.log("[v0] OpenAI generation successful")
        } catch (openaiError) {
          console.log("[v0] OpenAI failed, trying fallback:", openaiError)
          lastError = `OpenAI: ${openaiError instanceof Error ? openaiError.message : "Unknown error"}`
          // Continue to fallback options
        }
      }

      if (
        !imageUrl &&
        blackforestApiKey &&
        (model.includes("black-forest-labs") || model.startsWith("flux-")) &&
        !model.includes("Free")
      ) {
        try {
          console.log("[v0] Attempting BlackForest FLUX generation with model:", model)
          generationAttempted = true

          let bflEndpoint = "flux-pro-1.1"
          if (model.includes("FLUX.1-schnell")) {
            bflEndpoint = "flux-dev"
          } else if (model.includes("FLUX.1-pro")) {
            bflEndpoint = "flux-pro"
          } else if (model.includes("FLUX1.1")) {
            bflEndpoint = "flux-pro-1.1"
          }

          // Submit generation request
          const submitResponse = await fetch(`https://api.bfl.ai/v1/${bflEndpoint}`, {
            method: "POST",
            headers: {
              "x-key": blackforestApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: refinedPrompt,
              aspect_ratio: "9:16", // Portrait format for posters
              safety_tolerance: 2,
            }),
          })

          if (!submitResponse.ok) {
            const errorText = await submitResponse.text()
            console.log("[v0] BlackForest submit error:", errorText)
            lastError = `BlackForest: ${submitResponse.status} - ${errorText}`
            throw new Error(`BlackForest API request failed: ${submitResponse.status} - ${errorText}`)
          }

          const submitData = await submitResponse.json()
          const requestId = submitData.id
          const pollingUrl = submitData.polling_url || `https://api.bfl.ai/v1/get_result?id=${requestId}`

          console.log("[v0] BlackForest request submitted, polling for result:", requestId)

          // Poll for results with timeout
          let attempts = 0
          const maxAttempts = 60 // 30 seconds max

          while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500)) // Wait 500ms

            const pollResponse = await fetch(pollingUrl, {
              headers: {
                "x-key": blackforestApiKey,
              },
            })

            if (!pollResponse.ok) {
              const errorText = await pollResponse.text()
              console.log("[v0] BlackForest poll error:", errorText)
              throw new Error(`Polling failed: ${pollResponse.status} - ${errorText}`)
            }

            const pollData = await pollResponse.json()
            console.log("[v0] BlackForest poll status:", pollData.status)

            if (pollData.status === "Ready") {
              imageUrl = pollData.result.sample
              console.log("[v0] BlackForest generation successful")
              break
            } else if (pollData.status === "Error" || pollData.status === "Failed") {
              lastError = `BlackForest: Generation failed - ${pollData.status}`
              throw new Error(`Generation failed: ${pollData.status}`)
            }

            attempts++
          }

          if (!imageUrl && attempts >= maxAttempts) {
            lastError = "BlackForest: Generation timeout"
            throw new Error("Generation timeout after 30 seconds")
          }
        } catch (blackforestError) {
          console.log("[v0] BlackForest failed, trying fallback:", blackforestError)
          if (!lastError) {
            lastError = `BlackForest: ${blackforestError instanceof Error ? blackforestError.message : "Unknown error"}`
          }
        }
      }

      if (
        !imageUrl &&
        togetherApiKey &&
        (model.includes("Free") ||
          model.includes("together") ||
          model.includes("stabilityai") ||
          model.includes("playground") ||
          !generationAttempted)
      ) {
        try {
          console.log("[v0] Attempting Together AI generation")
          generationAttempted = true

          let togetherModel = model
          if (model.includes("FLUX.1-schnell-Free")) {
            togetherModel = "black-forest-labs/FLUX.1-schnell-Free"
          } else if (!model.includes("stabilityai") && !model.includes("playground")) {
            togetherModel = "stabilityai/stable-diffusion-xl-base-1.0"
          }

          const response = await fetch("https://api.together.xyz/v1/images/generations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${togetherApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: togetherModel,
              prompt: refinedPrompt,
              width: 1024,
              height: 1792,
              steps: advancedOptions.quality || 8,
              n: 1,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            lastError = `Together AI: ${errorData.error?.message || "API error"}`
            throw new Error(errorData.error?.message || "Together AI API error")
          }

          const data = await response.json()
          imageUrl = data.data[0].url
          console.log("[v0] Together AI generation successful")
        } catch (togetherError) {
          console.log("[v0] Together AI failed:", togetherError)
          if (!lastError) {
            lastError = `Together AI: ${togetherError instanceof Error ? togetherError.message : "Unknown error"}`
          }
        }
      }

      if (!imageUrl) {
        if (!generationAttempted) {
          const missingKeys = []
          if (model === "dall-e-3" && !openaiApiKey) missingKeys.push("OPENAI_API_KEY")
          if (
            (model.includes("black-forest-labs") || model.startsWith("flux-")) &&
            !model.includes("Free") &&
            !blackforestApiKey
          ) {
            missingKeys.push("BLACKFOREST_API_KEY")
          }
          if (
            (model.includes("Free") || model.includes("stabilityai") || model.includes("playground")) &&
            !togetherApiKey
          ) {
            missingKeys.push("TOGETHER_API_KEY")
          }

          const errorMessage =
            missingKeys.length > 0
              ? `No valid API key found for model "${model}". Missing: ${missingKeys.join(", ")}`
              : `No suitable API configuration found for model "${model}". Please check your environment variables.`

          throw new Error(errorMessage)
        } else {
          throw new Error(
            `Image generation failed. ${lastError ? `Error: ${lastError}` : "Please try a different model or check your API keys."}`,
          )
        }
      }

      // Auto-save the generated poster
      try {
        await fetch(`${request.nextUrl.origin}/api/auto-save-generation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId || "demo-user",
            type: "poster",
            prompt,
            refinedPrompt,
            model,
            result: { imageUrl },
            colors,
            brandVoice,
            advancedOptions,
            eventDetails,
            aspectRatio: advancedOptions.aspectRatio || "9:16",
            tags: ["poster", "marketing", "print"],
          }),
        })
      } catch (autoSaveError) {
        console.warn("Auto-save failed:", autoSaveError)
      }

      return NextResponse.json({
        success: true,
        imageUrl,
        refinedPrompt,
        resultType: "image",
        message: "Poster generated and auto-saved successfully",
      })
    } catch (error) {
      console.error("Poster generation error:", error)
      return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Request processing error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
