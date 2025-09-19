import { type NextRequest, NextResponse } from "next/server"
import { DatabaseOperations } from "@/lib/database-operations"

async function ensureUserExists(supabase: any, userId: string) {
  try {
    console.log("[v0] Ensuring user exists:", userId)

    // First check if user exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (existingUser) {
      console.log("[v0] User already exists in public.users")
      return true // User already exists
    }

    console.log("[v0] User not found in public.users, attempting to create")

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

    if (isUUID) {
      // For demo users or users not in auth, create them directly
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        email: `demo-${userId.slice(0, 8)}@example.com`,
        name: `Demo User`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("[v0] Failed to create demo user:", insertError)
        return false
      }

      console.log("[v0] Created demo user in public.users table:", userId)
      return true
    }

    // If user doesn't exist, get their info from auth.users and create them
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)

    if (authError || !authUser.user) {
      console.warn("[v0] Could not find user in auth:", authError)
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
      console.error("[v0] Failed to create user in public.users:", insertError)
      return false
    }

    console.log("[v0] Created user in public.users table:", userId)
    return true
  } catch (error) {
    console.error("[v0] Error ensuring user exists:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Save generated image API called")

    const body = await request.json()
    const {
      userId,
      type,
      title,
      prompt,
      refinedPrompt,
      model,
      imageUrl,
      svgContent,
      colors,
      brandVoice,
      advancedOptions,
      aspectRatio,
      isTemplate = false,
      tags = [],
    } = body

    console.log("[v0] Request data:", { userId, type, isTemplate, imageUrl: !!imageUrl })

    if (!userId || !type || !prompt || !imageUrl) {
      console.error("[v0] Missing required fields:", {
        userId: !!userId,
        type: !!type,
        prompt: !!prompt,
        imageUrl: !!imageUrl,
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate smart tags
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

    // Add template tag if marked as template
    if (isTemplate) {
      smartTags.push("template")
    }

    // Remove duplicates
    const uniqueTags = [...new Set(smartTags)]

    try {
      console.log("[v0] Using DatabaseOperations for user handling")

      const generationData = {
        user_id: userId,
        type,
        prompt,
        refined_prompt: refinedPrompt,
        model,
        result: {
          title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleDateString()}`,
          image_url: imageUrl,
          svg_content: svgContent || null,
          tags: uniqueTags,
          is_template: isTemplate,
          is_favorite: false,
          download_count: 0,
        },
        file_urls: [imageUrl],
        colors: colors || [],
        brand_voice: brandVoice || {},
        advanced_options: advancedOptions || {},
        dimensions: aspectRatio,
        status: "completed" as const,
      }

      const data = await DatabaseOperations.saveGeneration(generationData)

      console.log("[v0] Generation saved successfully:", data.id)
      return NextResponse.json({
        success: true,
        data,
        message: "Image saved successfully",
      })
    } catch (dbError) {
      console.error("[v0] Database operation failed:", dbError)
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
  } catch (error) {
    console.error("[v0] Save image error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
