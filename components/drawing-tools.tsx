"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Paintbrush,
  Eraser,
  PenTool,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  Droplets,
  Palette,
  Copy,
  Sparkles,
} from "lucide-react"

interface DrawingToolsProps {
  selectedTool: string
  onToolChange: (tool: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  opacity: number
  onOpacityChange: (opacity: number) => void
  color: string
  onColorChange: (color: string) => void
}

const colorPresets = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#800000",
  "#008000",
  "#000080",
  "#808000",
  "#800080",
  "#008080",
  "#C0C0C0",
  "#808080",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
]

export function DrawingTools({
  selectedTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  opacity,
  onOpacityChange,
  color,
  onColorChange,
}: DrawingToolsProps) {
  const [customColor, setCustomColor] = useState(color)
  const [brushHardness, setBrushHardness] = useState([100])
  const [shapeStroke, setShapeStroke] = useState([2])
  const [shapeFill, setShapeFill] = useState(true)

  const drawingTools = [
    { id: "brush", icon: Paintbrush, label: "Brush" },
    { id: "pen", icon: PenTool, label: "Pen Tool" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "clone", icon: Copy, label: "Clone Tool" },
    { id: "healing", icon: Sparkles, label: "Healing Brush" },
    { id: "paint-bucket", icon: Droplets, label: "Paint Bucket" },
  ]

  const shapeTools = [
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "triangle", icon: Triangle, label: "Triangle" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "arrow", icon: ArrowRight, label: "Arrow" },
  ]

  const handleColorPresetClick = useCallback(
    (presetColor: string) => {
      onColorChange(presetColor)
      setCustomColor(presetColor)
    },
    [onColorChange],
  )

  const handleCustomColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value
      setCustomColor(newColor)
      onColorChange(newColor)
    },
    [onColorChange],
  )

  const isShapeTool = shapeTools.some((tool) => tool.id === selectedTool)
  const isDrawingTool = drawingTools.some((tool) => tool.id === selectedTool)

  return (
    <div className="space-y-4">
      {/* Color Picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Color</Label>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-12 h-8 p-0 border-2 bg-transparent"
                style={{ backgroundColor: color }}
                title="Current Color"
              >
                <Palette className="w-4 h-4 text-white mix-blend-difference" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Custom Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={customColor}
                      onChange={handleCustomColorChange}
                      className="w-12 h-8 p-0 border rounded"
                    />
                    <Input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value)
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          onColorChange(e.target.value)
                        }
                      }}
                      className="flex-1 h-8 text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Color Presets</Label>
                  <div className="grid grid-cols-8 gap-1 mt-1">
                    {colorPresets.map((presetColor) => (
                      <button
                        key={presetColor}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: presetColor }}
                        onClick={() => handleColorPresetClick(presetColor)}
                        title={presetColor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="text-xs text-slate-500">{color}</div>
        </div>
      </div>

      <Separator />

      {/* Drawing Tools */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Drawing Tools</Label>
        <div className="grid grid-cols-3 gap-1">
          {drawingTools.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? "default" : "outline"}
              size="sm"
              className="aspect-square p-2"
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Shape Tools */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Shape Tools</Label>
        <div className="grid grid-cols-3 gap-1">
          {shapeTools.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? "default" : "outline"}
              size="sm"
              className="aspect-square p-2"
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Tool Settings */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Tool Settings</Label>

        {/* Brush Size */}
        <div>
          <Label className="text-xs">Size</Label>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            max={isShapeTool ? 20 : 100}
            min={1}
            step={1}
            className="mt-1"
          />
          <div className="text-xs text-slate-500 mt-1">{brushSize}px</div>
        </div>

        {/* Opacity */}
        <div>
          <Label className="text-xs">Opacity</Label>
          <Slider
            value={[opacity]}
            onValueChange={(value) => onOpacityChange(value[0])}
            max={100}
            min={1}
            step={1}
            className="mt-1"
          />
          <div className="text-xs text-slate-500 mt-1">{opacity}%</div>
        </div>

        {/* Brush-specific settings */}
        {(selectedTool === "brush" || selectedTool === "pen") && (
          <div>
            <Label className="text-xs">Hardness</Label>
            <Slider
              value={brushHardness}
              onValueChange={setBrushHardness}
              max={100}
              min={0}
              step={1}
              className="mt-1"
            />
            <div className="text-xs text-slate-500 mt-1">{brushHardness[0]}%</div>
          </div>
        )}

        {/* Shape-specific settings */}
        {isShapeTool && (
          <>
            <div>
              <Label className="text-xs">Stroke Width</Label>
              <Slider value={shapeStroke} onValueChange={setShapeStroke} max={20} min={0} step={1} className="mt-1" />
              <div className="text-xs text-slate-500 mt-1">{shapeStroke[0]}px</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shape-fill"
                checked={shapeFill}
                onChange={(e) => setShapeFill(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="shape-fill" className="text-xs">
                Fill Shape
              </Label>
            </div>
          </>
        )}

        {/* Clone tool settings */}
        {selectedTool === "clone" && (
          <div className="text-xs text-slate-500 p-2 bg-slate-50 dark:bg-slate-800 rounded">
            Hold Alt and click to set source point, then paint to clone from that area.
          </div>
        )}

        {/* Healing brush settings */}
        {selectedTool === "healing" && (
          <div className="text-xs text-slate-500 p-2 bg-slate-50 dark:bg-slate-800 rounded">
            Paint over imperfections to automatically blend and heal the area.
          </div>
        )}

        {/* Paint bucket settings */}
        {selectedTool === "paint-bucket" && (
          <div>
            <Label className="text-xs">Tolerance</Label>
            <Slider value={[32]} onValueChange={() => {}} max={255} min={0} step={1} className="mt-1" />
            <div className="text-xs text-slate-500 mt-1">32</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DrawingTools
