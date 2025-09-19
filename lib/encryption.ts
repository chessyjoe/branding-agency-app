import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-character-secret-key-here"
const ALGORITHM = "aes-256-gcm"

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipherGCM(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"))
    cipher.setAAD(Buffer.from("additional-auth-data"))

    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag()

    // Combine iv, authTag, and encrypted data
    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":")
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format")
    }

    const iv = Buffer.from(parts[0], "hex")
    const authTag = Buffer.from(parts[1], "hex")
    const encrypted = parts[2]

    const decipher = crypto.createDecipherGCM(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"))
    decipher.setAAD(Buffer.from("additional-auth-data"))
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function validateAndSanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string")
  }

  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`)
  }

  // Remove potentially dangerous characters
  return input.replace(/[<>"'&]/g, "").trim()
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}
