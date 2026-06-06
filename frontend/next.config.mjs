/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress workspace lockfile warnings from Turbopack
  experimental: {},
  // Proxy API calls to the Express backend to avoid CORS issues in dev
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
