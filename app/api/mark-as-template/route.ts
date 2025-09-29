import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { id, isTemplate } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing image ID" }, { status: 400 })
    }

    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data, error } = await supabase
        .from("generated_images")
        .update({
          is_template: isTemplate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        console.error("Supabase update error:", error)
        return NextResponse.json({ error: "Database update failed" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data,
        message: isTemplate ? "Marked as template" : "Removed from templates",
      })
    } catch (dbError) {
      console.error("Database operation failed:", dbError)
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }
  } catch (error) {
    console.error("Mark as template error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
