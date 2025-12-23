#!/usr/bin/env tsx
/**
 * Resolve Failed Migration
 * 
 * Hilft bei der Behebung von fehlgeschlagenen Prisma Migrationen.
 * Prüft ob die Migration tatsächlich fehlgeschlagen ist oder nur als "failed" markiert wurde.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMigrationStatus() {
  try {
    // Prüfe Migration Status in der _prisma_migrations Tabelle
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        started_at,
        finished_at,
        applied_steps_count,
        logs
      FROM _prisma_migrations
      WHERE migration_name = '20251210183809_init'
      ORDER BY started_at DESC
      LIMIT 1
    ` as any[]

    if (migrations.length === 0) {
      console.log('❌ Migration 20251210183809_init nicht gefunden in _prisma_migrations')
      return
    }

    const migration = migrations[0]
    
    console.log('\n📊 Migration Status:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Migration: ${migration.migration_name}`)
    console.log(`Gestartet: ${migration.started_at}`)
    console.log(`Beendet: ${migration.finished_at || 'NICHT BEENDET (fehlgeschlagen)'}`)
    console.log(`Angewandte Schritte: ${migration.applied_steps_count}`)
    
    if (migration.logs) {
      console.log(`\nLogs:`)
      console.log(migration.logs)
    }
    
    // Prüfe ob Tabellen existieren
    console.log('\n🔍 Prüfe ob Tabellen existieren...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('Client', 'Contract', 'User', 'Lead')
      ORDER BY table_name
    ` as any[]
    
    console.log(`\nGefundene Tabellen: ${tables.length}`)
    tables.forEach(t => console.log(`  ✅ ${t.table_name}`))
    
    if (tables.length >= 4) {
      console.log('\n✅ Migration scheint erfolgreich gewesen zu sein!')
      console.log('💡 Die Migration wurde wahrscheinlich erfolgreich ausgeführt,')
      console.log('   aber als "failed" markiert (z.B. durch Timeout).')
      console.log('\n📝 Lösung:')
      console.log('   Führe aus: npx prisma migrate resolve --applied 20251210183809_init')
      console.log('   Dann: npx prisma migrate deploy')
    } else {
      console.log('\n❌ Migration ist tatsächlich fehlgeschlagen!')
      console.log('💡 Die Tabellen existieren nicht.')
      console.log('\n📝 Lösung:')
      console.log('   1. Prüfe die Logs oben für Fehlerdetails')
      console.log('   2. Führe die Migration manuell aus oder')
      console.log('   3. Markiere als rolled back: npx prisma migrate resolve --rolled-back 20251210183809_init')
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
  } catch (error: any) {
    console.error('❌ Fehler beim Prüfen der Migration:', error.message)
    console.error('\n💡 Stelle sicher dass:')
    console.error('   - DATABASE_URL korrekt gesetzt ist')
    console.error('   - Datenbank erreichbar ist')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigrationStatus()

