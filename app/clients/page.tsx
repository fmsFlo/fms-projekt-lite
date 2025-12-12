import { prisma } from '@/lib/prisma'
import ClientsClient from './table'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ClientsPage() {
  // Auth wird von middleware.ts übernommen
  const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Kunden</h1>
          <a 
            href="/clients/new" 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--color-primary)',
              color: 'white'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Neu</span>
          </a>
        </div>
        <ClientsClient initialClients={clients} />
      </div>
    </div>
  )
}

