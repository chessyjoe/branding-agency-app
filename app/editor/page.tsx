"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
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
  Plus,
  X,
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
  const { user, loading, isConfigured } = useAuth()
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
  const [isLoadingSVG, setIsLoadingSVG] = useState(false)
  const [hasLoadedEditorData, setHasLoadedEditorData] = useState(false)

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

  // Handle authentication state
  useEffect(() => {
    if (!loading && isConfigured && !user) {
      console.log("[v0] User not authenticated, redirecting to login")
      window.location.href = "/auth/login?redirectTo=/editor"
    }
  }, [user, loading, isConfigured])

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

  // Function to load SVG content into the editor
  const loadSVGContent = useCallback(async (svgContent: string) => {
    if (isLoadingSVG) {
      console.log("[v0] SVG loading already in progress, skipping duplicate request")
      return
    }

    try {
      setIsLoadingSVG(true)
      console.log("[v0] Loading SVG content into editor...")
      
      // Create a new layer for the SVG content
      const svgLayer = createLayer("image", "SVG Content")
      if (!svgLayer) {
        console.error("[v0] Failed to create SVG layer - createLayer returned null")
        setIsLoadingSVG(false)
        return
      }

      loadSVGToCanvas(svgLayer, svgContent)
      setIsLoadingSVG(false)
    } catch (error) {
      console.error("[v0] Failed to load SVG content:", error)
      setIsLoadingSVG(false)
    }
  }, [createLayer, isLoadingSVG])

  const loadSVGToCanvas = useCallback((svgLayer: any, svgContent: string) => {
    try {
      // Create an SVG element from the content
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgContent, "image/svg+xml")
      const svgElement = svgDoc.documentElement

      // Check for parsing errors
      const parserError = svgDoc.querySelector("parsererror")
      if (parserError) {
        console.error("[v0] SVG parsing error:", parserError.textContent)
        return
      }

      // Convert SVG to canvas
      const canvas = svgLayer.canvas
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Create an image from the SVG with proper CORS handling
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })
      const svgUrl = URL.createObjectURL(svgBlob)
      
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      img.onload = () => {
        try {
          // Set canvas size to match SVG dimensions
          const svgWidth = svgElement.getAttribute("width") || "400"
          const svgHeight = svgElement.getAttribute("height") || "400"
          
          // Parse dimensions (remove 'px' if present)
          const width = parseInt(svgWidth.replace(/[^0-9.]/g, '')) || 400
          const height = parseInt(svgHeight.replace(/[^0-9.]/g, '')) || 400
          
          canvas.width = width
          canvas.height = height
          
          // Clear canvas and draw the SVG
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
          
          URL.revokeObjectURL(svgUrl)
          console.log("[v0] SVG content loaded successfully")
        } catch (drawError) {
          console.error("[v0] Failed to draw SVG to canvas:", drawError)
          URL.revokeObjectURL(svgUrl)
        }
      }
      
      img.onerror = (error) => {
        console.error("[v0] Failed to load SVG image:", error)
        URL.revokeObjectURL(svgUrl)
        
        // Fallback: try to render SVG directly to canvas
        try {
          const svgWidth = svgElement.getAttribute("width") || "400"
          const svgHeight = svgElement.getAttribute("height") || "400"
          
          const width = parseInt(svgWidth.replace(/[^0-9.]/g, '')) || 400
          const height = parseInt(svgHeight.replace(/[^0-9.]/g, '')) || 400
          
          canvas.width = width
          canvas.height = height
          
          // Set up a white background
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, width, height)
          
          // Add a placeholder message
          ctx.fillStyle = "#666666"
          ctx.font = "16px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText("SVG Content", width / 2, height / 2)
          
          console.log("[v0] SVG fallback rendering completed")
        } catch (fallbackError) {
          console.error("[v0] SVG fallback rendering failed:", fallbackError)
        }
      }
      
      img.src = svgUrl

    } catch (error) {
      console.error("[v0] Failed to load SVG to canvas:", error)
    }
  }, [])

  useEffect(() => {
    if (hasLoadedEditorData) {
      console.log("[v0] Editor data already loaded, skipping")
      return
    }

    const editorData = sessionStorage.getItem("editorImageData")
    if (editorData) {
      try {
        setHasLoadedEditorData(true)
        const data = JSON.parse(editorData)
        setCurrentImage(data.imageUrl)
        setEditorMetadata(data)
        console.log("[v0] Loaded editor data:", data)
        
        // Load SVG content if available - with a small delay to ensure layer system is ready
        let timeoutId: NodeJS.Timeout | null = null
        if (data.svgContent && !data.svgFallback) {
          console.log("[v0] SVG content available, loading into editor")
          // Use a longer delay to ensure layer system is fully ready
          timeoutId = setTimeout(() => loadSVGContent(data.svgContent), 300)
        } else if (data.svgContent && data.svgFallback) {
          console.log("[v0] SVG content available but is fallback, loading anyway")
          timeoutId = setTimeout(() => loadSVGContent(data.svgContent), 300)
        } else {
          console.log("[v0] No SVG content available, using regular image")
        }

        // Cleanup function to cancel timeout if component unmounts
        return () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to parse editor data:", error)
        setHasLoadedEditorData(false) // Reset on error so it can retry
      }
    }
  }, [loadSVGContent, hasLoadedEditorData])

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
        if (!newLayer) {
          throw new Error("Failed to create new image layer")
        }

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

      // Check if we need to use proxy for CORS
      const needsProxy =
        imageUrl.includes("bfl.ai") ||
        imageUrl.includes("delivery-") ||
        imageUrl.includes("blob.core.windows.net") ||
        imageUrl.includes("oaidalleapiprodscus.blob.core.windows.net") ||
        (imageUrl.startsWith("https://") && !imageUrl.includes(window.location.hostname))

      const finalImageUrl = needsProxy ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}` : imageUrl

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const ctx = layer.canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height)
          ctx.drawImage(img, 0, 0, layer.canvas.width, layer.canvas.height)
        }
      }
      img.onerror = (error) => {
        console.error("[v0] Failed to load image for layer update:", error)
      }
      img.src = finalImageUrl
    },
    [layers],
  )

  const handleCreateLayerFromAI = useCallback(
    async (type: Layer["type"], name: string, imageUrl: string) => {
      const newLayer = createLayer(type, name)
      if (!newLayer) {
        return
      }

      // Check if we need to use proxy for CORS
      const needsProxy =
        imageUrl.includes("bfl.ai") ||
        imageUrl.includes("delivery-") ||
        imageUrl.includes("blob.core.windows.net") ||
        imageUrl.includes("oaidalleapiprodscus.blob.core.windows.net") ||
        (imageUrl.startsWith("https://") && !imageUrl.includes(window.location.hostname))

      const finalImageUrl = needsProxy ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}` : imageUrl

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
      img.onerror = (error) => {
        console.error("[v0] Failed to load image for AI layer creation:", error)
      }
      img.src = finalImageUrl
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

  const tools = [
    { id: "select", icon: MousePointer, label: "Select", shortcut: "V" },
    { id: "move", icon: Move, label: "Move", shortcut: "M" },
    { id: "crop", icon: Crop, label: "Crop", shortcut: "C" },
    { id: "lasso", icon: MousePointer, label: "Lasso", shortcut: "L" },
  ]

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mx-auto mb-4 animate-pulse"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading Editor</h1>
          <p className="text-gray-600">Please wait while we prepare your workspace...</p>
        </div>
      </div>
    )
  }

  // Show authentication required message if not configured
  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Supabase to get started</h1>
          <p className="text-gray-600 mb-6">
            Please configure your Supabase integration to enable authentication and access the editor.
          </p>
          <Button 
            onClick={() => window.location.href = "/"}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  // Show authentication required message if user is not logged in
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access the editor. Please sign in to continue.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = "/auth/login?redirectTo=/editor"}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => window.location.href = "/auth/sign-up?redirectTo=/editor"}
              variant="outline"
              className="w-full"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-screen bg-gray-900 text-gray-100 ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
        {/* Top Toolbar */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg">AI Image Editor</span>
            {editorMetadata && (
              <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                {editorMetadata.type} • {editorMetadata.originalPrompt?.slice(0, 30)}...
              </Badge>
            )}
            {user && (
              <Badge variant="default" className="text-xs bg-green-900 text-green-300 border-green-700">
                ✓ {user.email}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleImportClick}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 border-0"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import image or project (Ctrl+O)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleExportClick}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 border-0"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export image or project (Ctrl+S)</TooltipContent>
            </Tooltip>

            <Button variant="ghost" size="sm" onClick={handleUndo} className="p-2 hover:bg-gray-800">
              <Undo className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleRedo} className="p-2 hover:bg-gray-800">
              <Redo className="w-4 h-4" />
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white border-0"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI Tools
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-gray-800"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowOnboarding(true)}
                  className="p-2 hover:bg-gray-800"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show help</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Layers */}
          <aside className="w-56 bg-gray-950 border-r border-gray-800 p-3 overflow-y-auto">
            <h2 className="text-sm font-semibold mb-3 text-gray-200">Layers</h2>
            <div className="space-y-2">
              {layers.length === 0 ? (
                <div className="text-gray-500 text-xs">No layers yet</div>
              ) : (
                layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      activeLayerId === layer.id 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    }`}
                    onClick={() => setActiveLayer(layer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{layer.name}</span>
                      <div className="flex items-center gap-1">
                        {layer.visible !== false && (
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createLayer("image", "New Layer")}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Layer
              </Button>
            </div>

            {/* Tools Panel */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-3 text-gray-200">Tools</h2>
              <div className="grid grid-cols-2 gap-1">
                {tools.map((tool) => (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedTool === tool.id ? "default" : "ghost"}
                        size="sm"
                        className={`aspect-square p-2 ${
                          selectedTool === tool.id 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        }`}
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
            </div>

            {/* Zoom Controls */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-3 text-gray-200">Zoom</h2>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 p-1 bg-gray-800 hover:bg-gray-700 text-gray-300"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom out</TooltipContent>
                </Tooltip>

                <div
                  className="flex-1 text-xs text-center py-1 cursor-pointer hover:bg-gray-800 rounded text-gray-300"
                  onClick={handleZoomReset}
                >
                  {zoom[0]}%
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 p-1 bg-gray-800 hover:bg-gray-700 text-gray-300"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom in</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </aside>

          {/* Main Canvas */}
          <main className="flex-1 flex items-center justify-center bg-gray-900 relative">
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
          </main>

          {/* Right Sidebar - Tools & Panels */}
          <aside className="w-64 bg-gray-950 border-l border-gray-800 p-3 overflow-y-auto">
            {/* AI Tools Section */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-3 text-gray-200">AI Tools</h2>
              <div className="space-y-2">
                <Button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Remove Background
                </Button>
                <Button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upscale Image
                </Button>
                <Button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Style Transfer
                </Button>
                <Button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Face Retouch
                </Button>
              </div>
            </div>

            {/* Drawing Tools */}
            {showDrawingTools && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold mb-3 text-gray-200">Drawing Tools</h2>
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
              </div>
            )}

            {/* Selection Tools */}
            {["select", "lasso"].includes(selectedTool) && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold mb-3 text-gray-200">Selection Tools</h2>
                <SelectionTools selectedTool={selectedTool} onToolChange={setSelectedTool} />
              </div>
            )}

            {/* AI Prompt Section */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-3 text-gray-200">AI Prompt</h2>
              <textarea 
                placeholder="Describe your edit..." 
                className="w-full p-2 bg-gray-800 rounded text-sm mb-2 text-gray-200 placeholder-gray-400 border-gray-700"
                rows={3}
              />
              <Button className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white">
                Apply AI Edit
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-3 text-gray-200">Quick Actions</h2>
              <div className="space-y-2">
                <Button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 justify-start">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rotate Left
                </Button>
                <Button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 justify-start">
                  <Crop className="w-4 h-4 mr-2" />
                  Auto Crop
                </Button>
                <Button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Remove Background
                </Button>
              </div>
            </div>

            {/* Conditional Panels */}
            {showExportPanel && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-200">Export</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowExportPanel(false)}
                    className="p-1 hover:bg-gray-800 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <ExportPanel
                  layers={layers}
                  activeLayerId={activeLayerId}
                  onExport={(options) => handleExport(layers, activeLayerId, options)}
                  onSaveProject={saveProject}
                />
              </div>
            )}

            {showImportPanel && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-200">Import</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowImportPanel(false)}
                    className="p-1 hover:bg-gray-800 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
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
              </div>
            )}

            {showAIPanel && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold mb-3 text-gray-200">AI Editing</h2>
                <AIEditingPanel
                  layers={layers}
                  activeLayerId={activeLayerId}
                  onLayerUpdate={handleLayerUpdate}
                  onCreateLayer={handleCreateLayerFromAI}
                />
              </div>
            )}
          </aside>
        </div>

        {/* Bottom History Bar */}
        <footer className="flex items-center gap-2 px-4 py-2 border-t border-gray-800 bg-gray-950 overflow-x-auto">
          <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">Original</div>
          <div className="px-2 py-1 bg-purple-600 rounded text-xs text-white">AI Edit 1</div>
          <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">AI Edit 2</div>
        </footer>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="editor-file-input"
          name="editor-file-input"
          aria-label="Import image file"
        />
      </div>

      {showOnboarding && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="max-w-md bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Welcome to AI Image Editor!</h2>
              <p className="text-sm text-gray-400">Get started with these keyboard shortcuts:</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">V</kbd>
                  <span className="text-gray-300">Select</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">M</kbd>
                  <span className="text-gray-300">Move</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">B</kbd>
                  <span className="text-gray-300">Brush</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">E</kbd>
                  <span className="text-gray-300">Eraser</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">Ctrl+Z</kbd>
                  <span className="text-gray-300">Undo</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">Ctrl+S</kbd>
                  <span className="text-gray-300">Export</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowOnboarding(false)} 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}
