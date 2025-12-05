import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const updateOpportunitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  phaseId: z.string().min(1).optional(),
  clientId: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  nextActionDate: z.string().optional().nullable(),
  nextActionNote: z.string().optional().nullable(),
})

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
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
    
    if (!opportunity) {
      return NextResponse.json({ message: 'Opportunity nicht gefunden' }, { status: 404 })
    }
    
    return NextResponse.json(opportunity)
  } catch (err: any) {
    console.error('Error fetching opportunity:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const data = updateOpportunitySchema.parse(body)
    
    // Konvertiere nextActionDate von String zu DateTime falls vorhanden
    const updateData: any = { ...data }
    if (updateData.nextActionDate !== undefined) {
      updateData.nextActionDate = updateData.nextActionDate 
        ? new Date(updateData.nextActionDate) 
        : null
    }
    
    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: updateData,
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
    console.error('Error updating opportunity:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.opportunity.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Opportunity gelöscht' })
  } catch (err: any) {
    console.error('Error deleting opportunity:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



