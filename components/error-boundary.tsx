"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, RefreshCw, Bug, Copy, Check } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: "page" | "component" | "critical"
}

const reportError = async (error: Error, errorInfo: React.ErrorInfo, level: string, errorId: string) => {
  const errorReport = {
    errorId,
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    level,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: localStorage.getItem("user_id") || "anonymous",
  }

  try {
    // Send to monitoring service
    await fetch("/api/error-reporting", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorReport),
    })
  } catch (reportingError) {
    console.error("Failed to report error:", reportingError)
  }

  // Also log to console for development
  console.group(`🚨 Error Boundary (${level})`)
  console.error("Error:", error)
  console.error("Error Info:", errorInfo)
  console.error("Error ID:", errorId)
  console.groupEnd()
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.setState({ errorInfo, errorId })

    // Report error
    reportError(error, errorInfo, this.props.level || "component", errorId)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.retryCount++
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          resetError={this.resetError}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          level={this.props.level}
        />
      )
    }

    return this.props.children
  }
}

function ErrorFallback({
  error,
  errorInfo,
  errorId,
  resetError,
  retryCount,
  maxRetries,
  level,
}: {
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
  resetError: () => void
  retryCount: number
  maxRetries: number
  level?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const [showDetails, setShowDetails] = React.useState(false)

  const copyErrorDetails = async () => {
    const details = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy error details:", err)
    }
  }

  const isPageLevel = level === "page" || level === "critical"
  const canRetry = retryCount < maxRetries

  return (
    <div
      className={`${isPageLevel ? "min-h-screen" : "min-h-64"} bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4`}
    >
      <Card className="w-full max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <Badge variant="destructive" className="text-xs">
              {level?.toUpperCase() || "ERROR"}
            </Badge>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isPageLevel ? "Application Error" : "Component Error"}
          </h3>

          <p className="text-gray-600 text-center mb-4">
            {error?.message || "An unexpected error occurred. Please try again."}
          </p>

          {errorId && (
            <div className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 px-2 py-1 rounded">
              Error ID: {errorId}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {canRetry && (
              <Button onClick={resetError} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
              </Button>
            )}

            <Button onClick={() => window.location.reload()}>Reload Page</Button>

            <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
              <Bug className="h-4 w-4 mr-2" />
              {showDetails ? "Hide" : "Show"} Details
            </Button>
          </div>

          {showDetails && (
            <div className="w-full max-w-lg">
              <div className="bg-gray-50 border rounded-lg p-4 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Error Details</span>
                  <Button size="sm" variant="ghost" onClick={copyErrorDetails} className="h-6 px-2">
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <div>
                    <strong>Message:</strong> {error?.message}
                  </div>
                  <div>
                    <strong>Location:</strong> {window.location.pathname}
                  </div>
                  <div>
                    <strong>Time:</strong> {new Date().toLocaleString()}
                  </div>
                  {error?.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!canRetry && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Maximum retry attempts reached. Please reload the page or contact support if the issue persists.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error, context?: string) => {
    // Report the error before throwing
    const errorId = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    reportError(error, { componentStack: context || "useErrorBoundary hook" } as React.ErrorInfo, "hook", errorId)

    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

export function GalleryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      level="component"
      fallback={({ error, resetError }) => (
        <Card className="m-4">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gallery Error</h3>
            <p className="text-gray-600 text-center mb-4">
              Failed to load gallery content. This might be due to a network issue or server error.
            </p>
            <Button onClick={resetError} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Gallery
            </Button>
          </CardContent>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function CanvasErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      level="component"
      fallback={({ error, resetError }) => (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Canvas Error</h3>
            <p className="text-sm mb-4">
              The image editor encountered an error. This might be due to browser compatibility or memory issues.
            </p>
            <Button onClick={resetError} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Canvas
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
