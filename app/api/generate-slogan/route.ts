import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const userId = formData.get('userId') as string
    const brandVoice = JSON.parse(formData.get('brandVoice') as string || '{}')
    const advancedOptions = JSON.parse(formData.get('advancedOptions') as string || '{}')

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    let systemPrompt = "You are a creative copywriter specializing in memorable slogans and taglines. Create 5 unique, catchy slogans based on the user's description. Make them memorable, brandable, and suitable for marketing use."

    if (brandVoice?.personality) {
      const personality = Object.entries(brandVoice.personality)
        .filter(([_, value]) => (value as number) > 6)
        .map(([key, _]) => key)
        .join(', ')
      if (personality) {
        systemPrompt += ` The brand personality should be ${personality}.`
      }
    }

    if (brandVoice?.tone?.length > 0) {
      systemPrompt += ` The tone should be ${brandVoice.tone.join(', ')}.`
    }

    if (brandVoice?.targetAudience) {
      systemPrompt += ` Target audience: ${brandVoice.targetAudience}.`
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.8,
    })

    const slogans = completion.choices[0]?.message?.content
      ?.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(slogan => slogan.length > 0) || []

    // Save to database
    if (userId && userId !== 'demo-user') {
      await supabaseAdmin.from('generations').insert({
        user_id: userId,
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
