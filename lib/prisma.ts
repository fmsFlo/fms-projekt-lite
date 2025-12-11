import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.NETLIFY_DATABASE_URL_UNPOOLED || 
  process.env.NETLIFY_DATABASE_URL

if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
  console.error('DATABASE_URL is not set or invalid:', databaseUrl)
  throw new Error('DATABASE_URL must be set and start with postgresql://')
}

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

