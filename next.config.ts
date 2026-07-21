import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // Local Supabase storage is served from a LAN IP during dev — Next 16 blocks
    // local IPs by default as an SSRF guard, separate from remotePatterns matching.
    // Local-network access is dev-only; production must not allow it.
    dangerouslyAllowLocalIP: isDev,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      ...(isDev
        ? [
            {
              protocol: 'http' as const,
              hostname: '192.168.1.20',
              port: '54341',
              pathname: '/storage/v1/object/public/**',
            },
            {
              protocol: 'http' as const,
              hostname: '192.168.1.108',
              port: '54341',
              pathname: '/storage/v1/object/public/**',
            },
            {
              protocol: 'http' as const,
              hostname: '127.0.0.1',
              port: '54341',
              pathname: '/storage/v1/object/public/**',
            },
            {
              protocol: 'http' as const,
              hostname: 'localhost',
              port: '54341',
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
}

export default nextConfig
