/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Avoid eval in development to satisfy stricter CSPs
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = "source-map"
    }
    return config
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production"
    
    // CSP configuration that allows necessary functionality
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: https://cdn.tailwindcss.com",
      "script-src-elem 'self' 'unsafe-inline' https: http: data: https://cdn.tailwindcss.com",
      "style-src 'self' 'unsafe-inline' https: http: data: https://cdn.tailwindcss.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https: http:",
      "font-src 'self' https: data:",
      "frame-src 'self' data:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "media-src 'self' data: blob:",
    ].join('; ')
    
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
