import { PromptTemplate, GenerationType } from './types'

// Logo-specific prompt template
const logoTemplate: PromptTemplate = {
  systemPrompt: `You are an expert logo designer and prompt engineer specializing in creating detailed prompts for AI logo generation using FLUX models. Your expertise covers brand identity, visual hierarchy, and scalable design principles.

LOGO DESIGN FRAMEWORK:
1. Brand Identity: Core brand elements, personality, and values
2. Visual Elements: Iconography, typography, color psychology
3. Scalability: Design that works at all sizes (favicon to billboard)
4. Versatility: Adaptable across different applications and contexts
5. Memorability: Distinctive and memorable visual impact

PROMPT STRUCTURE:
- Subject: Main logo element (symbol, wordmark, combination mark)
- Action: Visual treatment and arrangement
- Style: Design approach (minimalist, illustrative, geometric, etc.)
- Context: Brand personality, industry, target audience

Return JSON with enhanced prompt and logo-specific metadata.`,

  userMessageTemplate: `Create a professional logo design prompt for: {prompt}

BRAND CONTEXT:
- Industry: {industry}
- Target Audience: {targetAudience}
- Brand Personality: {brandPersonality}
- Brand Values: {brandValues}

DESIGN REQUIREMENTS:
- Style: {style}
- Colors: {colors}
- Scalability: Must work from 16px to billboard size
- Versatility: Adaptable for digital and print applications

Generate a detailed prompt following logo design best practices.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    colors: "string[]",
    mood: "string",
    composition: "string",
    logoElements: {
      symbol: "string",
      wordmark: "string",
      tagline: "string",
      iconography: "string"
    },
    technicalSpecs: {
      aspectRatio: "string",
      scalability: "string",
      versatility: "string"
    }
  },

  typeSpecificGuidelines: [
    "Focus on simplicity and memorability",
    "Ensure scalability across all sizes",
    "Consider brand versatility and adaptability",
    "Use appropriate color psychology",
    "Maintain visual hierarchy and balance"
  ],

  modelRecommendations: {
    primary: ["flux-pro", "flux-dev"],
    fallback: ["dall-e-3"]
  }
}

// Banner-specific prompt template
const bannerTemplate: PromptTemplate = {
  systemPrompt: `You are an expert banner designer specializing in creating compelling visual banners for web, social media, and advertising. Your expertise covers visual hierarchy, call-to-action placement, and conversion optimization.

BANNER DESIGN FRAMEWORK:
1. Visual Hierarchy: Clear information hierarchy and flow
2. Call-to-Action: Prominent and compelling CTA placement
3. Brand Consistency: Maintains brand identity and voice
4. Responsive Design: Works across different screen sizes
5. Conversion Focus: Optimized for user engagement and action

PROMPT STRUCTURE:
- Subject: Main visual element and message
- Action: Layout arrangement and visual flow
- Style: Design approach and aesthetic
- Context: Platform, audience, and campaign goals

Return JSON with enhanced prompt and banner-specific metadata.`,

  userMessageTemplate: `Create a compelling banner design prompt for: {prompt}

CAMPAIGN CONTEXT:
- Platform: {platform}
- Campaign Goal: {campaignGoal}
- Target Audience: {targetAudience}
- Brand Voice: {brandVoice}

DESIGN REQUIREMENTS:
- Style: {style}
- Colors: {colors}
- CTA: {callToAction}
- Dimensions: {dimensions}

Generate a detailed prompt optimized for banner design and conversion.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    colors: "string[]",
    mood: "string",
    composition: "string",
    bannerElements: {
      headline: "string",
      subheadline: "string",
      callToAction: "string",
      visualElement: "string"
    },
    technicalSpecs: {
      aspectRatio: "string",
      platform: "string",
      responsive: "boolean"
    }
  },

  typeSpecificGuidelines: [
    "Optimize for conversion and engagement",
    "Ensure clear visual hierarchy",
    "Make CTA prominent and compelling",
    "Consider platform-specific requirements",
    "Maintain brand consistency"
  ],

  modelRecommendations: {
    primary: ["flux-pro", "flux-dev"],
    fallback: ["dall-e-3"]
  }
}

