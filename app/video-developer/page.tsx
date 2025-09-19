"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Video, Sparkles, Play, ChevronDown } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { ColorPalettePicker } from "@/components/color-palette-picker"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const videoTypes = [
  { name: "Product Demo", value: "product-demo", description: "Showcase product features and benefits" },
  { name: "Brand Story", value: "brand-story", description: "Tell your company's story and values" },
  { name: "Social Media Ad", value: "social-ad", description: "Short promotional videos for social platforms" },
  { name: "Explainer Video", value: "explainer", description: "Educational content explaining concepts" },
  { name: "Testimonial", value: "testimonial", description: "Customer success stories and reviews" },
  { name: "Event Promo", value: "event-promo", description: "Promote upcoming events or launches" },
]

const videoFormats = [
  { name: "Square (1:1) - Instagram", value: "1:1", dimensions: "1080x1080" },
  { name: "Vertical (9:16) - Stories/TikTok", value: "9:16", dimensions: "1080x1920" },
  { name: "Horizontal (16:9) - YouTube", value: "16:9", dimensions: "1920x1080" },
  { name: "Horizontal (4:3) - Facebook", value: "4:3", dimensions: "1200x900" },
]

const durations = [
  { name: "15 seconds", value: 15 },
  { name: "30 seconds", value: 30 },
  { name: "60 seconds", value: 60 },
  { name: "2 minutes", value: 120 },
  { name: "Custom", value: 0 },
]

