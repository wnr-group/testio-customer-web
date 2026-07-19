import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // Local Supabase storage is served from a LAN IP during dev — Next 16 blocks
    // local IPs by default as an SSRF guard, separate from remotePatterns matching.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.108',
        port: '54341',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54341',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
