"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Download, Save } from "lucide-react"
import type { Layer } from "@/hooks/use-layer-system"

interface ExportPanelProps {
  layers: Layer[]
  activeLayerId: string | null
  onExport: (options: ExportOptions) => void
  onSaveProject: (projectData: ProjectData) => void
}

export interface ExportOptions {
  format: "png" | "jpg" | "svg" | "pdf"
  quality: number
  includeBackground: boolean
  exportType: "composite" | "active-layer" | "all-layers" | "visible-layers"
  resolution: "original" | "web" | "print" | "custom"
  customWidth?: number
  customHeight?: number
  transparentBackground: boolean
}

export interface ProjectData {
  name: string
  layers: Array<{
    id: string
    name: string
    type: Layer["type"]
    visible: boolean
    locked: boolean
    opacity: number
    blendMode: Layer["blendMode"]
    imageData: string // base64 encoded canvas data
  }>
  metadata: {
    createdAt: string
    lastModified: string
    version: string
    canvasSize: { width: number; height: number }
  }
}

export function ExportPanel({ layers, activeLayerId, onExport, onSaveProject }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<ExportOptions["format"]>("png")
  const [quality, setQuality] = useState([90])
  const [exportType, setExportType] = useState<ExportOptions["exportType"]>("composite")
  const [resolution, setResolution] = useState<ExportOptions["resolution"]>("original")
  const [customWidth, setCustomWidth] = useState(1920)
  const [customHeight, setCustomHeight] = useState(1080)
  const [includeBackground, setIncludeBackground] = useState(true)
  const [transparentBackground, setTransparentBackground] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setIsExporting(true)

    const exportOptions: ExportOptions = {
      format: exportFormat,
      quality: quality[0],
      includeBackground,
      exportType,
      resolution,
      customWidth: resolution === "custom" ? customWidth : undefined,
      customHeight: resolution === "custom" ? customHeight : undefined,
      transparentBackground,
    }

    try {
      await onExport(exportOptions)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }, [
    exportFormat,
    quality,
    includeBackground,
    exportType,
    resolution,
    customWidth,
    customHeight,
    transparentBackground,
    onExport,
  ])

  const handleSaveProject = useCallback(async () => {
    const projectData: ProjectData = {
      name: `Project_${new Date().toISOString().split("T")[0]}`,
      layers: layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        visible: layer.visible,
        locked: layer.locked,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        imageData: layer.canvas.toDataURL("image/png"),
      })),
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0.0",
        canvasSize: layers[0]
          ? {
              width: layers[0].canvas.width,
              height: layers[0].canvas.height,
            }
          : { width: 800, height: 600 },
      },
    }

    try {
      await onSaveProject(projectData)
    } catch (error) {
      console.error("Save project failed:", error)
    }
  }, [layers, onSaveProject])

  const getResolutionPresets = () => {
    switch (resolution) {
      case "web":
        return { width: 1920, height: 1080 }
      case "print":
        return { width: 3000, height: 2000 }
      case "custom":
        return { width: customWidth, height: customHeight }
      default:
        return null // original size
    }
  }

  return (
    <div className="space-y-4">
      {/* Export Format */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Export Format</Label>
        <Select value={exportFormat} onValueChange={(value: ExportOptions["format"]) => setExportFormat(value)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="png">PNG (Lossless)</SelectItem>
            <SelectItem value="jpg">JPEG (Compressed)</SelectItem>
            <SelectItem value="svg">SVG (Vector)</SelectItem>
            <SelectItem value="pdf">PDF (Document)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quality Slider (for JPEG) */}
      {exportFormat === "jpg" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quality</Label>
          <Slider value={quality} onValueChange={setQuality} max={100} min={10} step={5} className="w-full" />
          <div className="text-xs text-slate-500">{quality[0]}%</div>
        </div>
      )}

      <Separator />

      {/* Export Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Export Content</Label>
        <Select value={exportType} onValueChange={(value: ExportOptions["exportType"]) => setExportType(value)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="composite">Composite Image</SelectItem>
            <SelectItem value="active-layer">Active Layer Only</SelectItem>
            <SelectItem value="visible-layers">Visible Layers</SelectItem>
            <SelectItem value="all-layers">All Layers (Batch)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resolution */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Resolution</Label>
        <Select value={resolution} onValueChange={(value: ExportOptions["resolution"]) => setResolution(value)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">Original Size</SelectItem>
            <SelectItem value="web">Web (1920×1080)</SelectItem>
            <SelectItem value="print">Print (3000×2000)</SelectItem>
            <SelectItem value="custom">Custom Size</SelectItem>
          </SelectContent>
        </Select>

        {resolution === "custom" && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Label className="text-xs">Width</Label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                className="w-full h-8 px-2 text-xs border rounded"
                min="1"
                max="10000"
              />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                className="w-full h-8 px-2 text-xs border rounded"
                min="1"
                max="10000"
              />
            </div>
          </div>
        )}

        {getResolutionPresets() && (
          <div className="text-xs text-slate-500">
            Output: {getResolutionPresets()?.width} × {getResolutionPresets()?.height}px
          </div>
        )}
      </div>

      <Separator />

      {/* Export Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Options</Label>

        <div className="flex items-center space-x-2">
          <Checkbox id="include-background" checked={includeBackground} onCheckedChange={setIncludeBackground} />
          <Label htmlFor="include-background" className="text-xs">
            Include background
          </Label>
        </div>

        {exportFormat === "png" && (
          <div className="flex items-center space-x-2">
            <Checkbox id="transparent-bg" checked={transparentBackground} onCheckedChange={setTransparentBackground} />
            <Label htmlFor="transparent-bg" className="text-xs">
              Transparent background
            </Label>
          </div>
        )}
      </div>

      <Separator />

      {/* Export Actions */}
      <div className="space-y-2">
        <Button onClick={handleExport} disabled={isExporting || layers.length === 0} className="w-full" size="sm">
          {isExporting ? (
            <>
              <Download className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export Image
            </>
          )}
        </Button>

        <Button
          onClick={handleSaveProject}
          disabled={layers.length === 0}
          variant="outline"
          className="w-full bg-transparent"
          size="sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Project
        </Button>
      </div>

      {/* Export Info */}
      <div className="text-xs text-slate-500 space-y-1">
        <div>Layers: {layers.length}</div>
        <div>Active: {activeLayerId ? layers.find((l) => l.id === activeLayerId)?.name : "None"}</div>
        <div>Visible: {layers.filter((l) => l.visible).length}</div>
      </div>
    </div>
  )
}
