import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey

// Named export for createClient
export const createClient = createSupabaseClient

const createFallbackClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () =>
      Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    signUp: () =>
      Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
    update: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
    delete: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
  }),
})

// Default client for general use
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : createFallbackClient()

// Admin client for server-side operations
export const supabaseAdmin =
  isSupabaseConfigured && supabaseServiceKey
    ? createSupabaseClient(supabaseUrl, supabaseServiceKey)
    : createFallbackClient()

// Server-side client function
export function createAdminClient() {
  if (!isSupabaseConfigured || !supabaseServiceKey) {
    return createFallbackClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Client-side client function
export function createClientClient() {
  if (!isSupabaseConfigured) {
    return createFallbackClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Default export
export default supabase
