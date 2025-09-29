"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Download, Code, Sparkles, Copy, FileText, Terminal, ChevronDown } from "lucide-react"

const codeTypes = [
  { name: "Landing Page Component", value: "landing-component", description: "React component for landing pages" },
  { name: "API Integration", value: "api-integration", description: "Backend API endpoints and logic" },
  { name: "Database Schema", value: "database-schema", description: "SQL schema and migrations" },
  { name: "Authentication System", value: "auth-system", description: "Complete auth implementation" },
  { name: "Email Templates", value: "email-templates", description: "HTML email templates" },
  { name: "Custom Hook", value: "custom-hook", description: "Reusable React hooks" },
  { name: "Utility Functions", value: "utility-functions", description: "Helper functions and utilities" },
  { name: "Form Validation", value: "form-validation", description: "Form handling and validation" },
]

const languages = [
  { name: "TypeScript/React", value: "typescript-react" },
  { name: "JavaScript", value: "javascript" },
  { name: "Python", value: "python" },
  { name: "Node.js", value: "nodejs" },
  { name: "SQL", value: "sql" },
  { name: "HTML/CSS", value: "html-css" },
  { name: "PHP", value: "php" },
  { name: "Go", value: "go" },
]

const frameworks = [
  { name: "Next.js", value: "nextjs" },
  { name: "React", value: "react" },
  { name: "Vue.js", value: "vue" },
  { name: "Express.js", value: "express" },
  { name: "FastAPI", value: "fastapi" },
  { name: "Django", value: "django" },
  { name: "Laravel", value: "laravel" },
  { name: "None/Vanilla", value: "vanilla" },
]

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState("")
  const [codeType, setCodeType] = useState("landing-component")
  const [language, setLanguage] = useState("typescript-react")
  const [framework, setFramework] = useState("nextjs")
  const [requirements, setRequirements] = useState({
    functionality: "",
    styling: "",
    dependencies: "",
    performance: "",
    accessibility: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [documentation, setDocumentation] = useState("")
  const [tests, setTests] = useState("")
  const [technicalSpecsOpen, setTechnicalSpecsOpen] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          language,
          framework,
          requirements,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedCode(data.code)
        setDocumentation(data.documentation)
        setTests(data.tests)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Code className="h-8 w-8 text-teal-600" />
              <h1 className="text-3xl font-bold text-gray-900">Code Generator</h1>
              <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
            <p className="text-lg text-gray-600">
              Generate custom code solutions with OpenAI enhancement and best practices
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Code Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Requirements
                  </CardTitle>
                  <CardDescription>Specify what type of code you need and the technical requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="codeType">Code Type</Label>
                      <Select value={codeType} onValueChange={setCodeType}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {codeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.name}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="framework">Framework</Label>
                      <Select value={framework} onValueChange={setFramework}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frameworks.map((fw) => (
                            <SelectItem key={fw.value} value={fw.value}>
                              {fw.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="prompt">Detailed Description</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., Create a responsive contact form component with validation, email integration, success/error states, and accessibility features. Should include name, email, message fields with proper validation..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Technical Specifications */}
              <Collapsible open={technicalSpecsOpen} onOpenChange={setTechnicalSpecsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        Technical Specifications
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${technicalSpecsOpen ? "rotate-180" : ""}`}
                        />
                      </CardTitle>
                      <CardDescription>Provide specific technical requirements and constraints</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Functionality Requirements (e.g., real-time updates, data validation, API integration...)"
                        value={requirements.functionality}
                        onChange={(e) => setRequirements({ ...requirements, functionality: e.target.value })}
                        rows={2}
                      />

                      <Textarea
                        placeholder="Styling Requirements (e.g., Tailwind CSS, responsive design, dark mode support...)"
                        value={requirements.styling}
                        onChange={(e) => setRequirements({ ...requirements, styling: e.target.value })}
                        rows={2}
                      />

                      <Textarea
                        placeholder="Dependencies & Libraries (e.g., specific packages, avoid certain libraries...)"
                        value={requirements.dependencies}
                        onChange={(e) => setRequirements({ ...requirements, dependencies: e.target.value })}
                        rows={2}
                      />

                      <Textarea
                        placeholder="Performance Requirements (e.g., optimization needs, loading speed, memory usage...)"
                        value={requirements.performance}
                        onChange={(e) => setRequirements({ ...requirements, performance: e.target.value })}
                        rows={2}
                      />

                      <Textarea
                        placeholder="Accessibility Requirements (e.g., WCAG compliance, screen reader support, keyboard navigation...)"
                        value={requirements.accessibility}
                        onChange={(e) => setRequirements({ ...requirements, accessibility: e.target.value })}
                        rows={2}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Generate Button */}
              <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="w-full" size="lg">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Code</CardTitle>
                  <CardDescription>Your AI-generated code will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedCode || documentation || tests ? (
                    <Tabs defaultValue="code" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="code" className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          Code
                        </TabsTrigger>
                        <TabsTrigger value="docs" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Docs
                        </TabsTrigger>
                        <TabsTrigger value="tests" className="flex items-center gap-1">
                          <Terminal className="h-3 w-3" />
                          Tests
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="code" className="space-y-4">
                        {generatedCode ? (
                          <div className="space-y-4">
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2 z-10 bg-transparent"
                                onClick={() => copyToClipboard(generatedCode)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                                <pre className="text-sm">
                                  <code>{generatedCode}</code>
                                </pre>
                              </div>
                            </div>
                            <Button className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Download Code
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[200px]">
                            <div className="text-center">
                              <Code className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-gray-500 text-sm">Generated code will appear here</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="docs" className="space-y-4">
                        {documentation ? (
                          <div className="space-y-4">
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2 z-10 bg-transparent"
                                onClick={() => copyToClipboard(documentation)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <div className="bg-white p-4 rounded-lg border overflow-auto max-h-96">
                                <div className="prose prose-sm max-w-none">
                                  <pre className="whitespace-pre-wrap text-sm">{documentation}</pre>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[200px]">
                            <div className="text-center">
                              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-gray-500 text-sm">Documentation will appear here</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="tests" className="space-y-4">
                        {tests ? (
                          <div className="space-y-4">
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2 z-10 bg-transparent"
                                onClick={() => copyToClipboard(tests)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                                <pre className="text-sm">
                                  <code>{tests}</code>
                                </pre>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[200px]">
                            <div className="text-center">
                              <Terminal className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-gray-500 text-sm">Test code will appear here</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[300px]">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Your generated code will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Code Quality Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Code Quality Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <Badge variant="outline">✅</Badge>
                      <p>Best practices implementation</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">🔒</Badge>
                      <p>Security considerations</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">♿</Badge>
                      <p>Accessibility compliance</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">⚡</Badge>
                      <p>Performance optimized</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">📝</Badge>
                      <p>Comprehensive documentation</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">🧪</Badge>
                      <p>Unit tests included</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
