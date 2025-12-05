import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const updatePhaseSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  order: z.number().int().optional(),
  color: z.string().optional().nullable(),
  type: z.enum(['lead', 'opportunity']).optional(),
  description: z.string().optional().nullable(),
  probability: z.number().int().min(0).max(100).optional().nullable(),
  status: z.enum(['open', 'won', 'lost']).optional().nullable(),
  isDefault: z.boolean().optional(),
  isConverted: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

interface Params {
  params: { id: string }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const data = updatePhaseSchema.parse(body)
    
    // Wenn isDefault=true, setze alle anderen Phasen des gleichen Typs auf false
    if (data.isDefault) {
      const currentPhase = await prisma.pipelinePhase.findUnique({
        where: { id: params.id }
      })
      
      if (currentPhase) {
        await prisma.pipelinePhase.updateMany({
          where: { 
            type: currentPhase.type,
            id: { not: params.id }
          },
          data: { isDefault: false }
        })
      }
    }
    
    const phase = await prisma.pipelinePhase.update({
      where: { id: params.id },
      data: {
        ...data,
        // Konvertiere null zu undefined für optionale Felder
        color: data.color === null ? null : data.color,
        description: data.description === null ? null : data.description,
        probability: data.probability === null ? null : data.probability,
        status: data.status === null ? null : data.status,
      }
    })
    
    return NextResponse.json(phase)
  } catch (err: any) {
    console.error('Error updating pipeline phase:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.pipelinePhase.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Phase gelöscht' })
  } catch (err: any) {
    console.error('Error deleting pipeline phase:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



