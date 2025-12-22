'use client'

import { useState } from 'react'
import ClientDetailsNav from './ClientDetailsNav'
import EditClientForm from './edit-form'
import ContractCreator from './section-contract'
import RetirementConceptButton from './retirement-concept-button'
import DeleteClientButton from './delete-button'
import ContractsTable from './contracts-table'

interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  street?: string | null
  houseNumber?: string | null
  city?: string | null
  zip?: string | null
  iban?: string | null
  targetPensionNetto?: number | null
  desiredRetirementAge?: number | null
  monthlySavings?: number | null
}

interface Template {
  id: string
  name: string
  slug: string
  description?: string | null
  category?: string | null
}

interface Contract {
  id: string
  createdAt: string
  templateSlug: string
  sevdeskInvoiceId: string | null
  sevdeskInvoiceNumber: string | null
}

interface ClientDetailsPageClientProps {
  client: Client
  templates: Template[]
  contracts: Contract[]
  customerName: string
  customerAddress: string
  advisorName: string
}

export default function ClientDetailsPageClient({
  client,
  templates,
  contracts,
  customerName,
  customerAddress,
  advisorName,
}: ClientDetailsPageClientProps) {
  const [activeTab, setActiveTab] = useState('details')

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-6">
      {/* Header with Client Name - Hidden on mobile since EditClientForm shows it */}
      <div className="mb-4 md:mb-6 hidden md:block">
        <h1 className="text-xl md:text-2xl font-bold break-words" style={{ color: 'var(--color-text-primary)' }}>
          {customerName}
        </h1>
        {client.email && (
          <p className="text-sm mt-1 break-all" style={{ color: 'var(--color-text-secondary)' }}>
            {client.email}
          </p>
        )}
      </div>

      {/* Navigation */}
      <ClientDetailsNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="space-y-4 md:space-y-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <EditClientForm client={client} />
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <ContractCreator
              clientId={client.id}
              templates={templates}
              customerName={customerName}
              customerAddress={customerAddress}
              customerEmail={client.email || undefined}
              advisorName={advisorName}
              customerIban={client.iban || undefined}
            />

            <section>
              <h2 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Bisherige Dokumente
              </h2>
              <ContractsTable contracts={contracts} />
            </section>
          </div>
        )}

        {activeTab === 'concept' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <RetirementConceptButton clientId={client.id} />
              <a
                href={`/clients/${client.id}/analyse-tools/einnahmen-ausgaben`}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Einnahmen & Ausgaben
              </a>
              <a
                href={`/clients/${client.id}/analyse-tools/versicherungs-check`}
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Versicherungs-Check
              </a>
              <a
                href={`/clients/${client.id}/analyse-tools/empfehlungen`}
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Empfehlungen
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Delete Button - Hidden on mobile (shown in navigation) */}
      <div className="hidden md:block mt-6">
        <DeleteClientButton id={client.id} />
      </div>
    </div>
  )
}

