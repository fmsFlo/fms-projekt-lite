import { prisma } from '@/lib/prisma'
import KanbanBoard from './kanban-board'
import { requireAuth } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const auth = await requireAuth()
  if (!auth) {
    redirect('/login')
  }
  // Lade Phasen und Opportunities
  const phases = await prisma.pipelinePhase.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pipeline Management</h1>
      </div>
      
      <KanbanBoard 
        initialPhases={phases} 
        initialOpportunities={opportunities}
      />
    </div>
  )
}



