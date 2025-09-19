export interface DatabaseUser {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface DatabaseGeneration {
  id: string
  user_id: string
  prompt: string
  result: any
  file_urls: string[]
  is_template: boolean
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseTemplate {
  id: string
  name: string
  description: string
  category: string
  preview_url: string
  config: any
  created_at: string
  updated_at: string
}

// Table name constants to prevent typos
export const TABLES = {
  USERS: "users",
  GENERATIONS: "generations",
  TEMPLATES: "templates",
  USER_FAVORITES: "user_favorites",
  BRAND_KITS: "brand_kits",
} as const
