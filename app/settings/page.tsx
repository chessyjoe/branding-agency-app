"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Settings,
  User,
  Key,
  Bell,
  Palette,
  BarChart3,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
} from "lucide-react"

interface UserSettings {
  user: {
    id: string
    name: string
    email: string
    avatar: string
  }
  preferences: {
    defaultModel: string
    autoSave: boolean
    highQuality: boolean
    notifications: {
      email: boolean
      push: boolean
      marketing: boolean
    }
    theme: string
    language: string
  }
  apiKeys: Array<{
    id: string
    name: string
    provider: string
    keyPreview: string
    status: string
    lastUsed: string
    createdAt: string
  }>
  usage: {
    currentPeriod: {
      imagesGenerated: number
      videosGenerated: number
      codeGenerated: number
      slogansGenerated: number
    }
    limits: {
      imagesPerMonth: number
      videosPerMonth: number
      codePerMonth: number
      slogansPerMonth: number
    }
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState({ name: "", provider: "", key: "" })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [profileOpen, setProfileOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [addApiKeyOpen, setAddApiKeyOpen] = useState(false)
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [usageOpen, setUsageOpen] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/settings")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
      } else {
        // Use fallback data if available
        if (data.data) {
          setSettings(data.data)
        } else {
          throw new Error(data.error || "Failed to load settings")
        }
      }
    } catch (error) {
      console.error("Error fetching user settings:", error)
      setMessage({ type: "error", text: "Failed to load settings. Using default values." })

      // Set default settings as fallback
      setSettings({
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
        apiKeys: [],
        usage: {
          currentPeriod: {
            imagesGenerated: 0,
            videosGenerated: 0,
            codeGenerated: 0,
            slogansGenerated: 0,
          },
          limits: {
            imagesPerMonth: 100,
            videosPerMonth: 25,
            codePerMonth: 20,
            slogansPerMonth: 50,
          },
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Settings saved successfully!" })
      } else {
        throw new Error(data.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      setMessage({ type: "error", text: "Failed to save settings. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: string, value: any) => {
    if (!settings) return

    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: value,
      },
    })
  }

  const updateNotification = (key: string, value: boolean) => {
    if (!settings) return

    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        notifications: {
          ...settings.preferences.notifications,
          [key]: value,
        },
      },
    })
  }