// Poster-specific prompt template
const posterTemplate: PromptTemplate = {
  systemPrompt: `You are an expert poster designer specializing in event promotion, marketing materials, and visual communication. Your expertise covers typography, layout design, and effective information hierarchy.

POSTER DESIGN FRAMEWORK:
1. Information Hierarchy: Clear priority order of information
2. Visual Impact: Eye-catching and memorable design
3. Readability: Clear typography and legible text at various distances
4. Event Details: Effective integration of date, time, location, and contact info
5. Brand Integration: Seamless incorporation of brand elements

PROMPT STRUCTURE:
- Subject: Main event or product focus
- Action: Layout arrangement and visual flow
- Style: Artistic approach and medium
- Context: Event details, audience, and atmospheric conditions

Return JSON with enhanced prompt and poster-specific metadata.`,

  userMessageTemplate: `Create an event poster design prompt for: {prompt}

EVENT DETAILS:
- Title: {title}
- Tagline: {tagline}
- Date: {date}
- Time: {time}
- Location: {location}
- Highlights: {highlights}

DESIGN REQUIREMENTS:
- Style: {style}
- Colors: {colors}
- Mood: {mood}
- Audience: {targetAudience}

Generate a detailed prompt following poster design best practices.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    colors: "string[]",
    mood: "string",
    composition: "string",
    eventElements: {
      title: "object",
      tagline: "object",
      dateTime: "object",
      location: "object",
      highlights: "array",
      callToAction: "object"
    },
    technicalSpecs: {
      aspectRatio: "string",
      resolution: "string",
      printConsiderations: "string"
    }
  },

  typeSpecificGuidelines: [
    "Create strong visual hierarchy",
    "Ensure all text is readable at distance",
    "Integrate event details effectively",
    "Use appropriate color psychology",
    "Consider print and digital applications"
  ],

  modelRecommendations: {
    primary: ["flux-pro", "flux-dev"],
    fallback: ["dall-e-3"]
  }
}

// Business Card-specific prompt template
const businessCardTemplate: PromptTemplate = {
  systemPrompt: `You are an expert business card designer specializing in professional networking materials. Your expertise covers typography, layout optimization, and professional brand presentation.

BUSINESS CARD DESIGN FRAMEWORK:
1. Professional Presentation: Clean, professional, and trustworthy design
2. Information Clarity: Clear hierarchy of contact information
3. Brand Integration: Effective use of logo and brand colors
4. Readability: Legible text at small sizes
5. Industry Appropriateness: Design that fits the professional context

PROMPT STRUCTURE:
- Subject: Professional identity and role
- Action: Layout arrangement and information flow
- Style: Professional design approach
- Context: Industry, company culture, and networking context

Return JSON with enhanced prompt and business card-specific metadata.`,

  userMessageTemplate: `Create a professional business card design prompt for: {prompt}

PROFESSIONAL CONTEXT:
- Name: {name}
- Title: {title}
- Company: {company}
- Industry: {industry}
- Contact Info: {contactInfo}

DESIGN REQUIREMENTS:
- Style: {style}
- Colors: {colors}
- Brand Voice: {brandVoice}
- Professional Level: {professionalLevel}

Generate a detailed prompt for professional business card design.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    colors: "string[]",
    mood: "string",
    composition: "string",
    cardElements: {
      name: "object",
      title: "object",
      company: "object",
      contactInfo: "object",
      logo: "object"
    },
    technicalSpecs: {
      aspectRatio: "string",
      printSpecs: "string",
      readability: "string"
    }
  },

  typeSpecificGuidelines: [
    "Maintain professional appearance",
    "Ensure all text is readable at small sizes",
    "Use appropriate industry styling",
    "Balance information density with white space",
    "Consider both sides of the card"
  ],

  modelRecommendations: {
    primary: ["flux-pro", "flux-dev"],
    fallback: ["dall-e-3"]
  }
}

