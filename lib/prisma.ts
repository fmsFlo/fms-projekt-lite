import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Stelle sicher, dass der Datenbank-Pfad korrekt aufgelöst wird
const getDatabaseUrl = () => {
  // Verwende immer den absoluten Pfad zur Datenbank
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const dbUrl = `file:${dbPath}`
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Prisma DB URL:', dbUrl)
    console.log('🔍 Working Directory:', process.cwd())
    console.log('🔍 Datei existiert:', fs.existsSync(dbPath))
  }
  
  return dbUrl
}

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

