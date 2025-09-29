import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/hooks/use-auth"
import { GalleryStateProvider } from "@/hooks/use-gallery-state"
import "./globals.css"

// Fonts are provided by the `geist` package with default CSS variables

export const metadata: Metadata = {
  title: {
    default: "Branding Agency",
    template: "%s | Branding Agency",
  },
  description: "Create logos, posters, business cards, websites, and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  robots: {
    index: true,
    follow: true,
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body>
        <AuthProvider>
          <GalleryStateProvider>{children}</GalleryStateProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
