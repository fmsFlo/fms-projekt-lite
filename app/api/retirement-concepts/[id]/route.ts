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
})

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const concept = await prisma.retirementConcept.findUnique({
      where: { id: params.id },
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
    
    return NextResponse.json(concept)
  } catch (err: any) {
    console.error('Error fetching retirement concept:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const data = updateConceptSchema.parse(body)
    
    // Hole bestehendes Konzept
    const existing = await prisma.retirementConcept.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ message: 'Rentenkonzept nicht gefunden' }, { status: 404 })
    }
    
    // Aktualisiere Werte
    const birthDate = data.birthDate !== undefined 
      ? (data.birthDate ? new Date(data.birthDate) : null)
      : existing.birthDate
    
    // Aktualisiere Konzept
    const concept = await prisma.retirementConcept.update({
      where: { id: params.id },
      data: {
        birthDate: birthDate,
        desiredRetirementAge: data.desiredRetirementAge !== undefined ? data.desiredRetirementAge : existing.desiredRetirementAge,
        targetPensionNetto: data.targetPensionNetto !== undefined ? data.targetPensionNetto : existing.targetPensionNetto,
        hasCurrentPensionInfo: data.hasCurrentPensionInfo !== undefined ? data.hasCurrentPensionInfo : existing.hasCurrentPensionInfo,
        pensionAtRetirement: data.pensionAtRetirement !== undefined ? data.pensionAtRetirement : existing.pensionAtRetirement,
        pensionIncrease: data.pensionIncrease !== undefined ? data.pensionIncrease : existing.pensionIncrease,
        inflationRate: data.inflationRate !== undefined ? data.inflationRate : existing.inflationRate,
        calculatedPensionAtRetirement: data.calculatedPensionAtRetirement !== undefined ? data.calculatedPensionAtRetirement : existing.calculatedPensionAtRetirement,
        existingProvisionData: data.existingProvisionData !== undefined ? data.existingProvisionData : existing.existingProvisionData,
        totalExistingProvision: data.totalExistingProvision !== undefined ? data.totalExistingProvision : existing.totalExistingProvision,
        totalPensionWithProvision: data.totalPensionWithProvision !== undefined ? data.totalPensionWithProvision : existing.totalPensionWithProvision,
        calculatedTargetPension: data.calculatedTargetPension !== undefined ? data.calculatedTargetPension : existing.calculatedTargetPension,
        lifeExpectancy: data.lifeExpectancy !== undefined ? data.lifeExpectancy : existing.lifeExpectancy,
        monthlySavings: data.monthlySavings !== undefined ? data.monthlySavings : existing.monthlySavings,
        returnRate: data.returnRate !== undefined ? data.returnRate : existing.returnRate,
        withdrawalRate: data.withdrawalRate !== undefined ? data.withdrawalRate : existing.withdrawalRate,
        hasChildren: data.hasChildren !== undefined ? data.hasChildren : existing.hasChildren,
        isCompulsoryInsured: data.isCompulsoryInsured !== undefined ? data.isCompulsoryInsured : existing.isCompulsoryInsured,
        kvBaseRate: data.kvBaseRate !== undefined ? data.kvBaseRate : existing.kvBaseRate,
        kvAdditionalRate: data.kvAdditionalRate !== undefined ? data.kvAdditionalRate : existing.kvAdditionalRate,
        kvContributionIncrease: data.kvContributionIncrease !== undefined ? data.kvContributionIncrease : existing.kvContributionIncrease,
        taxFilingStatus: data.taxFilingStatus !== undefined ? data.taxFilingStatus : existing.taxFilingStatus,
        taxFreeAmount: data.taxFreeAmount !== undefined ? data.taxFreeAmount : existing.taxFreeAmount,
        taxIncreaseRate: data.taxIncreaseRate !== undefined ? data.taxIncreaseRate : existing.taxIncreaseRate,
        taxFreePercentage: data.taxFreePercentage !== undefined ? data.taxFreePercentage : existing.taxFreePercentage,
        statutoryStrengths: data.statutoryStrengths !== undefined ? data.statutoryStrengths : existing.statutoryStrengths,
        statutoryWeaknesses: data.statutoryWeaknesses !== undefined ? data.statutoryWeaknesses : existing.statutoryWeaknesses,
        privateStrengths: data.privateStrengths !== undefined ? data.privateStrengths : (existing as any).privateStrengths,
        privateWeaknesses: data.privateWeaknesses !== undefined ? data.privateWeaknesses : (existing as any).privateWeaknesses,
        customTemplateHtml: data.customTemplateHtml !== undefined ? data.customTemplateHtml : (existing as any).customTemplateHtml,
        recommendationDelta: data.recommendationDelta !== undefined ? data.recommendationDelta : (existing as any).recommendationDelta,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        calculationSnapshot: data.calculationSnapshot !== undefined ? data.calculationSnapshot : (existing as any).calculationSnapshot,
      },
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
    
    return NextResponse.json(concept)
  } catch (err: any) {
    console.error('Error updating retirement concept:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
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

