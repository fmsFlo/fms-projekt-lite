#!/usr/bin/env tsx
/**
 * Pre-Deploy Schema Consistency Check
 * 
 * Prüft ob das Prisma Schema mit der Datenbank übereinstimmt.
 * Wird vor jedem Deployment ausgeführt.
 */

import { PrismaClient } from '@prisma/client'

// Prüfe DATABASE_URL
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL ist nicht gesetzt!')
  console.error('\n💡 Lösung:')
  console.error('   1. Erstelle .env.local mit DATABASE_URL')
  console.error('   2. Oder setze: export DATABASE_URL="postgresql://..."')
  console.error('   3. Beispiel: DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"\n')
  process.exit(1)
}

// Validiere URL-Format
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL hat ungültiges Format:', databaseUrl)
  console.error('\n💡 DATABASE_URL muss mit postgresql:// oder postgres:// beginnen')
  console.error('   Beispiel: postgresql://user:password@host:5432/dbname\n')
  process.exit(1)
}

const prisma = new PrismaClient()

interface SchemaCheck {
  table: string
  column: string
  exists: boolean
  error?: string
}

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    // Prisma verwendet PascalCase für Spaltennamen
    // Tabellennamen sind snake_case (dank @@map in schema.prisma)
    // Prisma $queryRawUnsafe konvertiert ? automatisch zu $1, $2, etc.
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
    `
    
    // Prisma erwartet Parameter als Array bei $queryRaw
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ` as any[]
    
    return result.length > 0
  } catch (error: any) {
    console.error(`Fehler beim Prüfen von ${tableName}.${columnName}:`, error.message)
    return false
  }
}

async function checkCriticalColumns(): Promise<SchemaCheck[]> {
  const checks: SchemaCheck[] = []
  
  // Kritische Spalten die in Produktion vorhanden sein müssen
  const criticalColumns = [
    { table: 'custom_activities', column: 'calendlyEventId' },
    { table: 'calendly_events', column: 'id' },
    { table: 'calendly_events', column: 'startTime' },
    { table: 'calendly_events', column: 'userId' },
    { table: 'custom_activities', column: 'activityType' },
    { table: 'custom_activities', column: 'dateCreated' },
    { table: 'custom_activities', column: 'leadId' },
  ]
  
  for (const { table, column } of criticalColumns) {
    const exists = await checkColumnExists(table, column)
    checks.push({
      table,
      column,
      exists,
      error: exists ? undefined : `Spalte ${table}.${column} fehlt in der Datenbank`
    })
  }
  
  return checks
}

async function main() {
  console.log('🔍 Prüfe Schema-Konsistenz...\n')
  
  try {
    const checks = await checkCriticalColumns()
    
    const failed = checks.filter(c => !c.exists)
    const passed = checks.filter(c => c.exists)
    
    console.log(`✅ ${passed.length} Spalten gefunden`)
    console.log(`❌ ${failed.length} Spalten fehlen\n`)
    
    if (failed.length > 0) {
      console.error('⚠️  KRITISCH: Folgende Spalten fehlen in der Datenbank:\n')
      failed.forEach(check => {
        console.error(`   - ${check.table}.${check.column}`)
        console.error(`     ${check.error}\n`)
      })
      
      console.error('💡 Lösung:')
      console.error('   1. Führe Migrationen aus: npx prisma migrate deploy')
      console.error('   2. Prüfe ob alle Migrationen in prisma/migrations/ vorhanden sind')
      console.error('   3. Stelle sicher dass DATABASE_URL korrekt ist\n')
      
      process.exit(1)
    }
    
    console.log('✅ Schema-Konsistenz-Check erfolgreich!')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Fehler beim Schema-Check:', error.message)
    console.error('\n💡 Stelle sicher dass:')
    console.error('   - DATABASE_URL korrekt gesetzt ist')
    console.error('   - Datenbank erreichbar ist')
    console.error('   - Prisma Client generiert wurde: npx prisma generate\n')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

