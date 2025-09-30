# Prompt Enhancement System

A modular, type-aware prompt enhancement system that provides specialized prompt templates and enhancement logic for different generation types.

## Features

- **Type-Specific Templates**: Customized prompt templates for each generation type
- **Modular Architecture**: Easy to extend and maintain
- **AI-Powered Enhancement**: Uses GPT-4o for intelligent prompt enhancement
- **Fallback Support**: Graceful degradation when enhancement fails
- **Comprehensive Context**: Incorporates brand voice, colors, and advanced options

## Supported Generation Types

- `logo` - Logo design and brand identity
- `banner` - Web banners and advertising materials
- `poster` - Event posters and promotional materials
- `business-card` - Professional business cards
- `website` - Website design and development
- `video` - Video production and motion graphics
- `code` - Software development and programming
- `slogan` - Brand slogans and taglines

## Usage

### Basic Usage

```typescript
import { createPromptEnhancer, PromptEnhancementRequest } from '@/lib/prompt-enhancement'

const enhancer = createPromptEnhancer(process.env.OPENAI_API_KEY!)

const request: PromptEnhancementRequest = {
  prompt: "Create a modern tech startup logo",
  type: "logo",
  colors: ["#0066cc", "#ffffff"],
  brandVoice: {
    tone: ["Professional", "Innovative"],
    targetAudience: "Tech professionals",
    brandValues: "Innovation and reliability"
  },
  advancedOptions: {
    style: ["Minimalist", "Modern"],
    aspectRatio: "1:1"
  }
}

const result = await enhancer.enhancePrompt(request)
```

### API Integration

The system is already integrated into the `/api/refine-prompt` endpoint:

```typescript
// POST /api/refine-prompt
{
  "prompt": "Your base prompt",
  "type": "logo", // or any supported type
  "colors": ["#0066cc", "#ffffff"],
  "brandVoice": { /* brand voice object */ },
  "advancedOptions": { /* advanced options */ },
  "eventDetails": { /* event details for relevant types */ },
  "customContext": { /* any additional context */ }
}
```

## Template Structure

Each generation type has a specialized template with:

- **System Prompt**: Type-specific guidelines and expertise
- **User Message Template**: Structured input format
- **Output Structure**: Expected JSON response format
- **Type-Specific Guidelines**: Best practices for the generation type
- **Model Recommendations**: Suggested AI models for the type

## Example Enhanced Prompts

### Logo Generation
```
Original: "Tech startup logo"
Enhanced: "Modern minimalist logo for a technology startup, featuring a stylized geometric symbol representing innovation and growth, clean sans-serif typography, professional blue and white color scheme, scalable design that works from favicon to billboard, conveying trust, innovation, and forward-thinking approach for tech professionals and investors"
```

### Banner Generation
```
Original: "Summer sale banner"
Enhanced: "Eye-catching promotional banner for summer sale event, featuring vibrant gradient background with warm summer colors, bold typography with clear call-to-action, dynamic layout with product showcase, optimized for web and social media, designed to drive conversions and engagement"
```

### Poster Generation
```
Original: "Music festival poster"
Enhanced: "Dynamic event poster for summer music festival, featuring energetic typography with festival name prominently displayed, vibrant color palette with neon accents, artistic illustration of musical instruments and crowd energy, clear event details hierarchy with date, time, and location, atmospheric lighting suggesting evening performance, designed for both digital and print applications"
```

## Customization

### Adding New Generation Types

1. Create a new template in `templates.ts`:

```typescript
const newTypeTemplate: PromptTemplate = {
  systemPrompt: "Your system prompt...",
  userMessageTemplate: "Your user message template...",
  outputStructure: { /* expected output structure */ },
  typeSpecificGuidelines: [ /* guidelines */ ],
  modelRecommendations: {
    primary: ["model1", "model2"],
    fallback: ["fallback-model"]
  }
}
```

2. Add to the template registry:

```typescript
export const promptTemplates: Record<GenerationType, PromptTemplate> = {
  // ... existing templates
  'new-type': newTypeTemplate
}
```

3. Update the `GenerationType` union in `types.ts`

### Custom Context

You can pass additional context for any generation type:

```typescript
const request: PromptEnhancementRequest = {
  prompt: "Your prompt",
  type: "logo",
  customContext: {
    industry: "Healthcare",
    targetMarket: "B2B",
    competitors: ["Company A", "Company B"],
    uniqueValue: "AI-powered diagnostics"
  }
}
```

## Error Handling

The system includes comprehensive error handling:

- **API Failures**: Falls back to basic enhancement
- **JSON Parsing Errors**: Uses structured fallback responses
- **Missing API Keys**: Returns appropriate error messages
- **Invalid Types**: Defaults to poster template

## Performance

- **Structured Outputs**: Uses OpenAI's structured outputs with Zod schemas for reliable parsing
- **Caching**: Templates are loaded once and reused
- **Efficient Parsing**: No JSON parsing needed with structured outputs
- **Fallback Speed**: Quick fallback responses for reliability
- **Type Safety**: Full TypeScript support for better development experience

## API Key Requirements

### For Structured Outputs (Recommended)
To use the full structured outputs feature, your OpenAI API key needs the following scopes:
- `api.responses.write` - Required for structured outputs
- `api.responses.read` - Required for API access

### For Fallback Mode
If your API key doesn't have the required scopes, the system will automatically fall back to:
- Basic prompt enhancement without structured outputs
- Reliable fallback responses that maintain functionality
- All features work, but with slightly less sophisticated enhancement

### Checking Your API Key
You can verify your API key permissions at: https://platform.openai.com/api-keys

## Best Practices

1. **Always specify the correct type** for optimal enhancement
2. **Provide rich context** through brandVoice, colors, and advancedOptions
3. **Use customContext** for type-specific additional information
4. **Handle fallback responses** gracefully in your UI
5. **Test with different types** to ensure proper enhancement

## Integration with Generation APIs

The system is designed to work seamlessly with existing generation APIs:

- Logo generation automatically uses "logo" type
- Banner generation uses "banner" type
- Poster generation uses "poster" type
- And so on...

Each API can customize the enhancement request based on its specific needs while maintaining consistency across the application.
