import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface DualGenerationRequest {
  prompt: string
  type: 'logo' | 'banner' | 'poster' | 'business-card'
  colors?: string[]
  brandVoice?: any
  advancedOptions?: any
  eventDetails?: any
  width?: number
  height?: number
}

export interface DualGenerationResult {
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
  }
}

export class DualGenerationService {
  private openaiApiKey: string

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey
  }

  /**
   * Generate SVG content for editor use
   */
  async generateSVGContent(request: DualGenerationRequest): Promise<string> {
    const { prompt, type, colors = [], brandVoice = {}, width = 400, height = 400 } = request

    const svgSystemPrompt = `You are an expert SVG designer. Create clean, scalable, and editable SVG graphics optimized for web use and canvas editing.

REQUIREMENTS:
1. Return ONLY valid SVG code - no explanations, no markdown
2. Use semantic IDs for elements (e.g., id="logo-text", id="icon-shape")
3. Include proper viewBox attribute for scalability
4. Use clean, organized structure with groups for related elements
5. Optimize for editing in a canvas editor
6. Include proper xmlns and version attributes
7. Use inline styles for easy color modifications
8. Ensure all text is selectable and editable
9. Create vector paths that are smooth and professional
10. Make the design scalable without quality loss`

    const svgUserPrompt = `Create an SVG ${type} with the following specifications:

DESIGN BRIEF: ${prompt}

TECHNICAL SPECIFICATIONS:
- Dimensions: ${width}x${height}
- Colors: ${colors.length > 0 ? colors.join(', ') : 'Use appropriate colors for the design'}
- Style: ${request.advancedOptions?.style ? (Array.isArray(request.advancedOptions.style) ? request.advancedOptions.style.join(', ') : request.advancedOptions.style) : 'Modern and professional'}
- Brand Voice: ${brandVoice.tone ? (Array.isArray(brandVoice.tone) ? brandVoice.tone.join(', ') : brandVoice.tone) : 'Professional'}

Return only the complete SVG code starting with <svg> and ending with </svg>.`

    try {
      const { text: svgContent } = await generateText({
        model: openai("gpt-4o"),
        system: svgSystemPrompt,
        prompt: svgUserPrompt,
        temperature: 0.3,
      })

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

      return cleanSVG

    } catch (error) {
      console.error("[DualGeneration] SVG generation failed:", error)
      
      // Return fallback SVG
      return this.createFallbackSVG(request)
    }
  }

  /**
   * Generate both display image and SVG content
   */
  async generateDualContent(
    request: DualGenerationRequest,
    displayImageGenerator: (prompt: string, options: any) => Promise<string>
  ): Promise<DualGenerationResult> {
    try {
      console.log("[DualGeneration] Starting dual generation for:", request.type)

      // Generate both display image and SVG in parallel
      const [displayResult, svgResult] = await Promise.allSettled([
        displayImageGenerator(request.prompt, request),
        this.generateSVGContent(request)
      ])

      let displayImage: string | undefined
      let svgContent: string | undefined
      let fallback = false

      if (displayResult.status === 'fulfilled') {
        displayImage = displayResult.value
        console.log("[DualGeneration] Display image generated successfully")
      } else {
        console.error("[DualGeneration] Display image generation failed:", displayResult.reason)
      }

      if (svgResult.status === 'fulfilled') {
        svgContent = svgResult.value
        console.log("[DualGeneration] SVG content generated successfully, length:", svgContent.length)
      } else {
        console.error("[DualGeneration] SVG generation failed:", svgResult.reason)
        svgContent = this.createFallbackSVG(request)
        fallback = true
      }

      const hasDisplayImage = !!displayImage
      const hasSvg = !!svgContent

      if (!hasDisplayImage && !hasSvg) {
        return {
          success: false,
          error: "Both display image and SVG generation failed"
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
          hasSvg
        }
      }

    } catch (error) {
      console.error("[DualGeneration] Dual generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Dual generation failed"
      }
    }
  }

  /**
   * Create fallback SVG when AI generation fails
   */
  private createFallbackSVG(request: DualGenerationRequest): string {
    const { prompt, type, colors = [], width = 400, height = 400 } = request
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
}

/**
 * Create a dual generation service instance
 */
export function createDualGenerationService(openaiApiKey: string): DualGenerationService {
  return new DualGenerationService(openaiApiKey)
}
