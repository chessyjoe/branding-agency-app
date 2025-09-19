"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, MessageSquare } from 'lucide-react'
import { useState } from "react"

interface BrandVoice {
  personality: {
    professional: number
    friendly: number
    innovative: number
    trustworthy: number
    playful: number
  }
  tone: string[]
  targetAudience: string
  brandValues: string
}

interface BrandVoiceSelectorProps {
  brandVoice: BrandVoice
  onBrandVoiceChange: (brandVoice: BrandVoice) => void
}

const toneOptions = [
  'Professional', 'Friendly', 'Confident', 'Approachable', 'Authoritative',
  'Casual', 'Formal', 'Enthusiastic', 'Calm', 'Bold', 'Sophisticated',
  'Playful', 'Trustworthy', 'Innovative', 'Traditional', 'Modern'
]

export function BrandVoiceSelector({ brandVoice, onBrandVoiceChange }: BrandVoiceSelectorProps) {
  const [newTone, setNewTone] = useState("")

  const updatePersonality = (trait: keyof BrandVoice['personality'], value: number[]) => {
    onBrandVoiceChange({
      ...brandVoice,
      personality: {
        ...brandVoice.personality,
        [trait]: value[0]
      }
    })
  }

  const addTone = (tone: string) => {
    if (!brandVoice.tone.includes(tone) && brandVoice.tone.length < 5) {
      onBrandVoiceChange({
        ...brandVoice,
        tone: [...brandVoice.tone, tone]
      })
    }
  }

  const removeTone = (tone: string) => {
    onBrandVoiceChange({
      ...brandVoice,
      tone: brandVoice.tone.filter(t => t !== tone)
    })
  }

  const addCustomTone = () => {
    if (newTone.trim() && !brandVoice.tone.includes(newTone.trim()) && brandVoice.tone.length < 5) {
      addTone(newTone.trim())
      setNewTone("")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Brand Voice & Personality
        </CardTitle>
        <CardDescription>
          Define your brand's personality and communication style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personality Traits */}
        <div>
          <Label className="text-base font-medium">Personality Traits</Label>
          <div className="space-y-4 mt-3">
            {Object.entries(brandVoice.personality).map(([trait, value]) => (
              <div key={trait} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="capitalize">{trait}</Label>
                  <span className="text-sm text-gray-600">{value}/10</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={(newValue) => updatePersonality(trait as keyof BrandVoice['personality'], newValue)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <Label className="text-base font-medium">Brand Tone</Label>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {brandVoice.tone.map((tone) => (
                <Badge key={tone} variant="default" className="flex items-center gap-1">
                  {tone}
                  <Button
                    onClick={() => removeTone(tone)}
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            
            {brandVoice.tone.length < 5 && (
              <>
                <div className="flex flex-wrap gap-2">
                  {toneOptions
                    .filter(tone => !brandVoice.tone.includes(tone))
                    .map((tone) => (
                      <Button
                        key={tone}
                        onClick={() => addTone(tone)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        + {tone}
                      </Button>
                    ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tone..."
                    value={newTone}
                    onChange={(e) => setNewTone(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTone()}
                    className="flex-1"
                  />
                  <Button onClick={addCustomTone} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <Label htmlFor="targetAudience" className="text-base font-medium">Target Audience</Label>
          <Input
            id="targetAudience"
            placeholder="e.g., Young professionals, Small business owners, Tech enthusiasts"
            value={brandVoice.targetAudience}
            onChange={(e) => onBrandVoiceChange({
              ...brandVoice,
              targetAudience: e.target.value
            })}
            className="mt-2"
          />
        </div>

        {/* Brand Values */}
        <div>
          <Label htmlFor="brandValues" className="text-base font-medium">Brand Values</Label>
          <Textarea
            id="brandValues"
            placeholder="Describe your core brand values and what you stand for..."
            value={brandVoice.brandValues}
            onChange={(e) => onBrandVoiceChange({
              ...brandVoice,
              brandValues: e.target.value
            })}
            className="mt-2 min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  )
}
