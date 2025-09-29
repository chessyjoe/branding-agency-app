"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ColorPalettePicker } from "@/components/color-palette-picker"
import { BrandVoiceSelector } from "@/components/brand-voice-selector"
import { FileUpload } from "@/components/file-upload"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Palette, Download, Package, ImageIcon, ChevronDown } from "lucide-react"

export default function BrandKitPage() {
  const [brandName, setBrandName] = useState("")
  const [description, setDescription] = useState("")
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
  const [uploadedFiles, setUploadedFiles] = useState<{
    logo?: File
    assets?: File[]
  }>({})

  const [logoAssetsOpen, setLogoAssetsOpen] = useState(false)
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false)
  const [brandVoiceOpen, setBrandVoiceOpen] = useState(false)

  const handleFileUpload = (file: File, type: "reference" | "logo" | "content") => {
    if (type === "content") {
      setUploadedFiles((prev) => ({
        ...prev,
        assets: [...(prev.assets || []), file],
      }))
      return
    }
    if (type === "logo") {
      setUploadedFiles((prev) => ({ ...prev, logo: file }))
    }
    // "reference" not used in this page
  }

  const handleFileRemove = (type: "reference" | "logo" | "content", index?: number) => {
    if (type === "content" && typeof index === "number") {
      setUploadedFiles((prev) => ({
        ...prev,
        assets: prev.assets?.filter((_, i) => i !== index),
      }))
    } else {
      setUploadedFiles((prev) => {
        const updated = { ...prev }
        if (type === "logo") delete updated.logo
        return updated
      })
    }
  }

  const handleDownloadBrandKit = () => {
    const brandKit = {
      name: brandName,
      description,
      colors,
      brandVoice,
      assets: uploadedFiles,
      createdAt: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(brandKit, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${brandName || "brand-kit"}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Package className="h-10 w-10 text-blue-600" />
              Brand Kit Builder
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create and organize your complete brand identity in one place.
            </p>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Information</CardTitle>
                <CardDescription>Basic details about your brand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    placeholder="Enter your brand name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Brand Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your brand, mission, and values"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Collapsible open={logoAssetsOpen} onOpenChange={setLogoAssetsOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Logo & Assets
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${logoAssetsOpen ? "rotate-180" : ""}`}
                      />
                    </CardTitle>
                    <CardDescription>Upload your brand logo and other visual assets</CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      onFileRemove={handleFileRemove}
                      uploadedFiles={uploadedFiles}
                      acceptedTypes={["image/svg+xml", "image/png", "image/jpeg"]}
                      maxSize={10}
                      label="Brand Logo"
                      description="Upload your primary logo (SVG, PNG, or JPG)"
                      type="logo"
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={colorPaletteOpen} onOpenChange={setColorPaletteOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Color Palette
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${colorPaletteOpen ? "rotate-180" : ""}`}
                      />
                    </CardTitle>
                    <CardDescription>Define your brand colors</CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <ColorPalettePicker colors={colors} onColorsChange={setColors} maxColors={8} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={brandVoiceOpen} onOpenChange={setBrandVoiceOpen}>
              <div className="relative">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="absolute top-4 right-4 z-10 h-8 w-8 p-0 hover:bg-gray-100"
                    aria-label={brandVoiceOpen ? "Collapse brand voice" : "Expand brand voice"}
                  >
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

            {/* Download Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleDownloadBrandKit}
                disabled={!brandName.trim()}
                className="h-12 px-8 text-lg"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Brand Kit
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
