import { prisma } from '@/lib/prisma'
import PhasesConfig from './phases-config'

export const dynamic = 'force-dynamic'

export default async function PhasesConfigPage() {
  const leadPhases = await prisma.pipelinePhase.findMany({
    where: { type: 'lead', isActive: true },
    orderBy: { order: 'asc' }
  })
  
  const opportunityPhases = await prisma.pipelinePhase.findMany({
    where: { type: 'opportunity', isActive: true },
    orderBy: { order: 'asc' }
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Phasen konfigurieren</h1>
          <p className="text-sm text-gray-600 mt-1">
            Passen Sie die Phasen an Ihren Prozess an
          </p>
        </div>
      </div>
      
      <PhasesConfig 
        initialLeadPhases={leadPhases}
        initialOpportunityPhases={opportunityPhases}
      />
    </div>
  )
}



