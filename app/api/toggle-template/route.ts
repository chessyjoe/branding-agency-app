import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageId, isTemplate } = body

    if (!imageId || typeof isTemplate !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("generated_images")
      .update({ is_template: isTemplate })
      .eq("id", imageId)
      .select()
      .single()

    if (error) {
      console.error("Error toggling template status:", error)
      return NextResponse.json({ error: "Failed to update template status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      image: data,
      message: isTemplate ? "Added to templates" : "Removed from templates",
    })
  } catch (error) {
    console.error("Toggle template error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
