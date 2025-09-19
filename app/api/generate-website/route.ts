import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, model, userId, colors, brandVoice, advancedOptions } = body

    if (!prompt || !model) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Enhanced prompt for website generation
    let enhancedPrompt = `Create a modern, responsive website: ${prompt}`
    if (colors?.length > 0) {
      enhancedPrompt += ` Use colors: ${colors.join(", ")}.`
    }
    if (brandVoice?.tone?.length > 0) {
      enhancedPrompt += ` Style: ${brandVoice.tone.join(", ")}.`
    }

    let websiteCode = ""
    let previewUrl = ""

    if (model === "gpt-4" || model === "gpt-3.5-turbo") {
      // OpenAI API for code generation
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
      }

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content:
                "You are a professional web developer. Create complete, modern, responsive HTML websites with inline CSS and JavaScript. Include proper structure, styling, and functionality.",
            },
            {
              role: "user",
              content: enhancedPrompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json()
        console.error("OpenAI API error:", errorData)
        throw new Error(`OpenAI API request failed: ${openaiResponse.status}`)
      }

      const openaiData = await openaiResponse.json()
      websiteCode = openaiData.choices[0]?.message?.content || ""
    } else {
      // Together AI fallback
      if (!process.env.TOGETHER_API_KEY) {
        return NextResponse.json({ error: "No API key configured for the selected model" }, { status: 500 })
      }

      const togetherResponse = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-2-70b-chat-hf",
          messages: [
            {
              role: "system",
              content:
                "You are a professional web developer. Create complete, modern, responsive HTML websites with inline CSS and JavaScript.",
            },
            {
              role: "user",
              content: enhancedPrompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      })

      if (!togetherResponse.ok) {
        const errorData = await togetherResponse.json()
        console.error("Together AI error:", errorData)
        throw new Error(`Together AI API request failed: ${togetherResponse.status}`)
      }

      const togetherData = await togetherResponse.json()
      websiteCode = togetherData.choices[0]?.message?.content || ""
    }

    if (!websiteCode) {
      throw new Error("No website code generated")
    }

    // Create a preview URL (in a real implementation, you'd save this to a file server)
    previewUrl = `data:text/html;base64,${Buffer.from(websiteCode).toString("base64")}`

    // Auto-save the generated website
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auto-save-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId || "demo-user",
          type: "website",
          prompt,
          refinedPrompt: enhancedPrompt,
          model,
          result: { code: websiteCode, previewUrl },
          colors: colors || [],
          brandVoice: brandVoice || {},
          advancedOptions: advancedOptions || {},
          aspectRatio: "responsive",
          tags: ["website", "web-development", "responsive"],
        }),
      })
    } catch (saveError) {
      console.warn("Auto-save error:", saveError)
    }

    return NextResponse.json({
      success: true,
      code: websiteCode,
      previewUrl,
      resultType: "website",
      refinedPrompt: enhancedPrompt,
      message: "Website generated and auto-saved successfully",
    })
  } catch (error) {
    console.error("Website generation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 })
  }
}
