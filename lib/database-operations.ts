import { createServerClient } from "@/lib/supabase"
import { TABLES, type DatabaseGeneration, type DatabaseUser } from "./database-types"

export class DatabaseOperations {
  private static getClient() {
    return createServerClient()
  }

  // User operations
  static async ensureUserExists(userId: string, email?: string): Promise<DatabaseUser> {
    const supabase = this.getClient()

    const { data: existingUser } = await supabase.from(TABLES.USERS).select("*").eq("id", userId).single()

    if (existingUser) {
      return existingUser
    }

    const { data: newUser, error } = await supabase
      .from(TABLES.USERS)
      .insert({ id: userId, email: email || `${userId}@demo.com` })
      .select()
      .single()

    if (error) throw error
    return newUser
  }

  // Generation operations
  static async saveGeneration(
    generation: Omit<DatabaseGeneration, "id" | "created_at" | "updated_at">,
  ): Promise<DatabaseGeneration> {
    const supabase = this.getClient()

    // Ensure user exists first
    await this.ensureUserExists(generation.user_id)

    const { data, error } = await supabase.from(TABLES.GENERATIONS).insert(generation).select().single()

    if (error) throw error
    return data
  }

  static async getGenerations(
    userId: string,
    options: {
      isTemplate?: boolean
      isFavorite?: boolean
      limit?: number
      offset?: number
    } = {},
  ): Promise<DatabaseGeneration[]> {
    const supabase = this.getClient()

    let query = supabase
      .from(TABLES.GENERATIONS)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (options.isTemplate !== undefined) {
      query = query.eq("is_template", options.isTemplate)
    }

    if (options.isFavorite !== undefined) {
      query = query.eq("is_favorite", options.isFavorite)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }
}
