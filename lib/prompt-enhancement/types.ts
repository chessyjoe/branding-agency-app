// Type definitions for prompt enhancement system

export type GenerationType = 
  | 'logo' 
  | 'banner' 
  | 'poster' 
  | 'business-card' 
  | 'website' 
  | 'video' 
  | 'code' 
  | 'slogan'

export interface PromptTemplate {
  systemPrompt: string
  userMessageTemplate: string
  outputStructure: any
  typeSpecificGuidelines: string[]
  modelRecommendations: {
    primary: string[]
    fallback: string[]
  }
}

export interface EnhancedPromptData {
  prompt: string
  style?: string
  colors?: string[]
  mood?: string
  composition?: string
  technicalSpecs?: {
    aspectRatio?: string
    resolution?: string
    textReadability?: string
    printConsiderations?: string
  }
  typeSpecificData?: any
}

export interface PromptEnhancementRequest {
  prompt: string
  type: GenerationType
  colors?: string[]
  brandVoice?: any
  advancedOptions?: any
  eventDetails?: any
  customContext?: any
}

export interface PromptEnhancementResponse {
  success: boolean
  data?: EnhancedPromptData
  error?: string
  fallback?: boolean
}
