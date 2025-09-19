"use client"

import { useCallback } from "react"
import type { Layer } from "./use-layer-system"
import type { ExportOptions, ProjectData } from "@/components/export-panel"

export function useExportImport() {
  const exportComposite = useCallback(async (layers: Layer[], options: ExportOptions): Promise<void> => {
    if (layers.length === 0) return

    // Create composite canvas
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Determine canvas size
    const firstLayer = layers[0]
    let { width, height } = firstLayer.canvas

    if (options.resolution !== "original") {
      switch (options.resolution) {
        case "web":
          width = 1920
          height = 1080
          break
        case "print":
          width = 3000
          height = 2000
          break
        case "custom":
          width = options.customWidth || width
          height = options.customHeight || height
          break
      }
    }

    canvas.width = width
    canvas.height = height

    // Clear canvas
    if (options.includeBackground && !options.transparentBackground) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
    }

    // Composite layers
    const layersToExport = options.exportType === "visible-layers" ? layers.filter((l) => l.visible) : layers

    layersToExport
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach((layer) => {
        if (layer.visible || options.exportType === "all-layers") {
          ctx.globalAlpha = layer.opacity / 100
          ctx.globalCompositeOperation = layer.blendMode === "normal" ? "source-over" : layer.blendMode

          // Scale layer to fit new dimensions
          ctx.drawImage(layer.canvas, 0, 0, width, height)
        }
      })

    // Export based on format
    await downloadCanvas(canvas, options)
  }, [])

  const exportLayer = useCallback(async (layer: Layer, options: ExportOptions): Promise<void> => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    let { width, height } = layer.canvas
    if (options.resolution !== "original") {
      switch (options.resolution) {
        case "web":
          width = 1920
          height = 1080
          break
        case "print":
          width = 3000
          height = 2000
          break
        case "custom":
          width = options.customWidth || width
          height = options.customHeight || height
          break
      }
    }

    canvas.width = width
    canvas.height = height

    // Draw layer
    ctx.globalAlpha = layer.opacity / 100
    ctx.drawImage(layer.canvas, 0, 0, width, height)

    await downloadCanvas(canvas, options, layer.name)
  }, [])

  const exportAllLayers = useCallback(
    async (layers: Layer[], options: ExportOptions): Promise<void> => {
      for (const layer of layers) {
        await exportLayer(layer, options)
        // Small delay to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    },
    [exportLayer],
  )

  const downloadCanvas = useCallback(
    async (canvas: HTMLCanvasElement, options: ExportOptions, filename?: string): Promise<void> => {
      return new Promise((resolve) => {
        const defaultFilename = filename || `export_${Date.now()}`

        if (options.format === "svg") {
          // Convert to SVG (simplified)
          const svgData = canvasToSVG(canvas)
          downloadBlob(svgData, `${defaultFilename}.svg`, "image/svg+xml")
          resolve()
        } else if (options.format === "pdf") {
          // Convert to PDF would require a library like jsPDF
          // For now, export as PNG
          canvas.toBlob((blob) => {
            if (blob) {
              downloadBlob(blob, `${defaultFilename}.png`, "image/png")
            }
            resolve()
          }, "image/png")
        } else {
          const mimeType = options.format === "jpg" ? "image/jpeg" : "image/png"
          const quality = options.format === "jpg" ? options.quality / 100 : undefined

          canvas.toBlob(
            (blob) => {
              if (blob) {
                downloadBlob(blob, `${defaultFilename}.${options.format}`, mimeType)
              }
              resolve()
            },
            mimeType,
            quality,
          )
        }
      })
    },
    [],
  )

  const canvasToSVG = useCallback((canvas: HTMLCanvasElement): Blob => {
    const dataURL = canvas.toDataURL("image/png")
    const svgContent = `
      <svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
        <image href="${dataURL}" width="${canvas.width}" height="${canvas.height}"/>
      </svg>
    `
    return new Blob([svgContent], { type: "image/svg+xml" })
  }, [])

  const downloadBlob = useCallback((blob: Blob, filename: string, mimeType: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const saveProject = useCallback(
    async (projectData: ProjectData): Promise<void> => {
      const blob = new Blob([JSON.stringify(projectData, null, 2)], {
        type: "application/json",
      })
      downloadBlob(blob, `${projectData.name}.json`, "application/json")
    },
    [downloadBlob],
  )

  const importImageAsLayer = useCallback(
    async (file: File, layerName?: string): Promise<{ canvas: HTMLCanvasElement; name: string }> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height

          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            resolve({
              canvas,
              name: layerName || file.name.replace(/\.[^/.]+$/, ""),
            })
          } else {
            reject(new Error("Failed to get canvas context"))
          }
        }
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = URL.createObjectURL(file)
      })
    },
    [],
  )

  const handleExport = useCallback(
    async (layers: Layer[], activeLayerId: string | null, options: ExportOptions): Promise<void> => {
      switch (options.exportType) {
        case "composite":
        case "visible-layers":
          await exportComposite(layers, options)
          break
        case "active-layer":
          const activeLayer = layers.find((l) => l.id === activeLayerId)
          if (activeLayer) {
            await exportLayer(activeLayer, options)
          }
          break
        case "all-layers":
          await exportAllLayers(layers, options)
          break
      }
    },
    [exportComposite, exportLayer, exportAllLayers],
  )

  return {
    handleExport,
    saveProject,
    importImageAsLayer,
    downloadCanvas,
  }
}
