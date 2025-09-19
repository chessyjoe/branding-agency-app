"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useGalleryState } from "@/hooks/use-gallery-state"
import { ErrorBoundary } from "@/components/error-boundary"
import { LazyImage } from "@/components/lazy-image"
import { InfiniteScroll } from "@/components/infinite-scroll"
import {
  GalleryThumbnailsIcon as Gallery,
  Search,
  Download,
  Heart,
  Bookmark,
  Eye,
  Calendar,
  Palette,
  Sparkles,
  Grid3X3,
  List,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

function GalleryContent() {
  const { user, loading: authLoading } = useAuth()
  const {
    images,
    loading,
    error,
    hasMore,
    loadMore,
    toggleFavorite,
    toggleTemplate,
    incrementDownloadCount,
    retryLastOperation,
    clearError,
  } = useGalleryState()

  const [filteredItems, setFilteredItems] = useState(images)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("newest")

  // Filter and search logic
  useEffect(() => {
    let filtered = images

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((item) => item.type === selectedType)
    }

    // Special filters
    if (selectedFilter === "templates") {
      filtered = filtered.filter((item) => item.isTemplate || item.is_template)
    } else if (selectedFilter === "favorites") {
      filtered = filtered.filter((item) => item.isFavorite || item.is_favorite)
    } else if (selectedFilter === "auto-saved") {
      filtered = filtered.filter((item) => item.isAutoSaved)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
        case "oldest":
          return new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime()
        case "most-downloaded":
          return (b.downloadCount || b.download_count || 0) - (a.downloadCount || a.download_count || 0)
        case "alphabetical":
          return (a.title || "").localeCompare(b.title || "")
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
  }, [images, searchQuery, selectedType, selectedFilter, sortBy])

  const handleToggleFavorite = async (itemId: string) => {
    await toggleFavorite(itemId)
  }

  const handleToggleTemplate = async (itemId: string) => {
    await toggleTemplate(itemId)
  }

  const handleDownload = async (item: any) => {
    try {
      // Increment download count in shared state
      incrementDownloadCount(item.id)

      // Handle download based on type
      if (item.type === "website") {
        // Download HTML file
        const blob = new Blob([item.code || ""], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${(item.title || "website").replace(/\s+/g, "_")}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Use the download API endpoint for images
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
        const filename = `${item.type}-${timestamp}.png`
        const downloadUrl = `/api/download-image?url=${encodeURIComponent(item.imageUrl || item.image_url)}&filename=${encodeURIComponent(filename)}`

        const link = document.createElement("a")
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "logo":
        return <Sparkles className="h-4 w-4" />
      case "banner":
        return <Gallery className="h-4 w-4" />
      case "poster":
        return <Gallery className="h-4 w-4" />
      case "business-card":
        return <Gallery className="h-4 w-4" />
      case "website":
        return <Eye className="h-4 w-4" />
      default:
        return <Gallery className="h-4 w-4" />
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
            <Gallery className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your gallery</h3>
            <p className="text-gray-600 mb-6">
              You need to be signed in to access your generated content and templates.
            </p>
            <Button onClick={() => (window.location.href = "/auth/login")}>Sign In</Button>
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
              <Gallery className="h-10 w-10 text-blue-600" />
              Gallery & Templates
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse your generated content, manage templates, and reuse your best designs. Everything is automatically
              saved for easy access.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={clearError}>
                    Dismiss
                  </Button>
                  <Button size="sm" onClick={retryLastOperation}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters and Search */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by title, prompt, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Type Filter */}
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="logo">Logos</SelectItem>
                      <SelectItem value="banner">Banners</SelectItem>
                      <SelectItem value="poster">Posters</SelectItem>
                      <SelectItem value="business-card">Business Cards</SelectItem>
                      <SelectItem value="website">Websites</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Special Filters */}
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="templates">Templates</SelectItem>
                      <SelectItem value="favorites">Favorites</SelectItem>
                      <SelectItem value="auto-saved">Auto-Saved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 items-center">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="most-downloaded">Most Downloaded</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode */}
                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t text-sm text-gray-600">
                <span>Total: {filteredItems.length} items</span>
                <span>Templates: {filteredItems.filter((item) => item.isTemplate || item.is_template).length}</span>
                <span>Favorites: {filteredItems.filter((item) => item.isFavorite || item.is_favorite).length}</span>
                <span>Auto-Saved: {filteredItems.filter((item) => item.isAutoSaved).length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Grid/List with Infinite Scroll */}
          {loading && filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your gallery...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Gallery className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 text-center max-w-md">
                  {searchQuery || selectedType !== "all" || selectedFilter !== "all"
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Start generating content to build your gallery. Everything will be automatically saved here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <InfiniteScroll hasMore={hasMore} loading={loading} onLoadMore={loadMore}>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        {/* Image/Preview */}
                        <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                          {item.type === "website" ? (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                              <Eye className="h-12 w-12 text-blue-600" />
                            </div>
                          ) : (
                            <LazyImage
                              src={item.imageUrl || item.image_url || "/placeholder.svg"}
                              alt={item.title || item.prompt}
                              className="w-full h-full group-hover:scale-105 transition-transform"
                              placeholder="/placeholder.svg?height=300&width=300&text=Loading"
                            />
                          )}

                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleDownload(item)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleToggleFavorite(item.id)}
                              className={item.isFavorite || item.is_favorite ? "text-red-500" : ""}
                            >
                              <Heart
                                className={`h-4 w-4 ${item.isFavorite || item.is_favorite ? "fill-current" : ""}`}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleToggleTemplate(item.id)}
                              className={item.isTemplate || item.is_template ? "text-blue-500" : ""}
                            >
                              <Bookmark
                                className={`h-4 w-4 ${item.isTemplate || item.is_template ? "fill-current" : ""}`}
                              />
                            </Button>
                          </div>

                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex gap-1">
                            {item.isAutoSaved && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                Auto-Saved
                              </Badge>
                            )}
                            {(item.isTemplate || item.is_template) && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Template
                              </Badge>
                            )}
                            {(item.isFavorite || item.is_favorite) && (
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                Favorite
                              </Badge>
                            )}
                          </div>

                          {/* Download Count */}
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs bg-black/20 text-white">
                              {item.downloadCount || item.download_count || 0} <Download className="h-3 w-3 ml-1" />
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(item.type)}
                            <h3 className="font-semibold text-gray-900 truncate">
                              {item.title || item.prompt.slice(0, 30) + "..."}
                            </h3>
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.prompt}</p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>

                          {/* Colors */}
                          {item.colors && item.colors.length > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                              <Palette className="h-3 w-3 text-gray-400" />
                              <div className="flex gap-1">
                                {item.colors.map((color) => (
                                  <div
                                    key={color}
                                    className="w-4 h-4 rounded-full border border-gray-200"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.createdAt || item.created_at)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {item.model}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* List View with similar optimizations */
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                              {item.type === "website" ? (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                                  <Eye className="h-8 w-8 text-blue-600" />
                                </div>
                              ) : (
                                <LazyImage
                                  src={item.imageUrl || item.image_url || "/placeholder.svg"}
                                  alt={item.title || item.prompt}
                                  className="w-full h-full"
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(item.type)}
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {item.title || item.prompt.slice(0, 50) + "..."}
                                </h3>
                                <div className="flex gap-1">
                                  {item.isAutoSaved && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                      Auto-Saved
                                    </Badge>
                                  )}
                                  {(item.isTemplate || item.is_template) && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                      Template
                                    </Badge>
                                  )}
                                  {(item.isFavorite || item.is_favorite) && (
                                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                      Favorite
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleDownload(item)}>
                                  <Download className="h-4 w-4 mr-1" />
                                  {item.downloadCount || item.download_count || 0}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleFavorite(item.id)}
                                  className={item.isFavorite || item.is_favorite ? "text-red-500 border-red-200" : ""}
                                >
                                  <Heart
                                    className={`h-4 w-4 ${item.isFavorite || item.is_favorite ? "fill-current" : ""}`}
                                  />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleTemplate(item.id)}
                                  className={item.isTemplate || item.is_template ? "text-blue-500 border-blue-200" : ""}
                                >
                                  <Bookmark
                                    className={`h-4 w-4 ${item.isTemplate || item.is_template ? "fill-current" : ""}`}
                                  />
                                </Button>
                              </div>
                            </div>

                            <p className="text-gray-600 mb-3">{item.prompt}</p>

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(item.createdAt || item.created_at)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {item.model}
                              </Badge>
                              {item.colors && item.colors.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Palette className="h-4 w-4" />
                                  <div className="flex gap-1">
                                    {item.colors.map((color) => (
                                      <div
                                        key={color}
                                        className="w-4 h-4 rounded-full border border-gray-200"
                                        style={{ backgroundColor: color }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1 mt-3">
                              {item.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </InfiniteScroll>
          )}
        </div>
      </main>
    </div>
  )
}

export default function GalleryPage() {
  return (
    <ErrorBoundary>
      <GalleryContent />
    </ErrorBoundary>
  )
}
