import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const updateLeadSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  phaseId: z.string().min(1).optional(),
  clientId: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  nextActionDate: z.string().optional().nullable(),
  nextActionNote: z.string().optional().nullable(),
})

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const lead = await prisma.lead.findUnique({
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
    
    if (!lead) {
      return NextResponse.json({ message: 'Lead nicht gefunden' }, { status: 404 })
    }
    
    return NextResponse.json(lead)
  } catch (err: any) {
    console.error('Error fetching lead:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const data = updateLeadSchema.parse(body)
    
    const updateData: any = { ...data }
    if (updateData.nextActionDate !== undefined) {
      updateData.nextActionDate = updateData.nextActionDate 
        ? new Date(updateData.nextActionDate) 
        : null
    }
    
    const lead = await prisma.lead.update({
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
    
    return NextResponse.json(lead)
  } catch (err: any) {
    console.error('Error updating lead:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.lead.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Lead gelöscht' })
  } catch (err: any) {
    console.error('Error deleting lead:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



