import { createServerClient } from "@/lib/supabase"
import { encrypt, decrypt, validateAndSanitizeInput } from "@/lib/encryption"
import { validateAuthentication, rateLimiter } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await validateAuthentication(request)
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimiter.checkLimit(`api-keys-${user.id}-${clientIP}`, 10, 60000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error fetching API keys:", error)
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
    }

    const apiKeys = data.map((key) => {
      try {
        const decryptedKey = decrypt(key.encrypted_key)
        const maskedKey = "*".repeat(Math.max(0, decryptedKey.length - 4)) + decryptedKey.slice(-4)
        return {
          ...key,
          key: maskedKey,
          encrypted_key: undefined, // Don't expose encrypted data
        }
      } catch (decryptError) {
        console.error("Failed to decrypt API key:", decryptError)
        return {
          ...key,
          key: "****",
          encrypted_key: undefined,
        }
      }
    })

    return NextResponse.json({
      success: true,
      apiKeys,
    })
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await validateAuthentication(request)
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimiter.checkLimit(`create-api-key-${user.id}-${clientIP}`, 5, 300000)) {
      // 5 API key creations per 5 minutes
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const body = await request.json()
    const { service, name, key } = body

    if (!service || !name || !key) {
      return NextResponse.json({ error: "Missing required fields: service, name, key" }, { status: 400 })
    }

    const sanitizedService = validateAndSanitizeInput(service, 50)
    const sanitizedName = validateAndSanitizeInput(name, 100)
    const sanitizedKey = validateAndSanitizeInput(key, 500)

    const apiKeyPatterns = {
      openai: /^sk-[a-zA-Z0-9]{48,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-]{95,}$/,
      google: /^[a-zA-Z0-9_-]{39}$/,
      default: /^[a-zA-Z0-9_-]{10,}$/,
    }

    const pattern = apiKeyPatterns[sanitizedService as keyof typeof apiKeyPatterns] || apiKeyPatterns.default
    if (!pattern.test(sanitizedKey)) {
      return NextResponse.json({ error: "Invalid API key format for the selected service" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { count } = await supabase
      .from("api_keys")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (count && count >= 10) {
      return NextResponse.json({ error: "Maximum number of API keys reached (10)" }, { status: 400 })
    }

    // Encrypt the API key before storing
    const encryptedKey = encrypt(sanitizedKey)

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        service: sanitizedService,
        name: sanitizedName,
        encrypted_key: encryptedKey,
        is_active: true,
        usage_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error creating API key:", error)
      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
    }

    const maskedKey = "*".repeat(Math.max(0, sanitizedKey.length - 4)) + sanitizedKey.slice(-4)

    console.log(`API key created: user=${user.id}, service=${sanitizedService}, name=${sanitizedName}`)

    const apiKey = {
      ...data,
      key: maskedKey,
      encrypted_key: undefined, // Don't expose encrypted data
    }

    return NextResponse.json({
      success: true,
      apiKey,
    })
  } catch (error) {
    console.error("Error adding API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
