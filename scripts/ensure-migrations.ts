import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Prüfe ob alle Client-Felder existieren...\n')
  
  try {
    // Prüfe ob die Felder existieren, indem wir versuchen, sie zu lesen
    const testClient = await prisma.$queryRaw`
      SELECT 
        column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Client'
      AND column_name IN ('targetPensionNetto', 'desiredRetirementAge', 'monthlySavings')
    `
    
    const existingFields = (testClient as any[]).map((row: any) => row.column_name)
    console.log('📊 Gefundene Felder:', existingFields)
    
    const requiredFields = ['targetPensionNetto', 'desiredRetirementAge', 'monthlySavings']
    const missingFields = requiredFields.filter(field => !existingFields.includes(field))
    
    if (missingFields.length > 0) {
      console.log('❌ Fehlende Felder:', missingFields)
      console.log('\n💡 Führe Migration aus:')
      console.log('   npx prisma migrate deploy')
      console.log('\n   Oder manuell:')
      missingFields.forEach(field => {
        const type = field === 'desiredRetirementAge' ? 'INTEGER' : 'DOUBLE PRECISION'
        console.log(`   ALTER TABLE "Client" ADD COLUMN "${field}" ${type};`)
      })
      process.exit(1)
    } else {
      console.log('✅ Alle Felder existieren!')
    }
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error('\n💡 Führe Migration aus:')
    console.error('   npx prisma migrate deploy')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

