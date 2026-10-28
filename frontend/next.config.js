/** @type {import('next').NextConfig} */
const apiOrigin = process.env.JAVA_API_ORIGIN ?? "http://127.0.0.1:8080";

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` },
      { source: "/results/:path*", destination: `${apiOrigin}/results/:path*` },
    ];
  },
};

module.exports = nextConfig;