export default function VideoDeveloper() {
  const [prompt, setPrompt] = useState("")
  const [videoType, setVideoType] = useState("product-demo")
  const [format, setFormat] = useState("16:9")
  const [duration, setDuration] = useState(30)
  const [customDuration, setCustomDuration] = useState(30)
  const [videoInfo, setVideoInfo] = useState({
    title: "",
    description: "",
    callToAction: "",
    voiceOver: "",
    musicStyle: "upbeat",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState("")
  const [colors, setColors] = useState<string[]>(["#2563eb", "#1e40af"])
  const [uploadedFiles, setUploadedFiles] = useState<{
    reference?: File
    logo?: File
    assets?: File
  }>({})

  const [colorPaletteOpen, setColorPaletteOpen] = useState(false)

  const handleFileUpload = (file: File, type: "reference" | "logo" | "assets") => {
    setUploadedFiles((prev) => ({ ...prev, [type]: file }))
  }

  const handleFileRemove = (type: "reference" | "logo" | "assets") => {
    setUploadedFiles((prev) => {
      const updated = { ...prev }
      delete updated[type]
      return updated
    })
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || !videoInfo.title.trim()) return

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("videoType", videoType)
      formData.append("format", format)
      formData.append("duration", (duration || customDuration).toString())
      formData.append("videoInfo", JSON.stringify(videoInfo))
      formData.append("colors", JSON.stringify(colors))
      formData.append("userId", "demo-user")

      // Add uploaded files
      Object.entries(uploadedFiles).forEach(([type, file]) => {
        if (file) {
          formData.append(type, file)
        }
      })

      const response = await fetch("/api/generate-video", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedVideo(data.videoUrl)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Video className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Video Developer</h1>
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
            <p className="text-lg text-gray-600">
              Create professional promotional videos with AI-powered animations and brand integration
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Video Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Requirements
                  </CardTitle>
                  <CardDescription>Define your video concept and specifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="videoType">Video Type</Label>
                      <Select value={videoType} onValueChange={setVideoType}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {videoTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.name}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="format">Video Format</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {videoFormats.map((fmt) => (
                            <SelectItem key={fmt.value} value={fmt.value}>
                              <div>
                                <div className="font-medium">{fmt.name}</div>
                                <div className="text-xs text-gray-500">{fmt.dimensions}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Select
                        value={duration.toString()}
                        onValueChange={(value) => setDuration(Number.parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durations.map((dur) => (
                            <SelectItem key={dur.value} value={dur.value.toString()}>
                              {dur.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {duration === 0 && (
                        <Input
                          type="number"
                          placeholder="Custom seconds"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number.parseInt(e.target.value) || 30)}
                          min={5}
                          max={300}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="prompt">Video Concept</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., Dynamic product showcase for fitness app, showing people exercising with app interface overlays, energetic transitions, modern graphics, call-to-action at the end..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Video Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Details</CardTitle>
                  <CardDescription>Provide specific content for your video</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Video Title *"
                    value={videoInfo.title}
                    onChange={(e) => setVideoInfo({ ...videoInfo, title: e.target.value })}
                  />

                  <Textarea
                    placeholder="Video Description/Script"
                    value={videoInfo.description}
                    onChange={(e) => setVideoInfo({ ...videoInfo, description: e.target.value })}
                    rows={3}
                  />

                  <Input
                    placeholder="Call-to-Action (e.g., 'Download Now', 'Learn More')"
                    value={videoInfo.callToAction}
                    onChange={(e) => setVideoInfo({ ...videoInfo, callToAction: e.target.value })}
                  />

                  <Textarea
                    placeholder="Voice-over Script (optional)"
                    value={videoInfo.voiceOver}
                    onChange={(e) => setVideoInfo({ ...videoInfo, voiceOver: e.target.value })}
                    rows={2}
                  />

                  <div>
                    <Label htmlFor="musicStyle">Music Style</Label>
                    <Select
                      value={videoInfo.musicStyle}
                      onValueChange={(value) => setVideoInfo({ ...videoInfo, musicStyle: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upbeat">Upbeat & Energetic</SelectItem>
                        <SelectItem value="corporate">Corporate & Professional</SelectItem>
                        <SelectItem value="calm">Calm & Relaxing</SelectItem>
                        <SelectItem value="dramatic">Dramatic & Cinematic</SelectItem>
                        <SelectItem value="none">No Background Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* File Uploads */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Assets</CardTitle>
                  <CardDescription>Upload logos, reference videos, and additional assets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    uploadedFiles={uploadedFiles}
                    acceptedTypes={["video/mp4", "video/mov", "image/jpeg", "image/png"]}
                    maxSize={50}
                    label="Reference Videos/Images"
                    description="Upload reference materials or existing footage"
                    type="reference"
                  />

                  <FileUpload
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    uploadedFiles={uploadedFiles}
                    acceptedTypes={["image/svg+xml", "image/png"]}
                    maxSize={5}
                    label="Logo"
                    description="Upload your logo for brand integration"
                    type="logo"
                  />

                  <FileUpload
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    uploadedFiles={uploadedFiles}
                    acceptedTypes={["image/jpeg", "image/png", "video/mp4"]}
                    maxSize={100}
                    label="Additional Assets"
                    description="Product images, screenshots, or video clips"
                    type="assets"
                  />
                </CardContent>
              </Card>

              {/* Color Palette */}
              <Collapsible open={colorPaletteOpen} onOpenChange={setColorPaletteOpen}>
                <div className="relative">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="absolute top-4 right-4 z-10 h-8 w-8 p-0 hover:bg-gray-100">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${colorPaletteOpen ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ColorPalettePicker colors={colors} onColorsChange={setColors} maxColors={4} />
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || !videoInfo.title.trim() || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Video...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Create Video
                  </>
                )}
              </Button>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Video</CardTitle>
                  <CardDescription>Your AI-generated video will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedVideo ? (
                    <div className="space-y-4">
                      <div className="bg-black rounded-lg overflow-hidden">
                        <video
                          src={generatedVideo}
                          controls
                          className="w-full h-auto"
                          poster="/placeholder.svg?height=300&width=400&text=Video+Preview"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>

                      <div className="flex gap-2">
                        <Button asChild className="flex-1">
                          <a href={generatedVideo} download="generated-video.mp4">
                            <Download className="h-4 w-4 mr-2" />
                            Download Video
                          </a>
                        </Button>
                        <Button variant="outline" className="flex-1 bg-transparent">
                          <Play className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[300px]">
                      <div className="text-center">
                        <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Your generated video will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Video Specs */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Format:</span>
                      <span className="font-medium">{videoFormats.find((f) => f.value === format)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{duration || customDuration} seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{videoTypes.find((t) => t.value === videoType)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality:</span>
                      <span className="font-medium">HD 1080p</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <Badge variant="outline">🎬</Badge>
                      <p>AI-powered video generation</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">🎨</Badge>
                      <p>Brand-consistent styling</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">🎵</Badge>
                      <p>Background music integration</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">📱</Badge>
                      <p>Multiple format support</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">⚡</Badge>
                      <p>Fast rendering</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
