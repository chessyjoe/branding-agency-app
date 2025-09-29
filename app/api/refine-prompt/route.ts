import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  let eventDetails: any = null
  let colors: any = null
  let brandVoice: any = null
  let advancedOptions: any = null
  let prompt = ""
  let type = "poster"

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

    console.log("[v0] Using AI SDK with OpenAI provider")

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

    prompt = requestData.prompt
    type = requestData.type || "poster"
    eventDetails = requestData.eventDetails
    colors = requestData.colors
    brandVoice = requestData.brandVoice
    advancedOptions = requestData.advancedOptions

    console.log("[v0] Request data parsed successfully")
    console.log("[v0] Enhancement request details:", {
      promptLength: prompt?.length || 0,
      type,
      hasEventDetails: !!eventDetails,
      hasColors: !!(colors && colors.length > 0),
      hasBrandVoice: !!brandVoice,
      hasAdvancedOptions: !!advancedOptions,
    })

    if (!prompt) {
      console.log("[v0] Error: No prompt provided")
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const systemPrompt = `You are an expert prompt engineer specializing in ${type} design using BlackForest Labs FLUX models. Your task is to enhance prompts following the BFL framework: Subject + Action + Style + Context.

      Prompting Guidelines:
- Use structured descriptions with natural language
- Front-load the most important elements (word order matters)
- Build in layers: Foundation → Visual → Technical → Atmospheric
- Work without negatives - describe what you want to see
- Use specific, detailed descriptions for better results
- For text integration, use quotation marks and specify placement

Framework Structure:
1. Subject: Main focus (person, object, character, event poster)
2. Action: What's happening or the pose/arrangement
3. Style: Artistic approach, medium, aesthetic (photography, illustration, etc.)
4. Context: Setting, lighting, time, mood, atmospheric conditions

IMPORTANT: Return your response as a JSON object with the following expanded structure:
{
  "prompt": "your enhanced detailed prompt following BFL framework",
  "style": "visual style description",
  "colors": ["color1", "color2", "color3"],
  "mood": "overall mood/atmosphere",
  "composition": "layout and composition details",
  "eventElements": {
    "title": {
      "text": "event title",
      "placement": "suggested placement (top, center, etc.)",
      "emphasis": "visual emphasis level (primary, secondary)",
      "typography": "suggested font style"
    },
    "tagline": {
      "text": "tagline text",
      "placement": "suggested placement",
      "emphasis": "visual emphasis level"
    },
    "dateTime": {
      "date": "formatted date",
      "time": "formatted time", 
      "placement": "suggested placement",
      "format": "suggested display format"
    },
    "location": {
      "venue": "venue name",
      "address": "full address",
      "placement": "suggested placement",
      "prominence": "visual prominence level"
    },
    "highlights": [
      {
        "text": "highlight text",
        "priority": "display priority (1-5)",
        "visualTreatment": "suggested visual treatment"
      }
    ],
    "callToAction": {
      "text": "CTA text",
      "placement": "suggested placement",
      "style": "button/text style suggestion"
    },
    "contact": {
      "phone": "phone number",
      "email": "email address", 
      "website": "website URL",
      "placement": "suggested placement",
      "size": "relative size (small, medium, large)"
    },
    "pricing": {
      "amount": "price amount",
      "placement": "suggested placement",
      "emphasis": "visual emphasis"
    }
  },
  "designElements": {
    "primaryFocus": "main visual focus area",
    "secondaryElements": ["list of secondary visual elements"],
    "textHierarchy": ["ordered list of text importance"],
    "colorUsage": {
      "primary": "primary color usage",
      "accent": "accent color usage", 
      "background": "background color treatment"
    },
    "layoutSuggestions": {
      "grid": "suggested grid structure",
      "alignment": "text alignment recommendations",
      "spacing": "spacing recommendations"
    }
  },
  "technicalSpecs": {
    "aspectRatio": "recommended aspect ratio",
    "resolution": "recommended resolution",
    "textReadability": "readability considerations",
    "printConsiderations": "print-specific recommendations"
  }
}`

    let userMessage = `Base prompt: ${prompt}\n\n`

    // Add event details if provided
    if (eventDetails) {
      userMessage += `EVENT DETAILS:\n`
      if (eventDetails.title) userMessage += `- Title: ${eventDetails.title}\n`
      if (eventDetails.tagline) userMessage += `- Tagline: ${eventDetails.tagline}\n`
      if (eventDetails.date) userMessage += `- Date: ${eventDetails.date}\n`
      if (eventDetails.time) userMessage += `- Time: ${eventDetails.time}\n`
      if (eventDetails.location) userMessage += `- Location: ${eventDetails.location}\n`
      if (eventDetails.price) userMessage += `- Price: ${eventDetails.price}\n`
      if (eventDetails.highlights && eventDetails.highlights.length > 0) {
        userMessage += `- Key Highlights: ${eventDetails.highlights.filter((h: string) => h.trim()).join(", ")}\n`
      }
      if (eventDetails.ctaText) userMessage += `- Call to Action: ${eventDetails.ctaText}\n`
      if (eventDetails.phone || eventDetails.email || eventDetails.website) {
        userMessage += `- Contact Info: `
        const contacts = []
        if (eventDetails.phone) contacts.push(eventDetails.phone)
        if (eventDetails.email) contacts.push(eventDetails.email)
        if (eventDetails.website) contacts.push(eventDetails.website)
        userMessage += contacts.join(", ") + "\n"
      }
      userMessage += "\n"
    }

    // Add color palette if provided
    if (colors && colors.length > 0) {
      userMessage += `COLOR PALETTE: ${colors.join(", ")}\n\n`
    }

    // Add brand voice if provided
    if (brandVoice) {
      userMessage += `BRAND PERSONALITY:\n`
      if (brandVoice.tone && Array.isArray(brandVoice.tone) && brandVoice.tone.length > 0) {
        userMessage += `- Tone: ${brandVoice.tone.filter((t: string) => t && typeof t === "string").join(", ")}\n`
      }
      if (brandVoice.targetAudience && typeof brandVoice.targetAudience === "string") {
        userMessage += `- Target Audience: ${brandVoice.targetAudience}\n`
      }
      if (brandVoice.brandValues && typeof brandVoice.brandValues === "string") {
        userMessage += `- Brand Values: ${brandVoice.brandValues}\n`
      }
      userMessage += "\n"
    }

    // Add style preferences if provided
    if (advancedOptions) {
      if (advancedOptions.style && Array.isArray(advancedOptions.style) && advancedOptions.style.length > 0) {
        userMessage += `STYLE PREFERENCES: ${advancedOptions.style
          .filter((s: string) => s && typeof s === "string")
          .join(", ")}\n`
      }
      if (advancedOptions.aspectRatio && typeof advancedOptions.aspectRatio === "string") {
        userMessage += `ASPECT RATIO: ${advancedOptions.aspectRatio}\n`
      }
      userMessage += "\n"
    }

    userMessage += `Please create a comprehensive, detailed prompt following the BlackForest Labs framework (Subject + Action + Style + Context) that combines all these elements into a cohesive ${type} design. 

Structure the prompt with:
- Subject: The main poster/design focus
- Action: Layout arrangement or visual flow
- Style: Specific artistic approach and medium
- Context: Setting, lighting, time, mood, atmospheric conditions

Additionally, provide detailed breakdown of all event elements with specific placement suggestions, design hierarchy, and technical specifications for post-processing editor use.

Make it specific and detailed for optimal FLUX model results.`

    console.log("[v0] Making AI SDK call with model: gpt-4o")
    console.log("[v0] User message length:", userMessage.length)
    console.log("[v0] System prompt length:", systemPrompt.length)

    try {
      const { text: responseContent } = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: userMessage,
        temperature: 0.7,
      })

      console.log("[v0] AI SDK call successful")
      console.log("[v0] Response content length:", responseContent.length)
      console.log("[v0] Response preview:", responseContent.substring(0, 200) + "...")

      try {
        // Extract JSON from markdown code blocks if present
        let jsonContent = responseContent.trim()

        // Check if response is wrapped in markdown code blocks
        if (jsonContent.startsWith("```")) {
          // Find the start of JSON content (after \`\`\`json or \`\`\`)\n
          const startMatch = jsonContent.match(/^```(?:json)?\\s*\\n?/)
          if (startMatch) {
            jsonContent = jsonContent.substring(startMatch[0].length)
          }

          // Find the end of JSON content (before closing \`\`\`)\n
          const endIndex = jsonContent.lastIndexOf("```")
          if (endIndex !== -1) {
            jsonContent = jsonContent.substring(0, endIndex)
          }
        }

        // If still contains markdown, try alternative extraction
        if (jsonContent.includes("```")) {
          // Extract content between first { and last }
          const firstBrace = jsonContent.indexOf("{")
          const lastBrace = jsonContent.lastIndexOf("}")
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonContent = jsonContent.substring(firstBrace, lastBrace + 1)
          }
        }

        jsonContent = jsonContent.trim()
        console.log("[v0] Extracted JSON content length:", jsonContent.length)
        console.log("[v0] JSON content preview:", jsonContent.substring(0, 100) + "...")

        const refinedPromptData = JSON.parse(jsonContent)
        console.log("[v0] JSON parsing successful")
        return NextResponse.json({ refinedPromptData })
      } catch (parseError) {
        console.log("[v0] JSON parsing failed, using fallback structure")
        console.error("[v0] Parse error:", parseError)

        const enhancedPrompt = `${prompt}. Event: ${eventDetails?.title || "Event"} - ${eventDetails?.tagline || ""}. Date: ${eventDetails?.date || "TBD"}. Location: ${eventDetails?.location || "Venue TBD"}. Price: ${eventDetails?.price || "TBD"}. Professional ${advancedOptions?.style && Array.isArray(advancedOptions.style) ? advancedOptions.style.filter((s: string) => s && typeof s === "string").join(" ") : "modern"} design with ${colors && Array.isArray(colors) ? colors.filter((c: string) => c && typeof c === "string").join(", ") : "vibrant colors"}.`

        const fallbackData = {
          prompt: enhancedPrompt,
          style:
            advancedOptions?.style && Array.isArray(advancedOptions.style)
              ? advancedOptions.style.filter((s: string) => s && typeof s === "string").join(" ")
              : "modern",
          colors:
            colors && Array.isArray(colors)
              ? colors.filter((c: string) => c && typeof c === "string")
              : ["#1a1a1a", "#ffffff", "#0066cc"],
          mood:
            brandVoice?.tone && Array.isArray(brandVoice.tone)
              ? brandVoice.tone.filter((t: string) => t && typeof t === "string").join(" ")
              : "professional",
          composition: "balanced hierarchical layout",
          eventElements: {
            title: eventDetails?.title
              ? {
                  text: eventDetails.title,
                  placement: "top center",
                  emphasis: "primary",
                  typography: "bold sans-serif",
                }
              : null,
            tagline: eventDetails?.tagline
              ? {
                  text: eventDetails.tagline,
                  placement: "below title",
                  emphasis: "secondary",
                }
              : null,
            dateTime:
              eventDetails?.date || eventDetails?.time
                ? {
                    date: eventDetails.date || "",
                    time: eventDetails.time || "",
                    placement: "upper section",
                    format: "prominent display",
                  }
                : null,
            location: eventDetails?.location
              ? {
                  venue: eventDetails.location,
                  address: eventDetails.location,
                  placement: "middle section",
                  prominence: "medium",
                }
              : null,
            pricing: eventDetails?.price
              ? {
                  amount: eventDetails.price,
                  placement: "prominent area",
                  emphasis: "high",
                }
              : null,
          },
          designElements: {
            primaryFocus: "event title and main visual",
            secondaryElements: ["date/time", "location", "highlights"],
            textHierarchy: ["title", "date", "location", "highlights", "contact"],
          },
          technicalSpecs: {
            aspectRatio: advancedOptions?.aspectRatio || "9:16",
            resolution: "high resolution",
          },
        }

        console.log("[v0] Fallback data created successfully")
        return NextResponse.json({ refinedPromptData: fallbackData })
      }
    } catch (apiError: any) {
      console.error("[v0] AI SDK call failed:", apiError)
      console.error("[v0] Error type:", typeof apiError)
      console.error("[v0] Error constructor:", apiError?.constructor?.name)
      console.error("[v0] Error message:", apiError?.message)
      console.error("[v0] Error stack:", apiError?.stack)

      // Handle specific AI SDK errors
      if (apiError?.message?.includes("API key")) {
        console.error("[v0] API Key Error - check OPENAI_API_KEY configuration")
        return NextResponse.json(
          {
            error: "Invalid OpenAI API key",
            details: apiError.message,
          },
          { status: 401 },
        )
      } else if (apiError?.message?.includes("rate limit")) {
        console.error("[v0] Rate Limit Error - OpenAI API quota exceeded")
        return NextResponse.json(
          {
            error: "OpenAI rate limit exceeded",
            details: apiError.message,
          },
          { status: 429 },
        )
      } else if (apiError?.message?.includes("timeout")) {
        console.error("[v0] Timeout Error - OpenAI API request timed out")
        return NextResponse.json(
          {
            error: "OpenAI request timeout",
            details: "Request took too long to complete",
          },
          { status: 408 },
        )
      }

      // Generic API error fallback
      return NextResponse.json(
        {
          error: "OpenAI API error",
          details: apiError?.message || "Unknown API error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Prompt refinement error details:", error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    const emergencyFallback = {
      prompt: `Professional event poster for ${eventDetails?.title || "upcoming event"}. ${eventDetails?.tagline || "Special event"}. Date: ${eventDetails?.date || "TBD"}. Modern design with clean typography and vibrant colors.`,
      style: "modern professional",
      colors: ["#1a1a1a", "#ffffff", "#0066cc"],
      mood: "professional and engaging",
      composition: "clean hierarchical layout",
    }

    console.log("[v0] Emergency fallback response created")
    return NextResponse.json({ refinedPromptData: emergencyFallback })
  }
}
