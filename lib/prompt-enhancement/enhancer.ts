import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { 
  PromptEnhancementRequest, 
  PromptEnhancementResponse, 
  EnhancedPromptData,
  GenerationType 
} from './types'
import { getTemplate } from './templates'

// Zod schema for structured output
const EnhancedPromptSchema = z.object({
  prompt: z.string().describe("The enhanced, detailed prompt following the specific generation type framework"),
  style: z.string().describe("Visual style description"),
  colors: z.array(z.string()).describe("Array of color codes"),
  mood: z.string().describe("Overall mood and atmosphere"),
  composition: z.string().describe("Layout and composition details"),
  technicalSpecs: z.object({
    aspectRatio: z.string().optional().describe("Recommended aspect ratio"),
    resolution: z.string().optional().describe("Recommended resolution"),
    textReadability: z.string().optional().describe("Readability considerations"),
    printConsiderations: z.string().optional().describe("Print-specific recommendations")
  }).optional(),
  typeSpecificData: z.record(z.any()).optional().describe("Type-specific metadata and elements")
})

export class PromptEnhancer {
  private openaiApiKey: string

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey
  }

  async enhancePrompt(request: PromptEnhancementRequest): Promise<PromptEnhancementResponse> {
    try {
      const template = getTemplate(request.type)
      
      // Build the system prompt with type-specific guidelines
      const systemPrompt = this.buildSystemPrompt(template, request.type)
      
      // Build the user message with context
      const userMessage = this.buildUserMessage(template, request)
      
      console.log(`[PromptEnhancer] Enhancing ${request.type} prompt with template`)
      console.log(`[PromptEnhancer] System prompt length: ${systemPrompt.length}`)
      console.log(`[PromptEnhancer] User message length: ${userMessage.length}`)

      // Generate enhanced prompt using AI with structured output
      const { object: responseObject } = await generateObject({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: userMessage,
        temperature: 0.7,
        schema: EnhancedPromptSchema,
      })

      console.log(`[PromptEnhancer] Structured response received`)

      // Validate and structure the response
      const enhancedData = this.validateAndStructureResponse(responseObject, template)
      
      return {
        success: true,
        data: enhancedData
      }

    } catch (error) {
      console.error(`[PromptEnhancer] Error enhancing ${request.type} prompt:`, error)
      
      // Return fallback response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: true,
        data: this.createFallbackResponse(request)
      }
    }
  }

  private buildSystemPrompt(template: any, type: GenerationType): string {
    let systemPrompt = template.systemPrompt

    // Add type-specific model recommendations
    if (template.modelRecommendations) {
      systemPrompt += `\n\nRECOMMENDED MODELS:\n`
      systemPrompt += `Primary: ${template.modelRecommendations.primary.join(', ')}\n`
      systemPrompt += `Fallback: ${template.modelRecommendations.fallback.join(', ')}\n`
    }

    // Add type-specific guidelines
    if (template.typeSpecificGuidelines) {
      systemPrompt += `\n\nTYPE-SPECIFIC GUIDELINES:\n`
      template.typeSpecificGuidelines.forEach((guideline: string, index: number) => {
        systemPrompt += `${index + 1}. ${guideline}\n`
      })
    }

    // Add output structure requirements
    systemPrompt += `\n\nOUTPUT REQUIREMENTS:\n`
    systemPrompt += `Return your response as a JSON object following this structure:\n`
    systemPrompt += JSON.stringify(template.outputStructure, null, 2)

    return systemPrompt
  }

  private buildUserMessage(template: any, request: PromptEnhancementRequest): string {
    let userMessage = template.userMessageTemplate

    // Replace placeholders with actual values
    userMessage = userMessage.replace('{prompt}', request.prompt)
    userMessage = userMessage.replace('{type}', request.type)

    // Add context-specific information
    if (request.brandVoice) {
      userMessage += `\n\nBRAND VOICE:\n`
      if (request.brandVoice.tone) {
        userMessage += `- Tone: ${Array.isArray(request.brandVoice.tone) ? request.brandVoice.tone.join(', ') : request.brandVoice.tone}\n`
      }
      if (request.brandVoice.targetAudience) {
        userMessage += `- Target Audience: ${request.brandVoice.targetAudience}\n`
      }
      if (request.brandVoice.brandValues) {
        userMessage += `- Brand Values: ${request.brandVoice.brandValues}\n`
      }
    }

    // Add color information
    if (request.colors && request.colors.length > 0) {
      userMessage += `\n\nCOLOR PALETTE: ${request.colors.join(', ')}\n`
    }

    // Add advanced options
    if (request.advancedOptions) {
      userMessage += `\n\nADVANCED OPTIONS:\n`
      if (request.advancedOptions.style) {
        userMessage += `- Style: ${Array.isArray(request.advancedOptions.style) ? request.advancedOptions.style.join(', ') : request.advancedOptions.style}\n`
      }
      if (request.advancedOptions.aspectRatio) {
        userMessage += `- Aspect Ratio: ${request.advancedOptions.aspectRatio}\n`
      }
      if (request.advancedOptions.quality) {
        userMessage += `- Quality: ${request.advancedOptions.quality}\n`
      }
    }

    // Add event details for relevant types
    if (request.eventDetails && ['poster', 'banner', 'logo'].includes(request.type)) {
      userMessage += `\n\nEVENT DETAILS:\n`
      if (request.eventDetails.title) userMessage += `- Title: ${request.eventDetails.title}\n`
      if (request.eventDetails.tagline) userMessage += `- Tagline: ${request.eventDetails.tagline}\n`
      if (request.eventDetails.date) userMessage += `- Date: ${request.eventDetails.date}\n`
      if (request.eventDetails.time) userMessage += `- Time: ${request.eventDetails.time}\n`
      if (request.eventDetails.location) userMessage += `- Location: ${request.eventDetails.location}\n`
      if (request.eventDetails.price) userMessage += `- Price: ${request.eventDetails.price}\n`
      if (request.eventDetails.highlights && request.eventDetails.highlights.length > 0) {
        userMessage += `- Highlights: ${request.eventDetails.highlights.filter((h: string) => h.trim()).join(', ')}\n`
      }
    }

    // Add custom context
    if (request.customContext) {
      userMessage += `\n\nCUSTOM CONTEXT:\n`
      userMessage += JSON.stringify(request.customContext, null, 2)
    }

    return userMessage
  }


  private validateAndStructureResponse(parsed: any, template: any): EnhancedPromptData {
    // The structured output should already be validated by Zod, but we'll add safety checks
    const enhancedData: EnhancedPromptData = {
      prompt: parsed.prompt || 'Enhanced prompt',
      style: parsed.style || 'modern',
      colors: Array.isArray(parsed.colors) ? parsed.colors : [],
      mood: parsed.mood || 'professional',
      composition: parsed.composition || 'balanced',
      technicalSpecs: parsed.technicalSpecs || {}
    }

    // Add type-specific data if present
    if (parsed.typeSpecificData && typeof parsed.typeSpecificData === 'object') {
      enhancedData.typeSpecificData = parsed.typeSpecificData
    }

    return enhancedData
  }

  public createFallbackResponse(request: PromptEnhancementRequest): EnhancedPromptData {
    const basePrompt = request.prompt
    const type = request.type
    const colors = request.colors || []
    const style = request.advancedOptions?.style || 'modern'

    let enhancedPrompt = basePrompt

    // Add type-specific enhancements
    switch (type) {
      case 'logo':
        enhancedPrompt += `. Professional logo design with clean typography and scalable elements.`
        break
      case 'banner':
        enhancedPrompt += `. Eye-catching banner design optimized for conversion and engagement.`
        break
      case 'poster':
        enhancedPrompt += `. Professional event poster with clear hierarchy and compelling visuals.`
        break
      case 'business-card':
        enhancedPrompt += `. Professional business card design with clean layout and clear contact information.`
        break
      case 'website':
        enhancedPrompt += `. Modern website design with responsive layout and user-friendly interface.`
        break
      case 'video':
        enhancedPrompt += `. Professional video production with engaging visuals and smooth motion.`
        break
      case 'code':
        enhancedPrompt += `. Clean, efficient code following best practices and industry standards.`
        break
      case 'slogan':
        enhancedPrompt += `. Memorable and compelling slogan that captures the brand essence.`
        break
    }

    // Add color information
    if (colors.length > 0) {
      enhancedPrompt += ` Color palette: ${colors.join(', ')}.`
    }

    // Add style information
    if (style) {
      enhancedPrompt += ` Style: ${Array.isArray(style) ? style.join(' ') : style}.`
    }

    return {
      prompt: enhancedPrompt,
      style: Array.isArray(style) ? style.join(' ') : style,
      colors: colors,
      mood: 'professional',
      composition: 'balanced',
      technicalSpecs: {
        aspectRatio: request.advancedOptions?.aspectRatio || '16:9'
      }
    }
  }
}

export function createPromptEnhancer(openaiApiKey: string): PromptEnhancer {
  return new PromptEnhancer(openaiApiKey)
}
