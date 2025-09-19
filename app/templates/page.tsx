"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, Heart, Bookmark, Sparkles, ImageIcon, Calendar, Tag } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useGalleryState } from "@/hooks/use-gallery-state"

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth()
  const { images, loading, error, toggleFavorite, toggleTemplate, incrementDownloadCount } = useGalleryState()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedTab, setSelectedTab] = useState("all")

  // Filter images based on current tab and filters
  const filteredImages = images.filter((image) => {
    // Tab filter
    if (selectedTab === "templates" && !(image.is_template || image.isTemplate)) return false
    if (selectedTab === "favorites" && !(image.is_favorite || image.isFavorite)) return false

    // Type filter
    if (selectedType !== "all" && image.type !== selectedType) return false

    // Search filter
    if (
      searchTerm &&
      !(
        image.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    )
      return false

    return true
  })

  const handleDownload = async (imageUrl: string, type: string, id: string) => {
    try {
      // Increment download count in shared state
      incrementDownloadCount(id)

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const filename = `${type}-${timestamp}.png`

      const downloadUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleToggleTemplate = async (imageId: string) => {
    await toggleTemplate(imageId)
  }

  const handleToggleFavorite = async (imageId: string) => {
    await toggleFavorite(imageId)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "logo":
        return <Sparkles className="h-4 w-4" />
      case "banner":
        return <ImageIcon className="h-4 w-4" />
      case "poster":
        return <ImageIcon className="h-4 w-4" />
      case "business-card":
        return <ImageIcon className="h-4 w-4" />
      default:
        return <ImageIcon className="h-4 w-4" />
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your templates</h3>
            <p className="text-gray-600 mb-6">
              You need to be signed in to access your saved templates and generation history.
            </p>
            <Button onClick={() => (window.location.href = "/auth/login")}>Sign In</Button>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading images...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading templates</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Bookmark className="h-10 w-10 text-blue-600" />
              Templates & History
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse your generated images, save favorites as templates, and reuse successful designs.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Images</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by prompt or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="logo">Logos</SelectItem>
                  <SelectItem value="banner">Banners</SelectItem>
                  <SelectItem value="poster">Posters</SelectItem>
                  <SelectItem value="business-card">Business Cards</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Images Grid */}
          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
              <p className="text-gray-600">
                {selectedTab === "templates"
                  ? "You haven't saved any templates yet. Generate some images and save your favorites!"
                  : "Start generating some images to see them here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredImages.map((image) => (
                <Card key={image.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={image.image_url || "/placeholder.svg"}
                        alt={image.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {getTypeIcon(image.type)}
                          <span className="ml-1 capitalize">{image.type.replace("-", " ")}</span>
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        {(image.is_favorite || image.isFavorite) && (
                          <Badge variant="destructive" className="text-xs">
                            <Heart className="h-3 w-3" />
                          </Badge>
                        )}
                        {(image.is_template || image.isTemplate) && (
                          <Badge variant="default" className="text-xs">
                            <Bookmark className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{image.prompt}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(image.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {image.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {image.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {image.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{image.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(image.image_url, image.type, image.id)}
                          className="flex-1"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggleFavorite(image.id)}>
                          <Heart
                            className={`h-3 w-3 ${image.is_favorite || image.isFavorite ? "fill-current text-red-500" : ""}`}
                          />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggleTemplate(image.id)}>
                          <Bookmark
                            className={`h-3 w-3 ${image.is_template || image.isTemplate ? "fill-current text-blue-500" : ""}`}
                          />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
