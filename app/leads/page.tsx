import { prisma } from '@/lib/prisma'
import LeadsList from './leads-list'
import { requireAuth } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const auth = await requireAuth()
  if (!auth) {
    redirect('/login')
  }
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
      
      <LeadsList initialLeads={leads} phases={leadPhases} />
    </div>
  )
}



