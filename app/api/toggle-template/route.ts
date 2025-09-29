import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageId, isTemplate } = body

    if (!imageId || typeof isTemplate !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Desired new state: create/delete entry in templates table keyed by generation id
    // Load the generation to populate template fields
    const { data: generation, error: genError } = await supabase
      .from("generations")
      .select("id, user_id, type, prompt, refined_prompt, result, file_urls, colors, brand_voice, advanced_options")
      .eq("id", imageId)
      .eq("user_id", user.id)
      .single()

    if (genError) {
      console.error("Failed to load generation for templating:", genError)
      return NextResponse.json({ error: "Generation not found" }, { status: 404 })
    }

    if (isTemplate) {
      const title = generation.result?.title || generation.prompt?.slice(0, 80) || "Template"
      const previewUrl = generation.result?.image_url || generation.file_urls?.[0] || null
      const templateData = {
        generation_id: generation.id,
        prompt: generation.prompt,
        refined_prompt: generation.refined_prompt,
        result: generation.result,
        colors: generation.colors,
        brand_voice: generation.brand_voice,
        advanced_options: generation.advanced_options,
      }

      const { error: insertError } = await supabase
        .from("templates")
        .insert({
          id: generation.id, // align with generation-history check
          name: title,
          type: generation.type,
          description: null,
          preview_url: previewUrl,
          template_data: templateData,
          is_premium: false,
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError && insertError.code !== "23505") {
        // ignore unique violation if already templated
        console.error("Failed to save template:", insertError)
        return NextResponse.json({ error: "Failed to save as template" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Saved as template" })
    } else {
      const { error: deleteError } = await supabase
        .from("templates")
        .delete()
        .eq("id", generation.id)
        .eq("created_by", user.id)

      if (deleteError) {
        console.error("Failed to remove template:", deleteError)
        return NextResponse.json({ error: "Failed to remove template" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Removed from templates" })
    }
  } catch (error) {
    console.error("Toggle template error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
