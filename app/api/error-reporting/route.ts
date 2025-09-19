import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/lib/auth-utils"

interface ErrorReport {
  errorId: string
  message: string
  stack?: string
  componentStack?: string
  level: string
  timestamp: string
  userAgent: string
  url: string
  userId: string
}

export async function POST(request: NextRequest) {
  const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"

  // Rate limit error reports to prevent spam
  if (!rateLimiter.checkLimit(`error-report-${clientIP}`, 10, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const errorReport: ErrorReport = await request.json()

    // Validate required fields
    if (!errorReport.errorId || !errorReport.message || !errorReport.level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Log error to console (in production, you'd send to a monitoring service)
    console.error(`[ERROR REPORT] ${errorReport.level.toUpperCase()}:`, {
      id: errorReport.errorId,
      message: errorReport.message,
      url: errorReport.url,
      userId: errorReport.userId,
      timestamp: errorReport.timestamp,
      userAgent: errorReport.userAgent,
      stack: errorReport.stack?.substring(0, 1000), // Truncate stack trace
      componentStack: errorReport.componentStack?.substring(0, 500),
    })

    // In production, you would:
    // 1. Send to error monitoring service (Sentry, LogRocket, etc.)
    // 2. Store in database for analysis
    // 3. Send alerts for critical errors
    // 4. Aggregate error patterns

    // Example: Send to external monitoring service
    // await sendToMonitoringService(errorReport)

    return NextResponse.json({
      success: true,
      errorId: errorReport.errorId,
      message: "Error report received",
    })
  } catch (error) {
    console.error("Failed to process error report:", error)
    return NextResponse.json({ error: "Failed to process error report" }, { status: 500 })
  }
}

// Helper function for external monitoring service integration
async function sendToMonitoringService(errorReport: ErrorReport) {
  // Example integration with Sentry, LogRocket, or similar service
  // This would be implemented based on your chosen monitoring solution

  try {
    // Example: Sentry integration
    // Sentry.captureException(new Error(errorReport.message), {
    //   tags: {
    //     level: errorReport.level,
    //     errorId: errorReport.errorId,
    //   },
    //   extra: {
    //     componentStack: errorReport.componentStack,
    //     url: errorReport.url,
    //     userId: errorReport.userId,
    //   },
    // })

    console.log("Would send to monitoring service:", errorReport.errorId)
  } catch (error) {
    console.error("Failed to send to monitoring service:", error)
  }
}
