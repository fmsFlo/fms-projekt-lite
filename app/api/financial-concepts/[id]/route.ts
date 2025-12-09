import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
  // FinancialConcept Modell ist aktuell nicht aktiviert im Prisma Schema
  return NextResponse.json({ 
    message: 'FinancialConcept Modell ist nicht aktiviert' 
  }, { status: 501 })
}

export async function PATCH(req: Request, { params }: Params) {
  // FinancialConcept Modell ist aktuell nicht aktiviert im Prisma Schema
  return NextResponse.json({ 
    message: 'FinancialConcept Modell ist nicht aktiviert' 
  }, { status: 501 })
}

export async function DELETE(_req: Request, { params }: Params) {
  // FinancialConcept Modell ist aktuell nicht aktiviert im Prisma Schema
  return NextResponse.json({ 
    message: 'FinancialConcept Modell ist nicht aktiviert' 
  }, { status: 501 })
}