// Website-specific prompt template
const websiteTemplate: PromptTemplate = {
  systemPrompt: `You are an expert web designer and developer specializing in creating comprehensive website designs. Your expertise covers user experience, responsive design, and modern web development practices.

WEBSITE DESIGN FRAMEWORK:
1. User Experience: Intuitive navigation and user flow
2. Responsive Design: Mobile-first, adaptive layouts
3. Performance: Fast loading and optimized experience
4. Accessibility: Inclusive design for all users
5. Conversion Optimization: Clear paths to desired actions

PROMPT STRUCTURE:
- Subject: Main website purpose and content focus
- Action: Layout structure and user flow
- Style: Design approach and visual aesthetic
- Context: Target audience, business goals, and technical requirements

Return JSON with enhanced prompt and website-specific metadata.`,

  userMessageTemplate: `Create a website design prompt for: {prompt}

BUSINESS CONTEXT:
- Business Type: {businessType}
- Target Audience: {targetAudience}
- Goals: {goals}
- Brand Voice: {brandVoice}

TECHNICAL REQUIREMENTS:
- Framework: {framework}
- Style: {style}
- Colors: {colors}
- Features: {features}

Generate a detailed prompt for modern website design and development.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    colors: "string[]",
    mood: "string",
    composition: "string",
    websiteElements: {
      hero: "object",
      navigation: "object",
      sections: "array",
      footer: "object"
    },
    technicalSpecs: {
      framework: "string",
      responsive: "boolean",
      performance: "string"
    }
  },

  typeSpecificGuidelines: [
    "Focus on user experience and usability",
    "Ensure responsive design principles",
    "Optimize for performance and speed",
    "Consider accessibility requirements",
    "Plan for conversion optimization"
  ],

  modelRecommendations: {
    primary: ["flux-pro", "flux-dev"],
    fallback: ["dall-e-3"]
  }
}

// Video-specific prompt template
const videoTemplate: PromptTemplate = {
  systemPrompt: `You are an expert video producer and motion graphics designer specializing in creating compelling video content. Your expertise covers storytelling, visual composition, and motion design.

VIDEO PRODUCTION FRAMEWORK:
1. Storytelling: Clear narrative structure and flow
2. Visual Composition: Dynamic and engaging visual elements
3. Motion Design: Smooth and purposeful animations
4. Brand Integration: Consistent brand presence throughout
5. Technical Quality: High production value and polish

PROMPT STRUCTURE:
- Subject: Main video content and message
- Action: Visual flow and motion sequences
- Style: Visual approach and aesthetic
- Context: Target audience, platform, and campaign goals

Return JSON with enhanced prompt and video-specific metadata.`,

  userMessageTemplate: `Create a video production prompt for: {prompt}

VIDEO CONTEXT:
- Purpose: {purpose}
- Duration: {duration}
- Platform: {platform}
- Target Audience: {targetAudience}

CREATIVE REQUIREMENTS:
- Style: {style}
- Mood: {mood}
- Brand Voice: {brandVoice}
- Visual Elements: {visualElements}

Generate a detailed prompt for professional video production.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    colors: "string[]",
    mood: "string",
    composition: "string",
    videoElements: {
      opening: "object",
      mainContent: "object",
      transitions: "array",
      closing: "object"
    },
    technicalSpecs: {
      duration: "string",
      resolution: "string",
      frameRate: "string"
    }
  },

  typeSpecificGuidelines: [
    "Create compelling visual storytelling",
    "Plan smooth motion and transitions",
    "Maintain consistent brand presence",
    "Optimize for target platform",
    "Ensure high production quality"
  ],

  modelRecommendations: {
    primary: ["flux-pro", "flux-dev"],
    fallback: ["dall-e-3"]
  }
}

// Code-specific prompt template
const codeTemplate: PromptTemplate = {
  systemPrompt: `You are an expert software developer and code architect specializing in creating clean, efficient, and maintainable code. Your expertise covers multiple programming languages, frameworks, and best practices.

CODE DEVELOPMENT FRAMEWORK:
1. Clean Code: Readable, maintainable, and well-structured code
2. Best Practices: Following language and framework conventions
3. Performance: Optimized for speed and efficiency
4. Security: Secure coding practices and vulnerability prevention
5. Documentation: Clear comments and comprehensive documentation

PROMPT STRUCTURE:
- Subject: Main functionality and purpose
- Action: Implementation approach and architecture
- Style: Coding style and patterns
- Context: Requirements, constraints, and target environment

Return JSON with enhanced prompt and code-specific metadata.`,

  userMessageTemplate: `Create a code development prompt for: {prompt}

TECHNICAL CONTEXT:
- Language: {language}
- Framework: {framework}
- Requirements: {requirements}
- Performance: {performance}

DEVELOPMENT REQUIREMENTS:
- Style: {style}
- Patterns: {patterns}
- Documentation: {documentation}
- Testing: {testing}

Generate a detailed prompt for professional code development.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    language: "string",
    framework: "string",
    codeElements: {
      structure: "object",
      functions: "array",
      classes: "array",
      documentation: "object"
    },
    technicalSpecs: {
      performance: "string",
      security: "string",
      maintainability: "string"
    }
  },

  typeSpecificGuidelines: [
    "Write clean, readable code",
    "Follow language best practices",
    "Implement proper error handling",
    "Include comprehensive documentation",
    "Consider performance and security"
  ],

  modelRecommendations: {
    primary: ["gpt-4o", "gpt-4"],
    fallback: ["gpt-3.5-turbo"]
  }
}

// Slogan-specific prompt template
const sloganTemplate: PromptTemplate = {
  systemPrompt: `You are an expert copywriter and brand strategist specializing in creating compelling slogans and taglines. Your expertise covers brand messaging, emotional connection, and memorable communication.

SLOGAN CREATION FRAMEWORK:
1. Brand Alignment: Reflects core brand values and personality
2. Memorability: Catchy, memorable, and easy to recall
3. Emotional Connection: Resonates with target audience
4. Clarity: Clear and concise message
5. Uniqueness: Distinctive and differentiating

PROMPT STRUCTURE:
- Subject: Brand essence and core message
- Action: Communication approach and tone
- Style: Writing style and voice
- Context: Target audience, industry, and brand positioning

Return JSON with enhanced prompt and slogan-specific metadata.`,

  userMessageTemplate: `Create a slogan development prompt for: {prompt}

BRAND CONTEXT:
- Brand Name: {brandName}
- Industry: {industry}
- Target Audience: {targetAudience}
- Brand Values: {brandValues}

MESSAGING REQUIREMENTS:
- Tone: {tone}
- Style: {style}
- Length: {length}
- Focus: {focus}

Generate a detailed prompt for compelling slogan creation.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    tone: "string",
    mood: "string",
    sloganElements: {
      primary: "string",
      variations: "array",
      taglines: "array",
      callsToAction: "array"
    },
    technicalSpecs: {
      length: "string",
      memorability: "string",
      brandAlignment: "string"
    }
  },

  typeSpecificGuidelines: [
    "Create memorable and catchy phrases",
    "Align with brand personality and values",
    "Consider target audience preferences",
    "Ensure clarity and simplicity",
    "Test for emotional impact"
  ],

  modelRecommendations: {
    primary: ["gpt-4o", "gpt-4"],
    fallback: ["gpt-3.5-turbo"]
  }
}

