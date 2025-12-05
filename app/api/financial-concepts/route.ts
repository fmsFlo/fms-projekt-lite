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
  // FinancialConcept Modell ist aktuell nicht aktiviert im Prisma Schema
  return NextResponse.json({ 
    message: 'FinancialConcept Modell ist nicht aktiviert' 
  }, { status: 501 })
}

export async function POST(req: Request) {
  // FinancialConcept Modell ist aktuell nicht aktiviert im Prisma Schema
  return NextResponse.json({ 
    message: 'FinancialConcept Modell ist nicht aktiviert' 
  }, { status: 501 })
}



