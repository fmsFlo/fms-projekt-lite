import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const updateConceptSchema = z.object({
  currentRente: z.number().optional().nullable(),
  currentVorsorge: z.number().optional().nullable(),
  renteWithIncrease: z.number().optional().nullable(),
  taxDeductions: z.number().optional().nullable(),
  socialDeductions: z.number().optional().nullable(),
  totalRente: z.number().optional().nullable(),
  rentenluecke: z.number().optional().nullable(),
  wunschrente: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const concept = await prisma.financialConcept.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })
    
    if (!concept) {
      return NextResponse.json({ message: 'Finanzkonzept nicht gefunden' }, { status: 404 })
    }
    
    return NextResponse.json(concept)
  } catch (err: any) {
    console.error('Error fetching financial concept:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const data = updateConceptSchema.parse(body)
    
    // Berechne Gesamtrente und Rentenlücke neu
    const existing = await prisma.financialConcept.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ message: 'Finanzkonzept nicht gefunden' }, { status: 404 })
    }
    
    const currentRente = data.currentRente !== undefined ? data.currentRente : existing.currentRente
    const currentVorsorge = data.currentVorsorge !== undefined ? data.currentVorsorge : existing.currentVorsorge
    const renteWithIncrease = data.renteWithIncrease !== undefined ? data.renteWithIncrease : existing.renteWithIncrease
    const taxDeductions = data.taxDeductions !== undefined ? data.taxDeductions : existing.taxDeductions
    const socialDeductions = data.socialDeductions !== undefined ? data.socialDeductions : existing.socialDeductions
    const wunschrente = data.wunschrente !== undefined ? data.wunschrente : existing.wunschrente
    
    let totalRente = null
    let rentenluecke = null
    
    if (currentRente !== null && currentRente !== undefined) {
      totalRente = (currentRente || 0) + 
                   (currentVorsorge || 0) + 
                   (renteWithIncrease || 0) - 
                   (taxDeductions || 0) - 
                   (socialDeductions || 0)
      
      if (wunschrente !== null && wunschrente !== undefined) {
        rentenluecke = (wunschrente || 0) - totalRente
      }
    }
    
    const concept = await prisma.financialConcept.update({
      where: { id: params.id },
      data: {
        ...data,
        totalRente: totalRente,
        rentenluecke: rentenluecke,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })
    
    return NextResponse.json(concept)
  } catch (err: any) {
    console.error('Error updating financial concept:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.financialConcept.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Finanzkonzept gelöscht' })
  } catch (err: any) {
    console.error('Error deleting financial concept:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



