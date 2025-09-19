"use client"

import type React from "react"

import { useEffect, useRef, useCallback } from "react"

interface InfiniteScrollProps {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  threshold?: number
  children: React.ReactNode
}

export function InfiniteScroll({ hasMore, loading, onLoadMore, threshold = 200, children }: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore()
      }
    },
    [hasMore, loading, onLoadMore],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
    })

    observerRef.current.observe(sentinel)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [handleIntersection, threshold])

  return (
    <>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="h-4 flex items-center justify-center">
          {loading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />}
        </div>
      )}
    </>
  )
}
