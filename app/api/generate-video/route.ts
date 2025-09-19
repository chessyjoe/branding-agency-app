import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createServerClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    
    const prompt = formData.get('prompt') as string
    const videoType = formData.get('videoType') as string
    const format = formData.get('format') as string
    const duration = parseInt(formData.get('duration') as string)
    const videoInfo = JSON.parse(formData.get('videoInfo') as string || '{}')
    const colors = JSON.parse(formData.get('colors') as string || '[]')
    const userId = formData.get('userId') as string
    
    // Handle uploaded files
    const referenceFile = formData.get('reference') as File | null
    const logoFile = formData.get('logo') as File | null
    const assetsFile = formData.get('assets') as File | null

    const supabase = createServerClient()

    // Build comprehensive prompt for video generation
    let enhancedPrompt = `Create a ${videoType} video in ${format} aspect ratio, ${duration} seconds long. ${prompt}`

    // Add video information
    if (videoInfo.title) {
      enhancedPrompt += ` Title: "${videoInfo.title}".`
    }
    if (videoInfo.description) {
      enhancedPrompt += ` Description: ${videoInfo.description}.`
    }
    if (videoInfo.callToAction) {
      enhancedPrompt += ` Call-to-action: "${videoInfo.callToAction}".`
    }
    if (videoInfo.voiceOver) {
      enhancedPrompt += ` Voice-over script: ${videoInfo.voiceOver}.`
    }
    if (videoInfo.musicStyle && videoInfo.musicStyle !== 'none') {
      enhancedPrompt += ` Background music style: ${videoInfo.musicStyle}.`
    }

    // Add color information
    if (colors.length > 0) {
      enhancedPrompt += ` Brand colors: ${colors.join(', ')}.`
    }

    // Add file context
    let fileContext = ""
    if (referenceFile) {
      fileContext += " Reference video/image provided for style inspiration."
    }
    if (logoFile) {
      fileContext += " Company logo provided for branding integration."
    }
    if (assetsFile) {
      fileContext += " Additional assets provided for video content."
    }
    enhancedPrompt += fileContext

    // First, enhance the prompt with OpenAI
    const { text: refinedPrompt } = await generateText({
      model: openai("gpt-4o"),
      system: "You are an expert video producer and creative director. Refine the user's video request into a detailed, professional prompt that will generate the best possible promotional video. Include specific details about visual style, pacing, transitions, text overlays, brand integration, and storytelling elements. Focus on creating engaging, professional video content that drives results.",
      prompt: `Original request: "${enhancedPrompt}"\n\nPlease refine this into a detailed, professional prompt for generating a ${videoType} video. Include specific visual directions, timing, brand elements, and creative specifications that will produce a high-quality promotional video.`,
    })

    // For demo purposes, we'll simulate video generation
    // In a real implementation, you would use video generation APIs like:
    // - Runway ML
    // - Stable Video Diffusion
    // - Pika Labs
    // - Custom video generation pipeline

    const videoUrl = `/placeholder-video.mp4?title=${encodeURIComponent(videoInfo.title)}&type=${videoType}&duration=${duration}`

    // Save to Supabase
    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        type: 'video',
        prompt: enhancedPrompt,
        refined_prompt: refinedPrompt,
        result_url: videoUrl,
        metadata: {
          videoType,
          format,
          duration,
          videoInfo,
          colors,
          hasReferenceFile: !!referenceFile,
          hasLogoFile: !!logoFile,
          hasAssetsFile: !!assetsFile
        }
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ 
      success: true, 
      videoUrl,
      refinedPrompt,
      id: data.id
    })
  } catch (error) {
    console.error('Error generating video:', error)
    return Response.json({ 
      success: false, 
      error: "Failed to generate video" 
    }, { 
      status: 500 
    })
  }
}
