"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"

interface ImageEditorCanvasProps {
  image: string | null
  selectedTool: string
  brushSize: number
  opacity: number
  zoom: number
  sessionId?: string
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void
}

interface HistoryState {
  imageData: ImageData
}

function useImageSafe(src: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading")
  const [retryCount, setRetryCount] = useState(0)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    if (!src) {
      setImage(null)
      setStatus("loading")
      setErrorDetails(null)
      return
    }

    try {
      new URL(src)
    } catch (error) {
      console.error("[v0] Invalid image URL:", src, error)
      setStatus("failed")
      setErrorDetails("Invalid URL format")
      return
    }

    const needsProxy =
      src.includes("bfl.ai") ||
      src.includes("delivery-") ||
      (src.startsWith("https://") && !src.includes(window.location.hostname))

    const imageUrl = needsProxy ? `/api/proxy-image?url=${encodeURIComponent(src)}` : src

    console.log("[v0] Loading image:", {
      original: src,
      proxied: needsProxy,
      finalUrl: imageUrl,
      attempt: retryCount + 1,
    })

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      console.log("[v0] Image loaded successfully:", {
        url: imageUrl,
        dimensions: `${img.width}x${img.height}`,
        attempt: retryCount + 1,
      })
      setImage(img)
      setStatus("loaded")
      setErrorDetails(null)
    }

    img.onerror = (error) => {
      console.error("[v0] Failed to load image:", {
        url: imageUrl,
        original: src,
        needsProxy,
        attempt: retryCount + 1,
        error,
      })

      if (retryCount < 2) {
        console.log("[v0] Retrying image load in 2 seconds...")
        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 2000)
      } else {
        setImage(null)
        setStatus("failed")
        setErrorDetails(`Failed to load after ${retryCount + 1} attempts`)
      }
    }

    img.src = imageUrl

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, retryCount])

  useEffect(() => {
    setRetryCount(0)
    setErrorDetails(null)
  }, [src])

  return [image, status, errorDetails, retryCount] as const
}

export function ImageEditorCanvas({
  image,
  selectedTool,
  brushSize,
  opacity,
  zoom,
  sessionId,
  onHistoryChange,
}: ImageEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loadedImage, imageStatus, errorDetails, retryCount] = useImageSafe(image)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastZoomRef = useRef(zoom)
  const lastImageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !loadedImage || imageStatus !== "loaded") return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Only redraw if image or zoom changed
    if (loadedImage === lastImageRef.current && zoom === lastZoomRef.current) {
      return
    }

    lastImageRef.current = loadedImage
    lastZoomRef.current = zoom

    // Set canvas size to match container
    const container = canvas.parentElement
    if (container) {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      setCanvasSize({ width: rect.width, height: rect.height })
    }

    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate image position to center it
    const imageWidth = loadedImage.width * (zoom / 100)
    const imageHeight = loadedImage.height * (zoom / 100)
    const x = (canvas.width - imageWidth) / 2
    const y = (canvas.height - imageHeight) / 2

    ctx.drawImage(loadedImage, x, y, imageWidth, imageHeight)

    // Save initial state to history only if it's a new image
    if (history.length === 0 || loadedImage !== lastImageRef.current) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setHistory([{ imageData }])
      setHistoryIndex(0)
      onHistoryChange?.(false, false)
    }
  }, [loadedImage, imageStatus, zoom, onHistoryChange, history.length])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return

    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect()
    }

    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return

        canvas.width = rect.width
        canvas.height = rect.height
        setCanvasSize({ width: rect.width, height: rect.height })

        // Redraw current state
        if (history[historyIndex]) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            try {
              ctx.putImageData(history[historyIndex].imageData, 0, 0)
            } catch (error) {
              console.warn("[v0] Failed to restore canvas state after resize:", error)
              // Fallback: redraw the original image
              if (loadedImage && imageStatus === "loaded") {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                const imageWidth = loadedImage.width * (zoom / 100)
                const imageHeight = loadedImage.height * (zoom / 100)
                const x = (canvas.width - imageWidth) / 2
                const y = (canvas.height - imageHeight) / 2
                ctx.drawImage(loadedImage, x, y, imageWidth, imageHeight)
              }
            }
          }
        }
      })
    }

    resizeObserverRef.current = new ResizeObserver(handleResize)
    resizeObserverRef.current.observe(container)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [history, historyIndex, loadedImage, imageStatus, zoom])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ imageData })

    // Limit history to prevent memory issues
    const MAX_HISTORY = 20
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    } else {
      setHistoryIndex(historyIndex + 1)
    }

    setHistory(newHistory)
    onHistoryChange?.(true, false)

    // Debounced server save
    if (sessionId) {
      // Use a smaller data representation for server storage
      const compressedData = {
        width: canvas.width,
        height: canvas.height,
        // Only store essential metadata, not full ImageData
        timestamp: Date.now(),
      }

      fetch("/api/editor/save-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          actionType: selectedTool,
          canvasState: compressedData,
          actionMetadata: { tool: selectedTool, timestamp: Date.now() },
        }),
      }).catch(console.error)
    }
  }, [history, historyIndex, sessionId, selectedTool, onHistoryChange])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setIsDrawing(true)
      setLastPoint({ x, y })

      if (selectedTool === "brush" || selectedTool === "eraser") {
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.globalCompositeOperation = selectedTool === "eraser" ? "destination-out" : "source-over"
        ctx.globalAlpha = opacity / 100
        ctx.lineWidth = brushSize
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "#000000"

        ctx.beginPath()
        ctx.moveTo(x, y)
      }
    },
    [selectedTool, brushSize, opacity],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !lastPoint) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (selectedTool === "brush" || selectedTool === "eraser") {
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.lineTo(x, y)
        ctx.stroke()
      }

      setLastPoint({ x, y })
    },
    [isDrawing, lastPoint, selectedTool],
  )

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false)
      setLastPoint(null)
      saveToHistory()
    }
  }, [isDrawing, saveToHistory])

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Clear history to free memory
      setHistory([])
    }
  }, [])

  if (!image) {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <div className="text-6xl mb-4">🖼️</div>
          <h3 className="text-lg font-medium mb-2">No Image Loaded</h3>
          <p className="text-sm">Upload an image to start editing</p>
        </div>
      </div>
    )
  }

  if (imageStatus === "loading") {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <div className="text-6xl mb-4 animate-pulse">🖼️</div>
          <h3 className="text-lg font-medium mb-2">Loading Image...</h3>
          <p className="text-sm">
            {retryCount > 0 ? `Retry attempt ${retryCount + 1}/3` : "Please wait while we load your image"}
          </p>
        </div>
      </div>
    )
  }

  if (imageStatus === "failed") {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Failed to Load Image</h3>
          <p className="text-sm mb-2">
            {errorDetails || "The image could not be loaded. This might be due to network issues or CORS restrictions."}
          </p>
          <div className="text-xs text-slate-400 mb-4 max-w-md mx-auto break-all">URL: {image}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}
