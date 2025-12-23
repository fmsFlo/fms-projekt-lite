/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ ACHTUNG: Das deaktiviert TypeScript-Checks im Build
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Erhöhe Timeout für API Routes (für Vercel)
  // Wird auch in den einzelnen Route-Dateien mit export const maxDuration = 300 gesetzt
  // ... rest deiner Config
}

module.exports = nextConfig
