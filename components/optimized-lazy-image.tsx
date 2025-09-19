"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface OptimizedLazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  priority?: boolean
  sizes?: string
}

const getOptimizedImageUrl = (src: string, width?: number, quality = 75) => {
  // If it's already a placeholder or local image, return as-is
  if (src.includes("/placeholder.svg") || src.startsWith("/") || src.startsWith("data:")) {
    return src
  }

  // For external images, use our optimization proxy
  const params = new URLSearchParams()
  params.set("url", src)
  if (width) params.set("w", width.toString())
  params.set("q", quality.toString())

  return `/api/optimize-image?${params.toString()}`
}

export function OptimizedLazyImage({
  src,
  alt,
  className,
  placeholder,
  onLoad,
  onError,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: OptimizedLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Load immediately if priority
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string>("")
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const generateSrcSet = useCallback((baseSrc: string) => {
    const sizes = [300, 600, 900, 1200]
    return sizes.map((size) => `${getOptimizedImageUrl(baseSrc, size)} ${size}w`).join(", ")
  }, [])

  useEffect(() => {
    const currentImg = imgRef.current
    if (!currentImg || priority) return

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
        rootMargin: "100px", // Start loading 100px before the image comes into view
        threshold: 0.1,
      },
    )

    observerRef.current.observe(currentImg)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [priority])

  useEffect(() => {
    if (!isInView) return

    // Start with a low-quality version for faster perceived loading
    const lowQualitySrc = getOptimizedImageUrl(src, 300, 30)
    const highQualitySrc = getOptimizedImageUrl(src, undefined, 75)

    // Load low quality first
    const lowQualityImg = new Image()
    lowQualityImg.onload = () => {
      setCurrentSrc(lowQualitySrc)

      // Then load high quality
      const highQualityImg = new Image()
      highQualityImg.onload = () => {
        setCurrentSrc(highQualitySrc)
        setIsLoaded(true)
        onLoad?.()
      }
      highQualityImg.onerror = () => {
        setHasError(true)
        onError?.()
      }
      highQualityImg.src = highQualitySrc
    }
    lowQualityImg.onerror = () => {
      // If low quality fails, try high quality directly
      const directImg = new Image()
      directImg.onload = () => {
        setCurrentSrc(src)
        setIsLoaded(true)
        onLoad?.()
      }
      directImg.onerror = () => {
        setHasError(true)
        onError?.()
      }
      directImg.src = src
    }
    lowQualityImg.src = lowQualitySrc
  }, [isInView, src, onLoad, onError])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    onError?.()
  }, [onError])

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", className)}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholder ? (
            <img
              src={placeholder || "/placeholder.svg"}
              alt=""
              className="w-full h-full object-cover opacity-50"
              loading="eager"
            />
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
        src={currentSrc || (isInView ? src : undefined)}
        srcSet={isInView ? generateSrcSet(src) : undefined}
        sizes={sizes}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  )
}
