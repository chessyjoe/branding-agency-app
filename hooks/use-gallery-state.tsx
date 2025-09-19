"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "./use-auth"
import { useGalleryApi } from "./use-gallery-api"

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

interface GalleryStateContextType {
  images: GeneratedImage[]
  loading: boolean
  error: string | null
  hasMore: boolean
  refreshImages: () => Promise<void>
  loadMore: () => Promise<void>
  toggleFavorite: (imageId: string) => Promise<boolean>
  toggleTemplate: (imageId: string) => Promise<boolean>
  incrementDownloadCount: (imageId: string) => void
  addNewImage: (image: GeneratedImage) => void
  retryLastOperation: () => Promise<void>
  clearError: () => void
}

const GalleryStateContext = createContext<GalleryStateContextType>({
  images: [],
  loading: true,
  error: null,
  hasMore: true,
  refreshImages: async () => {},
  loadMore: async () => {},
  toggleFavorite: async () => false,
  toggleTemplate: async () => false,
  incrementDownloadCount: () => {},
  addNewImage: () => {},
  retryLastOperation: async () => {},
  clearError: () => {},
})

const LIMIT = 20

export function GalleryStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { fetchImages, toggleFavorite: apiToggleFavorite, toggleTemplate: apiToggleTemplate, cleanup } = useGalleryApi()

  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const lastOperationRef = useRef<(() => Promise<void>) | null>(null)

  const fetchImagesWithRetry = useCallback(
    async (currentOffset = 0, append = false): Promise<void> => {
      if (!user) {
        setImages([])
        setLoading(false)
        setHasMore(false)
        return
      }

      try {
        if (!append) {
          setLoading(true)
        }
        setError(null)

        const result = await fetchImages(currentOffset, LIMIT)

        if (append) {
          setImages((prev) => [...prev, ...result.images])
        } else {
          setImages(result.images)
        }

        setHasMore(result.hasMore)
        setOffset(currentOffset + result.images.length)
      } catch (err: any) {
        if (err.name === "AbortError") {
          return // Request was cancelled, ignore
        }

        console.error("[v0] Failed to fetch gallery items:", err)

        let userFriendlyError = "Failed to load gallery items"
        if (err.message.includes("network") || err.message.includes("Failed to fetch")) {
          userFriendlyError = "Network error - please check your connection and try again"
        } else if (err.message.includes("HTTP 500")) {
          userFriendlyError = "Server error - please try again in a moment"
        } else if (err.message.includes("HTTP 401") || err.message.includes("HTTP 403")) {
          userFriendlyError = "Authentication error - please sign in again"
        } else if (err.message) {
          userFriendlyError = err.message
        }

        setError(userFriendlyError)
        if (!append) {
          setImages([])
          setHasMore(false)
        }
      } finally {
        setLoading(false)
      }
    },
    [user, fetchImages],
  )

  const refreshImages = useCallback(async () => {
    setOffset(0)
    setHasMore(true)
    lastOperationRef.current = () => refreshImages()
    await fetchImagesWithRetry(0, false)
  }, [fetchImagesWithRetry])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    lastOperationRef.current = () => loadMore()
    await fetchImagesWithRetry(offset, true)
  }, [fetchImagesWithRetry, hasMore, loading, offset])

  const toggleFavorite = useCallback(
    async (imageId: string): Promise<boolean> => {
      const image = images.find((i) => i.id === imageId)
      if (!image) return false

      lastOperationRef.current = () => toggleFavorite(imageId)

      try {
        // Optimistic update
        setImages((prev) =>
          prev.map((item) =>
            item.id === imageId ? { ...item, is_favorite: !item.is_favorite, isFavorite: !item.isFavorite } : item,
          ),
        )

        await apiToggleFavorite(imageId, image.is_favorite)
        return true
      } catch (error: any) {
        console.error("Failed to toggle favorite:", error)
        // Revert optimistic update
        setImages((prev) =>
          prev.map((item) =>
            item.id === imageId ? { ...item, is_favorite: image.is_favorite, isFavorite: image.isFavorite } : item,
          ),
        )
        setError(`Failed to ${image.is_favorite ? "remove from" : "add to"} favorites: ${error.message}`)
        return false
      }
    },
    [images, apiToggleFavorite],
  )

  const toggleTemplate = useCallback(
    async (imageId: string): Promise<boolean> => {
      const image = images.find((i) => i.id === imageId)
      if (!image) return false

      lastOperationRef.current = () => toggleTemplate(imageId)

      try {
        // Optimistic update
        setImages((prev) =>
          prev.map((item) =>
            item.id === imageId ? { ...item, is_template: !item.is_template, isTemplate: !item.isTemplate } : item,
          ),
        )

        await apiToggleTemplate(imageId, image.is_template)
        return true
      } catch (error: any) {
        console.error("Failed to toggle template:", error)
        // Revert optimistic update
        setImages((prev) =>
          prev.map((item) =>
            item.id === imageId ? { ...item, is_template: image.is_template, isTemplate: image.isTemplate } : item,
          ),
        )
        setError(`Failed to ${image.is_template ? "remove from" : "save as"} template: ${error.message}`)
        return false
      }
    },
    [images, apiToggleTemplate],
  )

  const incrementDownloadCount = useCallback((imageId: string) => {
    setImages((prev) =>
      prev.map((item) =>
        item.id === imageId
          ? {
              ...item,
              download_count: (item.download_count || 0) + 1,
              downloadCount: (item.downloadCount || 0) + 1,
            }
          : item,
      ),
    )
  }, [])

  const addNewImage = useCallback((newImage: GeneratedImage) => {
    setImages((prev) => [newImage, ...prev])
  }, [])

  const retryLastOperation = useCallback(async () => {
    if (lastOperationRef.current) {
      setError(null)
      await lastOperationRef.current()
    } else {
      await refreshImages()
    }
  }, [refreshImages])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    if (user?.id) {
      refreshImages()
    }
  }, [user?.id, refreshImages])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return (
    <GalleryStateContext.Provider
      value={{
        images,
        loading,
        error,
        hasMore,
        refreshImages,
        loadMore,
        toggleFavorite,
        toggleTemplate,
        incrementDownloadCount,
        addNewImage,
        retryLastOperation,
        clearError,
      }}
    >
      {children}
    </GalleryStateContext.Provider>
  )
}

export const useGalleryState = () => {
  const context = useContext(GalleryStateContext)
  if (!context) {
    throw new Error("useGalleryState must be used within a GalleryStateProvider")
  }
  return context
}
