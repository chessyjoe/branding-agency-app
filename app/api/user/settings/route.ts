import { type NextRequest, NextResponse } from "next/server"

// Mock user settings data
const mockSettings = {
  user: {
    id: "demo-user",
    name: "Demo User",
    email: "demo@example.com",
    avatar: "/placeholder-user.jpg",
  },
  preferences: {
    defaultModel: "dall-e-3",
    autoSave: true,
    highQuality: true,
    notifications: {
      email: true,
      push: false,
      marketing: false,
    },
    theme: "light",
    language: "en",
  },
  apiKeys: [
    {
      id: "1",
      name: "OpenAI API Key",
      provider: "openai",
      keyPreview: "sk-...abc123",
      status: "active",
      lastUsed: "2024-01-15T10:30:00Z",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Anthropic API Key",
      provider: "anthropic",
      keyPreview: "ant-...def456",
      status: "active",
      lastUsed: "2024-01-14T15:45:00Z",
      createdAt: "2024-01-05T00:00:00Z",
    },
  ],
  usage: {
    currentPeriod: {
      imagesGenerated: 45,
      videosGenerated: 12,
      codeGenerated: 8,
      slogansGenerated: 23,
    },
    limits: {
      imagesPerMonth: 100,
      videosPerMonth: 25,
      codePerMonth: 20,
      slogansPerMonth: 50,
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    return NextResponse.json({
      success: true,
      data: mockSettings,
    })
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load settings",
        data: mockSettings, // Return mock data as fallback
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Simulate saving settings
    await new Promise((resolve) => setTimeout(resolve, 200))

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: { ...mockSettings, ...body },
    })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
      },
      { status: 500 },
    )
  }
}
