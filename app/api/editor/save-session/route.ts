import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, sessionName, originalImageUrl, canvasData, layers, metadata } = body

    if (sessionId) {
      // Update existing session
      const { data, error } = await supabase
        .from("editor_sessions")
        .update({
          session_name: sessionName,
          current_canvas_data: canvasData,
          layers: layers,
          metadata: metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating editor session:", error)
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
      }

      return NextResponse.json({ session: data })
    } else {
      // Create new session
      const { data, error } = await supabase
        .from("editor_sessions")
        .insert({
          user_id: user.id,
          session_name: sessionName,
          original_image_url: originalImageUrl,
          current_canvas_data: canvasData,
          layers: layers,
          metadata: metadata,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating editor session:", error)
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
      }

      return NextResponse.json({ session: data })
    }
  } catch (error) {
    console.error("Error in save-session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
