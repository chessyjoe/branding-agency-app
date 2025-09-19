import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/lib/auth-utils"
import { isAllowedDomain } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get("url")

  if (!imageUrl) {
    console.error("[v0] Proxy request missing URL parameter")
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 })
  }

  const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  if (!rateLimiter.checkLimit(`proxy-${clientIP}`, 20, 60000)) {
    // 20 requests per minute
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const url = new URL(imageUrl)

    const allowedDomains = [
      "bfl.ai",
      "delivery-bfl.ai",
      "api.openai.com",
      "amazonaws.com",
      "cloudfront.net",
      "supabase.co",
    ]

    // Use robust utility for SSRF protection
    if (!isAllowedDomain(url.hostname, allowedDomains)) {
      console.error("[v0] Blocked proxy request to unauthorized domain:", url.hostname)
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 })
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      console.error("[v0] Blocked non-HTTP protocol:", url.protocol)
      return NextResponse.json({ error: "Invalid protocol" }, { status: 403 })
    }

    const hostname = url.hostname
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.2") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.") ||
      hostname === "0.0.0.0" ||
      hostname.includes("::1")
    ) {
      console.error("[v0] Blocked internal network access:", hostname)
      return NextResponse.json({ error: "Internal network access denied" }, { status: 403 })
    }
  } catch (error) {
    console.error("[v0] Invalid URL format:", imageUrl, error)
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
  }

  try {
    console.log("[v0] Proxying image:", imageUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
        Accept: "image/*,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error("[v0] Failed to fetch image:", {
        url: imageUrl,
        status: response.status,
        statusText: response.statusText,
      })
      return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status })
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]

    if (!allowedMimeTypes.includes(contentType)) {
      console.error("[v0] Invalid content type:", contentType)
      return NextResponse.json({ error: "Invalid image format" }, { status: 415 })
    }

    const maxSizeInMB = 50
    if (imageBuffer.byteLength > maxSizeInMB * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 })
    }

    console.log("[v0] Successfully proxied image:", {
      url: imageUrl,
      size: imageBuffer.byteLength,
      contentType,
    })

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin":
          process.env.NODE_ENV === "production" ? request.headers.get("origin") || "*" : "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=3600",
        "X-Proxy-Status": "success",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    })
  } catch (error) {
    console.error("[v0] Error proxying image:", {
      url: imageUrl,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json({ error: "Failed to proxy image" }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": process.env.NODE_ENV === "production" ? request.headers.get("origin") || "*" : "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
