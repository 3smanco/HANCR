/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output للـ Docker production builds (Dockerfile.admin-panel)
  output: 'standalone',
  // Allow images from any domain for profile photos
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  // API rewrites to avoid CORS during development
  async rewrites() {
    return [
      {
        source: '/api/gql/:path*',
        destination: 'http://localhost:3002/graphql/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
