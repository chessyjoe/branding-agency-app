import { createUniversalDualService, type UniversalDualRequest, type UniversalDualResult } from './universal-service'

// Re-export types for convenience
export type { UniversalDualRequest, UniversalDualResult }

/**
 * Integration utility to add dual generation to any existing generation API
 */
export class DualGenerationIntegration {
  private dualService: any

  constructor(openaiApiKey: string) {
    this.dualService = createUniversalDualService(openaiApiKey)
  }

  /**
   * Add dual generation to an existing generation API
   */
  async addDualGeneration(
    request: UniversalDualRequest,
    displayContentGenerator: (prompt: string, options: any) => Promise<string>
  ): Promise<UniversalDualResult> {
    return await this.dualService.generateDualContent(request, displayContentGenerator)
  }

  /**
   * Generate only SVG content for editor use
   */
  async generateSVGOnly(request: UniversalDualRequest): Promise<string> {
    return await this.dualService.generateSVGContent(request)
  }
}

/**
 * Create a dual generation integration instance
 */
export function createDualIntegration(openaiApiKey: string): DualGenerationIntegration {
  return new DualGenerationIntegration(openaiApiKey)
}

/**
 * Helper function to integrate dual generation into existing APIs
 * Usage: Add this to any generation API after the main content is generated
 */
export async function integrateDualGeneration(
  openaiApiKey: string,
  request: UniversalDualRequest,
  displayImageUrl: string
): Promise<{ svgContent?: string; fallback?: boolean }> {
  try {
    const integration = createDualIntegration(openaiApiKey)
    
    // Generate SVG content for the editor
    const svgContent = await integration.generateSVGOnly(request)
    
    return {
      svgContent,
      fallback: false
    }
  } catch (error) {
    console.error("[DualIntegration] SVG generation failed:", error)
    
    // Return fallback SVG
    const integration = createDualIntegration(openaiApiKey)
    const fallbackSvg = await integration.generateSVGOnly({
      ...request,
      prompt: "Fallback design"
    })
    
    return {
      svgContent: fallbackSvg,
      fallback: true
    }
  }
}

/**
 * Helper to save dual generation results to database
 */
export function prepareDualGenerationData(
  displayImageUrl: string,
  svgContent?: string,
  fallback = false
) {
  return {
    image_url: displayImageUrl,
    svg_content: svgContent || null,
    generation_data: {
      hasSvg: !!svgContent,
      svgLength: svgContent?.length || 0,
      fallback,
      generatedAt: new Date().toISOString()
    }
  }
}
