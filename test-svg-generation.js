// Test SVG generation API
const testSVGGeneration = async () => {
  const testData = {
    prompt: "Create a modern tech startup logo with the text 'TechCorp'",
    type: "logo",
    colors: ["#0066cc", "#ffffff"],
    brandVoice: {
      tone: ["Professional", "Innovative"],
      targetAudience: "Tech professionals"
    },
    width: 400,
    height: 400
  }

  console.log('Testing SVG generation API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/generate-svg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ SVG Generation Success!')
      console.log('SVG Length:', result.svg?.length || 0)
      console.log('Metadata:', result.metadata)
      console.log('SVG Preview:', result.svg?.substring(0, 200) + '...')
      
      if (result.fallback) {
        console.log('⚠️ Used fallback SVG')
      } else {
        console.log('🎉 AI-generated SVG!')
      }
    } else {
      console.log('❌ SVG Generation Error:', result.error)
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message)
  }
}

// Run the test
testSVGGeneration().catch(console.error)




