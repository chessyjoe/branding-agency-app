import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("url")
    const filename = searchParams.get("filename") || "generated-image.png"

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl)

    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 })
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get("content-type") || "image/png"

    // Return the image with proper headers for download
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": imageBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Download image error:", error)
    return NextResponse.json({ error: "Failed to download image" }, { status: 500 })
  }
}
