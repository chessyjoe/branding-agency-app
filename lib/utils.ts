import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if a hostname is allowed based on a strict allowlist.
 * - Normalizes to punycode, lowercases, strips trailing dot.
 * - Allows exact matches or direct subdomains (e.g., foo.example.com for example.com).
 * - Prevents tricks like attacker.com.example.com or unicode bypasses.
 *
 * @param {string} hostname - The hostname to check (not a full URL).
 * @param {string[]} allowedDomains - List of allowed domains (should be normalized, e.g., no trailing dot).
 * @returns {boolean} True if allowed, false otherwise.
 */
import punycode from "punycode/";

export function isAllowedDomain(hostname: string, allowedDomains: string[]): boolean {
  if (!hostname) return false;
  // Normalize: lowercase, strip trailing dot, punycode
  let normalized = hostname.trim().replace(/\.$/, "").toLowerCase();
  try {
    normalized = punycode.toASCII(normalized);
  } catch {
    // If punycode conversion fails, reject
    return false;
  }
  for (const domain of allowedDomains) {
    const normDomain = punycode.toASCII(domain.toLowerCase().replace(/\.$/, ""));
    if (normalized === normDomain) return true;
    // Direct subdomain only (e.g., foo.example.com, not foo.bar.example.com unless you want to allow that)
    if (normalized.endsWith("." + normDomain)) {
      const sub = normalized.slice(0, -normDomain.length - 1);
      if (!sub.includes(".")) return true; // Only one dot before domain
    }
  }
  return false;
}

/**
 * Validate and sanitize a string input.
 * - Trims, checks type, enforces max length, and optional pattern.
 */
export function validateString(input: any, maxLength = 1000, pattern?: RegExp): string {
  if (typeof input !== "string") throw new Error("Input must be a string");
  let str = input.trim();
  if (str.length > maxLength) throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  if (pattern && !pattern.test(str)) throw new Error("Input does not match required pattern");
  // Remove potentially dangerous characters
  str = str.replace(/[<>"'&]/g, "");
  return str;
}

/**
 * Validate a number input with optional min/max.
 */
export function validateNumber(input: any, min?: number, max?: number): number {
  const num = Number(input);
  if (isNaN(num)) throw new Error("Input must be a number");
  if (min !== undefined && num < min) throw new Error(`Number must be >= ${min}`);
  if (max !== undefined && num > max) throw new Error(`Number must be <= ${max}`);
  return num;
}

/**
 * Validate an array input with optional item validation and length limits.
 */
export function validateArray<T>(input: any, itemValidator?: (item: any) => T, minLen = 0, maxLen = 1000): T[] {
  if (!Array.isArray(input)) throw new Error("Input must be an array");
  if (input.length < minLen) throw new Error(`Array must have at least ${minLen} items`);
  if (input.length > maxLen) throw new Error(`Array must have at most ${maxLen} items`);
  if (itemValidator) return input.map(itemValidator);
  return input;
}

/**
 * Validate an object input (basic type check).
 */
export function validateObject(input: any): Record<string, any> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw new Error("Input must be an object");
  return input;
}

/**
 * Validate a URL input using the robust domain allowlist utility if needed.
 */
export function validateUrl(input: any, allowedDomains?: string[]): string {
  if (typeof input !== "string") throw new Error("URL must be a string");
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL format");
  }
  if (allowedDomains && !isAllowedDomain(url.hostname, allowedDomains)) {
    throw new Error("URL domain not allowed");
  }
  return url.toString();
}

/**
 * Validate an email address (simple regex, not RFC exhaustive).
 */
export function validateEmail(input: any): string {
  if (typeof input !== "string") throw new Error("Email must be a string");
  const email = input.trim().toLowerCase();
  const emailPattern = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email)) throw new Error("Invalid email address");
  return email;
}
