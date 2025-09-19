import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Palette, Type, Image, Globe, Video, Code, Package, Zap, Users, Star, ArrowRight } from 'lucide-react'
import Link from "next/link"

const features = [
  {
    icon: Palette,
    title: "Logo Generator",
    description: "Create professional logos with AI-powered design tools",
    href: "/logo",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Type,
    title: "Slogan Creator",
    description: "Generate catchy slogans and taglines for your brand",
    href: "/slogan",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    icon: Image,
    title: "Banner Designer",
    description: "Design eye-catching banners for marketing campaigns",
    href: "/banner",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: Image,
    title: "Poster Creator",
    description: "Create stunning posters for events and promotions",
    href: "/poster",
    color: "text-pink-600",
    bgColor: "bg-pink-50"
  },
  {
    icon: Image,
    title: "Business Cards",
    description: "Design professional business cards that make an impression",
    href: "/business-card",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    icon: Package,
    title: "Brand Kit Builder",
    description: "Organize your complete brand identity in one place",
    href: "/brand-kit",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  },
  {
    icon: Globe,
    title: "Website Creator",
    description: "Build complete websites with AI assistance",
    href: "/website-creator",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50"
  },
  {
    icon: Video,
    title: "Video Developer",
    description: "Create engaging videos for your brand",
    href: "/video-developer",
    color: "text-red-600",
    bgColor: "bg-red-50"
  },
  {
    icon: Code,
    title: "Code Generator",
    description: "Generate code snippets and components",
    href: "/code-generator",
    color: "text-gray-600",
    bgColor: "bg-gray-50"
  }
]

const stats = [
  { label: "AI Models", value: "15+", icon: Zap },
  { label: "Happy Users", value: "10K+", icon: Users },
  { label: "Generations", value: "100K+", icon: Sparkles },
  { label: "Success Rate", value: "99%", icon: Star }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-4 w-4 mr-2" />
            Powered by Advanced AI
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Your Brand with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Magic
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your ideas into professional brand assets with our comprehensive AI-powered design suite. 
            From logos to websites, create everything you need to build a stunning brand identity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-12 px-8 text-lg" asChild>
              <Link href="/logo">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
              <Link href="/brand-kit">
                <Package className="mr-2 h-5 w-5" />
                Build Brand Kit
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Build Your Brand
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our comprehensive suite of AI tools helps you create professional brand assets in minutes, not hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${feature.bgColor}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-blue-50 transition-colors">
                  <Link href={feature.href}>
                    Get Started
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Brand?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are building amazing brands with our AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-lg" asChild>
              <Link href="/logo">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/brand-kit">
                View Examples
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
