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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Loader2,
  Download,
  Globe,
  Sparkles,
  Code,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  Calendar,
  Plus,
  Trash2,
} from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { ColorPalettePicker } from "@/components/color-palette-picker"
import { WebsitePreview } from "@/components/website-preview"

const websiteTypes = [
  { name: "Landing Page", value: "landing", description: "Single page for product/service promotion" },
  { name: "Business Website", value: "business", description: "Multi-page corporate website" },
  { name: "Portfolio", value: "portfolio", description: "Showcase work and projects" },
  { name: "E-commerce", value: "ecommerce", description: "Online store with product catalog" },
  { name: "Blog", value: "blog", description: "Content-focused website with articles" },
  { name: "SaaS App", value: "saas", description: "Software as a Service application" },
]

const frameworks = [
  { name: "Next.js (Recommended)", value: "nextjs" },
  { name: "React", value: "react" },
  { name: "Vue.js", value: "vue" },
  { name: "Svelte", value: "svelte" },
]

export default function WebsiteCreator() {
  const [prompt, setPrompt] = useState("")
  const [websiteType, setWebsiteType] = useState("landing")
  const [framework, setFramework] = useState("nextjs")
  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    industry: "",
    description: "",
    targetAudience: "",
    features: "",
  })

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

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [colors, setColors] = useState<string[]>(["#2563eb", "#1e40af"])
  const [uploadedFiles, setUploadedFiles] = useState<{
    reference?: File
    logo?: File
    content?: File
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [refinedPrompt, setRefinedPrompt] = useState("")
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")

  const [businessInfoOpen, setBusinessInfoOpen] = useState(false)
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false)
  const [assetsReferencesOpen, setAssetsReferencesOpen] = useState(false)
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false)

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
    if (!prompt.trim() || !businessInfo.name.trim()) {
      setError("Please provide both a website description and business name")
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccess(null)
    setGeneratedCode("")
    setPreviewUrl("")
    setRefinedPrompt("")

    try {
      console.log("Starting website generation...")

      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("websiteType", websiteType)
      formData.append("framework", framework)
      formData.append("businessInfo", JSON.stringify(businessInfo))
      formData.append("eventDetails", JSON.stringify(eventDetails))
      formData.append("colors", JSON.stringify(colors))

      // Add uploaded files
      Object.entries(uploadedFiles).forEach(([type, file]) => {
        if (file) {
          formData.append(type, file)
        }
      })

      console.log("Sending request to /api/generate-website")

      const response = await fetch("/api/generate-website", {
        method: "POST",
        body: formData,
      })

      console.log("Response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      // Get response text first to debug
      const responseText = await response.text()
      console.log("Response text:", responseText)

      // Check if response looks like JSON
      let data: any
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError)
        console.error("Response text:", responseText)
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}...`)
      }

      console.log("Parsed response data:", data)

      if (data.success) {
        setGeneratedCode(data.code)
        setPreviewUrl(data.previewUrl)
        setRefinedPrompt(data.refinedPrompt)
        setSuccess("Website generated successfully!")
      } else {
        throw new Error(data.error || "Failed to generate website")
      }
    } catch (error) {
      console.error("Error generating website:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadCode = () => {
    if (!generatedCode) return

    const blob = new Blob([generatedCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${businessInfo.name.toLowerCase().replace(/\s+/g, "-")}-website-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openPreviewInNewTab = () => {
    if (!generatedCode || !businessInfo.name) return

    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${businessInfo.name} - Preview</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            :root {
              --primary-color: ${colors[0] || "#2563eb"};
              --secondary-color: ${colors[1] || "#1e40af"};
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            }
          </style>
        </head>
        <body>
          <div id="preview-content">
            <!-- Generated website content will be rendered here -->
            <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
              <!-- Header -->
              <header class="bg-white shadow-sm">
                <div class="container mx-auto px-4 py-6">
                  <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold" style="color: ${colors[0] || "#2563eb"}">
                      ${businessInfo.name}
                    </h1>
                    <nav class="hidden md:flex space-x-6">
                      <a href="#home" class="text-gray-600 hover:text-gray-900">Home</a>
                      <a href="#about" class="text-gray-600 hover:text-gray-900">About</a>
                      <a href="#services" class="text-gray-600 hover:text-gray-900">Services</a>
                      <a href="#contact" class="text-gray-600 hover:text-gray-900">Contact</a>
                    </nav>
                    <button class="md:hidden">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </header>

              <!-- Hero Section -->
              <section class="py-20 px-4">
                <div class="container mx-auto text-center">
                  <h2 class="text-5xl font-bold mb-6 text-gray-900">
                    Welcome to ${businessInfo.name}
                  </h2>
                  <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    ${businessInfo.description || "Your trusted partner for innovative solutions"}
                  </p>
                  <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button class="px-8 py-3 text-lg rounded-md text-white font-medium" style="background-color: ${colors[0] || "#2563eb"}">
                      Get Started
                    </button>
                    <button class="px-8 py-3 text-lg rounded-md border-2 bg-transparent font-medium" style="border-color: ${colors[0] || "#2563eb"}; color: ${colors[0] || "#2563eb"}">
                      Learn More
                    </button>
                  </div>
                </div>
              </section>

              <!-- Features Section -->
              <section class="py-16 px-4 bg-white">
                <div class="container mx-auto">
                  <h3 class="text-3xl font-bold text-center mb-12 text-gray-900">
                    Our ${businessInfo.industry || "Professional"} Services
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-full" style="background-color: ${colors[0] || "#2563eb"}"></div>
                        <h4 class="text-xl font-semibold">Service 1</h4>
                      </div>
                      <p class="text-gray-600">
                        Professional service tailored to your specific needs and requirements.
                      </p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-full" style="background-color: ${colors[1] || "#1e40af"}"></div>
                        <h4 class="text-xl font-semibold">Service 2</h4>
                      </div>
                      <p class="text-gray-600">
                        Innovative solutions designed for modern challenges and opportunities.
                      </p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-full" style="background-color: ${colors[0] || "#2563eb"}"></div>
                        <h4 class="text-xl font-semibold">Service 3</h4>
                      </div>
                      <p class="text-gray-600">
                        Expert support and consultation to help you achieve your goals.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Contact Section -->
              <section class="py-16 px-4" style="background-color: ${colors[0] || "#2563eb"}">
                <div class="container mx-auto text-center">
                  <h3 class="text-3xl font-bold mb-6 text-white">
                    Ready to Get Started?
                  </h3>
                  <p class="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                    Contact us today to learn more about our services and how we can help your business grow.
                  </p>
                  <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button class="px-8 py-3 text-lg border-2 border-white text-white hover:bg-white bg-transparent rounded-md font-medium" style="color: ${colors[0] || "#2563eb"}">
                      Contact Us
                    </button>
                    <button class="px-8 py-3 text-lg bg-white hover:bg-gray-100 rounded-md font-medium" style="color: ${colors[0] || "#2563eb"}">
                      Get Quote
                    </button>
                  </div>
                </div>
              </section>

              <!-- Footer -->
              <footer class="bg-gray-900 text-white py-12 px-4">
                <div class="container mx-auto">
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                      <h4 class="text-lg font-bold mb-4">${businessInfo.name}</h4>
                      <p class="text-gray-400 text-sm">
                        ${businessInfo.description || "Your trusted partner for innovative solutions"}
                      </p>
                    </div>
                    <div>
                      <h4 class="text-lg font-bold mb-4">Services</h4>
                      <ul class="space-y-2 text-gray-400 text-sm">
                        <li><a href="#" class="hover:text-white">Service 1</a></li>
                        <li><a href="#" class="hover:text-white">Service 2</a></li>
                        <li><a href="#" class="hover:text-white">Service 3</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 class="text-lg font-bold mb-4">Company</h4>
                      <ul class="space-y-2 text-gray-400 text-sm">
                        <li><a href="#" class="hover:text-white">About</a></li>
                        <li><a href="#" class="hover:text-white">Careers</a></li>
                        <li><a href="#" class="hover:text-white">Contact</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 class="text-lg font-bold mb-4">Contact</h4>
                      <div class="space-y-2 text-gray-400 text-sm">
                        <p>Email: info@${businessInfo.name.toLowerCase().replace(/\s+/g, "")}.com</p>
                        <p>Phone: (555) 123-4567</p>
                        <p>Address: 123 Business St, City, State 12345</p>
                      </div>
                    </div>
                  </div>
                  <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                    <p>&copy; 2024 ${businessInfo.name}. All rights reserved.</p>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </body>
        </html>
      `)
      previewWindow.document.close()
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
              <Globe className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Website Creator</h1>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
            <p className="text-lg text-gray-600">
              Build complete websites with AI technology and advanced prompt enhancement
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website Requirements
                  </CardTitle>
                  <CardDescription>Describe your website needs and business information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="websiteType">Website Type</Label>
                      <Select value={websiteType} onValueChange={setWebsiteType}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {websiteTypes.map((type) => (
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
                      <Label htmlFor="framework">Framework</Label>
                      <Select value={framework} onValueChange={setFramework}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frameworks.map((fw) => (
                            <SelectItem key={fw.value} value={fw.value}>
                              {fw.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="prompt">Website Description *</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., Modern SaaS landing page for project management tool, clean design with hero section, feature highlights, pricing table, testimonials, and contact form..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="mt-2"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Collapsible open={businessInfoOpen} onOpenChange={setBusinessInfoOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        Business Information
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${businessInfoOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                      <CardDescription>Provide details about your business for personalized content</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessName">Business Name *</Label>
                          <Input
                            id="businessName"
                            placeholder="Your Business Name"
                            value={businessInfo.name}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="industry">Industry</Label>
                          <Input
                            id="industry"
                            placeholder="e.g., Technology, Healthcare, Finance"
                            value={businessInfo.industry}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Business Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Brief description of your business and what you do"
                          value={businessInfo.description}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                          rows={2}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Textarea
                          id="targetAudience"
                          placeholder="Who are your ideal customers?"
                          value={businessInfo.targetAudience}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, targetAudience: e.target.value })}
                          rows={2}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="features">Key Features/Services</Label>
                        <Textarea
                          id="features"
                          placeholder="What are your main products, services, or features?"
                          value={businessInfo.features}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, features: e.target.value })}
                          rows={2}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <Collapsible open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Event Details
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${eventDetailsOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                      <CardDescription>Add event information to create event-specific websites</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
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
                              placeholder="e.g., Annual Tech Conference 2024"
                              value={eventDetails.title}
                              onChange={(e) => setEventDetails({ ...eventDetails, title: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventTagline">Event Tagline</Label>
                            <Input
                              id="eventTagline"
                              placeholder="e.g., Innovating the Future Together"
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
                              placeholder="e.g., Convention Center, San Francisco"
                              value={eventDetails.location}
                              onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventPrice">Price</Label>
                            <Input
                              id="eventPrice"
                              placeholder="e.g., $99 - $299"
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
                              placeholder="e.g., Register Now"
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

                      {/* Contact & Social */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Contact & Social</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="eventPhone">Phone</Label>
                            <Input
                              id="eventPhone"
                              placeholder="e.g., (555) 123-4567"
                              value={eventDetails.phone}
                              onChange={(e) => setEventDetails({ ...eventDetails, phone: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventEmail">Email</Label>
                            <Input
                              id="eventEmail"
                              placeholder="e.g., info@event.com"
                              value={eventDetails.email}
                              onChange={(e) => setEventDetails({ ...eventDetails, email: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="eventWebsite">Website</Label>
                          <Input
                            id="eventWebsite"
                            placeholder="e.g., https://event.com"
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
                              placeholder="@eventpage"
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
                              placeholder="@eventpage"
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="twitter">Twitter</Label>
                            <Input
                              id="twitter"
                              placeholder="@eventpage"
                              value={eventDetails.social.twitter}
                              onChange={(e) =>
                                setEventDetails({
                                  ...eventDetails,
                                  social: { ...eventDetails.social, twitter: e.target.value },
                                })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input
                              id="linkedin"
                              placeholder="@eventpage"
                              value={eventDetails.social.linkedin}
                              onChange={(e) =>
                                setEventDetails({
                                  ...eventDetails,
                                  social: { ...eventDetails.social, linkedin: e.target.value },
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

              {/* File Uploads */}
              <Collapsible open={assetsReferencesOpen} onOpenChange={setAssetsReferencesOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        Assets & References
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${assetsReferencesOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                      <CardDescription>
                        Upload logos, reference designs, and content materials (optional)
                      </CardDescription>
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
                        label="Reference Websites"
                        description="Upload screenshots of websites you like"
                        type="reference"
                      />

                      <FileUpload
                        onFileUpload={handleFileUpload}
                        onFileRemove={handleFileRemove}
                        uploadedFiles={uploadedFiles}
                        acceptedTypes={["image/svg+xml", "image/png"]}
                        maxSize={5}
                        label="Logo"
                        description="Upload your business logo"
                        type="logo"
                      />

                      <FileUpload
                        onFileUpload={handleFileUpload}
                        onFileRemove={handleFileRemove}
                        uploadedFiles={uploadedFiles}
                        acceptedTypes={["text/plain", "application/pdf", "text/csv"]}
                        maxSize={10}
                        label="Content"
                        description="Upload text content, product lists, or documentation"
                        type="content"
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Color Palette */}
              <Collapsible open={colorPaletteOpen} onOpenChange={setColorPaletteOpen}>
                <div className="relative">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="absolute top-4 right-4 z-10 h-8 w-8 p-0 hover:bg-gray-100"
                      aria-label={colorPaletteOpen ? "Collapse color palette" : "Expand color palette"}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${colorPaletteOpen ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ColorPalettePicker colors={colors} onColorsChange={setColors} maxColors={5} />
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || !businessInfo.name.trim() || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Website...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Create Website
                  </>
                )}
              </Button>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Website</CardTitle>
                  <CardDescription>Your AI-generated website will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedCode ? (
                    <Tabs defaultValue="preview" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preview" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Preview
                        </TabsTrigger>
                        <TabsTrigger value="code" className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Code
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="preview" className="space-y-4">
                        <div className="space-y-4">
                          {/* Device Preview Buttons */}
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant={previewMode === "desktop" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPreviewMode("desktop")}
                            >
                              <Monitor className="h-4 w-4 mr-1" />
                              Desktop
                            </Button>
                            <Button
                              variant={previewMode === "tablet" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPreviewMode("tablet")}
                            >
                              <Tablet className="h-4 w-4 mr-1" />
                              Tablet
                            </Button>
                            <Button
                              variant={previewMode === "mobile" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPreviewMode("mobile")}
                            >
                              <Smartphone className="h-4 w-4 mr-1" />
                              Mobile
                            </Button>
                          </div>

                          {/* Preview Container */}
                          <div className="border rounded-lg overflow-hidden bg-white">
                            <div className="p-2 bg-gray-50 border-b text-xs text-gray-600 flex items-center justify-between">
                              <span>Preview: {businessInfo.name} Website</span>
                              <Button size="sm" variant="ghost" onClick={openPreviewInNewTab}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open in New Tab
                              </Button>
                            </div>
                            <div
                              className={`mx-auto bg-white transition-all duration-300 ${
                                previewMode === "mobile"
                                  ? "max-w-sm"
                                  : previewMode === "tablet"
                                    ? "max-w-2xl"
                                    : "w-full"
                              }`}
                            >
                              <WebsitePreview businessInfo={businessInfo} colors={colors} websiteType={websiteType} />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={openPreviewInNewTab} className="flex-1">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Full Preview
                            </Button>
                            <Button onClick={downloadCode} variant="outline" className="flex-1 bg-transparent">
                              <Download className="h-4 w-4 mr-2" />
                              Download Code
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="code" className="space-y-4">
                        <div className="space-y-4">
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                            <pre className="text-sm whitespace-pre-wrap">
                              <code>{generatedCode}</code>
                            </pre>
                          </div>
                          <Button onClick={downloadCode} className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Download Full Project
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Your generated website will appear here</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Fill in the required fields and click "Create Website"
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Refined Prompt Display */}
              {refinedPrompt && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">AI-Enhanced Prompt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">{refinedPrompt}</div>
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <Badge variant="outline">⚡</Badge>
                      <p>AI-powered code generation</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">📱</Badge>
                      <p>Fully responsive design</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">🎨</Badge>
                      <p>Brand-consistent styling</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">🚀</Badge>
                      <p>Production-ready code</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">🔍</Badge>
                      <p>SEO optimized</p>
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
