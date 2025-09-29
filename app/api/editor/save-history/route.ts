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
    const { sessionId, actionType, canvasState, layersState, actionMetadata } = body

    // Verify session belongs to user
    const { data: session } = await supabase
      .from("editor_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Save history entry
    const { data, error } = await supabase
      .from("editor_history")
      .insert({
        session_id: sessionId,
        action_type: actionType,
        canvas_state: canvasState,
        layers_state: layersState,
        action_metadata: actionMetadata,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving editor history:", error)
      return NextResponse.json({ error: "Failed to save history" }, { status: 500 })
    }

    // Keep only last 50 history entries per session
    const { error: cleanupError } = await supabase
      .from("editor_history")
      .delete()
      .eq("session_id", sessionId)
      .not(
        "id",
        "in",
        `(
        SELECT id FROM editor_history 
        WHERE session_id = '${sessionId}' 
        ORDER BY created_at DESC 
        LIMIT 50
      )`,
      )

    if (cleanupError) {
      console.error("Error cleaning up history:", cleanupError)
    }

    return NextResponse.json({ history: data })
  } catch (error) {
    console.error("Error in save-history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
