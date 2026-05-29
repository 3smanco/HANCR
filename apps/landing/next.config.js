/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // static site — يمكن نشره على Cloudflare Pages مجاناً
  images: { unoptimized: true },
};
module.exports = nextConfig;
