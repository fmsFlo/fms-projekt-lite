import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.NETLIFY_DATABASE_URL_UNPOOLED || 
  process.env.NETLIFY_DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  throw new Error('DATABASE_URL must be set. For local development with Docker: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docreate_dev')
}

// Validiere URL-Format (PostgreSQL oder SQLite)
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

// Optimiere Connection URL für besseres Pooling (verhindert "Connection Closed" Fehler)
function optimizeConnectionUrl(url: string): string {
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    return url
  }
  
  try {
    const urlObj = new URL(url)
    
    // Füge Connection Pooling-Parameter hinzu wenn nicht vorhanden
    if (!urlObj.searchParams.has('connection_limit')) {
      urlObj.searchParams.set('connection_limit', '10')
    }
    if (!urlObj.searchParams.has('pool_timeout')) {
      urlObj.searchParams.set('pool_timeout', '10')
    }
    if (!urlObj.searchParams.has('connect_timeout')) {
      urlObj.searchParams.set('connect_timeout', '60')
    }
    
    return urlObj.toString()
  } catch {
    // Falls URL-Parsing fehlschlägt, verwende Original-URL
    return url
  }
}

const optimizedDatabaseUrl = optimizeConnectionUrl(databaseUrl)

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: optimizedDatabaseUrl
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

