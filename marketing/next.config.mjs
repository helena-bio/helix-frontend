/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@helix/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
