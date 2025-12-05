import { prisma } from '@/lib/prisma'
import FinanzkonzeptForm from './finanzkonzept-form'

interface Params { params: { id: string } }

export default async function FinanzkonzeptPage({ params }: Params) {
  const client = await prisma.client.findUnique({ where: { id: params.id } })
  if (!client) return <div className="text-red-600">Client nicht gefunden</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finanzkonzept</h1>
          <p className="text-sm text-gray-600">
            Kunde: {client.firstName} {client.lastName}
          </p>
        </div>
        <a
          href={`/clients/${client.id}`}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Zurück zum Kunden
        </a>
      </div>

      <FinanzkonzeptForm clientId={client.id} />
    </div>
  )
}

