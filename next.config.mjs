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
    if (!isProd) return []
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'strict-dynamic' https: http:",
      "style-src 'self' 'unsafe-inline' https: http:",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https: http:",
      "font-src 'self' https: data:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
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
