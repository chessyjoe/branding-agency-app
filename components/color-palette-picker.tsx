"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, Palette } from "lucide-react"

interface ColorPalettePickerProps {
  colors: string[]
  onColorsChange: (colors: string[]) => void
  maxColors?: number
}

const presetPalettes = [
  { name: "Ocean Blue", colors: ["#2563eb", "#1e40af", "#1e3a8a"] },
  { name: "Forest Green", colors: ["#059669", "#047857", "#065f46"] },
  { name: "Sunset Orange", colors: ["#ea580c", "#dc2626", "#b91c1c"] },
  { name: "Purple Gradient", colors: ["#7c3aed", "#6d28d9", "#5b21b6"] },
  { name: "Pink Blush", colors: ["#ec4899", "#db2777", "#be185d"] },
  { name: "Teal Fresh", colors: ["#0d9488", "#0f766e", "#134e4a"] },
]

export function ColorPalettePicker({ colors, onColorsChange, maxColors = 5 }: ColorPalettePickerProps) {
  const [newColor, setNewColor] = useState("#000000")

  const addColor = () => {
    if (colors.length < maxColors && !colors.includes(newColor)) {
      onColorsChange([...colors, newColor])
    }
  }

  const removeColor = (index: number) => {
    onColorsChange(colors.filter((_, i) => i !== index))
  }

  const updateColor = (index: number, color: string) => {
    const updatedColors = [...colors]
    updatedColors[index] = color
    onColorsChange(updatedColors)
  }

  const applyPreset = (presetColors: string[]) => {
    onColorsChange(presetColors.slice(0, maxColors))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Brand Colors
        </CardTitle>
        <CardDescription>Choose colors that represent your brand</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Colors */}
        <div>
          <Label>Current Colors</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {colors.map((color, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="relative">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="w-10 h-10 rounded-md border-2 border-gray-200 cursor-pointer"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeColor(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Color */}
        {colors.length < maxColors && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="newColor">Add Color</Label>
              <div className="flex gap-2 mt-1">
                <input
                  id="newColor"
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-10 rounded-md border-2 border-gray-200 cursor-pointer"
                />
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <Button onClick={addColor} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        )}

        {/* Preset Palettes */}
        <div>
          <Label>Preset Palettes</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {presetPalettes.map((palette) => (
              <Button
                key={palette.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(palette.colors)}
                className="justify-start h-auto p-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {palette.colors.slice(0, 3).map((color, index) => (
                      <div key={index} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span className="text-xs">{palette.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
