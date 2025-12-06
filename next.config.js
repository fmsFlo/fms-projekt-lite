/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ ACHTUNG: Das deaktiviert TypeScript-Checks im Build
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ... rest deiner Config
}

module.exports = nextConfig
