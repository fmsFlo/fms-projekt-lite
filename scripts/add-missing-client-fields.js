const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addMissingFields(tableName, fields) {
  try {
    // Prüfe welche Felder fehlen
    const fieldNames = fields.map(f => f.name)
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      AND column_name = ANY(${fieldNames})
    `
    
    const existingFields = existingColumns.map(row => row.column_name)
    console.log(`📊 ${tableName}: Bereits vorhandene Felder:`, existingFields)
    
    const missingFields = fields.filter(field => !existingFields.includes(field.name))
    
    if (missingFields.length === 0) {
      console.log(`✅ ${tableName}: Alle Felder existieren bereits!`)
      return
    }
    
    console.log(`❌ ${tableName}: Fehlende Felder:`, missingFields.map(f => f.name))
    console.log(`\n🔧 ${tableName}: Füge fehlende Felder hinzu...\n`)
    
    // Füge fehlende Felder hinzu
    for (const field of missingFields) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${field.name}" ${field.type};`
        )
        console.log(`✅ ${tableName}: Feld "${field.name}" hinzugefügt`)
      } catch (error) {
        // Ignoriere Fehler wenn Feld bereits existiert
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`⚠️  ${tableName}: Feld "${field.name}" existiert bereits`)
        } else {
          console.error(`❌ ${tableName}: Fehler beim Hinzufügen von "${field.name}":`, error.message)
        }
      }
    }
  } catch (error) {
    console.error(`❌ ${tableName}: Fehler:`, error.message)
    // Nicht beenden, sondern weiter mit anderen Tabellen
  }
}

async function main() {
  console.log('🔧 Füge fehlende Datenbank-Felder hinzu...\n')
  
  try {
    // Client-Felder
    await addMissingFields('Client', [
      { name: 'targetPensionNetto', type: 'DOUBLE PRECISION' },
      { name: 'desiredRetirementAge', type: 'INTEGER' },
      { name: 'monthlySavings', type: 'DOUBLE PRECISION' }
    ])
    
    // RetirementConcept-Felder
    await addMissingFields('RetirementConcept', [
      { name: 'recommendationProvider', type: 'TEXT' },
      { name: 'recommendationAdvantages', type: 'TEXT' },
      { name: 'expectedRente', type: 'DOUBLE PRECISION' },
      { name: 'productBefore', type: 'TEXT' },
      { name: 'additionalRenteBefore', type: 'DOUBLE PRECISION' },
      { name: 'providerAfter', type: 'TEXT' },
      { name: 'advantages', type: 'TEXT' },
      { name: 'renteAfter1', type: 'DOUBLE PRECISION' },
      { name: 'renteAfter2', type: 'DOUBLE PRECISION' },
      { name: 'renteAfter3', type: 'DOUBLE PRECISION' },
      { name: 'returnRate1', type: 'DOUBLE PRECISION' },
      { name: 'returnRate2', type: 'DOUBLE PRECISION' },
      { name: 'returnRate3', type: 'DOUBLE PRECISION' },
      { name: 'monthlyContributionBefore', type: 'DOUBLE PRECISION' },
      { name: 'monthlyContributionAfter', type: 'DOUBLE PRECISION' }
    ])
    
    console.log('\n✅ Fertig!')
    
  } catch (error) {
    console.error('❌ Fehler:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

