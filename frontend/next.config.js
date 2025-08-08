/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    // In production, use environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    console.log('API URL for rewrites:', apiUrl)
    
    // Only return rewrites if we have a valid API URL
    if (!apiUrl || apiUrl.includes('your-backend-url')) {
      console.warn('No valid API URL configured, skipping rewrites')
      return []
    }
    
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