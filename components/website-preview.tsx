"use client"

interface WebsitePreviewProps {
  businessInfo: {
    name: string
    industry: string
    description: string
    targetAudience: string
    features: string
  }
  colors: string[]
  websiteType: string
}

export function WebsitePreview({ businessInfo, colors, websiteType }: WebsitePreviewProps) {
  const primaryColor = colors[0] || "#2563eb"
  const secondaryColor = colors[1] || "#1e40af"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-sm">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold" style={{ color: primaryColor }}>
              {businessInfo.name}
            </h1>
            <nav className="hidden md:flex space-x-4 text-sm">
              <a href="#home" className="text-gray-600 hover:text-gray-900">
                Home
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">
                About
              </a>
              <a href="#services" className="text-gray-600 hover:text-gray-900">
                Services
              </a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">
                Contact
              </a>
            </nav>
            <button className="md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Welcome to {businessInfo.name}</h2>
          <p className="text-base text-gray-600 mb-6 max-w-xl mx-auto">
            {businessInfo.description || "Your trusted partner for innovative solutions"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="px-6 py-2 text-sm rounded-md text-white font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Get Started
            </button>
            <button
              className="px-6 py-2 text-sm rounded-md border-2 bg-transparent font-medium"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Our {businessInfo.industry || "Professional"} Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                <h4 className="text-base font-semibold">Service 1</h4>
              </div>
              <p className="text-gray-600 text-sm">Professional service tailored to your specific needs.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: secondaryColor }}></div>
                <h4 className="text-base font-semibold">Service 2</h4>
              </div>
              <p className="text-gray-600 text-sm">Innovative solutions for modern challenges.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                <h4 className="text-base font-semibold">Service 3</h4>
              </div>
              <p className="text-gray-600 text-sm">Expert support and consultation services.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-4" style={{ backgroundColor: primaryColor }}>
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 text-white">Ready to Get Started?</h3>
          <p className="text-base text-white/90 mb-6 max-w-xl mx-auto">
            Contact us today to learn more about our services.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="px-6 py-2 text-sm border-2 border-white text-white hover:bg-white bg-transparent rounded-md font-medium">
              Contact Us
            </button>
            <button
              className="px-6 py-2 text-sm bg-white hover:bg-gray-100 rounded-md font-medium"
              style={{ color: primaryColor }}
            >
              Get Quote
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="text-base font-bold mb-3">{businessInfo.name}</h4>
              <p className="text-gray-400 text-xs">
                {businessInfo.description || "Your trusted partner for innovative solutions"}
              </p>
            </div>
            <div>
              <h4 className="text-base font-bold mb-3">Services</h4>
              <ul className="space-y-1 text-gray-400 text-xs">
                <li>
                  <a href="#" className="hover:text-white">
                    Service 1
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Service 2
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Service 3
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold mb-3">Company</h4>
              <ul className="space-y-1 text-gray-400 text-xs">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold mb-3">Contact</h4>
              <div className="space-y-1 text-gray-400 text-xs">
                <p>Email: info@{businessInfo.name.toLowerCase().replace(/\s+/g, "")}.com</p>
                <p>Phone: (555) 123-4567</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-400 text-xs">
            <p>&copy; 2024 {businessInfo.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
