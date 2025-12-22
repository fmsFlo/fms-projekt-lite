import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const retirementConceptSchema = z.object({
  clientId: z.string().min(1, 'Client-ID ist erforderlich'),
  birthDate: z.string().optional().nullable(),
  desiredRetirementAge: z.number().optional().nullable(),
  targetPensionNetto: z.number().optional().nullable(),
  hasCurrentPensionInfo: z.boolean().optional().nullable(),
  pensionAtRetirement: z.number().optional().nullable(),
  pensionIncrease: z.number().optional().nullable(),
  inflationRate: z.number().optional().nullable(),
  calculatedPensionAtRetirement: z.number().optional().nullable(),
  existingProvisionData: z.string().optional().nullable(),
  totalExistingProvision: z.number().optional().nullable(),
  totalPensionWithProvision: z.number().optional().nullable(),
  calculatedTargetPension: z.number().optional().nullable(),
  lifeExpectancy: z.number().optional().nullable(),
  monthlySavings: z.number().optional().nullable(),
  returnRate: z.number().optional().nullable(),
  withdrawalRate: z.number().optional().nullable(),
  hasChildren: z.boolean().optional().nullable(),
  isCompulsoryInsured: z.boolean().optional().nullable(),
  kvBaseRate: z.number().optional().nullable(),
  kvAdditionalRate: z.number().optional().nullable(),
  kvContributionIncrease: z.number().optional().nullable(),
  taxFilingStatus: z.string().optional().nullable(),
  taxFreeAmount: z.number().optional().nullable(),
  taxIncreaseRate: z.number().optional().nullable(),
  taxFreePercentage: z.number().optional().nullable(),
  capitalGainsTaxRate: z.number().optional().nullable(),
  capitalGainsSoliRate: z.number().optional().nullable(),
  capitalGainsChurchRate: z.number().optional().nullable(),
  capitalGainsAllowance: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  calculationSnapshot: z.string().optional().nullable(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    
    if (clientId) {
      const concepts = await prisma.retirementConcept.findMany({
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
    
    const concepts = await prisma.retirementConcept.findMany({
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
    console.error('Error fetching retirement concepts:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = retirementConceptSchema.parse(body)
    
    // Hole Client für Geburtsdatum
    const client = await prisma.client.findUnique({
      where: { id: data.clientId }
    })
    
    if (!client) {
      return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })
    }
    
    // Konvertiere Datum-String zu Date-Objekt
    const birthDate = data.birthDate 
      ? new Date(data.birthDate) 
      : client.birthDate || null
    
    // Erstelle Rentenkonzept in der Datenbank
    const concept = await prisma.retirementConcept.create({
      data: {
        clientId: data.clientId,
        birthDate,
        ...(data.desiredRetirementAge !== undefined && { desiredRetirementAge: data.desiredRetirementAge }),
        ...(data.targetPensionNetto !== undefined && { targetPensionNetto: data.targetPensionNetto }),
        ...(data.hasCurrentPensionInfo !== undefined && { hasCurrentPensionInfo: data.hasCurrentPensionInfo }),
        ...(data.pensionAtRetirement !== undefined && { pensionAtRetirement: data.pensionAtRetirement }),
        ...(data.pensionIncrease !== undefined && { pensionIncrease: data.pensionIncrease }),
        ...(data.inflationRate !== undefined && { inflationRate: data.inflationRate }),
        ...(data.calculatedPensionAtRetirement !== undefined && { calculatedPensionAtRetirement: data.calculatedPensionAtRetirement }),
        ...(data.existingProvisionData !== undefined && { existingProvisionData: data.existingProvisionData }),
        ...(data.totalExistingProvision !== undefined && { totalExistingProvision: data.totalExistingProvision }),
        ...(data.totalPensionWithProvision !== undefined && { totalPensionWithProvision: data.totalPensionWithProvision }),
        ...(data.calculatedTargetPension !== undefined && { calculatedTargetPension: data.calculatedTargetPension }),
        ...(data.lifeExpectancy !== undefined && { lifeExpectancy: data.lifeExpectancy }),
        ...(data.monthlySavings !== undefined && { monthlySavings: data.monthlySavings }),
        ...(data.returnRate !== undefined && { returnRate: data.returnRate }),
        ...(data.withdrawalRate !== undefined && { withdrawalRate: data.withdrawalRate }),
        ...(data.hasChildren !== undefined && { hasChildren: data.hasChildren }),
        ...(data.isCompulsoryInsured !== undefined && { isCompulsoryInsured: data.isCompulsoryInsured }),
        ...(data.kvBaseRate !== undefined && { kvBaseRate: data.kvBaseRate }),
        ...(data.kvAdditionalRate !== undefined && { kvAdditionalRate: data.kvAdditionalRate }),
        ...(data.kvContributionIncrease !== undefined && { kvContributionIncrease: data.kvContributionIncrease }),
        ...(data.taxFilingStatus !== undefined && { taxFilingStatus: data.taxFilingStatus }),
        ...(data.taxFreeAmount !== undefined && { taxFreeAmount: data.taxFreeAmount }),
        ...(data.taxIncreaseRate !== undefined && { taxIncreaseRate: data.taxIncreaseRate }),
        ...(data.taxFreePercentage !== undefined && { taxFreePercentage: data.taxFreePercentage }),
        ...(data.capitalGainsTaxRate !== undefined && { capitalGainsTaxRate: data.capitalGainsTaxRate }),
        ...(data.capitalGainsSoliRate !== undefined && { capitalGainsSoliRate: data.capitalGainsSoliRate }),
        ...(data.capitalGainsChurchRate !== undefined && { capitalGainsChurchRate: data.capitalGainsChurchRate }),
        ...(data.capitalGainsAllowance !== undefined && { capitalGainsAllowance: data.capitalGainsAllowance }),
        ...(data.calculationSnapshot !== undefined && { calculationSnapshot: data.calculationSnapshot }),
        ...(data.notes !== undefined && { notes: data.notes }),
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
    
    // Synchronisiere wichtige Werte zum Client (mit Fehlerbehandlung)
    const clientUpdateData: any = {}
    if (data.targetPensionNetto !== undefined) {
      clientUpdateData.targetPensionNetto = data.targetPensionNetto
    }
    if (data.desiredRetirementAge !== undefined) {
      clientUpdateData.desiredRetirementAge = data.desiredRetirementAge
    }
    if (data.monthlySavings !== undefined) {
      clientUpdateData.monthlySavings = data.monthlySavings
    }
    if (birthDate !== null) {
      clientUpdateData.birthDate = birthDate
    }
    
    // Aktualisiere Client, wenn es Werte zu synchronisieren gibt
    // Fehlerbehandlung: Wenn Client-Update fehlschlägt, ist das nicht kritisch
    if (Object.keys(clientUpdateData).length > 0) {
      try {
        await prisma.client.update({
          where: { id: data.clientId },
          data: clientUpdateData
        })
      } catch (clientUpdateError: any) {
        // Logge den Fehler, aber lasse das Konzept-Speichern nicht scheitern
        console.warn('Fehler beim Synchronisieren der Client-Daten:', clientUpdateError.message)
        // Prüfe, ob die Felder in der Datenbank existieren
        if (clientUpdateError.message?.includes('Unknown argument') || clientUpdateError.message?.includes('does not exist')) {
          console.warn('Hinweis: Client-Felder existieren möglicherweise noch nicht in der Datenbank. Führe "npx prisma db push" aus.')
        }
      }
    }
    
    return NextResponse.json(concept, { status: 201 })
  } catch (err: any) {
    console.error('Error creating retirement concept:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message, code: err.code, meta: err.meta }, { status: 500 })
  }
}

