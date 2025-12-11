import { prisma } from '@/lib/prisma'
import LeadsList from './leads-list'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  // Auth wird von middleware.ts übernommen
  const leads = await prisma.lead.findMany({
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
  
  const leadPhases = await prisma.pipelinePhase.findMany({
    where: { 
      type: 'lead',
      isActive: true 
    },
    orderBy: { order: 'asc' }
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">👤</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Leads</h1>
            <p className="text-sm text-gray-600">Alle Leads verwalten</p>
          </div>
        </div>
      </div>
      
      <LeadsList 
        initialLeads={leads.map(lead => ({
          ...lead,
          createdAt: lead.createdAt.toISOString(),
          updatedAt: lead.updatedAt.toISOString(),
          nextActionDate: lead.nextActionDate ? new Date(lead.nextActionDate).toISOString().split('T')[0] : null,
          phase: {
            ...lead.phase,
            createdAt: lead.phase.createdAt.toISOString(),
            updatedAt: lead.phase.updatedAt.toISOString()
          }
        }))} 
        phases={leadPhases.map(phase => ({
          id: phase.id,
          name: phase.name,
          color: phase.color
        }))} 
      />
    </div>
  )
}



