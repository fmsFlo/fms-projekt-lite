#!/usr/bin/env tsx
/**
 * Check Calendly Migration Status
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCalendlyMigration() {
  try {
    console.log('🔍 Prüfe Calendly Migration Status...\n')
    
    // Prüfe ob calendlyApiToken Spalte existiert
    const calendlyTokenExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'CompanySettings'
        AND column_name = 'calendlyApiToken'
    ` as any[]
    
    // Prüfe ob CalendlyEvent Tabelle existiert
    const calendlyEventTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'CalendlyEvent'
    ` as any[]
    
    // Prüfe ob CustomActivity Tabelle existiert
    const customActivityTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'CustomActivity'
    ` as any[]
    
    // Prüfe ob calendlyEventId Spalte existiert
    const calendlyEventIdColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'CustomActivity'
        AND column_name = 'calendlyEventId'
    ` as any[]
    
    console.log('Status:')
    console.log(`  calendlyApiToken Spalte: ${calendlyTokenExists.length > 0 ? '✅ Existiert' : '❌ Fehlt'}`)
    console.log(`  CalendlyEvent Tabelle: ${calendlyEventTable.length > 0 ? '✅ Existiert' : '❌ Fehlt'}`)
    console.log(`  CustomActivity Tabelle: ${customActivityTable.length > 0 ? '✅ Existiert' : '❌ Fehlt'}`)
    console.log(`  calendlyEventId Spalte: ${calendlyEventIdColumn.length > 0 ? '✅ Existiert' : '❌ Fehlt'}`)
    
    const allExist = calendlyTokenExists.length > 0 && 
                     calendlyEventTable.length > 0 && 
                     customActivityTable.length > 0 && 
                     calendlyEventIdColumn.length > 0
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (allExist) {
      console.log('\n✅ Migration scheint erfolgreich gewesen zu sein!')
      console.log('💡 Alle Tabellen/Spalten existieren bereits.')
      console.log('\n📝 Lösung:')
      console.log('   npx prisma migrate resolve --applied 20251211191811_add_calendly_and_custom_activities')
      console.log('   npx prisma migrate deploy')
    } else {
      console.log('\n❌ Migration ist teilweise fehlgeschlagen!')
      console.log('💡 Einige Tabellen/Spalten fehlen.')
      console.log('\n📝 Lösung:')
      console.log('   1. Prüfe welche Teile fehlen')
      console.log('   2. Führe fehlende Teile manuell aus')
      console.log('   3. Oder markiere als rolled-back und versuche erneut')
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkCalendlyMigration()

