import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface UniversalDualRequest {
  prompt: string
  type: 'logo' | 'banner' | 'poster' | 'business-card' | 'website' | 'video' | 'code' | 'slogan'
  colors?: string[]
  brandVoice?: any
  advancedOptions?: any
  eventDetails?: any
  customContext?: any
  width?: number
  height?: number
}

export interface UniversalDualResult {
  success: boolean
  displayImage?: string
  svgContent?: string
  fallback?: boolean
  error?: string
  metadata?: {
    generatedAt: string
    svgLength: number
    hasDisplayImage: boolean
    hasSvg: boolean
    type: string
  }
}

export class UniversalDualGenerationService {
  private openaiApiKey: string

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey
  }

  /**
   * Generate SVG content for any generation type
   */
  async generateSVGContent(request: UniversalDualRequest): Promise<string> {
    const { prompt, type, colors = [], brandVoice = {}, width = 400, height = 400 } = request

    // Get type-specific SVG generation prompt
    const svgPrompt = this.getTypeSpecificSVGPrompt(request)

    try {
      const { text: svgContent } = await generateText({
        model: openai("gpt-4o"),
        system: this.getSVGSystemPrompt(),
        prompt: svgPrompt,
        temperature: 0.3,
      })

      return this.cleanSVGContent(svgContent)

    } catch (error) {
      console.error("[UniversalDual] SVG generation failed:", error)
      return this.createFallbackSVG(request)
    }
  }

  /**
   * Generate both display content and SVG for any generation type
   */
  async generateDualContent(
    request: UniversalDualRequest,
    displayContentGenerator: (prompt: string, options: any) => Promise<string>
  ): Promise<UniversalDualResult> {
    try {
      console.log("[UniversalDual] Starting dual generation for:", request.type)

      // Generate both display content and SVG in parallel
      const [displayResult, svgResult] = await Promise.allSettled([
        displayContentGenerator(request.prompt, request),
        this.generateSVGContent(request)
      ])

      let displayImage: string | undefined
      let svgContent: string | undefined
      let fallback = false

      if (displayResult.status === 'fulfilled') {
        displayImage = displayResult.value
        console.log("[UniversalDual] Display content generated successfully")
      } else {
        console.error("[UniversalDual] Display content generation failed:", displayResult.reason)
      }

      if (svgResult.status === 'fulfilled') {
        svgContent = svgResult.value
        console.log("[UniversalDual] SVG content generated successfully, length:", svgContent.length)
      } else {
        console.error("[UniversalDual] SVG generation failed:", svgResult.reason)
        svgContent = this.createFallbackSVG(request)
        fallback = true
      }

      const hasDisplayImage = !!displayImage
      const hasSvg = !!svgContent

      if (!hasDisplayImage && !hasSvg) {
        return {
          success: false,
          error: "Both display content and SVG generation failed"
        }
      }

      return {
        success: true,
        displayImage,
        svgContent,
        fallback,
        metadata: {
          generatedAt: new Date().toISOString(),
          svgLength: svgContent?.length || 0,
          hasDisplayImage,
          hasSvg,
          type: request.type
        }
      }

    } catch (error) {
      console.error("[UniversalDual] Dual generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Dual generation failed"
      }
    }
  }

  /**
   * Get type-specific SVG generation prompt
   */
  private getTypeSpecificSVGPrompt(request: UniversalDualRequest): string {
    const { prompt, type, colors = [], brandVoice = {}, width = 400, height = 400, advancedOptions = {} } = request

    const typeSpecificPrompts = {
      logo: `Create a professional logo SVG with the text or symbol representing: ${prompt}`,
      banner: `Create a banner/poster SVG design for: ${prompt}`,
      poster: `Create a poster SVG design for: ${prompt}`,
      'business-card': `Create a business card front design SVG for: ${prompt}`,
      website: `Create a website header/hero section SVG design for: ${prompt}`,
      video: `Create a video thumbnail/cover SVG design for: ${prompt}`,
      code: `Create a code editor interface SVG design for: ${prompt}`,
      slogan: `Create a text-based design SVG for the slogan: ${prompt}`
    }

    const basePrompt = typeSpecificPrompts[type] || `Create an SVG design for: ${prompt}`

    return `${basePrompt}

TECHNICAL SPECIFICATIONS:
- Dimensions: ${width}x${height}
- Colors: ${colors.length > 0 ? colors.join(', ') : 'Use appropriate colors for the design'}
- Style: ${advancedOptions.style ? (Array.isArray(advancedOptions.style) ? advancedOptions.style.join(', ') : advancedOptions.style) : 'Modern and professional'}
- Brand Voice: ${brandVoice.tone ? (Array.isArray(brandVoice.tone) ? brandVoice.tone.join(', ') : brandVoice.tone) : 'Professional'}

Return only the complete SVG code starting with <svg> and ending with </svg>.`
  }

  /**
   * Get SVG system prompt
   */
  private getSVGSystemPrompt(): string {
    return `You are an expert SVG designer. Create clean, scalable, and editable SVG graphics optimized for web use and canvas editing.

REQUIREMENTS:
1. Return ONLY valid SVG code - no explanations, no markdown
2. Use semantic IDs for elements (e.g., id="logo-text", id="icon-shape", id="main-content")
3. Include proper viewBox attribute for scalability
4. Use clean, organized structure with groups for related elements
5. Optimize for editing in a canvas editor
6. Include proper xmlns and version attributes
7. Use inline styles for easy color modifications
8. Ensure all text is selectable and editable
9. Create vector paths that are smooth and professional
10. Make the design scalable without quality loss
11. Use appropriate fonts and text sizing
12. Include proper element hierarchy for easy manipulation`
  }

  /**
   * Clean and validate SVG content
   */
  private cleanSVGContent(svgContent: string): string {
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

    return cleanSVG
  }

  /**
   * Create fallback SVG when AI generation fails
   */
  private createFallbackSVG(request: UniversalDualRequest): string {
    const { prompt, type, colors = [], width = 400, height = 400 } = request
    const primaryColor = colors[0] || "#2563eb"
    const secondaryColor = colors[1] || "#1e40af"
    
    const fallbackPrompt = prompt.substring(0, 50) + (prompt.length > 50 ? "..." : "")
    
    const typeIcons = {
      logo: "L",
      banner: "B",
      poster: "P",
      'business-card': "BC",
      website: "W",
      video: "V",
      code: "C",
      slogan: "S"
    }
    
    const icon = typeIcons[type] || type.charAt(0).toUpperCase()
    
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
    <rect id="main-shape" x="${width*0.1}" y="${height*0.1}" width="${width*0.8}" height="${height*0.8}" rx="${width*0.1}" fill="url(#gradient)" stroke="${primaryColor}" stroke-width="2"/>
    <text id="main-text" x="${width/2}" y="${height/2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${Math.min(width, height)/8}" fill="white" font-weight="bold">
      ${icon}
    </text>
    <text id="type-label" x="${width/2}" y="${height*0.8}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${Math.min(width, height)/20}" fill="${primaryColor}" font-weight="normal">
      ${type.toUpperCase()}
    </text>
  </g>
</svg>`
  }
}

/**
 * Create a universal dual generation service instance
 */
export function createUniversalDualService(openaiApiKey: string): UniversalDualGenerationService {
  return new UniversalDualGenerationService(openaiApiKey)
}
