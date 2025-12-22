import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const updateConceptSchema = z.object({
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
  statutoryStrengths: z.string().optional().nullable(),
  statutoryWeaknesses: z.string().optional().nullable(),
  privateStrengths: z.string().optional().nullable(),
  privateWeaknesses: z.string().optional().nullable(),
  customTemplateHtml: z.string().optional().nullable(),
  recommendationDelta: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  calculationSnapshot: z.string().optional().nullable(),
  // Produktvergleichsdaten
  productBefore: z.string().optional().nullable(),
  additionalRenteBefore: z.number().optional().nullable(),
  providerAfter: z.string().optional().nullable(),
  advantages: z.string().optional().nullable(),
  renteAfter1: z.number().optional().nullable(),
  renteAfter2: z.number().optional().nullable(),
  renteAfter3: z.number().optional().nullable(),
  returnRate1: z.number().optional().nullable(),
  returnRate2: z.number().optional().nullable(),
  returnRate3: z.number().optional().nullable(),
  monthlyContributionBefore: z.number().optional().nullable(),
  monthlyContributionAfter: z.number().optional().nullable(),
  // Empfehlungsdaten
  recommendationProvider: z.string().optional().nullable(),
  recommendationAdvantages: z.string().optional().nullable(),
  expectedRente: z.number().optional().nullable(),
})

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    // ⚠️ WICHTIG: Gib ALLE Felder zurück, nicht nur eine Teilmenge
    const concept = await prisma.retirementConcept.findUnique({
      where: { id: params.id },
      // Kein select - hole ALLE Felder!
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
          }
        }
      }
    })
    
    if (!concept) {
      return NextResponse.json({ message: 'Rentenkonzept nicht gefunden' }, { status: 404 })
    }
    
    console.log('📤 API GET - Geladenes Konzept (vollständig):', {
      id: concept.id,
      targetPensionNetto: concept.targetPensionNetto,
      targetPensionNettoType: typeof concept.targetPensionNetto,
      pensionAtRetirement: concept.pensionAtRetirement,
      monthlySavings: concept.monthlySavings,
      desiredRetirementAge: concept.desiredRetirementAge,
      lifeExpectancy: concept.lifeExpectancy,
      // Zeige alle wichtigen Felder
      hasCurrentPensionInfo: concept.hasCurrentPensionInfo,
      pensionIncrease: concept.pensionIncrease,
      inflationRate: concept.inflationRate,
      returnRate: concept.returnRate,
      withdrawalRate: concept.withdrawalRate,
    })
    
    // ⚠️ WICHTIG: Gib das vollständige Objekt zurück, nicht nur selected fields!
    return NextResponse.json(concept)
  } catch (err: any) {
    console.error('Error fetching retirement concept:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    
    // DEBUG: Zeige was ankommt
    console.log('🔍 PATCH /api/retirement-concepts/[id]')
    console.log('🔍 Concept ID:', params.id)
    console.log('🔍 Empfangener Body (RAW):', JSON.stringify(body, null, 2))
    console.log('🔍 targetPensionNetto:', body.targetPensionNetto, typeof body.targetPensionNetto)
    
    // Prüfe ob Konzept existiert
    const existing = await prisma.retirementConcept.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ message: 'Rentenkonzept nicht gefunden' }, { status: 404 })
    }
    
    // Baue Update-Objekt NUR mit vorhandenen Feldern
    const updateData: any = {}
    
    // Felder explizit übernehmen (NULL-Werte werden überschrieben!)
    if (body.birthDate !== undefined) {
      updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null
    }
    if (body.desiredRetirementAge !== undefined) {
      updateData.desiredRetirementAge = body.desiredRetirementAge === null ? null : Number(body.desiredRetirementAge)
    }
    if (body.targetPensionNetto !== undefined) {
      updateData.targetPensionNetto = body.targetPensionNetto === null ? null : Number(body.targetPensionNetto)
    }
    if (body.pensionAtRetirement !== undefined) {
      updateData.pensionAtRetirement = body.pensionAtRetirement === null ? null : Number(body.pensionAtRetirement)
    }
    if (body.monthlySavings !== undefined) {
      updateData.monthlySavings = body.monthlySavings === null ? null : Number(body.monthlySavings)
    }
    if (body.lifeExpectancy !== undefined) {
      updateData.lifeExpectancy = body.lifeExpectancy === null ? null : Number(body.lifeExpectancy)
    }
    if (body.hasCurrentPensionInfo !== undefined) {
      updateData.hasCurrentPensionInfo = body.hasCurrentPensionInfo
    }
    if (body.pensionIncrease !== undefined) {
      updateData.pensionIncrease = body.pensionIncrease === null ? null : Number(body.pensionIncrease)
    }
    if (body.inflationRate !== undefined) {
      updateData.inflationRate = body.inflationRate === null ? null : Number(body.inflationRate)
    }
    if (body.returnRate !== undefined) {
      updateData.returnRate = body.returnRate === null ? null : Number(body.returnRate)
    }
    if (body.withdrawalRate !== undefined) {
      updateData.withdrawalRate = body.withdrawalRate === null ? null : Number(body.withdrawalRate)
    }
    if (body.hasChildren !== undefined) {
      updateData.hasChildren = body.hasChildren
    }
    if (body.isCompulsoryInsured !== undefined) {
      updateData.isCompulsoryInsured = body.isCompulsoryInsured
    }
    if (body.kvBaseRate !== undefined) {
      updateData.kvBaseRate = body.kvBaseRate === null ? null : Number(body.kvBaseRate)
    }
    if (body.kvAdditionalRate !== undefined) {
      updateData.kvAdditionalRate = body.kvAdditionalRate === null ? null : Number(body.kvAdditionalRate)
    }
    if (body.kvContributionIncrease !== undefined) {
      updateData.kvContributionIncrease = body.kvContributionIncrease === null ? null : Number(body.kvContributionIncrease)
    }
    if (body.taxFilingStatus !== undefined) {
      updateData.taxFilingStatus = body.taxFilingStatus
    }
    if (body.taxFreeAmount !== undefined) {
      updateData.taxFreeAmount = body.taxFreeAmount === null ? null : Number(body.taxFreeAmount)
    }
    if (body.taxIncreaseRate !== undefined) {
      updateData.taxIncreaseRate = body.taxIncreaseRate === null ? null : Number(body.taxIncreaseRate)
    }
    if (body.taxFreePercentage !== undefined) {
      updateData.taxFreePercentage = body.taxFreePercentage === null ? null : Number(body.taxFreePercentage)
    }
    if (body.statutoryStrengths !== undefined) {
      updateData.statutoryStrengths = body.statutoryStrengths
    }
    if (body.statutoryWeaknesses !== undefined) {
      updateData.statutoryWeaknesses = body.statutoryWeaknesses
    }
    if (body.privateStrengths !== undefined) {
      updateData.privateStrengths = body.privateStrengths
    }
    if (body.privateWeaknesses !== undefined) {
      updateData.privateWeaknesses = body.privateWeaknesses
    }
    if (body.customTemplateHtml !== undefined) {
      updateData.customTemplateHtml = body.customTemplateHtml
    }
    if (body.recommendationDelta !== undefined) {
      updateData.recommendationDelta = body.recommendationDelta === null ? null : Number(body.recommendationDelta)
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }
    if (body.calculationSnapshot !== undefined) {
      updateData.calculationSnapshot = body.calculationSnapshot
    }
    if (body.existingProvisionData !== undefined) {
      updateData.existingProvisionData = body.existingProvisionData
    }
    if (body.calculatedPensionAtRetirement !== undefined) {
      updateData.calculatedPensionAtRetirement = body.calculatedPensionAtRetirement === null ? null : Number(body.calculatedPensionAtRetirement)
    }
    if (body.totalExistingProvision !== undefined) {
      updateData.totalExistingProvision = body.totalExistingProvision === null ? null : Number(body.totalExistingProvision)
    }
    if (body.totalPensionWithProvision !== undefined) {
      updateData.totalPensionWithProvision = body.totalPensionWithProvision === null ? null : Number(body.totalPensionWithProvision)
    }
    if (body.calculatedTargetPension !== undefined) {
      updateData.calculatedTargetPension = body.calculatedTargetPension === null ? null : Number(body.calculatedTargetPension)
    }
    
    // Füge ALLE anderen Felder aus body hinzu die im Prisma Schema existieren
    // (Produktvergleichsdaten, Empfehlungsdaten, etc.)
    Object.keys(body).forEach(key => {
      if (updateData[key] === undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'clientId' && key !== 'client') {
        updateData[key] = body[key]
      }
    })
    
    console.log('🔍 Update-Daten für Prisma:', JSON.stringify(updateData, null, 2))
    
    const updated = await prisma.retirementConcept.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
          }
        }
      }
    })
    
    console.log('✅ Erfolgreich gespeichert:', JSON.stringify({
      id: updated.id,
      targetPensionNetto: updated.targetPensionNetto,
      pensionAtRetirement: updated.pensionAtRetirement,
      monthlySavings: updated.monthlySavings,
      desiredRetirementAge: updated.desiredRetirementAge,
      lifeExpectancy: updated.lifeExpectancy,
    }, null, 2))
    
    // Synchronisiere wichtige Werte zum Client (mit Fehlerbehandlung)
    const clientUpdateData: any = {}
    if (body.targetPensionNetto !== undefined) {
      clientUpdateData.targetPensionNetto = body.targetPensionNetto === null ? null : Number(body.targetPensionNetto)
    }
    if (body.desiredRetirementAge !== undefined) {
      clientUpdateData.desiredRetirementAge = body.desiredRetirementAge === null ? null : Number(body.desiredRetirementAge)
    }
    if (body.monthlySavings !== undefined) {
      clientUpdateData.monthlySavings = body.monthlySavings === null ? null : Number(body.monthlySavings)
    }
    if (body.birthDate !== undefined) {
      clientUpdateData.birthDate = body.birthDate ? new Date(body.birthDate) : null
    }
    
    // Aktualisiere Client, wenn es Werte zu synchronisieren gibt
    if (Object.keys(clientUpdateData).length > 0) {
      try {
        await prisma.client.update({
          where: { id: updated.clientId },
          data: clientUpdateData
        })
      } catch (clientUpdateError: any) {
        console.warn('Fehler beim Synchronisieren der Client-Daten:', clientUpdateError.message)
      }
    }
    
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('❌ PATCH Error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.retirementConcept.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Rentenkonzept gelöscht' })
  } catch (err: any) {
    console.error('Error deleting retirement concept:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

