import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const financialConceptSchema = z.object({
  clientId: z.string().min(1, 'Client-ID ist erforderlich'),
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    
    if (clientId) {
      const concepts = await prisma.financialConcept.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
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
      return NextResponse.json(concepts)
    }
    
    const concepts = await prisma.financialConcept.findMany({
      orderBy: { createdAt: 'desc' },
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
    return NextResponse.json(concepts)
  } catch (err: any) {
    console.error('Error fetching financial concepts:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = financialConceptSchema.parse(body)
    
    // Berechne Gesamtrente und Rentenlücke
    let totalRente = null
    let rentenluecke = null
    
    if (data.currentRente !== null && data.currentRente !== undefined) {
      totalRente = (data.currentRente || 0) + 
                   (data.currentVorsorge || 0) + 
                   (data.renteWithIncrease || 0) - 
                   (data.taxDeductions || 0) - 
                   (data.socialDeductions || 0)
      
      if (data.wunschrente !== null && data.wunschrente !== undefined) {
        rentenluecke = (data.wunschrente || 0) - totalRente
      }
    }
    
    const concept = await prisma.financialConcept.create({
      data: {
        clientId: data.clientId,
        currentRente: data.currentRente || null,
        currentVorsorge: data.currentVorsorge || null,
        renteWithIncrease: data.renteWithIncrease || null,
        taxDeductions: data.taxDeductions || null,
        socialDeductions: data.socialDeductions || null,
        totalRente: totalRente,
        rentenluecke: rentenluecke,
        wunschrente: data.wunschrente || null,
        notes: data.notes || null,
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
    
    return NextResponse.json(concept, { status: 201 })
  } catch (err: any) {
    console.error('Error creating financial concept:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



