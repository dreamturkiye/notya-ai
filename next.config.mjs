/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: { allowedOrigins: ['notya-ai.vercel.app', 'localhost:3000'] }
  }
}
export default nextConfig