  const addApiKey = async () => {
    if (!newApiKey.name || !newApiKey.provider || !newApiKey.key) {
      setMessage({ type: "error", text: "Please fill in all API key fields." })
      return
    }

    const newKey = {
      id: Date.now().toString(),
      name: newApiKey.name,
      provider: newApiKey.provider,
      keyPreview: `${newApiKey.key.slice(0, 8)}...${newApiKey.key.slice(-6)}`,
      status: "active",
      lastUsed: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    if (settings) {
      setSettings({
        ...settings,
        apiKeys: [...settings.apiKeys, newKey],
      })
    }

    setNewApiKey({ name: "", provider: "", key: "" })
    setMessage({ type: "success", text: "API key added successfully!" })
  }

  const removeApiKey = (keyId: string) => {
    if (!settings) return

    setSettings({
      ...settings,
      apiKeys: settings.apiKeys.filter((key) => key.id !== keyId),
    })
    setMessage({ type: "success", text: "API key removed successfully!" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load settings</h3>
            <p className="text-gray-600 mb-4">There was an error loading your settings.</p>
            <Button onClick={loadSettings}>Try Again</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Settings className="h-10 w-10 text-blue-600" />
              Settings
            </h1>
            <p className="text-xl text-gray-600">Manage your account preferences and API configurations.</p>
          </div>

          {/* Message Alert */}
          {message && (
            <Alert
              className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Palette className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="api-keys">
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="usage">
                <BarChart3 className="h-4 w-4 mr-2" />
                Usage
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        Profile Information
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={settings.user.avatar || "/placeholder.svg"}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <Button variant="outline" size="sm">
                          Change Avatar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={settings.user.name}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                user: { ...settings.user, name: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.user.email}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                user: { ...settings.user, email: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Collapsible open={preferencesOpen} onOpenChange={setPreferencesOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        Generation Preferences
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${preferencesOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="defaultModel">Default AI Model</Label>
                        <Select
                          value={settings.preferences.defaultModel}
                          onValueChange={(value) => updatePreference("defaultModel", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                            <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
                            <SelectItem value="midjourney">Midjourney</SelectItem>
                            <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="theme">Theme</Label>
                        <Select
                          value={settings.preferences.theme}
                          onValueChange={(value) => updatePreference("theme", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={settings.preferences.language}
                          onValueChange={(value) => updatePreference("language", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="autoSave">Auto-save generations</Label>
                            <p className="text-sm text-gray-500">Automatically save all generated content</p>
                          </div>
                          <Switch
                            id="autoSave"
                            checked={settings.preferences.autoSave}
                            onCheckedChange={(checked) => updatePreference("autoSave", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="highQuality">High quality mode</Label>
                            <p className="text-sm text-gray-500">Generate higher quality images (uses more credits)</p>
                          </div>
                          <Switch
                            id="highQuality"
                            checked={settings.preferences.highQuality}
                            onCheckedChange={(checked) => updatePreference("highQuality", checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Collapsible open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        Notification Preferences
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${notificationsOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailNotifications">Email notifications</Label>
                          <p className="text-sm text-gray-500">Receive updates about your generations</p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={settings.preferences.notifications.email}
                          onCheckedChange={(checked) => updateNotification("email", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="pushNotifications">Push notifications</Label>
                          <p className="text-sm text-gray-500">Get notified when generations are complete</p>
                        </div>
                        <Switch
                          id="pushNotifications"
                          checked={settings.preferences.notifications.push}
                          onCheckedChange={(checked) => updateNotification("push", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="marketingNotifications">Marketing emails</Label>
                          <p className="text-sm text-gray-500">Receive tips, updates, and promotional content</p>
                        </div>
                        <Switch
                          id="marketingNotifications"
                          checked={settings.preferences.notifications.marketing}
                          onCheckedChange={(checked) => updateNotification("marketing", checked)}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api-keys">
              <div className="space-y-6">
                <Collapsible open={addApiKeyOpen} onOpenChange={setAddApiKeyOpen}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                          Add New API Key
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${addApiKeyOpen ? "rotate-180" : ""}`}
                          />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="keyName">Key Name</Label>
                            <Input
                              id="keyName"
                              placeholder="e.g., OpenAI Production"
                              value={newApiKey.name}
                              onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="provider">Provider</Label>
                            <Select
                              value={newApiKey.provider}
                              onValueChange={(value) => setNewApiKey({ ...newApiKey, provider: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="anthropic">Anthropic</SelectItem>
                                <SelectItem value="google">Google</SelectItem>
                                <SelectItem value="cohere">Cohere</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                              id="apiKey"
                              type="password"
                              placeholder="Enter your API key"
                              value={newApiKey.key}
                              onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button onClick={addApiKey} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add API Key
                        </Button>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                <Collapsible open={apiKeysOpen} onOpenChange={setApiKeysOpen}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                          Your API Keys
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${apiKeysOpen ? "rotate-180" : ""}`}
                          />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        {settings.apiKeys.length === 0 ? (
                          <div className="text-center py-8">
                            <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500">No API keys configured yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {settings.apiKeys.map((apiKey) => (
                              <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{apiKey.name}</h4>
                                    <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>
                                      {apiKey.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500 mb-1">Provider: {apiKey.provider}</p>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {showApiKey === apiKey.id ? "sk-1234567890abcdef..." : apiKey.keyPreview}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                                    >
                                      {showApiKey === apiKey.id ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeApiKey(apiKey.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage">
              <Collapsible open={usageOpen} onOpenChange={setUsageOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        Usage Statistics
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${usageOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Images Generated</span>
                              <span className="text-sm text-gray-500">
                                {settings.usage.currentPeriod.imagesGenerated} / {settings.usage.limits.imagesPerMonth}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(settings.usage.currentPeriod.imagesGenerated / settings.usage.limits.imagesPerMonth) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Videos Generated</span>
                              <span className="text-sm text-gray-500">
                                {settings.usage.currentPeriod.videosGenerated} / {settings.usage.limits.videosPerMonth}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${(settings.usage.currentPeriod.videosGenerated / settings.usage.limits.videosPerMonth) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Code Generated</span>
                              <span className="text-sm text-gray-500">
                                {settings.usage.currentPeriod.codeGenerated} / {settings.usage.limits.codePerMonth}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${(settings.usage.currentPeriod.codeGenerated / settings.usage.limits.codePerMonth) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Slogans Generated</span>
                              <span className="text-sm text-gray-500">
                                {settings.usage.currentPeriod.slogansGenerated} /{" "}
                                {settings.usage.limits.slogansPerMonth}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{
                                  width: `${(settings.usage.currentPeriod.slogansGenerated / settings.usage.limits.slogansPerMonth) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Alert className="mt-6">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Usage resets on the 1st of each month. Upgrade your plan for higher limits.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <Button onClick={saveSettings} disabled={saving} size="lg">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
