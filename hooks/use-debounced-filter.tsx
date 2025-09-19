"use client"

import { useState, useEffect, useMemo } from "react"

interface GeneratedImage {
  id: string
  type: string
  prompt: string
  title?: string
  tags: string[]
  is_template: boolean
  is_favorite: boolean
  isTemplate?: boolean
  isFavorite?: boolean
  isAutoSaved?: boolean
  created_at: string
  createdAt?: string
  download_count?: number
  downloadCount?: number
}

interface FilterOptions {
  searchQuery: string
  selectedType: string
  selectedFilter: string
  sortBy: string
}

export function useDebouncedFilter(images: GeneratedImage[], filters: FilterOptions, debounceMs = 300) {
  const [debouncedFilters, setDebouncedFilters] = useState(filters)

  // Debounce filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [filters, debounceMs])

  const filteredItems = useMemo(() => {
    let filtered = images

    // Search filter - only apply if there's a search query
    if (debouncedFilters.searchQuery.trim()) {
      const query = debouncedFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.prompt.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Type filter
    if (debouncedFilters.selectedType !== "all") {
      filtered = filtered.filter((item) => item.type === debouncedFilters.selectedType)
    }

    // Special filters
    if (debouncedFilters.selectedFilter === "templates") {
      filtered = filtered.filter((item) => item.isTemplate || item.is_template)
    } else if (debouncedFilters.selectedFilter === "favorites") {
      filtered = filtered.filter((item) => item.isFavorite || item.is_favorite)
    } else if (debouncedFilters.selectedFilter === "auto-saved") {
      filtered = filtered.filter((item) => item.isAutoSaved)
    }

    // Sort - use a more efficient sorting approach
    const sortFunctions = {
      newest: (a: GeneratedImage, b: GeneratedImage) =>
        new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime(),
      oldest: (a: GeneratedImage, b: GeneratedImage) =>
        new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime(),
      "most-downloaded": (a: GeneratedImage, b: GeneratedImage) =>
        (b.downloadCount || b.download_count || 0) - (a.downloadCount || a.download_count || 0),
      alphabetical: (a: GeneratedImage, b: GeneratedImage) => (a.title || "").localeCompare(b.title || ""),
    }

    const sortFunction = sortFunctions[debouncedFilters.sortBy as keyof typeof sortFunctions]
    if (sortFunction) {
      filtered.sort(sortFunction)
    }

    return filtered
  }, [images, debouncedFilters])

  const stats = useMemo(
    () => ({
      total: filteredItems.length,
      templates: filteredItems.filter((item) => item.isTemplate || item.is_template).length,
      favorites: filteredItems.filter((item) => item.isFavorite || item.is_favorite).length,
      autoSaved: filteredItems.filter((item) => item.isAutoSaved).length,
    }),
    [filteredItems],
  )

  return {
    filteredItems,
    stats,
    isFiltering: JSON.stringify(filters) !== JSON.stringify(debouncedFilters),
  }
}
