"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Settings } from 'lucide-react'

interface AdvancedOptions {
  aspectRatio?: string
  style?: string[]
  quality?: number
  creativity?: number
  iterations?: number
  seed?: number
  negativePrompt?: string
  enhancePrompt?: boolean
  highResolution?: boolean
  customDimensions?: { width: number; height: number }
}

interface AdvancedOptionsProps {
  options: AdvancedOptions
  onOptionsChange: (options: AdvancedOptions) => void
  type: 'logo' | 'banner' | 'poster' | 'business-card' | 'slogan' | 'website' | 'video' | 'code'
}

const aspectRatios = {
  logo: ['1:1', '16:9', '4:3', '3:2'],
  banner: ['16:9', '21:9', '3:1', '4:1'],
  poster: ['2:3', '3:4', '4:5', '11:17'],
  'business-card': ['3.5:2', '85:55', '90:50'],
  slogan: [],
  website: ['16:9', '4:3'],
  video: ['16:9', '9:16', '1:1', '4:5'],
  code: []
}

const styleOptions = {
  logo: ['Minimalist', 'Modern', 'Classic', 'Bold', 'Elegant', 'Playful', 'Corporate', 'Creative'],
  banner: ['Modern', 'Bold', 'Elegant', 'Minimalist', 'Vibrant', 'Professional', 'Creative', 'Clean'],
  poster: ['Vintage', 'Modern', 'Bold', 'Artistic', 'Minimalist', 'Colorful', 'Typography-focused'],
  'business-card': ['Professional', 'Modern', 'Elegant', 'Minimalist', 'Creative', 'Bold', 'Classic'],
  slogan: ['Catchy', 'Professional', 'Creative', 'Memorable', 'Bold', 'Friendly'],
  website: ['Modern', 'Minimalist', 'Professional', 'Creative', 'Bold', 'Clean'],
  video: ['Cinematic', 'Modern', 'Dynamic', 'Professional', 'Creative', 'Energetic'],
  code: ['Clean', 'Modern', 'Professional', 'Efficient', 'Readable']
}

export function AdvancedOptions({ options, onOptionsChange, type }: AdvancedOptionsProps) {
  const updateOption = (key: keyof AdvancedOptions, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value
    })
  }

  const addStyle = (style: string) => {
    const currentStyles = options.style || []
    if (!currentStyles.includes(style) && currentStyles.length < 3) {
      updateOption('style', [...currentStyles, style])
    }
  }

  const removeStyle = (style: string) => {
    const currentStyles = options.style || []
    updateOption('style', currentStyles.filter(s => s !== style))
  }

  const availableRatios = aspectRatios[type] || []
  const availableStyles = styleOptions[type] || []

  return (
    <div className="space-y-6">
      {/* Aspect Ratio */}
      {availableRatios.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Aspect Ratio</Label>
          <Select value={options.aspectRatio} onValueChange={(value) => updateOption('aspectRatio', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              {availableRatios.map((ratio) => (
                <SelectItem key={ratio} value={ratio}>
                  {ratio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Style Selection */}
      {availableStyles.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Style</Label>
          <div className="mt-2 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(options.style || []).map((style) => (
                <Badge key={style} variant="default" className="flex items-center gap-1">
                  {style}
                  <Button
                    onClick={() => removeStyle(style)}
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            
            {(options.style || []).length < 3 && (
              <div className="flex flex-wrap gap-2">
                {availableStyles
                  .filter(style => !(options.style || []).includes(style))
                  .map((style) => (
                    <Button
                      key={style}
                      onClick={() => addStyle(style)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      + {style}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quality */}
      {type !== 'slogan' && type !== 'code' && (
        <div>
          <div className="flex justify-between">
            <Label className="text-sm font-medium">Quality</Label>
            <span className="text-sm text-gray-600">{options.quality || 8}/10</span>
          </div>
          <Slider
            value={[options.quality || 8]}
            onValueChange={(value) => updateOption('quality', value[0])}
            max={10}
            min={1}
            step={1}
            className="mt-2"
          />
        </div>
      )}

      {/* Creativity */}
      <div>
        <div className="flex justify-between">
          <Label className="text-sm font-medium">Creativity</Label>
          <span className="text-sm text-gray-600">{options.creativity || 6}/10</span>
        </div>
        <Slider
          value={[options.creativity || 6]}
          onValueChange={(value) => updateOption('creativity', value[0])}
          max={10}
          min={1}
          step={1}
          className="mt-2"
        />
      </div>

      {/* Iterations */}
      <div>
        <Label className="text-sm font-medium">Iterations</Label>
        <Select value={String(options.iterations || 1)} onValueChange={(value) => updateOption('iterations', parseInt(value))}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 iteration</SelectItem>
            <SelectItem value="2">2 iterations</SelectItem>
            <SelectItem value="3">3 iterations</SelectItem>
            <SelectItem value="4">4 iterations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Seed */}
      <div>
        <Label htmlFor="seed" className="text-sm font-medium">Seed (optional)</Label>
        <Input
          id="seed"
          type="number"
          placeholder="Random seed for reproducible results"
          value={options.seed || ''}
          onChange={(e) => updateOption('seed', e.target.value ? parseInt(e.target.value) : undefined)}
          className="mt-2"
        />
      </div>

      {/* Negative Prompt */}
      {type !== 'slogan' && type !== 'code' && (
        <div>
          <Label htmlFor="negativePrompt" className="text-sm font-medium">Negative Prompt</Label>
          <Textarea
            id="negativePrompt"
            placeholder="What to avoid in the generation..."
            value={options.negativePrompt || ''}
            onChange={(e) => updateOption('negativePrompt', e.target.value)}
            className="mt-2 min-h-[60px]"
          />
        </div>
      )}

      {/* Switches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enhancePrompt" className="text-sm font-medium">Enhance Prompt</Label>
          <Switch
            id="enhancePrompt"
            checked={options.enhancePrompt !== false}
            onCheckedChange={(checked) => updateOption('enhancePrompt', checked)}
          />
        </div>

        {type !== 'slogan' && type !== 'code' && (
          <div className="flex items-center justify-between">
            <Label htmlFor="highResolution" className="text-sm font-medium">High Resolution</Label>
            <Switch
              id="highResolution"
              checked={options.highResolution !== false}
              onCheckedChange={(checked) => updateOption('highResolution', checked)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
