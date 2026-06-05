/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  },
  experimental: {
    serverActions: { allowedOrigins: ['notya.ai', 'www.notya.ai'] }
  }
}
export default nextConfig
