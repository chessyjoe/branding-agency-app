"use client"

import React from "react"
import { useErrorMonitoring, useNetworkMonitoring } from "@/hooks/use-error-monitoring"

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useErrorMonitoring()
  useNetworkMonitoring()

  return <>{children}</>
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<{
    loadTime?: number
    renderTime?: number
    memoryUsage?: number
  }>({})

  React.useEffect(() => {
    // Measure page load time
    if ("performance" in window) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
      setMetrics((prev) => ({ ...prev, loadTime }))
    }

    // Measure memory usage (if available)
    if ("memory" in performance) {
      const memory = (performance as any).memory
      setMetrics((prev) => ({
        ...prev,
        memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      }))
    }

    // Measure render time
    const renderStart = Date.now()
    requestAnimationFrame(() => {
      const renderTime = Date.now() - renderStart
      setMetrics((prev) => ({ ...prev, renderTime }))
    })
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
      <div>Load: {metrics.loadTime}ms</div>
      <div>Render: {metrics.renderTime}ms</div>
      {metrics.memoryUsage && <div>Memory: {metrics.memoryUsage}MB</div>}
    </div>
  )
}