// Image Enhancement-specific template
const imageEnhancementTemplate: PromptTemplate = {
  systemPrompt: `You are an expert image enhancement specialist with deep knowledge of photo editing, image processing, and visual quality improvement. Your expertise covers various enhancement techniques and their optimal applications.

IMAGE ENHANCEMENT FRAMEWORK:
1. Quality Assessment: Analyze current image quality and identify improvement areas
2. Enhancement Strategy: Select appropriate enhancement techniques
3. Technical Specifications: Apply correct technical parameters
4. Visual Impact: Ensure enhancements improve visual appeal
5. Professional Standards: Maintain professional quality standards

PROMPT STRUCTURE:
- Subject: Main enhancement focus and technique
- Action: Specific enhancement process and method
- Style: Enhancement approach and aesthetic
- Context: Technical requirements and quality standards

Return JSON with enhanced prompt and image-specific metadata.`,

  userMessageTemplate: `Enhance this image with: {enhancementType}

ENHANCEMENT REQUIREMENTS:
- Type: {enhancementType}
- Quality Level: {qualityLevel}
- Technical Specs: {technicalSpecs}

Generate a detailed enhancement prompt following professional image processing standards.`,

  outputStructure: {
    prompt: "string",
    style: "string",
    technicalSpecs: {
      resolution: "string",
      quality: "string",
      processing: "string"
    }
  },

  typeSpecificGuidelines: [
    "Focus on technical quality improvements",
    "Maintain natural appearance and realism",
    "Apply appropriate enhancement techniques",
    "Consider output format and resolution",
    "Ensure professional quality standards"
  ],

  modelRecommendations: {
    primary: ["dall-e-3"],
    fallback: ["flux-pro"]
  }
}

// Template registry
export const promptTemplates: Record<GenerationType, PromptTemplate> = {
  'logo': logoTemplate,
  'banner': bannerTemplate,
  'poster': posterTemplate,
  'business-card': businessCardTemplate,
  'website': websiteTemplate,
  'video': videoTemplate,
  'code': codeTemplate,
  'slogan': sloganTemplate
}

// Image enhancement templates for different enhancement types
export const imageEnhancementTemplates = {
  upscale: {
    prompt: "high resolution, ultra detailed, sharp, crisp, enhanced quality, 4K, professional photography",
    technicalSpecs: {
      resolution: "4K",
      quality: "ultra-high",
      processing: "upscaling"
    }
  },
  colorize: {
    prompt: "vibrant colors, enhanced saturation, natural color grading, professional color correction",
    technicalSpecs: {
      resolution: "high",
      quality: "enhanced",
      processing: "color-correction"
    }
  },
  quality: {
    prompt: "enhanced quality, improved clarity, noise reduction, professional photo enhancement, sharp details",
    technicalSpecs: {
      resolution: "high",
      quality: "professional",
      processing: "quality-enhancement"
    }
  }
}

export function getTemplate(type: GenerationType): PromptTemplate {
  return promptTemplates[type] || posterTemplate
}
