import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function ensureUserExists(supabase: any, userId: string) {
  try {
    // First check if user exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (existingUser) {
      return true // User already exists
    }

    // If user doesn't exist, get their info from auth.users and create them
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)

    if (authError || !authUser.user) {
      console.warn("Could not find user in auth:", authError)
      return false
    }

    // Create user in public.users table
    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      email: authUser.user.email,
      name: authUser.user.user_metadata?.name || authUser.user.email?.split("@")[0] || "User",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Failed to create user in public.users:", insertError)
      return false
    }

    console.log("[v0] Created user in public.users table:", userId)
    return true
  } catch (error) {
    console.error("Error ensuring user exists:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
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

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "Missing userId",
        savedId: null,
        message: "Generation completed but auto-save failed - no user ID provided",
      })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      console.warn("Invalid UUID format for userId:", userId)
      return NextResponse.json({
        success: false,
        error: "Invalid user ID format",
        savedId: null,
        message: "Generation completed but auto-save failed - invalid user ID",
      })
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
      const supabase = await createClient()

      const userExists = await ensureUserExists(supabase, userId)
      if (!userExists) {
        console.warn("Could not ensure user exists, skipping auto-save")
        return NextResponse.json({
          success: false,
          error: "User validation failed",
          savedId: null,
          message: "Generation completed but auto-save failed - user validation error",
        })
      }

      // Save to database
      const { data, error } = await supabase
        .from("generations")
        .insert({
          user_id: userId,
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
