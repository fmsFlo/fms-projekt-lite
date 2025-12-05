import { prisma } from '@/lib/prisma'
import ClientsClient from './table'
import { requireAuth } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const auth = await requireAuth()
  if (!auth) {
    redirect('/login')
  }

  const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Kunden</h1>
          <a href="/clients/new" className="px-4 py-2 rounded-md text-white hover:opacity-90 transition-opacity font-medium text-sm" style={{ backgroundColor: 'var(--color-success)' }}>
            + Neu
          </a>
        </div>
        <ClientsClient initialClients={clients} />
      </div>
    </div>
  )
}

