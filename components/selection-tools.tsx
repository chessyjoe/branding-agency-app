"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { MousePointer, Square, Wand2, Scissors, Copy, Trash2 } from "lucide-react"

interface SelectionToolsProps {
  onToolChange: (tool: string) => void
  selectedTool: string
}

export function SelectionTools({ onToolChange, selectedTool }: SelectionToolsProps) {
  const [featherRadius, setFeatherRadius] = useState([0])
  const [tolerance, setTolerance] = useState([32])

  const selectionTools = [
    { id: "select", icon: Square, label: "Rectangle Select" },
    { id: "lasso", icon: MousePointer, label: "Lasso Select" },
    { id: "magic-wand", icon: Wand2, label: "Magic Wand" },
  ]

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Selection Tools</Label>
        <div className="grid grid-cols-3 gap-1">
          {selectionTools.map((tool) => (
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

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Feather Radius</Label>
          <Slider value={featherRadius} onValueChange={setFeatherRadius} max={50} min={0} step={1} className="mt-1" />
          <div className="text-xs text-slate-500 mt-1">{featherRadius[0]}px</div>
        </div>

        {selectedTool === "magic-wand" && (
          <div>
            <Label className="text-xs">Tolerance</Label>
            <Slider value={tolerance} onValueChange={setTolerance} max={255} min={0} step={1} className="mt-1" />
            <div className="text-xs text-slate-500 mt-1">{tolerance[0]}</div>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Selection Actions</Label>
        <div className="grid grid-cols-2 gap-1">
          <Button variant="outline" size="sm" className="bg-transparent">
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent">
            <Scissors className="w-3 h-3 mr-1" />
            Cut
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent">
            <Wand2 className="w-3 h-3 mr-1" />
            Invert
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent text-red-500">
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SelectionTools
