import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("[v0] Generation history API called")

  try {
    const { searchParams } = new URL(request.url)
    // Derive user from session instead of trusting query param
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const type = searchParams.get("type")
    const isTemplate = searchParams.get("isTemplate")
    const isFavorite = searchParams.get("isFavorite")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const userId = user.id
    console.log("[v0] API params:", { userId, type, isTemplate, isFavorite, limit, offset })

    console.log("[v0] Building query for generations table")
    let query = supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    console.log("[v0] Executing query")
    const { data, error } = await query

    if (error) {
      console.error("[v0] Supabase query error:", error)
      return NextResponse.json({ error: "Failed to fetch generation history" }, { status: 500 })
    }

    console.log("[v0] Query successful, data length:", data?.length || 0)

    const transformedImages = (data || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      prompt: item.prompt,
      refined_prompt: item.refined_prompt,
      model: item.model,
      image_url: item.result?.image_url || item.file_urls?.[0] || "",
      code: item.result?.code,
      preview_url: item.result?.preview_url,
      colors: item.colors || [],
      brand_voice: item.brand_voice,
      advanced_options: item.advanced_options,
      aspect_ratio: item.dimensions || "1:1",
      is_template: false, // Will be determined by checking if it exists in templates table
      is_favorite: false, // Will be determined by checking user_favorites table
      tags: [],
      created_at: item.created_at,
      updated_at: item.updated_at,
      download_count: 0,
    }))

    let filteredImages = transformedImages

    if (isTemplate === "true") {
      // Only return items that exist in templates table
      const templateIds = transformedImages.map((img: any) => img.id)
      if (templateIds.length > 0) {
        const { data: templates } = await supabase.from("templates").select("id").in("id", templateIds)

        const templateIdSet = new Set(templates?.map((t: any) => t.id) || [])
        filteredImages = transformedImages.filter((img: any) => templateIdSet.has(img.id))
        filteredImages.forEach((img: any) => {
          img.is_template = true
        })
      } else {
        filteredImages = []
      }
    }

    if (isFavorite === "true") {
      // Only return items that exist in user_favorites table
      const generationIds = filteredImages.map((img: any) => img.id)
      if (generationIds.length > 0) {
        const { data: favorites } = await supabase
          .from("user_favorites")
          .select("generation_id")
          .eq("user_id", userId)
          .in("generation_id", generationIds)

        const favoriteIdSet = new Set(favorites?.map((f: any) => f.generation_id) || [])
        filteredImages = filteredImages.filter((img: any) => favoriteIdSet.has(img.id))
        filteredImages.forEach((img: any) => {
          img.is_favorite = true
        })
      } else {
        filteredImages = []
      }
    }

    return NextResponse.json({
      success: true,
      images: filteredImages,
    })
  } catch (error) {
    console.error("[v0] Generation history API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
