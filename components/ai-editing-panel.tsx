"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Wand2, Scissors, Palette, Zap, Upload, ImageIcon, Layers } from "lucide-react"
import type { Layer } from "@/hooks/use-layer-system"

interface AIEditingPanelProps {
  layers?: Layer[]
  activeLayerId?: string | null
  onLayerUpdate?: (layerId: string, imageUrl: string) => void
  onCreateLayer?: (type: Layer["type"], name: string, imageUrl: string) => void
}

export function AIEditingPanel({ layers = [], activeLayerId, onLayerUpdate, onCreateLayer }: AIEditingPanelProps) {
  const [prompt, setPrompt] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<"full" | "selection" | "layer">("layer")
  const [enhancementType, setEnhancementType] = useState("quality")
  const [styleStrength, setStyleStrength] = useState([0.7])
  const [aiModel, setAIModel] = useState("dall-e-2")
  const [outputMode, setOutputMode] = useState<"replace" | "new-layer">("new-layer")

  const getActiveLayerCanvas = useCallback(() => {
    if (!activeLayerId || !layers.length) return null
    const activeLayer = layers.find((l) => l.id === activeLayerId)
    return activeLayer?.canvas || null
  }, [activeLayerId, layers])

  const canvasToBlob = useCallback((canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob())
      }, "image/png")
    })
  }, [])

  const createMask = useCallback(
    async (canvas: HTMLCanvasElement): Promise<Blob> => {
      const maskCanvas = document.createElement("canvas")
      maskCanvas.width = canvas.width
      maskCanvas.height = canvas.height
      const ctx = maskCanvas.getContext("2d")

      if (ctx) {
        // Create a simple mask - white where we want to edit, black where we don't
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      return canvasToBlob(maskCanvas)
    },
    [canvasToBlob],
  )

  const handleInpaint = async () => {
    if (!prompt.trim()) return

    const activeCanvas = getActiveLayerCanvas()
    if (!activeCanvas) {
      console.error("No active layer canvas found")
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingStep("Preparing image data...")

    try {
      setProcessingProgress(20)
      const imageBlob = await canvasToBlob(activeCanvas)
      const maskBlob = await createMask(activeCanvas)

      setProcessingStep("Sending to AI service...")
      setProcessingProgress(40)

      const formData = new FormData()
      formData.append("image", imageBlob, "image.png")
      formData.append("mask", maskBlob, "mask.png")
      formData.append("prompt", prompt)
      formData.append("model", aiModel)

      const response = await fetch("/api/ai-inpaint", {
        method: "POST",
        body: formData,
      })

      setProcessingStep("Processing AI response...")
      setProcessingProgress(80)

      const result = await response.json()

      if (result.success) {
        setProcessingStep("Applying changes...")
        setProcessingProgress(100)

        if (outputMode === "new-layer" && onCreateLayer) {
          onCreateLayer("image", `AI Edit: ${prompt.slice(0, 20)}...`, result.imageUrl)
        } else if (outputMode === "replace" && onLayerUpdate && activeLayerId) {
          onLayerUpdate(activeLayerId, result.imageUrl)
        }

        console.log("[v0] AI inpainting completed:", result.imageUrl)
      } else {
        console.error("[v0] AI inpainting failed:", result.error)
      }
    } catch (error) {
      console.error("[v0] AI inpainting error:", error)
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
      setProcessingStep("")
    }
  }

  const handleRemoveBackground = async () => {
    const activeCanvas = getActiveLayerCanvas()
    if (!activeCanvas) return

    setIsProcessing(true)
    setProcessingStep("Removing background...")

    try {
      const imageBlob = await canvasToBlob(activeCanvas)
      const formData = new FormData()
      formData.append("image", imageBlob, "image.png")
      formData.append("userId", "demo-user")
      formData.append("method", "ai")

      const response = await fetch("/api/remove-background", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        if (outputMode === "new-layer" && onCreateLayer) {
          onCreateLayer("image", "Background Removed", result.imageUrl)
        } else if (outputMode === "replace" && onLayerUpdate && activeLayerId) {
          onLayerUpdate(activeLayerId, result.imageUrl)
        }
      }
    } catch (error) {
      console.error("[v0] Background removal error:", error)
    } finally {
      setIsProcessing(false)
      setProcessingStep("")
    }
  }

  const handleEnhance = async () => {
    const activeCanvas = getActiveLayerCanvas()
    if (!activeCanvas) return

    setIsProcessing(true)
    setProcessingStep(`Enhancing image (${enhancementType})...`)

    try {
      const imageBlob = await canvasToBlob(activeCanvas)
      const formData = new FormData()
      formData.append("image", imageBlob, "image.png")
      formData.append("userId", "demo-user")
      formData.append("type", enhancementType)

      const response = await fetch("/api/enhance-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        if (outputMode === "new-layer" && onCreateLayer) {
          onCreateLayer("image", `Enhanced (${enhancementType})`, result.imageUrl)
        } else if (outputMode === "replace" && onLayerUpdate && activeLayerId) {
          onLayerUpdate(activeLayerId, result.imageUrl)
        }
      }
    } catch (error) {
      console.error("[v0] Image enhancement error:", error)
    } finally {
      setIsProcessing(false)
      setProcessingStep("")
    }
  }

  return (
    <div className="space-y-4">
      {/* Processing Status */}
      {isProcessing && (
        <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {processingStep || "Processing..."}
            </span>
          </div>
          {processingProgress > 0 && <Progress value={processingProgress} className="h-2" />}
        </div>
      )}

      {/* Output Mode Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Output Mode</Label>
        <div className="flex gap-2">
          <Button
            variant={outputMode === "new-layer" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setOutputMode("new-layer")}
          >
            <Layers className="w-3 h-3 mr-1" />
            New Layer
          </Button>
          <Button
            variant={outputMode === "replace" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setOutputMode("replace")}
          >
            <ImageIcon className="w-3 h-3 mr-1" />
            Replace
          </Button>
        </div>
      </div>

      <Separator />

      {/* AI Model Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">AI Model</Label>
        <Select value={aiModel} onValueChange={setAIModel}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
            <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* AI Inpainting */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">AI Inpainting</Label>
        <Textarea
          placeholder="Describe what you want to add or change in the selected area..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[80px] text-sm"
        />

        <Button
          onClick={handleInpaint}
          disabled={!prompt.trim() || isProcessing || !activeLayerId}
          className="w-full"
          size="sm"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Apply AI Edit
        </Button>
      </div>

      <Separator />

      {/* Quick AI Actions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Quick AI Actions</Label>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start bg-transparent"
          onClick={handleRemoveBackground}
          disabled={isProcessing || !activeLayerId}
        >
          <Scissors className="w-4 h-4 mr-2" />
          Remove Background
        </Button>

        <div className="space-y-2">
          <div className="flex gap-1">
            {["quality", "upscale", "colorize"].map((type) => (
              <Button
                key={type}
                variant={enhancementType === type ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setEnhancementType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start bg-transparent"
            onClick={handleEnhance}
            disabled={isProcessing || !activeLayerId}
          >
            <Zap className="w-4 h-4 mr-2" />
            Enhance Quality
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start bg-transparent"
          disabled={isProcessing || !activeLayerId}
        >
          <Palette className="w-4 h-4 mr-2" />
          Auto Color Correct
        </Button>
      </div>

      <Separator />

      {/* Style Transfer */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Style Transfer</Label>
        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" disabled={isProcessing}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Style Image
        </Button>

        <div>
          <Label className="text-xs">Style Strength</Label>
          <Slider
            value={styleStrength}
            onValueChange={setStyleStrength}
            max={1}
            min={0.1}
            step={0.1}
            className="mt-1"
          />
          <div className="text-xs text-slate-500 mt-1">{Math.round(styleStrength[0] * 100)}%</div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start bg-transparent"
          disabled={isProcessing || !activeLayerId}
        >
          <Palette className="w-4 h-4 mr-2" />
          Apply Style Transfer
        </Button>

        <p className="text-xs text-slate-500">Upload a reference image to transfer its style to your image</p>
      </div>

      {/* Layer Status */}
      {!activeLayerId && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">Select a layer to enable AI editing features</p>
        </div>
      )}
    </div>
  )
}

export default AIEditingPanel
