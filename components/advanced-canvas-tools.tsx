"use client"

import type React from "react"

import { useRef, useCallback, useEffect } from "react"

interface Point {
  x: number
  y: number
}

interface CanvasToolsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  selectedTool: string
  brushSize: number
  opacity: number
  color: string
  onHistoryAdd: () => void
}

export function useAdvancedCanvasTools({
  canvasRef,
  selectedTool,
  brushSize,
  opacity,
  color,
  onHistoryAdd,
}: CanvasToolsProps) {
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)
  const startPointRef = useRef<Point | null>(null)
  const cloneSourceRef = useRef<Point | null>(null)
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Create temporary canvas for shape preview
  useEffect(() => {
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement("canvas")
    }
  }, [])

  const getCanvasPoint = useCallback((e: MouseEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const drawBrush = useCallback(
    (ctx: CanvasRenderingContext2D, point: Point, isStart = false) => {
      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = opacity / 100
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (isStart || !lastPointRef.current) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    },
    [brushSize, opacity, color],
  )

  const drawPen = useCallback(
    (ctx: CanvasRenderingContext2D, point: Point, isStart = false) => {
      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = opacity / 100
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (isStart) {
        ctx.beginPath()
        ctx.moveTo(point.x, point.y)
      } else if (lastPointRef.current) {
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    },
    [brushSize, opacity, color],
  )

  const drawEraser = useCallback(
    (ctx: CanvasRenderingContext2D, point: Point, isStart = false) => {
      ctx.globalCompositeOperation = "destination-out"
      ctx.globalAlpha = opacity / 100
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (isStart || !lastPointRef.current) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    },
    [brushSize, opacity],
  )

  const drawClone = useCallback(
    (ctx: CanvasRenderingContext2D, point: Point) => {
      if (!cloneSourceRef.current) return

      const sourceX = cloneSourceRef.current.x
      const sourceY = cloneSourceRef.current.y
      const size = brushSize

      // Get image data from source
      const imageData = ctx.getImageData(sourceX - size / 2, sourceY - size / 2, size, size)

      // Apply to current position
      ctx.globalAlpha = opacity / 100
      ctx.putImageData(imageData, point.x - size / 2, point.y - size / 2)
    },
    [brushSize, opacity],
  )

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, start: Point, end: Point, shape: string, preview = false) => {
      if (preview) {
        ctx.globalCompositeOperation = "source-over"
        ctx.globalAlpha = 0.5
        ctx.setLineDash([5, 5])
      } else {
        ctx.globalCompositeOperation = "source-over"
        ctx.globalAlpha = opacity / 100
        ctx.setLineDash([])
      }

      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = brushSize

      const width = end.x - start.x
      const height = end.y - start.y

      ctx.beginPath()

      switch (shape) {
        case "rectangle":
          ctx.rect(start.x, start.y, width, height)
          break
        case "circle":
          const radius = Math.sqrt(width * width + height * height) / 2
          const centerX = start.x + width / 2
          const centerY = start.y + height / 2
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
          break
        case "line":
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          break
        case "arrow":
          // Draw line
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          // Draw arrowhead
          const angle = Math.atan2(height, width)
          const arrowLength = 15
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle - Math.PI / 6),
            end.y - arrowLength * Math.sin(angle - Math.PI / 6),
          )
          ctx.moveTo(end.x, end.y)
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle + Math.PI / 6),
            end.y - arrowLength * Math.sin(angle + Math.PI / 6),
          )
          break
        case "triangle":
          ctx.moveTo(start.x + width / 2, start.y)
          ctx.lineTo(start.x, start.y + height)
          ctx.lineTo(start.x + width, start.y + height)
          ctx.closePath()
          break
      }

      ctx.stroke()
      if (shape !== "line" && shape !== "arrow") {
        ctx.fill()
      }

      ctx.setLineDash([])
    },
    [brushSize, opacity, color],
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const point = getCanvasPoint(e)
      isDrawingRef.current = true
      lastPointRef.current = point
      startPointRef.current = point

      // Handle clone source selection
      if (selectedTool === "clone" && e.altKey) {
        cloneSourceRef.current = point
        return
      }

      switch (selectedTool) {
        case "brush":
          drawBrush(ctx, point, true)
          break
        case "pen":
          drawPen(ctx, point, true)
          break
        case "eraser":
          drawEraser(ctx, point, true)
          break
      }
    },
    [selectedTool, drawBrush, drawPen, drawEraser, getCanvasPoint],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDrawingRef.current) return

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const point = getCanvasPoint(e)

      switch (selectedTool) {
        case "brush":
          drawBrush(ctx, point)
          break
        case "pen":
          drawPen(ctx, point)
          break
        case "eraser":
          drawEraser(ctx, point)
          break
        case "clone":
          if (cloneSourceRef.current) {
            drawClone(ctx, point)
          }
          break
        case "rectangle":
        case "circle":
        case "line":
        case "arrow":
        case "triangle":
          // Clear and redraw with preview
          if (startPointRef.current && tempCanvasRef.current) {
            const tempCtx = tempCanvasRef.current.getContext("2d")
            if (tempCtx) {
              tempCanvasRef.current.width = canvas.width
              tempCanvasRef.current.height = canvas.height
              tempCtx.drawImage(canvas, 0, 0)
              drawShape(ctx, startPointRef.current, point, selectedTool, true)
            }
          }
          break
      }

      lastPointRef.current = point
    },
    [selectedTool, drawBrush, drawPen, drawEraser, drawClone, drawShape, getCanvasPoint],
  )

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Finalize shape drawing
    if (
      startPointRef.current &&
      lastPointRef.current &&
      ["rectangle", "circle", "line", "arrow", "triangle"].includes(selectedTool)
    ) {
      // Restore original canvas and draw final shape
      if (tempCanvasRef.current) {
        const tempCtx = tempCanvasRef.current.getContext("2d")
        if (tempCtx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(tempCanvasRef.current, 0, 0)
        }
      }
      drawShape(ctx, startPointRef.current, lastPointRef.current, selectedTool, false)
    }

    isDrawingRef.current = false
    lastPointRef.current = null
    startPointRef.current = null
    onHistoryAdd()
  }, [selectedTool, drawShape, onHistoryAdd])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
