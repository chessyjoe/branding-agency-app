import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageId, isFavorite } = body

    if (!imageId || typeof isFavorite !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("generated_images")
      .update({ is_favorite: isFavorite })
      .eq("id", imageId)
      .select()
      .single()

    if (error) {
      console.error("Error toggling favorite status:", error)
      return NextResponse.json({ error: "Failed to update favorite status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      image: data,
      message: isFavorite ? "Added to favorites" : "Removed from favorites",
    })
  } catch (error) {
    console.error("Toggle favorite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
