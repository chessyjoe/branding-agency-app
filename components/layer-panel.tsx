"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  GripVertical,
  Copy,
  Layers,
  ImageIcon,
  Type,
  Square,
} from "lucide-react"
import type { Layer } from "@/hooks/use-layer-system"

interface LayerPanelProps {
  layers: Layer[]
  activeLayerId: string | null
  onCreateLayer: (type: Layer["type"]) => void
  onDeleteLayer: (layerId: string) => void
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void
  onSetActiveLayer: (layerId: string) => void
  onDuplicateLayer: (layerId: string) => void
  onMergeLayers: (layerIds: string[]) => void
  onReorderLayers: (dragIndex: number, hoverIndex: number) => void
}

export function LayerPanel({
  layers,
  activeLayerId,
  onCreateLayer,
  onDeleteLayer,
  onUpdateLayer,
  onSetActiveLayer,
  onDuplicateLayer,
  onMergeLayers,
  onReorderLayers,
}: LayerPanelProps) {
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])

  const getLayerIcon = (type: Layer["type"]) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-3 h-3" />
      case "text":
        return <Type className="w-3 h-3" />
      case "shape":
        return <Square className="w-3 h-3" />
      default:
        return <Layers className="w-3 h-3" />
    }
  }

  const toggleLayerSelection = (layerId: string, isCtrlClick: boolean) => {
    if (isCtrlClick) {
      setSelectedLayers((prev) => (prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]))
    } else {
      setSelectedLayers([layerId])
      onSetActiveLayer(layerId)
    }
  }

  return (
    <div className="space-y-2">
      {/* Layer Creation Buttons */}
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant="outline"
          size="sm"
          className="justify-start bg-transparent text-xs"
          onClick={() => onCreateLayer("drawing")}
        >
          <Plus className="w-3 h-3 mr-1" />
          Drawing
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start bg-transparent text-xs"
          onClick={() => onCreateLayer("image")}
        >
          <Plus className="w-3 h-3 mr-1" />
          Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start bg-transparent text-xs"
          onClick={() => onCreateLayer("text")}
        >
          <Plus className="w-3 h-3 mr-1" />
          Text
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start bg-transparent text-xs"
          onClick={() => onCreateLayer("shape")}
        >
          <Plus className="w-3 h-3 mr-1" />
          Shape
        </Button>
      </div>

      {/* Multi-layer Operations */}
      {selectedLayers.length > 1 && (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs bg-transparent"
            onClick={() => {
              onMergeLayers(selectedLayers)
              setSelectedLayers([])
            }}
          >
            <Layers className="w-3 h-3 mr-1" />
            Merge
          </Button>
        </div>
      )}

      {/* Layers List */}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {layers
          .sort((a, b) => b.zIndex - a.zIndex) // Show top layers first
          .map((layer, index) => (
            <div
              key={layer.id}
              className={`p-2 rounded border transition-colors cursor-pointer ${
                activeLayerId === layer.id
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                  : selectedLayers.includes(layer.id)
                    ? "bg-slate-100 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
                    : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
              onClick={(e) => toggleLayerSelection(layer.id, e.ctrlKey || e.metaKey)}
            >
              {/* Layer Header */}
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="w-3 h-3 text-slate-400 cursor-move" />
                {getLayerIcon(layer.type)}
                <Input
                  value={layer.name}
                  onChange={(e) => {
                    e.stopPropagation()
                    onUpdateLayer(layer.id, { name: e.target.value })
                  }}
                  className="flex-1 h-6 text-xs border-none bg-transparent p-0 focus-visible:ring-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateLayer(layer.id, { visible: !layer.visible })
                    }}
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateLayer(layer.id, { locked: !layer.locked })
                    }}
                  >
                    {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicateLayer(layer.id)
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteLayer(layer.id)
                    }}
                    disabled={layers.length <= 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Layer Controls */}
              <div className="space-y-2">
                {/* Opacity Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-12">Opacity</span>
                  <Slider
                    value={[layer.opacity]}
                    onValueChange={(value) => onUpdateLayer(layer.id, { opacity: value[0] })}
                    max={100}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-500 w-8">{layer.opacity}%</span>
                </div>

                {/* Blend Mode */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-12">Blend</span>
                  <Select
                    value={layer.blendMode}
                    onValueChange={(value: Layer["blendMode"]) => onUpdateLayer(layer.id, { blendMode: value })}
                  >
                    <SelectTrigger className="flex-1 h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="multiply">Multiply</SelectItem>
                      <SelectItem value="screen">Screen</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="soft-light">Soft Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
      </div>

      {layers.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No layers yet</p>
          <p className="text-xs">Create a layer to start editing</p>
        </div>
      )}
    </div>
  )
}
