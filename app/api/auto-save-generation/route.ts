import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      prompt,
      refinedPrompt,
      model,
      result,
      colors,
      brandVoice,
      advancedOptions,
      aspectRatio,
      tags = [],
    } = body

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized", savedId: null }, { status: 401 })
    }

    // Generate smart tags based on content
    const smartTags = [...tags]

    // Add type-specific tags
    if (type === "logo") {
      smartTags.push("branding", "identity")
    } else if (type === "banner") {
      smartTags.push("marketing", "advertising")
    } else if (type === "poster") {
      smartTags.push("print", "display")
    } else if (type === "business-card") {
      smartTags.push("professional", "networking")
    } else if (type === "website") {
      smartTags.push("web", "digital")
    }

    // Add color-based tags
    if (colors && colors.length > 0) {
      smartTags.push("colored")
      if (colors.length === 1) {
        smartTags.push("monochrome")
      } else {
        smartTags.push("multicolor")
      }
    }

    // Add style tags from brand voice
    if (brandVoice?.tone) {
      smartTags.push(...brandVoice.tone.map((t: string) => t.toLowerCase()))
    }

    // Add model tag
    smartTags.push(`model-${model.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`)

    // Add auto-save tag
    smartTags.push("auto-saved")

    // Remove duplicates
    const uniqueTags = [...new Set(smartTags)]

    try {
      // Save to database
      const { data, error } = await supabase
        .from("generations")
        .insert({
          user_id: user.id,
          type,
          prompt,
          refined_prompt: refinedPrompt,
          model,
          result: {
            imageUrl: result.imageUrl,
            svg: result.svg || null,
            tags: uniqueTags,
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleDateString()}`,
            aspectRatio,
            downloadCount: 0,
            isTemplate: false,
            isFavorite: false,
          },
          colors: colors || [],
          brand_voice: brandVoice || {},
          advanced_options: advancedOptions || {},
          status: "completed",
          file_urls: result.imageUrl ? [result.imageUrl] : [],
          dimensions: aspectRatio,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase save error:", error)
        // Don't throw error, just log it
        return NextResponse.json({
          success: false,
          error: "Database save failed",
          savedId: null,
          message: "Generation completed but auto-save failed",
        })
      }

      return NextResponse.json({
        success: true,
        savedId: data.id,
        tags: uniqueTags,
        message: "Generation auto-saved successfully",
      })
    } catch (dbError) {
      console.warn("Database operation failed, continuing without save:", dbError)

      // Return success even if database save fails
      return NextResponse.json({
        success: false,
        error: "Database unavailable",
        savedId: null,
        message: "Generation completed but auto-save failed",
      })
    }
  } catch (error) {
    console.error("Auto-save error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Auto-save failed",
      savedId: null,
    })
  }
}
