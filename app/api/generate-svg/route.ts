import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] SVG generation API called")

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
      width = 400,
      height = 400
    } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[v0] Generating SVG for:", { type, promptLength: prompt.length, colors })

    // Create specialized SVG generation prompt
    const svgSystemPrompt = `You are an expert SVG designer and developer. You create clean, scalable, and editable SVG graphics that are optimized for web use and canvas editing.

IMPORTANT REQUIREMENTS:
1. Return ONLY valid SVG code - no explanations, no markdown, no extra text
2. Use semantic IDs for elements (e.g., id="logo-text", id="icon-shape")
3. Include proper viewBox attribute for scalability
4. Use clean, organized structure with groups for related elements
5. Optimize for editing in a canvas editor
6. Include proper xmlns and version attributes
7. Use inline styles or CSS classes for easy color modifications
8. Ensure all text is selectable and editable
9. Create vector paths that are smooth and professional
10. Make the design scalable without quality loss

SVG STRUCTURE GUIDELINES:
- Start with <svg> tag with proper viewBox
- Group related elements with <g> tags
- Use descriptive IDs for all major elements
- Include title and description elements for accessibility
- Optimize path data for smaller file size
- Use appropriate stroke-width for the design scale`

    const svgUserPrompt = `Create an SVG ${type} with the following specifications:

DESIGN BRIEF: ${prompt}

TECHNICAL SPECIFICATIONS:
- Dimensions: ${width}x${height}
- Colors: ${colors.length > 0 ? colors.join(', ') : 'Use appropriate colors for the design'}
- Style: ${advancedOptions.style ? (Array.isArray(advancedOptions.style) ? advancedOptions.style.join(', ') : advancedOptions.style) : 'Modern and professional'}
- Brand Voice: ${brandVoice.tone ? (Array.isArray(brandVoice.tone) ? brandVoice.tone.join(', ') : brandVoice.tone) : 'Professional'}

DESIGN REQUIREMENTS:
- Create a clean, professional ${type}
- Use vector shapes and paths
- Ensure scalability from small icons to large displays
- Include proper element hierarchy
- Make text elements editable
- Use semantic naming for elements
- Optimize for canvas manipulation

Return only the complete SVG code starting with <svg> and ending with </svg>.`

    try {
      const { text: svgContent } = await generateText({
        model: openai("gpt-4o"),
        system: svgSystemPrompt,
        prompt: svgUserPrompt,
        temperature: 0.3, // Lower temperature for more consistent SVG structure
      })

      console.log("[v0] SVG generation successful, length:", svgContent.length)

      // Clean up the SVG content
      let cleanSVG = svgContent.trim()
      
      // Remove any markdown code blocks if present
      if (cleanSVG.startsWith("```")) {
        const startMatch = cleanSVG.match(/^```(?:svg|xml)?\s*\n?/)
        if (startMatch) {
          cleanSVG = cleanSVG.substring(startMatch[0].length)
        }
        const endIndex = cleanSVG.lastIndexOf("```")
        if (endIndex !== -1) {
          cleanSVG = cleanSVG.substring(0, endIndex)
        }
      }

      // Ensure SVG starts and ends properly
      if (!cleanSVG.startsWith("<svg")) {
        const svgStart = cleanSVG.indexOf("<svg")
        if (svgStart !== -1) {
          cleanSVG = cleanSVG.substring(svgStart)
        }
      }

      if (!cleanSVG.endsWith("</svg>")) {
        const svgEnd = cleanSVG.lastIndexOf("</svg>")
        if (svgEnd !== -1) {
          cleanSVG = cleanSVG.substring(0, svgEnd + 6)
        }
      }

      // Basic SVG validation
      if (!cleanSVG.includes("<svg") || !cleanSVG.includes("</svg>")) {
        throw new Error("Generated content is not valid SVG")
      }

      console.log("[v0] SVG cleaned and validated successfully")

      return NextResponse.json({
        success: true,
        svg: cleanSVG,
        type: "svg",
        metadata: {
          width,
          height,
          colors,
          generatedAt: new Date().toISOString(),
          contentLength: cleanSVG.length
        }
      })

    } catch (aiError) {
      console.error("[v0] AI SVG generation failed:", aiError)
      
      // Create a fallback SVG
      const fallbackSVG = createFallbackSVG(type, prompt, colors, width, height)
      
      return NextResponse.json({
        success: true,
        svg: fallbackSVG,
        type: "svg",
        fallback: true,
        metadata: {
          width,
          height,
          colors,
          generatedAt: new Date().toISOString(),
          contentLength: fallbackSVG.length
        }
      })
    }

  } catch (error) {
    console.error("[v0] SVG generation error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "SVG generation failed",
        success: false
      }, 
      { status: 500 }
    )
  }
}

// Fallback SVG generator for when AI fails
function createFallbackSVG(
  type: string, 
  prompt: string, 
  colors: string[], 
  width: number, 
  height: number
): string {
  const primaryColor = colors[0] || "#2563eb"
  const secondaryColor = colors[1] || "#1e40af"
  
  const fallbackPrompt = prompt.substring(0, 50) + (prompt.length > 50 ? "..." : "")
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <title>${type.charAt(0).toUpperCase() + type.slice(1)} - ${fallbackPrompt}</title>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  <g id="background">
    <rect width="100%" height="100%" fill="white"/>
  </g>
  <g id="main-content">
    <circle id="main-shape" cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/4}" fill="url(#gradient)" stroke="${primaryColor}" stroke-width="2"/>
    <text id="main-text" x="${width/2}" y="${height/2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="18" fill="white" font-weight="bold">
      ${type.toUpperCase()}
    </text>
  </g>
</svg>`
}




