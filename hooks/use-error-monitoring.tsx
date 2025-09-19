"use client"

import { useEffect, useCallback } from "react"

interface ErrorMetrics {
  errorCount: number
  lastError?: Date
  errorTypes: Record<string, number>
}

export function useErrorMonitoring() {
  const reportClientError = useCallback(
    async (error: Error, context: string, level: "low" | "medium" | "high" | "critical" = "medium") => {
      const errorReport = {
        errorId: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: error.message,
        stack: error.stack,
        context,
        level,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem("user_id") || "anonymous",
      }

      try {
        await fetch("/api/error-reporting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(errorReport),
        })
      } catch (reportingError) {
        console.error("Failed to report client error:", reportingError)
      }
    },
    [],
  )

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)

      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

      reportClientError(error, "unhandled_promise_rejection", "high")
    }

    // Handle global JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("Global error:", event.error)

      const error = event.error instanceof Error ? event.error : new Error(event.message)

      reportClientError(error, "global_error", "high")
    }

    // Handle resource loading errors
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement
      if (target && (target.tagName === "IMG" || target.tagName === "SCRIPT" || target.tagName === "LINK")) {
        const error = new Error(`Failed to load resource: ${target.getAttribute("src") || target.getAttribute("href")}`)
        reportClientError(error, "resource_load_error", "medium")
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleGlobalError)
    document.addEventListener("error", handleResourceError, true)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleGlobalError)
      document.removeEventListener("error", handleResourceError, true)
    }
  }, [reportClientError])

  useEffect(() => {
    // Monitor long tasks that block the main thread
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            console.warn("Long task detected:", entry.duration + "ms")

            const error = new Error(`Long task detected: ${entry.duration}ms`)
            reportClientError(error, "performance_long_task", "low")
          }
        }
      })

      try {
        observer.observe({ entryTypes: ["longtask"] })
      } catch (e) {
        console.warn("Long task monitoring not supported")
      }

      return () => observer.disconnect()
    }
  }, [reportClientError])

  return {
    reportError: reportClientError,
  }
}

export function useNetworkMonitoring() {
  const reportNetworkError = useCallback(async (url: string, status: number, statusText: string, context: string) => {
    const error = new Error(`Network error: ${status} ${statusText} for ${url}`)

    const errorReport = {
      errorId: `network_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      context: `network_${context}`,
      level: status >= 500 ? "high" : "medium",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem("user_id") || "anonymous",
      networkDetails: {
        requestUrl: url,
        status,
        statusText,
      },
    }

    try {
      await fetch("/api/error-reporting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorReport),
      })
    } catch (reportingError) {
      console.error("Failed to report network error:", reportingError)
    }
  }, [])

  return {
    reportNetworkError,
  }
}
