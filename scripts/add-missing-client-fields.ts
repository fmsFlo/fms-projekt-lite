import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Füge fehlende Client-Felder hinzu...\n')
  
  try {
    // Prüfe welche Felder fehlen
    const existingColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Client'
      AND column_name IN ('targetPensionNetto', 'desiredRetirementAge', 'monthlySavings')
    `
    
    const existingFields = existingColumns.map(row => row.column_name)
    console.log('📊 Bereits vorhandene Felder:', existingFields)
    
    const requiredFields = [
      { name: 'targetPensionNetto', type: 'DOUBLE PRECISION' },
      { name: 'desiredRetirementAge', type: 'INTEGER' },
      { name: 'monthlySavings', type: 'DOUBLE PRECISION' }
    ]
    
    const missingFields = requiredFields.filter(field => !existingFields.includes(field.name))
    
    if (missingFields.length === 0) {
      console.log('✅ Alle Felder existieren bereits!')
      return
    }
    
    console.log('❌ Fehlende Felder:', missingFields.map(f => f.name))
    console.log('\n🔧 Füge fehlende Felder hinzu...\n')
    
    // Füge fehlende Felder hinzu
    for (const field of missingFields) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "${field.name}" ${field.type};`
        )
        console.log(`✅ Feld "${field.name}" hinzugefügt`)
      } catch (error: any) {
        // Ignoriere Fehler wenn Feld bereits existiert
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`⚠️  Feld "${field.name}" existiert bereits`)
        } else {
          console.error(`❌ Fehler beim Hinzufügen von "${field.name}":`, error.message)
        }
      }
    }
    
    console.log('\n✅ Fertig!')
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

