"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
  MapPin,
  DollarSign,
  Plus,
  X,
  Phone,
  Mail,
  Globe,
  Hash,
} from "lucide-react"

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
    provider: "Together AI",
  },
  {
    name: "Stable Diffusion XL",
    value: "stabilityai/stable-diffusion-xl-base-1.0",
    description: "High-quality image generation with excellent detail",
    provider: "Together AI",
  },
  {
    name: "Playground v2.5",
    value: "playgroundai/playground-v2.5-1024px-aesthetic",
    description: "Aesthetic-focused model for beautiful visuals",
    provider: "Together AI",
  },
]

export default function PosterPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState("black-forest-labs/FLUX.1-schnell")
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{
    imageUrl?: string
    refinedPrompt?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enhancedPromptData, setEnhancedPromptData] = useState<any>(null)
  const [isReferenceFilesOpen, setIsReferenceFilesOpen] = useState(false)
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false)
  const [isBrandVoiceOpen, setIsBrandVoiceOpen] = useState(false)
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false)
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false)

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
    aspectRatio: "9:16",
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
  const [uploadedFiles, setUploadedFiles] = useState<{
    reference?: File
    logo?: File
    brandGuide?: File
  }>({})

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
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
    },
  })

  const handleFileUpload = (file: File, type: "reference" | "logo" | "brand-guide") => {
    setUploadedFiles((prev) => ({ ...prev, [type]: file }))
  }

  const handleFileRemove = (type: "reference" | "logo" | "brand-guide") => {
    setUploadedFiles((prev) => {
      const updated = { ...prev }
      delete updated[type]
      return updated
    })
  }

  const addHighlight = () => {
    setEventDetails((prev) => ({
      ...prev,
      highlights: [...prev.highlights, ""],
    }))
  }

  const removeHighlight = (index: number) => {
    setEventDetails((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }))
  }

  const updateHighlight = (index: number, value: string) => {
    setEventDetails((prev) => ({
      ...prev,
      highlights: prev.highlights.map((highlight, i) => (i === index ? value : highlight)),
    }))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setResult(null)
    setEnhancedPromptData(null)

    try {
      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("model", selectedModel)
      formData.append("userId", "demo-user")
      formData.append("colors", JSON.stringify(colors))
      formData.append("brandVoice", JSON.stringify(brandVoice))
      formData.append("advancedOptions", JSON.stringify(advancedOptions))
      formData.append("eventDetails", JSON.stringify(eventDetails))

      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file)
        }
      })

      const response = await fetch("/api/generate-poster", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate poster")
      }

      if (data.success) {
        setResult({
          imageUrl: data.imageUrl,
          refinedPrompt: data.refinedPrompt,
        })
        if (data.enhancedPromptData) {
          setEnhancedPromptData(data.enhancedPromptData)
        }
      } else {
        throw new Error(data.error || "Generation failed")
      }
    } catch (error) {
      console.error("Error generating poster:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!result?.imageUrl) return

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const filename = `poster-${timestamp}.png`

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
      link.download = `poster-${Date.now()}.png`
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
          userId: "demo-user",
          type: "poster",
          prompt,
          refinedPrompt: result.refinedPrompt,
          model: selectedModel,
          imageUrl: result.imageUrl,
          colors,
          brandVoice,
          advancedOptions,
          aspectRatio: "9:16",
          isTemplate: true,
          tags: ["poster", "generated"],
        }),
      })

      if (response.ok) {
        alert("Poster saved as template!")
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

    const editorData = {
      imageUrl: result.imageUrl,
      originalPrompt: prompt,
      refinedPrompt: result.refinedPrompt,
      type: "poster",
      colors,
      brandVoice,
      advancedOptions,
      eventDetails,
    }

    sessionStorage.setItem("editorImageData", JSON.stringify(editorData))

    router.push("/editor")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-10 w-10 text-blue-600" />
              AI Poster Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create stunning posters for events, marketing campaigns, and promotional materials with AI-powered design.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Poster Description
                  </CardTitle>
                  <CardDescription>Describe the poster you want to create</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">What kind of poster do you want?</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., Event poster for a music festival, vibrant colors, bold typography, featuring musical instruments and stage lights"
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
                                {model.provider} ��� {model.description}
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
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Event Details
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isEventDetailsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </CardTitle>
                      <CardDescription>Add specific event information to your poster</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Basic Info</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="eventTitle">Event Title</Label>
                            <Input
                              id="eventTitle"
                              placeholder="e.g., Summer Music Festival"
                              value={eventDetails.title}
                              onChange={(e) => setEventDetails((prev) => ({ ...prev, title: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventTagline">Tagline</Label>
                            <Input
                              id="eventTagline"
                              placeholder="e.g., Where Music Meets Magic"
                              value={eventDetails.tagline}
                              onChange={(e) => setEventDetails((prev) => ({ ...prev, tagline: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Event Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="eventDate" className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Date
                            </Label>
                            <Input
                              id="eventDate"
                              type="date"
                              value={eventDetails.date}
                              onChange={(e) => setEventDetails((prev) => ({ ...prev, date: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventTime">Time</Label>
                            <Input
                              id="eventTime"
                              type="time"
                              value={eventDetails.time}
                              onChange={(e) => setEventDetails((prev) => ({ ...prev, time: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventPrice" className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Price
                            </Label>
                            <Input
                              id="eventPrice"
                              placeholder="e.g., $25 or Free"
                              value={eventDetails.price}
                              onChange={(e) => setEventDetails((prev) => ({ ...prev, price: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="eventLocation" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </Label>
                          <Input
                            id="eventLocation"
                            placeholder="e.g., Central Park, New York"
                            value={eventDetails.location}
                            onChange={(e) => setEventDetails((prev) => ({ ...prev, location: e.target.value }))}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">Event Highlights</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addHighlight}
                            className="flex items-center gap-2 bg-transparent"
                          >
                            <Plus className="h-4 w-4" />
                            Add Highlight
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {eventDetails.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder={`Highlight ${index + 1} (e.g., Live performances, Food trucks, Art exhibitions)`}
                                value={highlight}
                                onChange={(e) => updateHighlight(index, e.target.value)}
                              />
                              {eventDetails.highlights.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeHighlight(index)}
                                  className="flex-shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Call to Action */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Call to Action</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="ctaText">CTA Text</Label>
                            <Input
                              id="ctaText"
                              placeholder="e.g., Get Tickets Now, Register Today"
                              value={eventDetails.ctaText}
                              onChange={(e) => setEventDetails((prev) => ({ ...prev, ctaText: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ctaStyle">CTA Style</Label>
                            <Select
                              value={eventDetails.ctaStyle}
                              onValueChange={(value) => setEventDetails((prev) => ({ ...prev, ctaStyle: value }))}
                            >
                              <SelectTrigger className="mt-2">
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

                      {/* Footer Info */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Contact & Social Media</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone" className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone
                            </Label>
                            <Input
                              id="phone"
                              placeholder="e.g., (555) 123-4567"
                              value={eventDetails.phone}
                              onChange={(e) => setEventDetails((prev) => ({ ...prev, phone: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="e.g., info@event.com"
                              value={eventDetails.email}
                              onChange={(e) => setEventDetails((prev) => ({ ...prev, email: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="website" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website
                          </Label>
                          <Input
                            id="website"
                            placeholder="e.g., www.event.com"
                            value={eventDetails.website}
                            onChange={(e) => setEventDetails((prev) => ({ ...prev, website: e.target.value }))}
                            className="mt-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="facebook" className="flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              Facebook
                            </Label>
                            <Input
                              id="facebook"
                              placeholder="@eventpage"
                              value={eventDetails.socialMedia.facebook}
                              onChange={(e) =>
                                setEventDetails((prev) => ({
                                  ...prev,
                                  socialMedia: { ...prev.socialMedia, facebook: e.target.value },
                                }))
                              }
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input
                              id="instagram"
                              placeholder="@eventpage"
                              value={eventDetails.socialMedia.instagram}
                              onChange={(e) =>
                                setEventDetails((prev) => ({
                                  ...prev,
                                  socialMedia: { ...prev.socialMedia, instagram: e.target.value },
                                }))
                              }
                              className="mt-2"
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
                        type="brand-guide"
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
                      <CardDescription>Choose colors for your poster</CardDescription>
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
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5" />
                          Brand Voice & Personality
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isBrandVoiceOpen ? "rotate-180" : ""
                          }`}
                        />
                      </CardTitle>
                      <CardDescription>Define your brand's personality and tone</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <BrandVoiceSelector brandVoice={brandVoice} onBrandVoiceChange={setBrandVoice} />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
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
                      <AdvancedOptions options={advancedOptions} onOptionsChange={setAdvancedOptions} type="poster" />
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
                    Generating Poster...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Poster
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-6">
              <Card className="min-h-[600px]">
                <CardHeader>
                  <CardTitle>Generated Poster</CardTitle>
                  <CardDescription>Your AI-generated poster will appear here</CardDescription>
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Your Poster</h3>
                      <p className="text-gray-600">This may take a few moments...</p>
                    </div>
                  )}

                  {result && (
                    <div className="w-full">
                      <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-8 mb-6">
                        <img
                          src={result.imageUrl || "/placeholder.svg"}
                          alt="Generated poster"
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

                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Final Prompt Sent to Generation Model:</h4>
                        <p className="text-sm text-gray-700 font-mono bg-white p-3 rounded border">
                          {result.refinedPrompt || prompt}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">Model: {selectedModel}</div>
                      </div>

                      {result.refinedPrompt && result.refinedPrompt !== prompt && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Enhanced Prompt Used:</h4>
                          <p className="text-sm text-blue-800">{result.refinedPrompt}</p>
                        </div>
                      )}

                      {enhancedPromptData && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-3">Detailed Prompt Enhancement Data:</h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-medium text-green-800">Enhanced Prompt:</span>
                              <p className="text-green-700 mt-1">{enhancedPromptData.prompt}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium text-green-800">Style:</span>
                                <p className="text-green-700">{enhancedPromptData.style}</p>
                              </div>
                              <div>
                                <span className="font-medium text-green-800">Mood:</span>
                                <p className="text-green-700">{enhancedPromptData.mood}</p>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-green-800">Colors:</span>
                              <div className="flex gap-2 mt-1">
                                {enhancedPromptData.colors?.map((color: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                    {color}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-green-800">Composition:</span>
                              <p className="text-green-700">{enhancedPromptData.composition}</p>
                            </div>
                            {enhancedPromptData.eventElements && (
                              <div>
                                <span className="font-medium text-green-800">Event Elements:</span>
                                <div className="mt-1 space-y-1">
                                  {Object.entries(enhancedPromptData.eventElements).map(
                                    ([key, value]: [string, any]) => (
                                      <div key={key} className="text-xs">
                                        <span className="font-medium capitalize">
                                          {key.replace(/([A-Z])/g, " $1")}:
                                        </span>
                                        <span className="ml-2 text-green-700">
                                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!result && !isGenerating && !error && (
                        <div className="text-center p-8">
                          <Sparkles className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Create</h3>
                          <p className="text-gray-600">Enter a description and click generate to create your poster</p>
                        </div>
                      )}
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
