"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { FixedSizeGrid as Grid } from "react-window"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LazyImage } from "@/components/lazy-image"
import { Download, Heart, Bookmark, Eye, Calendar, Palette } from "lucide-react"

interface GeneratedImage {
  id: string
  type: string
  prompt: string
  image_url: string
  colors: string[]
  is_template: boolean
  is_favorite: boolean
  tags: string[]
  created_at: string
  download_count?: number
  title?: string
  imageUrl?: string
  isTemplate?: boolean
  isFavorite?: boolean
  downloadCount?: number
  createdAt?: string
  model: string
}

interface VirtualGalleryGridProps {
  items: GeneratedImage[]
  onToggleFavorite: (id: string) => Promise<void>
  onToggleTemplate: (id: string) => Promise<void>
  onDownload: (item: GeneratedImage) => Promise<void>
  viewMode: "grid" | "list"
}

const GridItem = ({ columnIndex, rowIndex, style, data }: any) => {
  const { items, itemsPerRow, onToggleFavorite, onToggleTemplate, onDownload } = data
  const index = rowIndex * itemsPerRow + columnIndex
  const item = items[index]

  if (!item) {
    return <div style={style} />
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
      case "website":
        return <Eye className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  return (
    <div style={style} className="p-3">
      <Card className="group hover:shadow-lg transition-shadow h-full">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Image/Preview */}
          <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden flex-shrink-0">
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
              <Button size="sm" variant="secondary" onClick={() => onDownload(item)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onToggleFavorite(item.id)}
                className={item.isFavorite || item.is_favorite ? "text-red-500" : ""}
              >
                <Heart className={`h-4 w-4 ${item.isFavorite || item.is_favorite ? "fill-current" : ""}`} />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onToggleTemplate(item.id)}
                className={item.isTemplate || item.is_template ? "text-blue-500" : ""}
              >
                <Bookmark className={`h-4 w-4 ${item.isTemplate || item.is_template ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
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
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              {getTypeIcon(item.type)}
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {item.title || item.prompt.slice(0, 30) + "..."}
              </h3>
            </div>

            <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">{item.prompt}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 2}
                </Badge>
              )}
            </div>

            {/* Colors */}
            {item.colors && item.colors.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-3 w-3 text-gray-400" />
                <div className="flex gap-1">
                  {item.colors.slice(0, 4).map((color) => (
                    <div
                      key={color}
                      className="w-3 h-3 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
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
    </div>
  )
}

const MemoizedGridItem = ({ columnIndex, rowIndex, style, data }: any) => {
  const { items, itemsPerRow } = data
  const index = rowIndex * itemsPerRow + columnIndex
  const item = items[index]

  // Only re-render if the specific item changes
  return useMemo(() => {
    return <GridItem columnIndex={columnIndex} rowIndex={rowIndex} style={style} data={data} />
  }, [item?.id, item?.is_favorite, item?.is_template, item?.download_count, columnIndex, rowIndex, style, data])
}

export function VirtualGalleryGrid({
  items,
  onToggleFavorite,
  onToggleTemplate,
  onDownload,
  viewMode,
}: VirtualGalleryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const { itemsPerRow, itemWidth, itemHeight } = useMemo(() => {
    const minItemWidth = viewMode === "grid" ? 280 : 600
    const gap = 24
    const availableWidth = containerSize.width - gap

    if (availableWidth <= 0) return { itemsPerRow: 1, itemWidth: minItemWidth, itemHeight: 400 }

    const itemsPerRow = Math.max(1, Math.floor(availableWidth / (minItemWidth + gap)))
    const itemWidth = (availableWidth - (itemsPerRow - 1) * gap) / itemsPerRow
    const itemHeight = viewMode === "grid" ? itemWidth * 1.4 : 200

    return { itemsPerRow, itemWidth, itemHeight }
  }, [containerSize.width, viewMode])

  const rowCount = Math.ceil(items.length / itemsPerRow)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let timeoutId: NodeJS.Timeout

    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const entry = entries[0]
        if (entry) {
          const { width, height } = entry.contentRect
          setContainerSize({ width, height })
        }
      }, 100) // Debounce resize events
    })

    resizeObserver.observe(container)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [])

  const gridData = useMemo(
    () => ({
      items,
      itemsPerRow,
      onToggleFavorite,
      onToggleTemplate,
      onDownload,
    }),
    [items, itemsPerRow, onToggleFavorite, onToggleTemplate, onDownload],
  )

  if (containerSize.width === 0 || containerSize.height === 0) {
    return (
      <div ref={containerRef} className="w-full h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <Grid
        columnCount={itemsPerRow}
        columnWidth={itemWidth}
        height={containerSize.height}
        rowCount={rowCount}
        rowHeight={itemHeight}
        width={containerSize.width}
        itemData={gridData}
        overscanRowCount={2} // Pre-render 2 rows above/below viewport
        overscanColumnCount={1}
      >
        {MemoizedGridItem}
      </Grid>
    </div>
  )
}
