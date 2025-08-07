/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    // In production, use environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
  // Ensure dynamic rendering for pages that need it
  trailingSlash: false,
}

module.exports = nextConfig 