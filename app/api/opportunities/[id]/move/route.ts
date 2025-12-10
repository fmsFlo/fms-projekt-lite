import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const moveSchema = z.object({
  phaseId: z.string().min(1, 'Phase ist erforderlich'),
})

interface Params {
  params: { id: string }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const { phaseId } = moveSchema.parse(body)
    
    // Prüfe ob Phase existiert
    const phase = await prisma.pipelinePhase.findUnique({
      where: { id: phaseId }
    })
    
    if (!phase) {
      return NextResponse.json({ message: 'Phase nicht gefunden' }, { status: 404 })
    }
    
    // Verschiebe Opportunity
    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: { phaseId },
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
      }
    })
    
    return NextResponse.json(opportunity)
  } catch (err: any) {
    console.error('Error moving opportunity:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



