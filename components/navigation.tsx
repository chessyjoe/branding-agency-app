"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"
import {
  ChevronDown,
  Menu,
  Sparkles,
  ImageIcon,
  FileText,
  CreditCard,
  Globe,
  Video,
  Code,
  MessageSquare,
  Bookmark,
  FolderOpen,
  Package,
  Settings,
  Zap,
  User,
  LogOut,
  LogIn,
} from "lucide-react"

const navigationItems = {
  generators: {
    title: "Generators",
    icon: Sparkles,
    items: [
      { name: "Logo Generator", href: "/logo", icon: Sparkles, description: "Create professional logos" },
      { name: "Banner Generator", href: "/banner", icon: ImageIcon, description: "Design marketing banners" },
      { name: "Poster Generator", href: "/poster", icon: FileText, description: "Make event posters" },
      { name: "Business Cards", href: "/business-card", icon: CreditCard, description: "Professional business cards" },
    ],
  },
  advanced: {
    title: "Advanced Tools",
    icon: Zap,
    items: [
      { name: "Website Creator", href: "/website-creator", icon: Globe, description: "Build complete websites" },
      { name: "Video Developer", href: "/video-developer", icon: Video, description: "Create promotional videos" },
      { name: "Code Generator", href: "/code-generator", icon: Code, description: "Generate custom code" },
      { name: "Slogan Generator", href: "/slogan", icon: MessageSquare, description: "Craft catchy slogans" },
    ],
  },
  management: {
    title: "Management",
    icon: FolderOpen,
    items: [
      { name: "Gallery", href: "/gallery", icon: ImageIcon, description: "View all your creations" },
      { name: "Templates & History", href: "/templates", icon: Bookmark, description: "Saved templates and history" },
      { name: "Brand Kit", href: "/brand-kit", icon: Package, description: "Manage brand assets" },
    ],
  },
}

export function Navigation() {
  const { user, loading, signOut } = useAuth()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        const dropdownElement = dropdownRefs.current[openDropdown]
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdown(null)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openDropdown])

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null)
    setIsMobileOpen(false)
  }, [pathname])

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key)
  }

  const isActiveSection = (items: any[]) => {
    return items.some((item) => pathname === item.href)
  }

  const isActivePage = (href: string) => {
    return pathname === href
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BrandCraft</span>
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {Object.entries(navigationItems).map(([key, section]) => {
              const SectionIcon = section.icon
              const isActive = isActiveSection(section.items)

              return (
                <div key={key} className="relative" ref={(el) => (dropdownRefs.current[key] = el)}>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    onClick={() => toggleDropdown(key)}
                  >
                    <SectionIcon className="w-4 h-4" />
                    <span>{section.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${openDropdown === key ? "rotate-180" : ""}`}
                    />
                  </Button>

                  {openDropdown === key && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-slide-down">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                              isActivePage(item.href)
                                ? "bg-purple-50 text-purple-700"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            <ItemIcon className="w-4 h-4 flex-shrink-0" />
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Settings Link */}
            <Link href="/settings">
              <Button
                variant="ghost"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePage("/settings")
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </Link>

            {/* User Authentication */}
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
              {loading ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              ) : user ? (
                <div className="relative" ref={(el) => (dropdownRefs.current["user"] = el)}>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => toggleDropdown("user")}
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="max-w-32 truncate">{user.email}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${openDropdown === "user" ? "rotate-180" : ""}`}
                    />
                  </Button>

                  {openDropdown === "user" && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-slide-down">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                        <div className="text-xs text-gray-500">Signed in</div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <LogIn className="w-4 h-4" />
                      <span>Sign in</span>
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Open menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">BrandCraft</span>
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">AI</span>
                </div>

                {/* Mobile User Authentication */}
                {!loading && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                            <div className="text-xs text-gray-500">Signed in</div>
                          </div>
                        </div>
                        <Button
                          onClick={handleSignOut}
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center space-x-2 bg-transparent"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link href="/auth/login" className="block">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center space-x-2 bg-transparent"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>Sign in</span>
                          </Button>
                        </Link>
                        <Link href="/auth/sign-up" className="block">
                          <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                            Sign up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-6">
                  {Object.entries(navigationItems).map(([key, section]) => {
                    const SectionIcon = section.icon
                    return (
                      <div key={key}>
                        <div className="flex items-center space-x-2 mb-3 px-2">
                          <SectionIcon className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        </div>
                        <div className="space-y-1 ml-7">
                          {section.items.map((item) => {
                            const ItemIcon = item.icon
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                  isActivePage(item.href)
                                    ? "bg-purple-50 text-purple-700"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <ItemIcon className="w-4 h-4" />
                                <span>{item.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  <div className="border-t pt-4">
                    <Link
                      href="/settings"
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActivePage("/settings") ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
