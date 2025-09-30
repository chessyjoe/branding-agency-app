import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Get SVG content API called")

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("imageUrl")
    const generationId = searchParams.get("generationId")

    if (!imageUrl && !generationId) {
      return NextResponse.json({ error: "Missing imageUrl or generationId parameter" }, { status: 400 })
    }

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Looking up SVG content for:", { imageUrl, generationId })

    try {
      let query = supabase
        .from('generated_images')
        .select('svg_content, result, type, prompt, colors, created_at')
        .eq('user_id', user.id)

      if (generationId) {
        query = query.eq('id', generationId)
      } else if (imageUrl) {
        query = query.eq('image_url', imageUrl)
      }

      const { data, error } = await query.single()

      if (error) {
        console.error("[v0] Database query error:", error)
        return NextResponse.json({ 
          error: "SVG content not found",
          hasSvg: false
        }, { status: 404 })
      }

      if (!data) {
        return NextResponse.json({ 
          error: "Generation not found",
          hasSvg: false
        }, { status: 404 })
      }

      // Check if SVG content exists
      const svgContent = data.svg_content || data.result?.svg_content
      
      if (!svgContent) {
        return NextResponse.json({
          hasSvg: false,
          message: "No SVG content available for this generation",
          metadata: {
            type: data.type,
            prompt: data.prompt,
            colors: data.colors,
            createdAt: data.created_at
          }
        })
      }

      console.log("[v0] SVG content found, length:", svgContent.length)

      return NextResponse.json({
        success: true,
        hasSvg: true,
        svg: svgContent,
        metadata: {
          type: data.type,
          prompt: data.prompt,
          colors: data.colors,
          createdAt: data.created_at,
          contentLength: svgContent.length
        }
      })

    } catch (dbError) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json({ 
        error: "Database error",
        hasSvg: false
      }, { status: 500 })
    }

  } catch (error) {
    console.error("[v0] Get SVG content error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to get SVG content",
        hasSvg: false
      }, 
      { status: 500 }
    )
  }
}
