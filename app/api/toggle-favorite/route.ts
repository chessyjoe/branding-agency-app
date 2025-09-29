import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageId, isFavorite } = body

    if (!imageId || typeof isFavorite !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Maintain favorites via user_favorites join table
    if (isFavorite) {
      const { error } = await supabase
        .from("user_favorites")
        .insert({ user_id: user.id, generation_id: imageId })
        .select()
        .single()
      if (error && error.code !== "23505") {
        console.error("Error adding favorite:", error)
        return NextResponse.json({ error: "Failed to add to favorites" }, { status: 500 })
      }
    } else {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("generation_id", imageId)
      if (error) {
        console.error("Error removing favorite:", error)
        return NextResponse.json({ error: "Failed to remove from favorites" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: isFavorite ? "Added to favorites" : "Removed from favorites",
    })
  } catch (error) {
    console.error("Toggle favorite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
