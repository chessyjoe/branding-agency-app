"use client"

import { useCallback, useRef, useEffect } from "react"

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100 // Maximum number of cache entries

export function useGalleryCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    const now = Date.now()
    const cache = cacheRef.current
    const keysToDelete: string[] = []

    // Remove expired entries
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => cache.delete(key))

    // If still too large, remove oldest entries
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE)
      toDelete.forEach(([key]) => cache.delete(key))
    }
  }, [])

  const getCachedData = useCallback((key: string) => {
    const cached = cacheRef.current.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    cacheRef.current.delete(key)
    return null
  }, [])

  const setCachedData = useCallback(
    (key: string, data: any, ttl = CACHE_TTL) => {
      cacheRef.current.set(key, { data, timestamp: Date.now(), ttl })

      // Trigger cleanup if cache is getting large
      if (cacheRef.current.size > MAX_CACHE_SIZE * 0.8) {
        cleanup()
      }
    },
    [cleanup],
  )

  const clearUserCache = useCallback((userId: string) => {
    const cache = cacheRef.current
    const keysToDelete = Array.from(cache.keys()).filter((key) => key.startsWith(`images-${userId}`))
    keysToDelete.forEach((key) => cache.delete(key))
  }, [])

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  useEffect(() => {
    cleanupIntervalRef.current = setInterval(cleanup, 2 * 60 * 1000) // Every 2 minutes

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
      cacheRef.current.clear()
    }
  }, [cleanup])

  return {
    getCachedData,
    setCachedData,
    clearUserCache,
    clearAllCache,
    getCacheSize: () => cacheRef.current.size,
  }
}
