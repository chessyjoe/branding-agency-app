import { Card, CardContent } from "@/components/ui/card"

export default function GalleryLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto mb-2" />
              <div className="h-4 w-12 bg-muted rounded animate-pulse mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-20 bg-muted rounded animate-pulse" />
      </div>

      {/* Gallery skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-48 bg-muted animate-pulse" />
            <CardContent className="p-4">
              <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse mb-3" />
              <div className="flex space-x-1 mb-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="w-4 h-4 bg-muted rounded-full animate-pulse" />
                ))}
              </div>
              <div className="flex space-x-1 mb-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-5 w-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
