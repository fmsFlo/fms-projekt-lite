import { prisma } from '@/lib/prisma'
import ContractCreator from './section-contract'
import DeleteClientButton from './delete-button'
import EditClientForm from './edit-form'
import RetirementConceptButton from './retirement-concept-button'
import ContractsTable from './contracts-table'
import { SERVICE_CONTACT_SEED } from '@/lib/service/serviceContactSeeds'
import { requireAuth } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

const SERVICE_TEMPLATES = [
  {
    name: 'Beitragsfreistellung anfordern',
    slug: 'service-beitragsfreistellung',
    description: 'Schreiben zur Beantragung einer Beitragsfreistellung',
    category: 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)',
    fields: [
      'recipientCompany',
      'recipientEmail',
      'recipientAddress',
      'policyNumber',
      'effectiveDate',
      'fileNameCode',
      'responseDeadline',
      'customBody',
    ],
  },
  {
    name: 'Kontaktsperre',
    slug: 'service-kontaktsperre',
    description: 'Schreiben zur Untersagung jeglicher Kontaktaufnahme',
    category: 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)',
    fields: [
      'recipientCompany',
      'recipientEmail',
      'recipientAddress',
      'responseDeadline',
      'fileNameCode',
      'customBody',
    ],
  },
  {
    name: 'Kündigung mit Auszahlung',
    slug: 'service-kuendigung-auszahlung',
    description: 'Kündigung mit Auszahlungsanweisung',
    category: 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)',
    fields: [
      'recipientCompany',
      'recipientEmail',
      'recipientAddress',
      'policyNumber',
      'terminationDate',
      'responseDeadline',
      'fileNameCode',
      'payoutIban',
      'payoutBic',
      'payoutBankName',
      'customBody',
    ],
  },
  {
    name: 'Kündigung ohne Auszahlung',
    slug: 'service-kuendigung-ohne-auszahlung',
    description: 'Kündigung ohne Auszahlungsanweisung',
    category: 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)',
    fields: [
      'recipientCompany',
      'recipientEmail',
      'recipientAddress',
      'policyNumber',
      'terminationDate',
      'responseDeadline',
      'fileNameCode',
      'customBody',
    ],
  },
  {
    name: 'Beitragsfreistellung mit SEPA-Widerruf',
    slug: 'service-beitragsfreistellung-sepa-widerruf',
    description: 'Beitragsfreistellung inklusive SEPA-Widerruf',
    category: 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)',
    fields: [
      'recipientCompany',
      'recipientEmail',
      'recipientAddress',
      'policyNumber',
      'effectiveDate',
      'responseDeadline',
      'sepaMandateReference',
      'sepaRevocationDate',
      'fileNameCode',
      'customBody',
    ],
  },
  {
    name: 'Beitragsänderung',
    slug: 'service-beitragsaenderung',
    description: 'Schreiben zur Änderung des Beitrags',
    category: 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)',
    fields: [
      'recipientCompany',
      'recipientEmail',
      'recipientAddress',
      'policyNumber',
      'effectiveDate',
      'responseDeadline',
      'reducedAmount',
      'fileNameCode',
      'customBody',
    ],
  },
  {
    name: 'Unterlagen anfordern',
    slug: 'service-unterlagen-anfordern',
    description: 'Service-Schreiben zur Anforderung von Vertragsunterlagen',
    category: 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)',
    fields: [
      'recipientCompany',
      'recipientEmail',
      'recipientAddress',
      'policyNumber',
      'responseDeadline',
      'requestedDocuments',
      'fileNameCode',
      'customBody',
    ],
  },
  {
    name: 'Erstkontaktformular',
    slug: 'service-erstkontaktformular',
    description: 'Dokumentation des ersten Kundenkontakts',
    category: 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)',
    fields: [
      'contactDate',
      'contactTime',
      'advisorName',
      'contactReasonRecommendation',
      'contactReasonAdvertising',
      'contactReasonDamageReport',
      'contactReasonEvb',
      'contactReasonAdjustment',
      'contactReasonInformation',
      'contactReasonOtherChecked',
      'contactReasonOther',
      'initiatorWishConsultation',
      'initiatorWishOffer',
      'initiatorWishAppointment',
      'initiatorWishEvb',
      'initiatorWishOtherChecked',
      'initiatorWishOther',
      'furtherContactLandline',
      'furtherContactMobile',
      'furtherContactEmail',
      'contractDocumentsProvided',
      'contractDocumentsSending',
      'contractDocumentsPickup',
      'fileNameCode',
      'customBody',
    ],
  },
]

async function ensureServiceTemplates() {
  await prisma.contractTemplate.deleteMany({
    where: {
      slug: { in: ['service-allgemeines-schreiben', 'service-kuendigung'] },
    },
  })

  await Promise.all(
    SERVICE_TEMPLATES.map((tpl) =>
      prisma.contractTemplate.upsert({
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
    )
  )
}

async function ensureServiceContacts() {
  // Falls der aktuelle Prisma Client noch kein ServiceContact Model kennt (z. B. vor regenereiertem Client), silently skip.
  if (typeof (prisma as any).serviceContact?.count !== 'function') {
    return
  }

  const count = await prisma.serviceContact.count()
  if (count > 0) return

  if (SERVICE_CONTACT_SEED.length === 0) return

  await prisma.serviceContact.createMany({
    data: SERVICE_CONTACT_SEED.map((entry) => ({
      name: entry.name,
      email: entry.email,
      address: entry.address,
      category: entry.category || 'Versicherung',
    })),
  })
}

interface Params { params: { id: string } }

export default async function ClientDetailPage({ params }: Params) {
  const auth = await requireAuth()
  if (!auth) {
    redirect('/login')
  }

  const client = await prisma.client.findUnique({ where: { id: params.id } })
  if (!client) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="text-sm" style={{ color: 'var(--color-error)' }}>Client nicht gefunden</div>
    </div>
  )
  await ensureServiceContacts()
  await ensureServiceTemplates()
  const contracts = await prisma.contract.findMany({ where: { clientId: client.id }, orderBy: { createdAt: 'desc' } })
  const templates = await prisma.contractTemplate.findMany({ orderBy: { name: 'asc' } })
  const companySettings = await prisma.companySettings.findFirst()
  
  // Baue Adresse zusammen
  const addressParts = [
    client.street,
    client.houseNumber,
    client.zip,
    client.city
  ].filter(Boolean)
  const fullAddress = addressParts.join(', ')
  const customerName = `${client.firstName} ${client.lastName}`.trim()
  
  // Berater-Name aus Company Settings
  const advisorName = companySettings?.personalName || ''

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <EditClientForm client={client} />

        <div className="flex items-center gap-3">
          <RetirementConceptButton clientId={client.id} />
          <div className="ml-auto"><DeleteClientButton id={client.id} /></div>
        </div>

        <ContractCreator 
          clientId={client.id} 
          templates={templates}
          customerName={customerName}
          customerAddress={fullAddress}
          customerEmail={client.email || undefined}
          advisorName={advisorName}
          customerIban={client.iban || undefined}
        />

        <section>
          <h2 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>Bisherige Verträge</h2>
          <ContractsTable
            contracts={contracts.map((contract) => ({
              id: contract.id,
              createdAt: contract.createdAt.toISOString(),
              templateSlug: contract.templateSlug,
              sevdeskInvoiceId: contract.sevdeskInvoiceId,
              sevdeskInvoiceNumber: contract.sevdeskInvoiceNumber,
            }))}
          />
        </section>
      </div>
    </div>
  )
}

