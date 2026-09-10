/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Material Tailwind 2.1.x has type definition clashes with @types/react 18.2+
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
