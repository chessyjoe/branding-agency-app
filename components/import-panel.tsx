"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Upload, FolderOpen, ImageIcon, Layers } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import type { Layer } from "@/hooks/use-layer-system"
import type { ProjectData } from "./export-panel"

interface ImportPanelProps {
  onImportImage: (file: File, layerName?: string) => void
  onImportProject: (projectData: ProjectData) => void
  onImportLayers: (layers: Layer[]) => void
}

export function ImportPanel({ onImportImage, onImportProject, onImportLayers }: ImportPanelProps) {
  const [uploadedFiles, setUploadedFiles] = useState<{
    image?: File
    project?: File
  }>({})
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((file: File, type: "image" | "project") => {
    setUploadedFiles((prev) => ({ ...prev, [type]: file }))
  }, [])

  const handleFileRemove = useCallback((type: "image" | "project") => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev }
      delete newFiles[type]
      return newFiles
    })
  }, [])

  const handleImportImage = useCallback(async () => {
    const file = uploadedFiles.image
    if (!file) return

    setIsImporting(true)
    try {
      const layerName = file.name.replace(/\.[^/.]+$/, "") // Remove extension
      await onImportImage(file, layerName)
      setUploadedFiles((prev) => ({ ...prev, image: undefined }))
    } catch (error) {
      console.error("Image import failed:", error)
    } finally {
      setIsImporting(false)
    }
  }, [uploadedFiles.image, onImportImage])

  const handleImportProject = useCallback(async () => {
    const file = uploadedFiles.project
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const projectData: ProjectData = JSON.parse(text)
      await onImportProject(projectData)
      setUploadedFiles((prev) => ({ ...prev, project: undefined }))
    } catch (error) {
      console.error("Project import failed:", error)
    } finally {
      setIsImporting(false)
    }
  }, [uploadedFiles.project, onImportProject])

  const handleQuickImageImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const layerName = file.name.replace(/\.[^/.]+$/, "")
        onImportImage(file, layerName)
      }
    },
    [onImportImage],
  )

  const handleQuickProjectImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && file.type === "application/json") {
        file.text().then((text) => {
          try {
            const projectData: ProjectData = JSON.parse(text)
            onImportProject(projectData)
          } catch (error) {
            console.error("Invalid project file:", error)
          }
        })
      }
    },
    [onImportProject],
  )

  return (
    <div className="space-y-4">
      {/* Quick Import Buttons */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Quick Import</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start bg-transparent"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Add Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start bg-transparent"
            onClick={() => projectInputRef.current?.click()}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Open Project
          </Button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQuickImageImport} className="hidden" />
        <input
          ref={projectInputRef}
          type="file"
          accept=".json"
          onChange={handleQuickProjectImport}
          className="hidden"
        />
      </div>

      <Separator />

      {/* Detailed Image Import */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Import Image as Layer</Label>
        <FileUpload
          onFileUpload={(file) => handleImageUpload(file, "image")}
          onFileRemove={() => handleFileRemove("image")}
          uploadedFiles={{ image: uploadedFiles.image }}
          acceptedTypes={["image/png", "image/jpeg", "image/webp", "image/gif"]}
          maxSize={10}
          label=""
          description="Import an image as a new layer"
          type="image"
        />

        {uploadedFiles.image && (
          <Button onClick={handleImportImage} disabled={isImporting} className="w-full" size="sm">
            {isImporting ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 mr-2" />
                Create Layer
              </>
            )}
          </Button>
        )}
      </div>

      <Separator />

      {/* Project Import */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Import Project</Label>
        <FileUpload
          onFileUpload={(file) => handleImageUpload(file, "project")}
          onFileRemove={() => handleFileRemove("project")}
          uploadedFiles={{ project: uploadedFiles.project }}
          acceptedTypes={["application/json"]}
          maxSize={50}
          label=""
          description="Import a complete project with all layers"
          type="project"
        />

        {uploadedFiles.project && (
          <Button onClick={handleImportProject} disabled={isImporting} className="w-full" size="sm">
            {isImporting ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Project
              </>
            )}
          </Button>
        )}
      </div>

      {/* Import Tips */}
      <div className="text-xs text-slate-500 space-y-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="font-medium">Import Tips:</div>
        <div>• Images will be added as new layers</div>
        <div>• Projects include all layers and settings</div>
        <div>• Drag & drop images directly onto canvas</div>
        <div>• Supported: PNG, JPEG, WebP, GIF</div>
      </div>
    </div>
  )
}
