import { createBrowserClient } from "@supabase/ssr"

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export const isSupabaseConfigured = () => {
  console.log("[v0] Checking Supabase config:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "missing",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "missing",
  })

  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
  )
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[v0] Supabase environment variables not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
    )
    // Return a mock client that throws helpful errors
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: new Error("Supabase not configured") }),
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error("Supabase not configured") }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        signUp: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        signOut: () => Promise.resolve({ error: new Error("Supabase not configured") }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: new Error("Supabase not configured") }),
        insert: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        update: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        delete: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      }),
    } as any
  }

  console.log("[v0] Creating Supabase client with configured environment variables")
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}

// Export a function instead of the client instance
export const getClient = getSupabaseClient

export const supabase = getSupabaseClient()
