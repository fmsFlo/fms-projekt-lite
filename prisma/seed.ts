import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const templates = [
    {
      name: 'Vergütungsvereinbarung Nettoprodukt SEPA',
      slug: 'verguetungsvereinbarung-nettoprodukt-sepa',
      description: 'Vergütungsvereinbarung für Nettoprodukt mit SEPA Lastschrift',
      category: 'Honorarberatung',
      fields: ["productProvider", "productDescription", "applicationDate", "amountEUR", "paymentMethod", "paymentFrequency", "numberOfInstallments", "increasedStartAmount", "bookingStart", "person2Name", "person2Provider", "person2Product", "person2Amount", "person3Name", "person3Provider", "person3Product", "person3Amount", "totalAmount"],
    },
    {
      name: 'Vergütungsvereinbarung Nettoprodukt Überweisung',
      slug: 'verguetungsvereinbarung-nettoprodukt-ueberweisung',
      description: 'Vergütungsvereinbarung für Nettoprodukt mit Überweisung',
      category: 'Honorarberatung',
      fields: ["productProvider", "productDescription", "applicationDate", "amountEUR", "paymentMethod", "bookingStart", "person2Name", "person2Provider", "person2Product", "person2Amount", "person3Name", "person3Provider", "person3Product", "person3Amount", "totalAmount"],
    },
    {
      name: 'Beratungsprotokoll',
      slug: 'beratungsprotokoll',
      description: 'Beratungsprotokoll gemäß Versicherungsvertragsgesetz',
      category: 'Honorarberatung',
      fields: ["customerName", "customerAddress", "customerWishes", "customerWishesProductType", "customerWishesImportant", "customerNeeds", "customerNeedsFocus", "customerNeedsFocusCustom", "riskAssessment", "riskAssessmentProductType", "insuranceTypes", "insuranceTypesProductType", "adviceAndReasoning", "adviceAndReasoningProductType", "adviceAndReasoningProvider", "adviceAndReasoningTariff", "adviceAndReasoningReason", "suitabilitySuitable", "suitabilityNotSuitable", "suitabilityAttached", "customerDecisionFull", "customerDecisionPartial", "customerDecisionProductType", "customerDecisionProvider", "customerDecisionTariff", "customerDecisionReason", "marketResearchObjective", "marketResearchBroker", "marketResearchMultiAgent", "marketResearchInsurers", "marketResearchLimited", "placeDate", "customerSignature", "intermediarySignature", "additionalNote"],
    },
    {
      name: 'Allgemeines Service-Schreiben',
      slug: 'service-allgemeines-schreiben',
      description: 'Freitext-Schreiben an Versicherungen, Banken oder Produktpartner',
      category: 'Service',
      fields: [
        'recipientCompany',
        'recipientEmail',
        'recipientAddress',
        'contactPerson',
        'policyNumber',
        'subject',
        'customBody',
      ],
    },
    {
      name: 'Beitragsfreistellung anfordern',
      slug: 'service-beitragsfreistellung',
      description: 'Schreiben zur Beantragung einer Beitragsfreistellung',
      category: 'Service',
      fields: [
        'recipientCompany',
        'recipientEmail',
        'recipientAddress',
        'policyNumber',
        'effectiveDate',
        'customBody',
      ],
    },
    {
      name: 'Kündigung erklären',
      slug: 'service-kuendigung',
      description: 'Kündigungsschreiben für Versicherungs- oder Bankverträge',
      category: 'Service',
      fields: [
        'recipientCompany',
        'recipientEmail',
        'recipientAddress',
        'policyNumber',
        'terminationDate',
        'customBody',
      ],
    },
    {
      name: 'Kündigung mit Auszahlung',
      slug: 'service-kuendigung-auszahlung',
      description: 'Kündigung mit Auszahlung auf angegebene Bankverbindung',
      category: 'Service',
      fields: [
        'recipientCompany',
        'recipientEmail',
        'recipientAddress',
        'policyNumber',
        'terminationDate',
        'payoutIban',
        'payoutBic',
        'payoutBankName',
        'customBody',
      ],
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
  }

  console.log('Seed complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})

