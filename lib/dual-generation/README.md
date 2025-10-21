# Universal Dual Generation System

This modular system enables all generation APIs to support dual generation - creating both display content and SVG content for the editor.

## Overview

The dual generation system provides:
- **Display Content**: Regular images/content for display purposes
- **SVG Content**: Editable SVG content for the canvas editor
- **Fallback Support**: Automatic fallback when AI generation fails
- **Universal Integration**: Works with any generation type

## Quick Integration

### 1. Import the integration utilities

```typescript
import { integrateDualGeneration, prepareDualGenerationData, type UniversalDualRequest } from "@/lib/dual-generation"
```

### 2. Add dual generation to any API

```typescript
// After generating the main display content
const displayImageUrl = await generateMainContent(prompt, options)

// Generate SVG content for editor
const dualRequest: UniversalDualRequest = {
  prompt,
  type: "logo", // or "banner", "poster", etc.
  colors,
  brandVoice,
  advancedOptions,
  width: 400,
  height: 400
}

const { svgContent, fallback } = await integrateDualGeneration(
  process.env.OPENAI_API_KEY!,
  dualRequest,
  displayImageUrl
)

// Prepare data for database
const generationData = prepareDualGenerationData(displayImageUrl, svgContent, fallback)

// Save to database
await supabase.from('generated_images').insert({
  user_id: user.id,
  type: 'logo',
  prompt,
  image_url: displayImageUrl,
  svg_content: svgContent,
  generation_data: generationData.generation_data,
  created_at: new Date().toISOString()
})
```

### 3. Return dual content to frontend

```typescript
return NextResponse.json({
  success: true,
  imageUrl: displayImageUrl,
  svgContent,
  fallback,
  metadata: {
    hasSvg: !!svgContent,
    svgLength: svgContent?.length || 0,
    generatedAt: new Date().toISOString()
  }
})
```

## Supported Generation Types

- `logo` - Logo designs
- `banner` - Banner/poster designs  
- `poster` - Poster designs
- `business-card` - Business card designs
- `website` - Website header/hero designs
- `video` - Video thumbnail designs
- `code` - Code editor interface designs
- `slogan` - Text-based designs

## API Endpoints

### Universal Dual Generation
- `POST /api/generate-dual` - Generate both display and SVG content

### SVG-Only Generation
- `POST /api/generate-svg` - Generate only SVG content
- `GET /api/get-svg-content` - Retrieve SVG content by image URL or generation ID

## Database Schema

The system expects these fields in your `generated_images` table:

```sql
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  svg_content TEXT, -- SVG content for editor
  generation_data JSONB, -- Metadata about generation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Frontend Integration

### Loading Images with SVG Support

```typescript
// Check if SVG content is available
const response = await fetch(`/api/get-svg-content?imageUrl=${imageUrl}`)
const { hasSvg, svg } = await response.json()

if (hasSvg) {
  // Use SVG content in editor
  loadSVGInEditor(svg)
} else {
  // Fall back to regular image
  loadImageInEditor(imageUrl)
}
```

### Editor Canvas Integration

```typescript
// In your canvas component
const loadContentInEditor = async (imageUrl: string) => {
  try {
    // Try to get SVG content first
    const svgResponse = await fetch(`/api/get-svg-content?imageUrl=${imageUrl}`)
    const { hasSvg, svg } = await svgResponse.json()
    
    if (hasSvg) {
      // Load SVG content for editing
      const svgElement = new DOMParser().parseFromString(svg, 'image/svg+xml')
      canvas.loadSVG(svgElement.documentElement)
    } else {
      // Load regular image
      const img = new Image()
      img.onload = () => canvas.loadImage(img)
      img.src = imageUrl
    }
  } catch (error) {
    console.error('Failed to load content:', error)
    // Fallback to regular image loading
  }
}
```

## Error Handling

The system includes comprehensive error handling:

- **AI Generation Failures**: Automatic fallback to basic SVG
- **Network Issues**: Graceful degradation to display-only content
- **Invalid SVG**: Validation and cleanup of generated content
- **Database Errors**: Continue without saving if database fails

## Performance Considerations

- **Parallel Generation**: Display and SVG content generated simultaneously
- **Caching**: SVG content cached in database for reuse
- **Fallback Speed**: Quick fallback generation when AI fails
- **Size Optimization**: SVG content optimized for web use

## Testing

Test the dual generation system:

```bash
# Test SVG generation
curl -X POST http://localhost:3000/api/generate-svg \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Modern tech logo", "type": "logo", "colors": ["#0066cc"]}'

# Test dual generation
curl -X POST http://localhost:3000/api/generate-dual \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Modern tech logo", "type": "logo", "colors": ["#0066cc"]}'
```

## Migration Guide

To add dual generation to existing APIs:

1. **Import the utilities** in your existing API
2. **Add SVG generation** after main content generation
3. **Update database schema** to include `svg_content` field
4. **Update frontend** to handle SVG content
5. **Test thoroughly** with various generation types

The system is designed to be backward compatible - existing APIs will continue to work while new ones can opt into dual generation.




