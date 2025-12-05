import { prisma } from '@/lib/prisma'
import FinancialConceptForm from './financial-concept-form'

interface Params {
  params: { id: string }
}

export default async function FinancialConceptPage({ params }: Params) {
  // FinancialConcept Modell ist aktuell nicht aktiviert im Prisma Schema
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Finanzkonzept</h1>
      <p className="text-red-600">Das FinancialConcept Modell ist aktuell nicht aktiviert.</p>
    </div>
  )
}

