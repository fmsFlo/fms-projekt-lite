import { prisma } from '@/lib/prisma'
import OpportunitiesList from './opportunities-list'

export const dynamic = 'force-dynamic'

export default async function OpportunitiesPage() {
  // Auth wird von middleware.ts übernommen
  const opportunities = await prisma.opportunity.findMany({
    include: {
      phase: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  const opportunityPhases = await prisma.pipelinePhase.findMany({
    where: { 
      type: 'opportunity',
      isActive: true 
    },
    orderBy: { order: 'asc' }
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">💼</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Opportunities</h1>
            <p className="text-sm text-gray-600">Alle Opportunities verwalten</p>
          </div>
        </div>
      </div>
      
      <OpportunitiesList 
        initialOpportunities={opportunities.map(opp => ({
          ...opp,
          createdAt: opp.createdAt.toISOString(),
          updatedAt: opp.updatedAt.toISOString(),
          nextActionDate: opp.nextActionDate ? new Date(opp.nextActionDate).toISOString().split('T')[0] : null,
          phase: {
            ...opp.phase,
            createdAt: opp.phase.createdAt.toISOString(),
            updatedAt: opp.phase.updatedAt.toISOString()
          }
        }))} 
        phases={opportunityPhases.map(phase => ({
          id: phase.id,
          name: phase.name,
          slug: phase.slug,
          order: phase.order,
          color: phase.color
        }))} 
      />
    </div>
  )
}



