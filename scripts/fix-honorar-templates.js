const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Korrigiere Honorar-Template-Kategorien...\n')
  
  try {
    // Finde alle Templates mit falscher Kategorie
    const wrongCategoryTemplates = await prisma.contractTemplate.findMany({
      where: {
        category: 'Honorarberatung'
      }
    })
    
    console.log(`📊 Gefunden: ${wrongCategoryTemplates.length} Templates mit Kategorie "Honorarberatung"`)
    
    if (wrongCategoryTemplates.length > 0) {
      // Update alle auf "Honorar Beratung"
      const result = await prisma.contractTemplate.updateMany({
        where: {
          category: 'Honorarberatung'
        },
        data: {
          category: 'Honorar Beratung'
        }
      })
      
      console.log(`✅ ${result.count} Templates aktualisiert`)
    }
    
    // Prüfe ob Honorar-Templates existieren
    const honorarTemplates = await prisma.contractTemplate.findMany({
      where: {
        category: 'Honorar Beratung'
      }
    })
    
    console.log(`\n📊 Templates mit Kategorie "Honorar Beratung": ${honorarTemplates.length}`)
    
    if (honorarTemplates.length === 0) {
      console.log('\n⚠️  Keine Honorar-Templates gefunden! Erstelle sie aus dem Seed...')
      
      // Erstelle die Honorar-Templates
      const templates = [
        {
          name: 'Vergütungsvereinbarung Nettoprodukt SEPA',
          slug: 'verguetungsvereinbarung-nettoprodukt-sepa',
          description: 'Vergütungsvereinbarung für Nettoprodukt mit SEPA Lastschrift',
          category: 'Honorar Beratung',
          fields: ["productProvider", "productDescription", "applicationDate", "amountEUR", "paymentMethod", "paymentFrequency", "numberOfInstallments", "increasedStartAmount", "bookingStart", "person2Name", "person2Provider", "person2Product", "person2Amount", "person3Name", "person3Provider", "person3Product", "person3Amount", "totalAmount"],
        },
        {
          name: 'Vergütungsvereinbarung Nettoprodukt Überweisung',
          slug: 'verguetungsvereinbarung-nettoprodukt-ueberweisung',
          description: 'Vergütungsvereinbarung für Nettoprodukt mit Überweisung',
          category: 'Honorar Beratung',
          fields: ["productProvider", "productDescription", "applicationDate", "amountEUR", "paymentMethod", "bookingStart", "person2Name", "person2Provider", "person2Product", "person2Amount", "person3Name", "person3Provider", "person3Product", "person3Amount", "totalAmount"],
        },
        {
          name: 'Beratungsprotokoll',
          slug: 'beratungsprotokoll',
          description: 'Beratungsprotokoll gemäß Versicherungsvertragsgesetz',
          category: 'Honorar Beratung',
          fields: ["customerName", "customerAddress", "customerWishes", "customerWishesProductType", "customerWishesImportant", "customerNeeds", "customerNeedsFocus", "customerNeedsFocusCustom", "riskAssessment", "riskAssessmentProductType", "insuranceTypes", "insuranceTypesProductType", "adviceAndReasoning", "adviceAndReasoningProductType", "adviceAndReasoningProvider", "adviceAndReasoningTariff", "adviceAndReasoningReason", "suitabilitySuitable", "suitabilityNotSuitable", "suitabilityAttached", "customerDecisionFull", "customerDecisionPartial", "customerDecisionProductType", "customerDecisionProvider", "customerDecisionTariff", "customerDecisionReason", "marketResearchObjective", "marketResearchBroker", "marketResearchMultiAgent", "marketResearchInsurers", "marketResearchLimited", "placeDate", "customerSignature", "intermediarySignature", "additionalNote"],
        },
      ]
      
      for (const tpl of templates) {
        await prisma.contractTemplate.upsert({
          where: { slug: tpl.slug },
          update: {
            name: tpl.name,
            description: tpl.description,
            category: tpl.category,
            fields: JSON.stringify(tpl.fields),
          },
          create: {
            name: tpl.name,
            slug: tpl.slug,
            description: tpl.description,
            category: tpl.category,
            fields: JSON.stringify(tpl.fields),
          },
        })
        console.log(`  ✅ ${tpl.name} erstellt/aktualisiert`)
      }
    } else {
      honorarTemplates.forEach(t => {
        console.log(`  - ${t.name} (${t.slug})`)
      })
    }
    
    console.log('\n✅ Fertig!')
    
  } catch (error) {
    console.error('❌ Fehler:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()

