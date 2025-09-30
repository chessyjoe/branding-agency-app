"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/file-upload"
import { ColorPalettePicker } from "@/components/color-palette-picker"
import { BrandVoiceSelector } from "@/components/brand-voice-selector"
import { AdvancedOptions } from "@/components/advanced-options"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sparkles,
  Download,
  Share2,
  Wand2,
  Palette,
  Upload,
  Settings,
  Bookmark,
  ChevronDown,
  Calendar,
  Plus,
  Trash2,
} from "lucide-react"
import { Input } from "@/components/ui/input"

const models = [
  {
    name: "DALL-E 3",
    value: "dall-e-3",
    description: "OpenAI's flagship model for high-quality, detailed images",
    provider: "OpenAI",
  },
  {
    name: "FLUX.1 Schnell",
    value: "black-forest-labs/FLUX.1-schnell",
    description: "Fast, high-quality image generation from BlackForest Labs",
    provider: "BlackForest Labs",
  },
  {
    name: "FLUX.1 Dev",
    value: "black-forest-labs/FLUX.1-dev",
    description: "Development model with enhanced control and quality",
    provider: "BlackForest Labs",
  },
  {
    name: "FLUX.1 Pro",
    value: "black-forest-labs/FLUX.1-pro",
    description: "Professional grade model for commercial use",
    provider: "BlackForest Labs",
  },
  {
    name: "Flux Schnell (Free)",
    value: "black-forest-labs/FLUX.1-schnell-Free",
    description: "Fast and free Flux model for quick iterations",
    provider: "",
  },
  {
    name: "Stable Diffusion XL",
    value: "stabilityai/stable-diffusion-xl-base-1.0",
    description: "High-quality image generation with excellent detail",
    provider: "",
  },
  {
    name: "Playground v2.5",
    value: "playgroundai/playground-v2.5-1024px-aesthetic",
    description: "Aesthetic-focused model for beautiful visuals",
    provider: "",
  },
]

