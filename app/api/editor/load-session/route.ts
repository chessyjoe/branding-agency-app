import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (sessionId) {
      // Load specific session
      const { data, error } = await supabase
        .from("editor_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error loading editor session:", error)
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      return NextResponse.json({ session: data })
    } else {
      // Load all user sessions
      const { data, error } = await supabase
        .from("editor_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error loading editor sessions:", error)
        return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 })
      }

      return NextResponse.json({ sessions: data })
    }
  } catch (error) {
    console.error("Error in load-session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
