"use client"

import { useCallback, useRef } from "react"
import { useAuth } from "./use-auth"
import { useGalleryCache } from "./use-gallery-cache"

interface GeneratedImage {
  id: string
  type: string
  prompt: string
  refined_prompt?: string
  model: string
  image_url: string
  code?: string
  preview_url?: string
  colors: string[]
  brand_voice: any
  advanced_options: any
  aspect_ratio: string
  is_template: boolean
  is_favorite: boolean
  tags: string[]
  created_at: string
  updated_at: string
  download_count?: number
  title?: string
  imageUrl?: string
  isTemplate?: boolean
  isFavorite?: boolean
  isAutoSaved?: boolean
  downloadCount?: number
  createdAt?: string
}

export function useGalleryApi() {
  const { user } = useAuth()
  const { getCachedData, setCachedData, clearUserCache } = useGalleryCache()
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeRequestsRef = useRef<Set<string>>(new Set())

  const fetchImages = useCallback(
    async (offset = 0, limit = 20, retryCount = 0): Promise<{ images: GeneratedImage[]; hasMore: boolean }> => {
      if (!user) {
        return { images: [], hasMore: false }
      }

      const requestKey = `${user.id}-${offset}-${limit}`

      if (activeRequestsRef.current.has(requestKey)) {
        throw new Error("Request already in progress")
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      activeRequestsRef.current.add(requestKey)

      try {
        const cacheKey = `images-${user.id}-${offset}-${limit}`
        const cachedData = getCachedData(cacheKey)

        if (cachedData) {
          return {
            images: cachedData.images.map(transformImage),
            hasMore: cachedData.images.length === limit,
          }
        }

        const params = new URLSearchParams({
          userId: user.id,
          limit: limit.toString(),
          offset: offset.toString(),
        })

        const response = await fetch(`/api/generation-history?${params}`, {
          signal: abortController.signal,
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ""}`)
        }

        const data = await response.json()

        if (data.success) {
          // Cache the response
          setCachedData(cacheKey, data)

          return {
            images: data.images.map(transformImage),
            hasMore: data.images.length === limit,
          }
        } else {
          throw new Error(data.error || "Failed to fetch images")
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          throw err // Let caller handle abort
        }

        const isNetworkError =
          err.message.includes("fetch") ||
          err.message.includes("network") ||
          err.message.includes("Failed to fetch") ||
          err.name === "TypeError"

        if (retryCount < 3 && isNetworkError) {
          const delay = Math.pow(2, retryCount) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
          return fetchImages(offset, limit, retryCount + 1)
        }

        throw err
      } finally {
        activeRequestsRef.current.delete(requestKey)
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    },
    [user, getCachedData, setCachedData],
  )

  const toggleFavorite = useCallback(
    async (imageId: string, currentState: boolean): Promise<void> => {
      const response = await fetch("/api/toggle-favorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
          isFavorite: !currentState,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to toggle favorite`)
      }

      if (user?.id) {
        clearUserCache(user.id)
      }
    },
    [user?.id, clearUserCache],
  )

  const toggleTemplate = useCallback(
    async (imageId: string, currentState: boolean): Promise<void> => {
      const response = await fetch("/api/toggle-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
          isTemplate: !currentState,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to toggle template`)
      }

      if (user?.id) {
        clearUserCache(user.id)
      }
    },
    [user?.id, clearUserCache],
  )

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    activeRequestsRef.current.clear()
  }, [])

  return {
    fetchImages,
    toggleFavorite,
    toggleTemplate,
    cleanup,
  }
}

const transformImage = (item: GeneratedImage): GeneratedImage => ({
  ...item,
  title: item.prompt.slice(0, 50) + (item.prompt.length > 50 ? "..." : ""),
  imageUrl: item.image_url,
  isTemplate: item.is_template,
  isFavorite: item.is_favorite,
  isAutoSaved: true,
  downloadCount: item.download_count || 0,
  createdAt: item.created_at,
})
