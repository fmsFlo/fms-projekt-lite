import { prisma } from '@/lib/prisma'
import ClientsClient from './table'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ClientsPage() {
  // Auth wird von middleware.ts übernommen
  try {
    // Lade Clients - verwende try-catch für fehlende Felder
    let clients
    try {
      clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } })
    } catch (schemaError: any) {
      // Falls Felder fehlen, lade ohne die optionalen Felder
      if (schemaError.message?.includes('targetPensionNetto') || schemaError.message?.includes('does not exist')) {
        console.warn('⚠️ Einige Felder fehlen in der Datenbank, füge sie hinzu...')
        // Versuche die Felder hinzuzufügen
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "targetPensionNetto" DOUBLE PRECISION;
            ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "desiredRetirementAge" INTEGER;
            ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "monthlySavings" DOUBLE PRECISION;
          `)
          // Versuche erneut zu laden
          clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } })
        } catch (addError: any) {
          console.error('❌ Fehler beim Hinzufügen der Felder:', addError.message)
          throw schemaError
        }
      } else {
        throw schemaError
      }
    }
    
    // Serialisiere die Daten für Client Component (Date-Objekte zu Strings)
    const serializedClients = clients.map(client => ({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      birthDate: client.birthDate ? client.birthDate.toISOString() : null,
    }))
    
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
          <ClientsClient initialClients={serializedClients} />
        </div>
      </div>
    )
  } catch (error: any) {
    console.error('❌ Fehler beim Laden der Clients:', error)
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-red-600">
          <h2 className="text-xl font-bold mb-2">Fehler beim Laden der Kunden</h2>
          <p className="text-sm">{error.message || 'Unbekannter Fehler'}</p>
          <p className="text-xs mt-2">Bitte prüfe die Server-Logs für Details.</p>
        </div>
      </div>
    )
  }
}

