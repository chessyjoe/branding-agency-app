import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { 
      prompt, 
      codeType, 
      language, 
      framework, 
      requirements
    } = await req.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Build comprehensive prompt for code generation
    let enhancedPrompt = `Generate ${codeType} code in ${language}`
    
    if (framework !== 'vanilla') {
      enhancedPrompt += ` using ${framework} framework`
    }
    
    enhancedPrompt += `. ${prompt}`

    // Add technical requirements
    if (requirements.functionality) {
      enhancedPrompt += ` Functionality requirements: ${requirements.functionality}.`
    }
    if (requirements.styling) {
      enhancedPrompt += ` Styling requirements: ${requirements.styling}.`
    }
    if (requirements.dependencies) {
      enhancedPrompt += ` Dependencies: ${requirements.dependencies}.`
    }
    if (requirements.performance) {
      enhancedPrompt += ` Performance requirements: ${requirements.performance}.`
    }
    if (requirements.accessibility) {
      enhancedPrompt += ` Accessibility requirements: ${requirements.accessibility}.`
    }

    // First, enhance the prompt with OpenAI
    const { text: refinedPrompt } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert software engineer and code architect. Refine the user's code request into a detailed, technical specification that will generate the best possible code. Include specific details about:

      1. Code structure and architecture
      2. Best practices and design patterns
      3. Error handling and edge cases
      4. Performance optimizations
      5. Security considerations
      6. Accessibility features
      7. Testing requirements
      8. Documentation needs

      Focus on creating production-ready, maintainable, and well-documented code.`,
      prompt: `Original request: "${enhancedPrompt}"\n\nPlease refine this into a detailed, professional specification for generating high-quality ${language} code using ${framework}. Include specific technical requirements, code structure, and implementation details.`,
    })

    // Generate the main code
    const { text: generatedCode } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert ${language} developer specializing in ${framework}. Generate clean, production-ready code that follows best practices. Include:

      1. Proper error handling
      2. Type safety (if applicable)
      3. Performance optimizations
      4. Security best practices
      5. Accessibility features
      6. Clear comments and documentation
      7. Modular, maintainable structure
      8. Proper imports and exports

      Generate only the code without explanations.`,
      prompt: refinedPrompt
    })

    // Generate documentation
    const { text: documentation } = await generateText({
      model: openai("gpt-4o"),
      system: "You are a technical writer. Create comprehensive documentation for the generated code including setup instructions, usage examples, API documentation, and troubleshooting guide.",
      prompt: `Create detailed documentation for this ${codeType} code:\n\n${generatedCode}\n\nInclude setup, usage, configuration, and examples.`
    })

    // Generate tests
    const { text: tests } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a test engineer. Generate comprehensive unit tests for the provided code using appropriate testing frameworks for ${language}/${framework}. Include edge cases, error scenarios, and integration tests where applicable.`,
      prompt: `Generate unit tests for this code:\n\n${generatedCode}\n\nInclude test setup, multiple test cases, and proper assertions.`
    })

    // Save to Supabase
    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        type: 'code',
        prompt: enhancedPrompt,
        refined_prompt: refinedPrompt,
        result_text: generatedCode,
        metadata: {
          codeType,
          language,
          framework,
          requirements,
          documentation,
          tests
        }
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ 
      success: true, 
      code: generatedCode,
      documentation,
      tests,
      refinedPrompt,
      id: data.id
    })
  } catch (error) {
    console.error('Error generating code:', error)
    return Response.json({ 
      success: false, 
      error: "Failed to generate code" 
    }, { 
      status: 500 
    })
  }
}
