import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { createPromptEnhancer } from '@/lib/prompt-enhancement/enhancer'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const brandVoice = JSON.parse(formData.get('brandVoice') as string || '{}')
    const advancedOptions = JSON.parse(formData.get('advancedOptions') as string || '{}')

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Enhance the prompt using the modular system
    const enhancer = createPromptEnhancer(process.env.OPENAI_API_KEY || "")
    const enhancementResult = await enhancer.enhancePrompt({
      prompt,
      type: "slogan",
      brandVoice,
      advancedOptions
    })

    const enhancedPrompt = enhancementResult.success && enhancementResult.data 
      ? enhancementResult.data.prompt 
      : prompt

    // Use the enhanced prompt for slogan generation
    const systemPrompt = "You are a creative copywriter specializing in memorable slogans and taglines. Create 5 unique, catchy slogans based on the user's description. Make them memorable, brandable, and suitable for marketing use."

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: enhancedPrompt }
      ],
      max_tokens: 300,
      temperature: 0.8,
    })

    const slogans = completion.choices[0]?.message?.content
      ?.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(slogan => slogan.length > 0) || []

    // Save to database for authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('generations').insert({
        user_id: user.id,
        type: 'slogan',
        prompt: prompt,
        result: { slogans },
        brand_voice: brandVoice,
        advanced_options: advancedOptions,
        status: 'completed'
      })
    }

    return NextResponse.json({
      success: true,
      slogans,
      resultType: 'text'
    })

  } catch (error) {
    console.error('Slogan generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate slogans' },
      { status: 500 }
    )
  }
}
