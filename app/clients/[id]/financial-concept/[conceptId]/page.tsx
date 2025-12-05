import { prisma } from '@/lib/prisma'
import FinancialConceptForm from './financial-concept-form'

interface Params {
  params: { id: string }
}

export default async function FinancialConceptPage({ params }: Params) {
  const concept = await prisma.financialConcept.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  })

  if (!concept) {
    return <div className="text-red-600">Finanzkonzept nicht gefunden</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finanzkonzept</h1>
          <p className="text-sm text-gray-600">
            {concept.client.firstName} {concept.client.lastName}
          </p>
        </div>
        <a
          href={`/clients/${concept.client.id}`}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Zurück zum Kunden
        </a>
      </div>

      <FinancialConceptForm initialConcept={concept} />
    </div>
  )
}

