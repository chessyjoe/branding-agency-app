"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BrandVoiceSelector } from "@/components/brand-voice-selector"
import { AdvancedOptions } from "@/components/advanced-options"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sparkles, Download, Copy, Check, ChevronDown, Calendar, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SloganPage() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [slogans, setSlogans] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false)
  const [eventDetails, setEventDetails] = useState({
    title: "",
    tagline: "",
    date: "",
    time: "",
    location: "",
    price: "",
    highlights: [""],
    ctaText: "",
    ctaStyle: "primary",
    phone: "",
    email: "",
    website: "",
    social: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
    },
  })

  const [brandVoice, setBrandVoice] = useState({
    personality: {
      professional: 7,
      friendly: 5,
      innovative: 8,
      trustworthy: 9,
      playful: 3,
    },
    tone: ["Confident", "Professional"],
    targetAudience: "",
    brandValues: "",
  })

  const [advancedOptions, setAdvancedOptions] = useState({
    creativity: 8,
    iterations: 1,
    enhancePrompt: true,
  })

  const [brandVoiceOpen, setBrandVoiceOpen] = useState(false)
  const [generationOptionsOpen, setGenerationOptionsOpen] = useState(false)

  const addHighlight = () => {
    setEventDetails({
      ...eventDetails,
      highlights: [...eventDetails.highlights, ""],
    })
  }

  const removeHighlight = (index: number) => {
    setEventDetails({
      ...eventDetails,
      highlights: eventDetails.highlights.filter((_, i) => i !== index),
    })
  }

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...eventDetails.highlights]
    newHighlights[index] = value
    setEventDetails({
      ...eventDetails,
      highlights: newHighlights,
    })
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setSlogans([])

    try {
      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("userId", "demo-user")
      formData.append("brandVoice", JSON.stringify(brandVoice))
      formData.append("advancedOptions", JSON.stringify(advancedOptions))
      formData.append("eventDetails", JSON.stringify(eventDetails))

      const response = await fetch("/api/generate-slogan", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate slogans")
      }

      if (data.success && data.slogans) {
        setSlogans(data.slogans)
      } else {
        throw new Error("No slogans generated")
      }
    } catch (error) {
      console.error("Error generating slogans:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async (slogan: string, index: number) => {
    try {
      await navigator.clipboard.writeText(slogan)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleDownload = () => {
    if (slogans.length === 0) return

    const content = `Generated Slogans\n\nPrompt: ${prompt}\n\nSlogans:\n${slogans.map((slogan, index) => `${index + 1}. ${slogan}`).join("\n")}\n\nGenerated on: ${new Date().toLocaleString()}`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `slogans-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-10 w-10 text-blue-600" />
              AI Slogan Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create memorable slogans and taglines for your brand with AI-powered creativity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Describe Your Brand</CardTitle>
                  <CardDescription>Tell us about your business, product, or service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">What do you need a slogan for?</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., A sustainable coffee shop that sources beans directly from farmers, focusing on environmental responsibility and community connection"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="mt-2 min-h-[120px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Collapsible open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
                <Card>
                  <CardHeader>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          <CardTitle>Event Details</CardTitle>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${isEventDetailsOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CardDescription>Add event information to create event-specific slogans</CardDescription>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Basic Info</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="eventTitle">Event Title</Label>
                            <Input
                              id="eventTitle"
                              placeholder="e.g., Summer Music Festival 2024"
                              value={eventDetails.title}
                              onChange={(e) => setEventDetails({ ...eventDetails, title: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventTagline">Current Tagline</Label>
                            <Input
                              id="eventTagline"
                              placeholder="e.g., Where Music Meets Magic"
                              value={eventDetails.tagline}
                              onChange={(e) => setEventDetails({ ...eventDetails, tagline: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Event Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="eventDate">Date</Label>
                            <Input
                              id="eventDate"
                              type="date"
                              value={eventDetails.date}
                              onChange={(e) => setEventDetails({ ...eventDetails, date: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventTime">Time</Label>
                            <Input
                              id="eventTime"
                              type="time"
                              value={eventDetails.time}
                              onChange={(e) => setEventDetails({ ...eventDetails, time: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="eventLocation">Location</Label>
                            <Input
                              id="eventLocation"
                              placeholder="e.g., Central Park, NYC"
                              value={eventDetails.location}
                              onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventPrice">Price</Label>
                            <Input
                              id="eventPrice"
                              placeholder="e.g., $25 - $150"
                              value={eventDetails.price}
                              onChange={(e) => setEventDetails({ ...eventDetails, price: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">Key Features</h4>
                          <Button
                            onClick={addHighlight}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 bg-transparent"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {eventDetails.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder={`Feature ${index + 1}`}
                                value={highlight}
                                onChange={(e) => updateHighlight(index, e.target.value)}
                                className="flex-1"
                              />
                              {eventDetails.highlights.length > 1 && (
                                <Button
                                  onClick={() => removeHighlight(index)}
                                  size="sm"
                                  variant="ghost"
                                  className="p-1 h-8 w-8"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Call to Action */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Call to Action</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="ctaText">CTA Text</Label>
                            <Input
                              id="ctaText"
                              placeholder="e.g., Get Tickets Now"
                              value={eventDetails.ctaText}
                              onChange={(e) => setEventDetails({ ...eventDetails, ctaText: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ctaStyle">CTA Style</Label>
                            <Select
                              value={eventDetails.ctaStyle}
                              onValueChange={(value) => setEventDetails({ ...eventDetails, ctaStyle: value })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primary">Primary Button</SelectItem>
                                <SelectItem value="secondary">Secondary Button</SelectItem>
                                <SelectItem value="outline">Outline Button</SelectItem>
                                <SelectItem value="text">Text Link</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <Collapsible open={brandVoiceOpen} onOpenChange={setBrandVoiceOpen}>
                <div className="relative">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="absolute top-4 right-4 z-10 h-8 w-8 p-0 hover:bg-gray-100">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${brandVoiceOpen ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <BrandVoiceSelector brandVoice={brandVoice} onBrandVoiceChange={setBrandVoice} />
                  </CollapsibleContent>
                </div>
              </Collapsible>

              <Collapsible open={generationOptionsOpen} onOpenChange={setGenerationOptionsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        Generation Options
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${generationOptionsOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <AdvancedOptions options={advancedOptions} onOptionsChange={setAdvancedOptions} type="slogan" />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Slogans...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Slogans
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-6">
              <Card className="min-h-[600px]">
                <CardHeader>
                  <CardTitle>Generated Slogans</CardTitle>
                  <CardDescription>Your AI-generated slogans will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="text-center p-8">
                      <div className="text-red-600 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Generation Failed</h3>
                      <p className="text-gray-600 mb-4">{error}</p>
                      <Button onClick={() => setError(null)} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="text-center p-8">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Your Slogans</h3>
                      <p className="text-gray-600">This may take a few moments...</p>
                    </div>
                  )}

                  {slogans.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex gap-3 justify-end mb-4">
                        <Button onClick={handleDownload} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download All
                        </Button>
                      </div>

                      {slogans.map((slogan, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-lg font-medium text-gray-900 flex-1">{slogan}</p>
                            <Button
                              onClick={() => handleCopy(slogan, index)}
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                            >
                              {copiedIndex === index ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!slogans.length && !isGenerating && !error && (
                    <div className="text-center p-8">
                      <Sparkles className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Create</h3>
                      <p className="text-gray-600">
                        Describe your brand and click generate to create memorable slogans
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
