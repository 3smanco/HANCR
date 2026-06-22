/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // تجاهل lint + tsc errors للبناء السريع
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
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
