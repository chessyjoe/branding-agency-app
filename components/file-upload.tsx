"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, X, File, ImageIcon, AlertTriangle } from "lucide-react"

interface FileUploadProps {
  onFileUpload: (file: File, type: "reference" | "logo" | "content") => void
  onFileRemove: (type: "reference" | "logo" | "content") => void
  uploadedFiles: {
    reference?: File
    logo?: File
    content?: File
  }
  acceptedTypes: string[]
  maxSize: number
  label: string
  description: string
  type: "reference" | "logo" | "content"
}

export function FileUpload({
  onFileUpload,
  onFileRemove,
  uploadedFiles,
  acceptedTypes,
  maxSize,
  label,
  description,
  type,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validateFile = useCallback(
    async (file: File): Promise<string | null> => {
      // File size validation
      if (file.size > maxSize * 1024 * 1024) {
        return `File size must be less than ${maxSize}MB`
      }

      // File type validation
      if (!acceptedTypes.includes(file.type)) {
        return `Invalid file type. Allowed types: ${acceptedTypes.join(", ")}`
      }

      // File name validation
      const fileName = file.name
      if (fileName.length > 255) {
        return "File name is too long"
      }

      // Check for suspicious file extensions
      const suspiciousExtensions = [".exe", ".bat", ".cmd", ".scr", ".pif", ".com", ".jar", ".vbs", ".js"]
      const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf("."))
      if (suspiciousExtensions.includes(fileExtension)) {
        return "File type not allowed for security reasons"
      }

      // For images, validate file header (magic numbers)
      if (file.type.startsWith("image/")) {
        try {
          const buffer = await file.slice(0, 12).arrayBuffer()
          const bytes = new Uint8Array(buffer)

          // Check magic numbers for common image formats
          const isValidImage =
            // PNG
            (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
            // JPEG
            (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
            // WebP
            (bytes[0] === 0x52 &&
              bytes[1] === 0x49 &&
              bytes[2] === 0x46 &&
              bytes[3] === 0x46 &&
              bytes[8] === 0x57 &&
              bytes[9] === 0x45 &&
              bytes[10] === 0x42 &&
              bytes[11] === 0x50) ||
            // GIF
            (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46)

          if (!isValidImage) {
            return "Invalid image file format"
          }
        } catch (error) {
          return "Failed to validate image file"
        }
      }

      return null
    },
    [acceptedTypes, maxSize],
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        setIsValidating(true)
        setError(null)

        try {
          const validationError = await validateFile(file)
          if (validationError) {
            setError(validationError)
            return
          }

          setError(null)
          onFileUpload(file, type)
        } catch (error) {
          setError("Failed to validate file")
        } finally {
          setIsValidating(false)
        }
      }
    },
    [onFileUpload, type, validateFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: 1,
    disabled: isValidating,
  })

  const currentFile = uploadedFiles[type]

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-sm text-gray-500">{description}</p>

      {currentFile ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(currentFile)}
                <div>
                  <p className="text-sm font-medium">{currentFile.name}</p>
                  <p className="text-xs text-gray-500">{(currentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onFileRemove(type)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : isValidating
                ? "border-gray-300 bg-gray-50"
                : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          {isValidating ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">Validating file...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              {isDragActive ? (
                <p className="text-sm text-blue-600">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Drag & drop a file here, or click to select</p>
                  <p className="text-xs text-gray-500">Max size: {maxSize}MB</p>
                  <p className="text-xs text-gray-400 mt-1">Allowed: {acceptedTypes.join(", ")}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
