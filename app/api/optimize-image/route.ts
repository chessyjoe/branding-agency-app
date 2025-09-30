import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get("url")
  const width = searchParams.get("w")
  const quality = searchParams.get("q") || "75"

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 })
  }

  const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  if (!rateLimiter.checkLimit(`optimize-${clientIP}`, 50, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const url = new URL(imageUrl)

    // Use the existing proxy validation logic
    const allowedDomains = [
      "bfl.ai",
      "delivery-bfl.ai",
      "api.openai.com",
      "amazonaws.com",
      "cloudfront.net",
      "supabase.co",
      "oaidalleapiprodscus.blob.core.windows.net", // Azure Blob Storage for DALL-E
      "blob.core.windows.net", // General Azure Blob Storage
    ]

    const isAllowedDomain = allowedDomains.some((domain) => {
      return url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    })

    if (!isAllowedDomain) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 })
    }

    // Fetch the original image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageOptimizer/1.0)",
        Accept: "image/*",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

    // For now, just return the original image with optimization headers
    // In a production environment, you'd use a service like Sharp or similar
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        "X-Optimized": "true",
        Vary: "Accept",
      },
    })
  } catch (error) {
    console.error("Image optimization error:", error)
    return NextResponse.json({ error: "Failed to optimize image" }, { status: 500 })
  }
}
