"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  MousePointer,
  Crop,
  Paintbrush,
  Undo,
  Redo,
  Download,
  Upload,
  EyeOff,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  HelpCircle,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { LayerPanel } from "@/components/layer-panel"
import { LayeredCanvas } from "@/components/layered-canvas"
import { useLayerSystem, type Layer } from "@/hooks/use-layer-system"
import { useExportImport } from "@/hooks/use-export-import"
import DrawingTools from "@/components/drawing-tools"
import SelectionTools from "@/components/selection-tools"
import AIEditingPanel from "@/components/ai-editing-panel"
import { ExportPanel } from "@/components/export-panel"
import { ImportPanel } from "@/components/import-panel"

export default function ImageEditorPage() {
  const [selectedTool, setSelectedTool] = useState("select")
  const [brushSize, setBrushSize] = useState(10)
  const [opacity, setOpacity] = useState(100)
  const [zoom, setZoom] = useState([100])
  const [color, setColor] = useState("#000000")
  const [showLayers, setShowLayers] = useState(true)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showDrawingTools, setShowDrawingTools] = useState(true)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [editorMetadata, setEditorMetadata] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [layers, setLayers] = useState<Layer[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)

  const {
    layers: systemLayers,
    activeLayerId: systemActiveLayerId,
    createLayer,
    deleteLayer,
    updateLayer,
    setActiveLayer,
    duplicateLayer,
    mergeLayers,
    reorderLayers,
  } = useLayerSystem()

  const { handleExport, saveProject, importImageAsLayer } = useExportImport()

  useEffect(() => {
    setLayers(systemLayers)
    setActiveLayerId(systemActiveLayerId)
  }, [systemLayers, systemActiveLayerId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
          case "s":
            e.preventDefault()
            setShowExportPanel(true)
            break
          case "o":
            e.preventDefault()
            setShowImportPanel(true)
            break
          case "d":
            e.preventDefault()
            if (activeLayerId) {
              const activeLayer = layers.find((l) => l.id === activeLayerId)
              if (activeLayer) {
                duplicateLayer(activeLayerId)
              }
            }
            break
          case "Delete":
          case "Backspace":
            e.preventDefault()
            if (activeLayerId) {
              deleteLayer(activeLayerId)
            }
            break
        }
      }

      switch (e.key) {
        case "v":
          setSelectedTool("select")
          break
        case "m":
          setSelectedTool("move")
          break
        case "c":
          setSelectedTool("crop")
          break
        case "b":
          setSelectedTool("brush")
          break
        case "e":
          setSelectedTool("eraser")
          break
        case "l":
          setSelectedTool("lasso")
          break
        case "Escape":
          setShowExportPanel(false)
          setShowImportPanel(false)
          setShowOnboarding(false)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeLayerId, layers, duplicateLayer, deleteLayer])

  useEffect(() => {
    const hasVisited = localStorage.getItem("editor-visited")
    if (!hasVisited) {
      setShowOnboarding(true)
      localStorage.setItem("editor-visited", "true")
    }
  }, [])

  useEffect(() => {
    const editorData = sessionStorage.getItem("editorImageData")
    if (editorData) {
      try {
        const data = JSON.parse(editorData)
        setCurrentImage(data.imageUrl)
        setEditorMetadata(data)
        console.log("[v0] Loaded editor data:", data)
      } catch (error) {
        console.error("[v0] Failed to parse editor data:", error)
      }
    }
  }, [])

  const tools = [
    { id: "select", icon: MousePointer, label: "Select", shortcut: "V" },
    { id: "move", icon: Move, label: "Move", shortcut: "M" },
    { id: "crop", icon: Crop, label: "Crop", shortcut: "C" },
    { id: "lasso", icon: MousePointer, label: "Lasso", shortcut: "L" },
  ]

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentImage(e.target?.result as string)
        setEditorMetadata(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleUndo = () => {
    console.log("[v0] Undo action triggered")
  }

  const handleRedo = () => {
    console.log("[v0] Redo action triggered")
  }

  const handleExportClick = useCallback(() => {
    setShowExportPanel(true)
  }, [])

  const handleImportClick = useCallback(() => {
    setShowImportPanel(true)
  }, [])

  const handleImportImage = useCallback(
    async (file: File, layerName?: string) => {
      try {
        const { canvas, name } = await importImageAsLayer(file, layerName)
        const newLayer = createLayer("image", name)

        newLayer.canvas.width = canvas.width
        newLayer.canvas.height = canvas.height
        const ctx = newLayer.canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(canvas, 0, 0)
        }

        setShowImportPanel(false)
      } catch (error) {
        console.error("Import failed:", error)
      }
    },
    [createLayer, importImageAsLayer],
  )

  const handleLayerUpdate = useCallback(
    async (layerId: string, imageUrl: string) => {
      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const ctx = layer.canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height)
          ctx.drawImage(img, 0, 0, layer.canvas.width, layer.canvas.height)
        }
      }
      img.src = imageUrl
    },
    [layers],
  )

  const handleCreateLayerFromAI = useCallback(
    async (type: Layer["type"], name: string, imageUrl: string) => {
      const newLayer = createLayer(type, name)

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        newLayer.canvas.width = img.width
        newLayer.canvas.height = img.height
        const ctx = newLayer.canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0)
        }
      }
      img.src = imageUrl
    },
    [createLayer],
  )

  const handleZoomIn = useCallback(() => {
    setZoom([Math.min(zoom[0] + 25, 500)])
  }, [zoom])

  const handleZoomOut = useCallback(() => {
    setZoom([Math.max(zoom[0] - 25, 25)])
  }, [zoom])

  const handleZoomReset = useCallback(() => {
    setZoom([100])
  }, [])

  return (
    <TooltipProvider>
      <div
        className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
      >
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Image Editor</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Edit, enhance, and transform your images with AI-powered tools
                </p>
                {editorMetadata && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {editorMetadata.type} • {editorMetadata.originalPrompt?.slice(0, 50)}...
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setShowOnboarding(true)}>
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Show help</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</TooltipContent>
                </Tooltip>

                <Badge variant="secondary" className="px-3 py-1">
                  Beta
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
            <Card className="col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-transparent"
                        onClick={handleImportClick}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Import image or project (Ctrl+O)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-transparent"
                        onClick={handleExportClick}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export image or project (Ctrl+S)</TooltipContent>
                  </Tooltip>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <Separator />

                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleUndo}>
                        <Undo className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleRedo}>
                        <Redo className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
                  </Tooltip>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-1">
                  {tools.map((tool) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={selectedTool === tool.id ? "default" : "outline"}
                          size="sm"
                          className="aspect-square p-2"
                          onClick={() => setSelectedTool(tool.id)}
                        >
                          {tool.icon && <tool.icon className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {tool.label} ({tool.shortcut})
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Zoom</Label>
                    <div className="flex gap-1 mt-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 p-1 bg-transparent"
                            onClick={handleZoomOut}
                          >
                            <ZoomOut className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom out</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex-1 text-xs text-center py-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            onClick={handleZoomReset}
                          >
                            {zoom[0]}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Reset zoom (100%)</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 p-1 bg-transparent"
                            onClick={handleZoomIn}
                          >
                            <ZoomIn className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom in</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Button
                    variant={showDrawingTools ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setShowDrawingTools(!showDrawingTools)}
                  >
                    <Paintbrush className="w-4 h-4 mr-2" />
                    Drawing Tools
                  </Button>
                  <Button
                    variant={showAIPanel ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setShowAIPanel(!showAIPanel)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Tools
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="col-span-7">
              <Card className="h-full">
                <CardContent className="p-0 h-full">
                  <LayeredCanvas
                    image={currentImage}
                    selectedTool={selectedTool}
                    brushSize={brushSize}
                    opacity={opacity}
                    zoom={zoom[0]}
                    onLayerSystemChange={(newLayers, newActiveLayerId) => {
                      setLayers(newLayers)
                      setActiveLayerId(newActiveLayerId)
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="col-span-3 space-y-4 max-h-full overflow-y-auto">
              {showExportPanel && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Export</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowExportPanel(false)}>
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ExportPanel
                      layers={layers}
                      activeLayerId={activeLayerId}
                      onExport={(options) => handleExport(layers, activeLayerId, options)}
                      onSaveProject={saveProject}
                    />
                  </CardContent>
                </Card>
              )}

              {showImportPanel && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Import</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowImportPanel(false)}>
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ImportPanel
                      onImportImage={handleImportImage}
                      onImportProject={(projectData) => {
                        console.log("Import project:", projectData)
                        setShowImportPanel(false)
                      }}
                      onImportLayers={(layers) => {
                        console.log("Import layers:", layers)
                        setShowImportPanel(false)
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {showDrawingTools && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Drawing Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DrawingTools
                      selectedTool={selectedTool}
                      onToolChange={setSelectedTool}
                      brushSize={brushSize}
                      onBrushSizeChange={setBrushSize}
                      opacity={opacity}
                      onOpacityChange={setOpacity}
                      color={color}
                      onColorChange={setColor}
                    />
                  </CardContent>
                </Card>
              )}

              {["select", "lasso"].includes(selectedTool) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Selection Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SelectionTools selectedTool={selectedTool} onToolChange={setSelectedTool} />
                  </CardContent>
                </Card>
              )}

              {showLayers && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Layers</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowLayers(false)}>
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LayerPanel
                      layers={layers}
                      activeLayerId={activeLayerId}
                      onCreateLayer={createLayer}
                      onDeleteLayer={deleteLayer}
                      onUpdateLayer={updateLayer}
                      onSetActiveLayer={setActiveLayer}
                      onDuplicateLayer={duplicateLayer}
                      onMergeLayers={mergeLayers}
                      onReorderLayers={reorderLayers}
                    />
                  </CardContent>
                </Card>
              )}

              {showAIPanel && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">AI Editing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AIEditingPanel
                      layers={layers}
                      activeLayerId={activeLayerId}
                      onLayerUpdate={handleLayerUpdate}
                      onCreateLayer={handleCreateLayerFromAI}
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rotate Left
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Crop className="w-4 h-4 mr-2" />
                    Auto Crop
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Remove Background
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {showOnboarding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Welcome to Image Editor!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <p>Get started with these keyboard shortcuts:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">V</kbd> Select
                    </div>
                    <div>
                      <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">M</kbd> Move
                    </div>
                    <div>
                      <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">B</kbd> Brush
                    </div>
                    <div>
                      <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">E</kbd> Eraser
                    </div>
                    <div>
                      <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+Z</kbd> Undo
                    </div>
                    <div>
                      <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+S</kbd> Export
                    </div>
                  </div>
                </div>
                <Button onClick={() => setShowOnboarding(false)} className="w-full">
                  Got it!
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
