"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({ src, alt, className, placeholder, onLoad, onError }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const currentImg = imgRef.current
    if (!currentImg) return

    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.disconnect()
          }
        })
      },
      {
        rootMargin: "50px", // Start loading 50px before the image comes into view
      },
    )

    observerRef.current.observe(currentImg)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", className)}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          {placeholder ? (
            <img src={placeholder || "/placeholder.svg"} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-2" />
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  )
}
