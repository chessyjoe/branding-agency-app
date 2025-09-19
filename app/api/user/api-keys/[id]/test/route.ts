import { createServerClient } from "@/lib/supabase"
import { decrypt } from "@/lib/encryption"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const userId = 'demo-user' // In real app, get from auth

    // Get the API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (keyError) throw keyError

    // Decrypt the API key
    const decryptedKey = decrypt(apiKeyData.encrypted_key)

    let testResult = { success: false, message: '', responseTime: 0 }
    const startTime = Date.now()

    try {
      switch (apiKeyData.service) {
        case 'openai':
          // Test OpenAI API
          const { text } = await generateText({
            model: openai("gpt-3.5-turbo", { apiKey: decryptedKey }),
            prompt: "Say 'API test successful' if you can read this.",
            maxTokens: 10
          })
          testResult = {
            success: true,
            message: 'OpenAI API key is working correctly',
            responseTime: Date.now() - startTime
          }
          break

        case 'vercel-v0':
          // Test Vercel v0 API
          const v0Response = await fetch('https://api.vercel.com/v1/user', {
            headers: { 'Authorization': `Bearer ${decryptedKey}` }
          })
          testResult = {
            success: v0Response.ok,
            message: v0Response.ok ? 'Vercel API key is working correctly' : 'Vercel API key test failed',
            responseTime: Date.now() - startTime
          }
          break

        case 'replicate':
          // Test Replicate API
          const replicateResponse = await fetch('https://api.replicate.com/v1/account', {
            headers: { 'Authorization': `Token ${decryptedKey}` }
          })
          testResult = {
            success: replicateResponse.ok,
            message: replicateResponse.ok ? 'Replicate API key is working correctly' : 'Replicate API key test failed',
            responseTime: Date.now() - startTime
          }
          break

        case 'supabase':
          // Test Supabase connection
          const testSupabase = createServerClient()
          const { error: testError } = await testSupabase.from('generations').select('count').limit(1)
          testResult = {
            success: !testError,
            message: !testError ? 'Supabase connection is working correctly' : 'Supabase connection test failed',
            responseTime: Date.now() - startTime
          }
          break

        case 'together':
          // Test Together AI API
          const togetherResponse = await fetch('https://api.together.xyz/v1/models', {
            headers: { 'Authorization': `Bearer ${decryptedKey}` }
          })
          testResult = {
            success: togetherResponse.ok,
            message: togetherResponse.ok ? 'Together AI API key is working correctly' : 'Together AI API key test failed',
            responseTime: Date.now() - startTime
          }
          break

        default:
          testResult = {
            success: false,
            message: `Testing not implemented for ${apiKeyData.service}`,
            responseTime: Date.now() - startTime
          }
      }

      // Update last tested timestamp and usage count
      await supabase
        .from('api_keys')
        .update({ 
          last_tested: new Date().toISOString(),
          usage_count: apiKeyData.usage_count + 1
        })
        .eq('id', params.id)

    } catch (testError) {
      testResult = {
        success: false,
        message: `API test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime
      }
    }

    return Response.json({ 
      success: true, 
      testResult
    })
  } catch (error) {
    console.error('Error testing API key:', error)
    return Response.json({ 
      success: false, 
      error: "Failed to test API key" 
    }, { 
      status: 500 
    })
  }
}
