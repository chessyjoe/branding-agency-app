"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  type: "image" | "drawing" | "text" | "shape"
  canvas: HTMLCanvasElement
  zIndex: number
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "soft-light"
}

export interface LayerSystemState {
  layers: Layer[]
  activeLayerId: string | null
  history: LayerSystemState[]
  historyIndex: number
}

export function useLayerSystem() {
  const [state, setState] = useState<LayerSystemState>({
    layers: [],
    activeLayerId: null,
    history: [],
    historyIndex: -1,
  })

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const canvasesRef = useRef<Set<HTMLCanvasElement>>(new Set())
  const isUnmountedRef = useRef(false)

  const createTrackedCanvas = useCallback(() => {
    const canvas = document.createElement("canvas")
    canvasesRef.current.add(canvas)
    return canvas
  }, [])

  const cleanupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    canvas.width = 0
    canvas.height = 0
    canvas.remove()
    canvasesRef.current.delete(canvas)
  }, [])

  const createLayer = useCallback(
    (type: Layer["type"], name?: string) => {
      // Remove the unmounted check for now - it's causing issues in React Strict Mode
      // if (isUnmountedRef.current) {
      //   console.warn("[v0] createLayer called on unmounted component")
      //   return null
      // }

      const canvas = createTrackedCanvas()
      const container = canvasContainerRef.current
      
      // Set default canvas size
      canvas.width = 800
      canvas.height = 600
      
      // Try to get container dimensions if available
      if (container) {
        try {
          const rect = container.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            canvas.width = rect.width
            canvas.height = rect.height
          }
        } catch (error) {
          console.warn("[v0] Failed to get container dimensions:", error)
        }
      }

      const newLayer: Layer = {
        id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
        visible: true,
        locked: false,
        opacity: 100,
        type,
        canvas,
        zIndex: state.layers.length,
        blendMode: "normal",
      }

      setState((prev) => ({
        ...prev,
        layers: [...prev.layers, newLayer],
        activeLayerId: newLayer.id,
      }))

      console.log("[v0] Created layer:", {
        id: newLayer.id,
        type: newLayer.type,
        name: newLayer.name,
        canvasSize: `${canvas.width}x${canvas.height}`
      })

      return newLayer
    },
    [state.layers.length, createTrackedCanvas],
  )

  const deleteLayer = useCallback(
    (layerId: string) => {
      setState((prev) => {
        if (prev.layers.length <= 1) return prev

        const layerToDelete = prev.layers.find((l) => l.id === layerId)
        if (layerToDelete) {
          cleanupCanvas(layerToDelete.canvas)
        }

        const newLayers = prev.layers.filter((l) => l.id !== layerId)
        const newActiveId = prev.activeLayerId === layerId ? newLayers[0]?.id || null : prev.activeLayerId

        return {
          ...prev,
          layers: newLayers,
          activeLayerId: newActiveId,
        }
      })
    },
    [cleanupCanvas],
  )

  const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer)),
    }))
  }, [])

  const reorderLayers = useCallback((dragIndex: number, hoverIndex: number) => {
    setState((prev) => {
      const newLayers = [...prev.layers]
      const draggedLayer = newLayers[dragIndex]
      newLayers.splice(dragIndex, 1)
      newLayers.splice(hoverIndex, 0, draggedLayer)

      // Update z-indices
      return {
        ...prev,
        layers: newLayers.map((layer, index) => ({
          ...layer,
          zIndex: index,
        })),
      }
    })
  }, [])

  const mergeLayers = useCallback(
    (layerIds: string[]) => {
      if (layerIds.length < 2) return

      const layersToMerge = state.layers.filter((l) => layerIds.includes(l.id))
      if (layersToMerge.length < 2) return

      // Create new merged canvas
      const mergedCanvas = createTrackedCanvas()
      const ctx = mergedCanvas.getContext("2d")
      if (!ctx) return

      // Set canvas size to match existing layers
      const firstLayer = layersToMerge[0]
      mergedCanvas.width = firstLayer.canvas.width
      mergedCanvas.height = firstLayer.canvas.height

      // Draw all layers onto merged canvas
      layersToMerge
        .sort((a, b) => a.zIndex - b.zIndex)
        .forEach((layer) => {
          if (layer.visible) {
            ctx.globalAlpha = layer.opacity / 100
            ctx.globalCompositeOperation = layer.blendMode === "normal" ? "source-over" : layer.blendMode
            ctx.drawImage(layer.canvas, 0, 0)
          }
        })

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"

      // Create merged layer
      const mergedLayer: Layer = {
        id: `merged_${Date.now()}`,
        name: "Merged Layer",
        visible: true,
        locked: false,
        opacity: 100,
        type: "drawing",
        canvas: mergedCanvas,
        zIndex: Math.min(...layersToMerge.map((l) => l.zIndex)),
        blendMode: "normal",
      }

      setState((prev) => ({
        ...prev,
        layers: [...prev.layers.filter((l) => !layerIds.includes(l.id)), mergedLayer].sort(
          (a, b) => a.zIndex - b.zIndex,
        ),
        activeLayerId: mergedLayer.id,
      }))

      layersToMerge.forEach((layer) => cleanupCanvas(layer.canvas))
    },
    [state.layers, createTrackedCanvas, cleanupCanvas],
  )

  const duplicateLayer = useCallback(
    (layerId: string) => {
      const layer = state.layers.find((l) => l.id === layerId)
      if (!layer) return

      const newCanvas = createTrackedCanvas()
      newCanvas.width = layer.canvas.width
      newCanvas.height = layer.canvas.height

      const ctx = newCanvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(layer.canvas, 0, 0)
      }

      const duplicatedLayer: Layer = {
        ...layer,
        id: `${layer.id}_copy_${Date.now()}`,
        name: `${layer.name} Copy`,
        canvas: newCanvas,
        zIndex: layer.zIndex + 1,
      }

      setState((prev) => ({
        ...prev,
        layers: [
          ...prev.layers.map((l) => (l.zIndex > layer.zIndex ? { ...l, zIndex: l.zIndex + 1 } : l)),
          duplicatedLayer,
        ],
        activeLayerId: duplicatedLayer.id,
      }))
    },
    [state.layers, createTrackedCanvas],
  )

  const getActiveLayer = useCallback(() => {
    return state.layers.find((l) => l.id === state.activeLayerId) || null
  }, [state.layers, state.activeLayerId])

  const compositeAllLayers = useCallback(
    (targetCanvas: HTMLCanvasElement) => {
      const ctx = targetCanvas.getContext("2d")
      if (!ctx) return

      ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)

      state.layers
        .filter((layer) => layer.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .forEach((layer) => {
          ctx.globalAlpha = layer.opacity / 100
          ctx.globalCompositeOperation = layer.blendMode === "normal" ? "source-over" : layer.blendMode
          ctx.drawImage(layer.canvas, 0, 0)
        })

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
    },
    [state.layers],
  )

  const cleanup = useCallback(() => {
    // Clean up all tracked canvases
    canvasesRef.current.forEach((canvas) => {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      canvas.width = 0
      canvas.height = 0
      canvas.remove()
    })
    canvasesRef.current.clear()

    // Reset state
    setState({
      layers: [],
      activeLayerId: null,
      history: [],
      historyIndex: -1,
    })
  }, [])

  useEffect(() => {
    return () => {
      // Only set unmounted flag after a delay to avoid Strict Mode issues
      setTimeout(() => {
        isUnmountedRef.current = true
      }, 0)
      cleanup()
    }
  }, [cleanup])

  return {
    ...state,
    canvasContainerRef,
    createLayer,
    deleteLayer,
    updateLayer,
    reorderLayers,
    mergeLayers,
    duplicateLayer,
    getActiveLayer,
    compositeAllLayers,
    cleanup,
    setActiveLayer: (layerId: string) => setState((prev) => ({ ...prev, activeLayerId: layerId })),
  }
}
