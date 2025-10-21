// Test the universal dual generation system
const testUniversalDual = async () => {
  console.log('🧪 Testing Universal Dual Generation System\n')

  // Test data for different generation types
  const testCases = [
    {
      name: 'Logo Generation',
      data: {
        prompt: "Create a modern tech startup logo with the text 'TechCorp'",
        type: "logo",
        colors: ["#0066cc", "#ffffff"],
        brandVoice: { tone: ["Professional", "Innovative"] },
        width: 400,
        height: 400
      }
    },
    {
      name: 'Banner Generation',
      data: {
        prompt: "Create a promotional banner for a summer sale",
        type: "banner",
        colors: ["#ff6b6b", "#4ecdc4"],
        brandVoice: { tone: ["Energetic", "Fun"] },
        width: 800,
        height: 200
      }
    },
    {
      name: 'Poster Generation',
      data: {
        prompt: "Create a movie poster for a sci-fi thriller",
        type: "poster",
        colors: ["#1a1a1a", "#ff0000"],
        brandVoice: { tone: ["Dark", "Mysterious"] },
        width: 600,
        height: 900
      }
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`)
    console.log(`   Prompt: ${testCase.data.prompt}`)
    console.log(`   Type: ${testCase.data.type}`)
    console.log(`   Colors: ${testCase.data.colors.join(', ')}`)
    
    try {
      // Test SVG generation
      console.log('   🔄 Testing SVG generation...')
      const svgResponse = await fetch('http://localhost:3000/api/generate-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      })

      if (svgResponse.ok) {
        const svgResult = await svgResponse.json()
        console.log(`   ✅ SVG Generation: ${svgResult.success ? 'Success' : 'Failed'}`)
        console.log(`   📏 SVG Length: ${svgResult.svg?.length || 0} characters`)
        console.log(`   🔄 Fallback: ${svgResult.fallback ? 'Yes' : 'No'}`)
        
        if (svgResult.success && svgResult.svg) {
          console.log(`   📄 SVG Preview: ${svgResult.svg.substring(0, 100)}...`)
        }
      } else {
        const error = await svgResponse.json()
        console.log(`   ❌ SVG Generation Error: ${error.error}`)
      }

      // Test dual generation
      console.log('   🔄 Testing dual generation...')
      const dualResponse = await fetch('http://localhost:3000/api/generate-dual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      })

      if (dualResponse.ok) {
        const dualResult = await dualResponse.json()
        console.log(`   ✅ Dual Generation: ${dualResult.success ? 'Success' : 'Failed'}`)
        console.log(`   🖼️  Display Image: ${dualResult.displayImage ? 'Generated' : 'Not generated'}`)
        console.log(`   🎨 SVG Content: ${dualResult.svgContent ? 'Generated' : 'Not generated'}`)
        console.log(`   🔄 Fallback: ${dualResult.fallback ? 'Yes' : 'No'}`)
        
        if (dualResult.metadata) {
          console.log(`   📊 Metadata:`, {
            hasDisplayImage: dualResult.metadata.hasDisplayImage,
            hasSvg: dualResult.metadata.hasSvg,
            svgLength: dualResult.metadata.svgLength,
            type: dualResult.metadata.type
          })
        }
      } else {
        const error = await dualResponse.json()
        console.log(`   ❌ Dual Generation Error: ${error.error}`)
      }

    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`)
    }
  }

  console.log('\n🎉 Universal Dual Generation System Test Complete!')
  console.log('\n📚 Next Steps:')
  console.log('   1. Integrate into existing generation APIs')
  console.log('   2. Update frontend to handle SVG content')
  console.log('   3. Update database schema for SVG support')
  console.log('   4. Test with real generation APIs')
}

// Run the test
testUniversalDual().catch(console.error)