export default function BannerPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState("black-forest-labs/FLUX.1-schnell")
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{
    imageUrl?: string
    svgContent?: string
    svgFallback?: boolean
    refinedPrompt?: string
    metadata?: {
      hasSvg?: boolean
      svgLength?: number
      svgFallback?: boolean
      generatedAt?: string
    }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReferenceFilesOpen, setIsReferenceFilesOpen] = useState(false)
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false)
  const [isBrandVoiceOpen, setIsBrandVoiceOpen] = useState(false)
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false)
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
  const [colors, setColors] = useState<string[]>([])
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
    aspectRatio: "16:9",
    style: ["Modern"],
    quality: 8,
    creativity: 6,
    iterations: 1,
    seed: undefined,
    negativePrompt: "",
    enhancePrompt: true,
    highResolution: true,
    customDimensions: undefined,
  })
  const handleAdvancedOptionsChange = (opts: any) => {
    setAdvancedOptions({
      aspectRatio: typeof opts?.aspectRatio === "string" ? opts.aspectRatio : "16:9",
      style: Array.isArray(opts?.style) ? opts.style : [],
      quality: typeof opts?.quality === "number" ? opts.quality : 8,
      creativity: typeof opts?.creativity === "number" ? opts.creativity : 6,
      iterations: typeof opts?.iterations === "number" ? opts.iterations : 1,
      seed: typeof opts?.seed === "number" ? opts.seed : undefined,
      negativePrompt: typeof opts?.negativePrompt === "string" ? opts.negativePrompt : "",
      enhancePrompt: opts?.enhancePrompt !== false,
      highResolution: opts?.highResolution !== false,
      customDimensions: opts?.customDimensions,
    })
  }
  const [uploadedFiles, setUploadedFiles] = useState<{
    reference?: File
    logo?: File
    content?: File
  }>({})

  const handleFileUpload = (file: File, type: "reference" | "logo" | "content") => {
    setUploadedFiles((prev) => ({ ...prev, [type]: file }))
  }

  const handleFileRemove = (type: "reference" | "logo" | "content") => {
    setUploadedFiles((prev) => {
      const updated = { ...prev }
      delete updated[type]
      return updated
    })
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("model", selectedModel)
      formData.append("colors", JSON.stringify(colors))
      formData.append("brandVoice", JSON.stringify(brandVoice))
      formData.append("advancedOptions", JSON.stringify(advancedOptions))
      formData.append("eventDetails", JSON.stringify(eventDetails))

      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file)
        }
      })

      const response = await fetch("/api/generate-banner", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate banner")
      }

      if (data.success) {
        setResult({
          imageUrl: data.imageUrl,
          svgContent: data.svgContent,
          svgFallback: data.svgFallback,
          refinedPrompt: data.refinedPrompt,
          metadata: data.metadata,
        })
      } else {
        throw new Error(data.error || "Generation failed")
      }
    } catch (error) {
      console.error("Error generating banner:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!result?.imageUrl) return

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const filename = `banner-${timestamp}.png`

      const downloadUrl = `/api/download-image?url=${encodeURIComponent(result.imageUrl)}&filename=${encodeURIComponent(filename)}`

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed:", error)
      const link = document.createElement("a")
      link.href = result.imageUrl
      link.download = `banner-${Date.now()}.png`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!result?.imageUrl) return

    try {
      const response = await fetch("/api/save-generated-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "banner",
          prompt,
          refinedPrompt: result.refinedPrompt,
          model: selectedModel,
          imageUrl: result.imageUrl,
          colors,
          brandVoice,
          advancedOptions,
          aspectRatio: "16:9",
          isTemplate: true,
          tags: ["banner", "generated"],
        }),
      })

      if (response.ok) {
        alert("Banner saved as template!")
      } else {
        throw new Error("Failed to save template")
      }
    } catch (error) {
      console.error("Save template failed:", error)
      alert("Failed to save template")
    }
  }

  const handleOpenInEditor = () => {
    if (!result?.imageUrl) return

    // Store the image data in sessionStorage for the editor
    const editorData = {
      imageUrl: result.imageUrl,
      svgContent: result.svgContent,
      svgFallback: result.svgFallback,
      originalPrompt: prompt,
      refinedPrompt: result.refinedPrompt,
      type: "banner",
      colors,
      brandVoice,
      advancedOptions,
      eventDetails,
      metadata: result.metadata,
    }

    sessionStorage.setItem("editorImageData", JSON.stringify(editorData))

    // Navigate to editor
    router.push("/editor")
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-10 w-10 text-blue-600" />
              AI Banner Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create eye-catching banners for websites, social media, and marketing campaigns with AI-powered design.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Banner Description
                  </CardTitle>
                  <CardDescription>Describe the banner you want to create</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">What kind of banner do you want?</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., Professional website banner for a tech company, featuring modern graphics, call-to-action text, and corporate colors"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="mt-2 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="model">AI Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-gray-500">
                                {model.provider} • {model.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <CardDescription>Add event information to enhance your banner design</CardDescription>
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
                            <Label htmlFor="eventTagline">Tagline</Label>
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
                          <h4 className="font-medium text-gray-900">Highlights</h4>
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
                                placeholder={`Highlight ${index + 1}`}
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

                      {/* Contact Info */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Contact & Social</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              placeholder="e.g., (555) 123-4567"
                              value={eventDetails.phone}
                              onChange={(e) => setEventDetails({ ...eventDetails, phone: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="e.g., info@event.com"
                              value={eventDetails.email}
                              onChange={(e) => setEventDetails({ ...eventDetails, email: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            placeholder="e.g., www.event.com"
                            value={eventDetails.website}
                            onChange={(e) => setEventDetails({ ...eventDetails, website: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="facebook">Facebook</Label>
                            <Input
                              id="facebook"
                              placeholder="Facebook handle"
                              value={eventDetails.social.facebook}
                              onChange={(e) =>
                                setEventDetails({
                                  ...eventDetails,
                                  social: { ...eventDetails.social, facebook: e.target.value },
                                })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input
                              id="instagram"
                              placeholder="Instagram handle"
                              value={eventDetails.social.instagram}
                              onChange={(e) =>
                                setEventDetails({
                                  ...eventDetails,
                                  social: { ...eventDetails.social, instagram: e.target.value },
                                })
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <Collapsible open={isReferenceFilesOpen} onOpenChange={setIsReferenceFilesOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Upload className="h-5 w-5" />
                          Reference Files
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isReferenceFilesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </CardTitle>
                      <CardDescription>Upload reference images or brand guidelines (optional)</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <FileUpload
                        onFileUpload={handleFileUpload}
                        onFileRemove={handleFileRemove}
                        uploadedFiles={uploadedFiles}
                        acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
                        maxSize={10}
                        label="Reference Images"
                        description="Upload inspiration images or style references"
                        type="reference"
                      />

                      <FileUpload
                        onFileUpload={handleFileUpload}
                        onFileRemove={handleFileRemove}
                        uploadedFiles={uploadedFiles}
                        acceptedTypes={["image/svg+xml", "image/png"]}
                        maxSize={5}
                        label="Logo/Brand Assets"
                        description="Upload logo or brand assets to include"
                        type="logo"
                      />

                      <FileUpload
                        onFileUpload={handleFileUpload}
                        onFileRemove={handleFileRemove}
                        uploadedFiles={uploadedFiles}
                        acceptedTypes={["application/pdf", "image/jpeg", "image/png"]}
                        maxSize={20}
                        label="Brand Guidelines"
                        description="Upload brand style guide or guidelines document"
                        type="content"
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <Collapsible open={isColorPaletteOpen} onOpenChange={setIsColorPaletteOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Palette className="h-5 w-5" />
                          Color Palette
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isColorPaletteOpen ? "rotate-180" : ""
                          }`}
                        />
                      </CardTitle>
                      <CardDescription>Choose colors for your banner</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <ColorPalettePicker colors={colors} onColorsChange={setColors} maxColors={6} />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <Collapsible open={isBrandVoiceOpen} onOpenChange={setIsBrandVoiceOpen}>
                <BrandVoiceSelector brandVoice={brandVoice} onBrandVoiceChange={setBrandVoice} />
              </Collapsible>

              <Collapsible open={isAdvancedOptionsOpen} onOpenChange={setIsAdvancedOptionsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Advanced Options
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isAdvancedOptionsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </CardTitle>
                      <CardDescription>Fine-tune generation parameters</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <AdvancedOptions options={advancedOptions as any} onOptionsChange={handleAdvancedOptionsChange} type="banner" />
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
                    Generating Banner...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Banner
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-6">
              <Card className="min-h-[600px]">
                <CardHeader>
                  <CardTitle>Generated Banner</CardTitle>
                  <CardDescription>Your AI-generated banner will appear here</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[500px]">
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Your Banner</h3>
                      <p className="text-gray-600">This may take a few moments...</p>
                    </div>
                  )}

                  {result && (
                    <div className="w-full">
                      <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-8 mb-6">
                        <img
                          src={result.imageUrl || "/placeholder.svg"}
                          alt="Generated banner"
                          className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                        />
                      </div>

                      <div className="flex gap-3 justify-center flex-wrap">
                        <Button onClick={handleDownload} className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          onClick={handleOpenInEditor}
                          variant="outline"
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <Wand2 className="h-4 w-4" />
                          Open in Editor
                        </Button>
                        <Button
                          onClick={handleSaveAsTemplate}
                          variant="outline"
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <Bookmark className="h-4 w-4" />
                          Save as Template
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </div>

                      {result.refinedPrompt && result.refinedPrompt !== prompt && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Enhanced Prompt Used:</h4>
                          <p className="text-sm text-blue-800">{result.refinedPrompt}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!result && !isGenerating && !error && (
                    <div className="text-center p-8">
                      <Sparkles className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Create</h3>
                      <p className="text-gray-600">Enter a description and click generate to create your banner</p>
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
