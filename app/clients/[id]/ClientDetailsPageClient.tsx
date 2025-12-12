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
                Bisherige Verträge
              </h2>
              <ContractsTable contracts={contracts} />
            </section>
          </div>
        )}

        {activeTab === 'concept' && (
          <div className="space-y-6">
            <RetirementConceptButton clientId={client.id} />
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

