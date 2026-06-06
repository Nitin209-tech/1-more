/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress workspace lockfile warnings from Turbopack
  experimental: {},
  // Optionally proxy API calls to an external Express backend when
  // BACKEND_URL is set in the environment (e.g., Vercel project env vars).
  // If BACKEND_URL is not defined, no rewrites will be added and the
  // frontend expects its own API routes or a separately deployed backend.
  async rewrites() {
    const backend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
    if (!backend) return [];

    // Ensure no trailing slash on backend URL
    const destBase = backend.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${destBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
