const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Prüfe Templates in der Datenbank...\n')
  
  try {
    // Hole alle Templates
    const templates = await prisma.contractTemplate.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    })
    
    console.log(`📊 Gesamt: ${templates.length} Templates gefunden\n`)
    
    if (templates.length === 0) {
      console.log('⚠️  Keine Templates in der Datenbank!')
      return
    }
    
    // Gruppiere nach Kategorie
    const byCategory = {}
    templates.forEach(t => {
      const cat = t.category || '(keine Kategorie)'
      if (!byCategory[cat]) {
        byCategory[cat] = []
      }
      byCategory[cat].push(t)
    })
    
    console.log('📁 Templates nach Kategorie:')
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n  ${category}: ${items.length} Templates`)
      items.forEach(t => {
        console.log(`    - ${t.name} (${t.slug})`)
      })
    })
    
    // Prüfe speziell Honorar Beratung
    const honorarTemplates = templates.filter(t => t.category === 'Honorar Beratung')
    console.log(`\n✅ Honorar Beratung Templates: ${honorarTemplates.length}`)
    if (honorarTemplates.length > 0) {
      honorarTemplates.forEach(t => {
        console.log(`    - ${t.name} (${t.slug})`)
      })
    } else {
      console.log('   ⚠️  Keine Templates mit Kategorie "Honorar Beratung" gefunden!')
      console.log('   Verfügbare Kategorien:', Object.keys(byCategory))
    }
    
    // Prüfe Beratungsprotokoll
    const beratungsprotokoll = templates.filter(t => 
      t.category === 'Beratungsprotokoll' || 
      t.slug === 'beratungsprotokoll'
    )
    console.log(`\n✅ Beratungsprotokoll Templates: ${beratungsprotokoll.length}`)
    if (beratungsprotokoll.length > 0) {
      beratungsprotokoll.forEach(t => {
        console.log(`    - ${t.name} (${t.slug}) - Kategorie: ${t.category}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()

