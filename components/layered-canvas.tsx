"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useLayerSystem, type Layer } from "@/hooks/use-layer-system"

interface LayeredCanvasProps {
  image: string | null
  selectedTool: string
  brushSize: number
  opacity: number
  zoom: number
  onLayerSystemChange?: (layers: Layer[], activeLayerId: string | null) => void
}

export function LayeredCanvas({
  image,
  selectedTool,
  brushSize,
  opacity,
  zoom,
  onLayerSystemChange,
}: LayeredCanvasProps) {
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const imageObjectsRef = useRef<Set<HTMLImageElement>>(new Set())
  const isUnmountedRef = useRef(false)

  const { layers, activeLayerId, canvasContainerRef, createLayer, getActiveLayer, compositeAllLayers, cleanup } =
    useLayerSystem()

  const createTrackedImage = useCallback(() => {
    const img = new Image()
    imageObjectsRef.current.add(img)

    const cleanupImage = () => {
      img.onload = null
      img.onerror = null
      img.src = ""
      imageObjectsRef.current.delete(img)
    }

    return { img, cleanupImage }
  }, [])

  useEffect(() => {
    if (image && layers.length === 0) {
      const imageLayer = createLayer("image", "Background")
      const { img, cleanupImage } = createTrackedImage()

      img.crossOrigin = "anonymous"
      img.onload = () => {
        if (isUnmountedRef.current) {
          cleanupImage()
          return
        }

        const ctx = imageLayer.canvas.getContext("2d")
        if (ctx) {
          imageLayer.canvas.width = img.width
          imageLayer.canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          createLayer("drawing", "Drawing Layer 1")
        }
        cleanupImage()
      }

      img.onerror = () => {
        if (isUnmountedRef.current) {
          cleanupImage()
          return
        }

        console.log("[v0] Failed to load image for layer system")
        const needsProxy =
          image.includes("bfl.ai") ||
          image.includes("delivery-") ||
          (image.startsWith("https://") && !image.includes(window.location.hostname))

        if (needsProxy && !image.includes("/api/proxy-image")) {
          const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(image)}`
          console.log("[v0] Retrying with proxy:", proxiedUrl)

          const { img: retryImg, cleanupImage: cleanupRetryImage } = createTrackedImage()
          retryImg.crossOrigin = "anonymous"
          retryImg.onload = () => {
            if (isUnmountedRef.current) {
              cleanupRetryImage()
              return
            }

            const ctx = imageLayer.canvas.getContext("2d")
            if (ctx) {
              imageLayer.canvas.width = retryImg.width
              imageLayer.canvas.height = retryImg.height
              ctx.drawImage(retryImg, 0, 0)
              createLayer("drawing", "Drawing Layer 1")
            }
            cleanupRetryImage()
          }
          retryImg.onerror = () => {
            if (isUnmountedRef.current) {
              cleanupRetryImage()
              return
            }

            console.error("[v0] Failed to load image even with proxy")
            // Create a fallback canvas with error message
            const ctx = imageLayer.canvas.getContext("2d")
            if (ctx) {
              imageLayer.canvas.width = 800
              imageLayer.canvas.height = 600
              ctx.fillStyle = "#f1f5f9"
              ctx.fillRect(0, 0, 800, 600)
              ctx.fillStyle = "#64748b"
              ctx.font = "16px sans-serif"
              ctx.textAlign = "center"
              ctx.fillText("Failed to load image", 400, 300)
              createLayer("drawing", "Drawing Layer 1")
            }
            cleanupRetryImage()
          }
          retryImg.src = proxiedUrl
        } else {
          // Create fallback canvas for other errors
          const ctx = imageLayer.canvas.getContext("2d")
          if (ctx) {
            imageLayer.canvas.width = 800
            imageLayer.canvas.height = 600
            ctx.fillStyle = "#f1f5f9"
            ctx.fillRect(0, 0, 800, 600)
            ctx.fillStyle = "#64748b"
            ctx.font = "16px sans-serif"
            ctx.textAlign = "center"
            ctx.fillText("Failed to load image", 400, 300)
            createLayer("drawing", "Drawing Layer 1")
          }
        }
        cleanupImage()
      }
      img.src = image
    }
  }, [image, layers.length, createLayer, createTrackedImage])

  useEffect(() => {
    const canvas = compositeCanvasRef.current
    if (!canvas || layers.length === 0) return

    // Set canvas size to match layers
    const firstLayer = layers[0]
    if (firstLayer) {
      canvas.width = firstLayer.canvas.width
      canvas.height = firstLayer.canvas.height
    }

    compositeAllLayers(canvas)
  }, [layers, compositeAllLayers])

  useEffect(() => {
    onLayerSystemChange?.(layers, activeLayerId)
  }, [layers, activeLayerId, onLayerSystemChange])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const activeLayer = getActiveLayer()
      if (!activeLayer || activeLayer.locked || !activeLayer.visible) return

      const canvas = compositeCanvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)

      setIsDrawing(true)
      setLastPoint({ x, y })

      if (selectedTool === "brush" || selectedTool === "eraser") {
        const ctx = activeLayer.canvas.getContext("2d")
        if (!ctx) return

        ctx.globalCompositeOperation = selectedTool === "eraser" ? "destination-out" : "source-over"
        ctx.globalAlpha = (opacity / 100) * (activeLayer.opacity / 100)
        ctx.lineWidth = brushSize
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "#000000"
        ctx.beginPath()
        ctx.moveTo(x, y)
      }
    },
    [getActiveLayer, selectedTool, brushSize, opacity],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !lastPoint) return

      const activeLayer = getActiveLayer()
      if (!activeLayer || activeLayer.locked) return

      const canvas = compositeCanvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)

      if (selectedTool === "brush" || selectedTool === "eraser") {
        const ctx = activeLayer.canvas.getContext("2d")
        if (!ctx) return

        ctx.lineTo(x, y)
        ctx.stroke()
      }

      setLastPoint({ x, y })
    },
    [isDrawing, lastPoint, selectedTool, getActiveLayer],
  )

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false)
      setLastPoint(null)

      // Trigger re-composite
      const canvas = compositeCanvasRef.current
      if (canvas) {
        compositeAllLayers(canvas)
      }
    }
  }, [isDrawing, compositeAllLayers])

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true

      // Clean up all tracked image objects
      imageObjectsRef.current.forEach((img) => {
        img.onload = null
        img.onerror = null
        img.src = ""
      })
      imageObjectsRef.current.clear()

      // Clean up layer system
      cleanup()

      // Clean up composite canvas context
      const canvas = compositeCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    }
  }, [cleanup])

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

  return (
    <div ref={canvasContainerRef} className="w-full h-full bg-slate-50 dark:bg-slate-900">
      <canvas
        ref={compositeCanvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}
