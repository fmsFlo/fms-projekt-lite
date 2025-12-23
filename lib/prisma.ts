import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Prisma Client nutzt automatisch process.env.DATABASE_URL
// KEINE manuelle Überschreibung - Netlify UI Environment Variables werden verwendet

// Validiere dass DATABASE_URL gesetzt ist (nur für bessere Fehlermeldungen)
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  throw new Error('DATABASE_URL must be set. For local development: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docreate_dev')
}

// Validiere URL-Format (PostgreSQL oder SQLite)
const databaseUrl = process.env.DATABASE_URL
const isValidDatabaseUrl = 
  databaseUrl.startsWith('postgresql://') || 
  databaseUrl.startsWith('postgres://') ||
  databaseUrl.startsWith('file:')

if (!isValidDatabaseUrl) {
  console.error('DATABASE_URL has invalid format:', databaseUrl)
  throw new Error('DATABASE_URL must start with postgresql://, postgres://, or file:')
}

// In Production: Nur PostgreSQL erlauben
if (process.env.NODE_ENV === 'production' && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error('Only PostgreSQL is supported in production. Please use a PostgreSQL database.')
}

// Warnung wenn SQLite verwendet wird (nur für lokale Entwicklung als Fallback)
if (databaseUrl.startsWith('file:') && process.env.NODE_ENV === 'development') {
  console.warn('⚠️  WARNING: Using SQLite database, but schema.prisma is configured for PostgreSQL.')
  console.warn('⚠️  For proper local development, use PostgreSQL:')
  console.warn('⚠️  1. Start Docker: docker-compose up -d')
  console.warn('⚠️  2. Set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docreate_dev in .env.local')
}

// Prisma Client OHNE datasource override - nutzt automatisch process.env.DATABASE_URL
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

