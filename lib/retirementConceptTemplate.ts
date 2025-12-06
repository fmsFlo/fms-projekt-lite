import path from 'node:path'
import fs from 'node:fs/promises'
import Handlebars from 'handlebars'
import type { Prisma, RetirementConcept } from '@prisma/client'

type TemplateAttachment = {
  id: string
  category: string
  originalName: string
  filePath?: string | null
}

interface TemplateConcept {
  id: string
  client?: {
    firstName?: string | null
    lastName?: string | null
  } | null
  attachments?: TemplateAttachment[]
  targetPensionNetto?: number | null
  calculatedPensionAtRetirement?: number | null
  totalPensionWithProvision?: number | null
  statutoryStrengths?: string | null
  statutoryWeaknesses?: string | null
  privateStrengths?: string | null
  privateWeaknesses?: string | null
  recommendationDelta?: number | null
  customTemplateHtml?: string | null
  notes?: string | null
  calculationSnapshot?: string | null
}

export interface RetirementConceptTemplateAttachment {
  originalName: string
  fileUrl: string
}

type CalculationSnapshot = {
  statutory?: {
    grossCurrent: number | null
    grossFuture: number | null
    netCurrent: number | null
    netFuture: number | null
  }
  privateExisting?: {
    grossCurrent: number
    grossFuture: number
    netCurrent: number
    netFuture: number
  }
  planned?: {
    grossCurrent: number
    grossFuture: number
    netCurrent: number
    netFuture: number
  }
  gaps?: {
    before: number
    after: number
    coveragePercent: number
  }
  requiredSavings?: {
    monthlySavings: number
    netFuture: number
    netCurrent: number
  }
  meta?: {
    employmentType?: 'employee' | 'civil-servant'
    civilServant?: {
      inputs?: {
        entryDate?: string
        state?: string
        besoldungsgruppe?: string
        erfahrungsstufe?: number
        pensionIncrease?: number
        additional?: number
        hasPromotion?: boolean
        futureGroup?: string
        futureLevel?: number
        churchTax?: boolean
        insuranceType?: 'statutory' | 'private'
        statutoryHasBeihilfe?: boolean
        beihilfeRateCurrent?: number
        beihilfeRateRetirement?: number
        privateContributionCurrent?: number
      }
      results?: {
        brutto?: number
        netto?: number
        steuern?: number
        kvpv?: number
        ruhegehaltssatz?: number
        insuranceType?: 'statutory' | 'private'
        contributionsCurrent?: number
        contributionsFuture?: number
        beihilfeRateCurrent?: number
        beihilfeRateRetirement?: number
      }
    }
  }
}

export interface RetirementConceptTemplateData {
  clientName: string
  clientNameRaw: string | null
  targetPensionNetto?: string
  targetPensionNettoRaw?: number | null
  statutorySummary?: string
  statutorySummaryRaw?: number | null
  pensionGap?: string
  pensionGapRaw?: number | null
  statutoryStrengths?: string
  statutoryWeaknesses?: string
  privateStrengths?: string
  privateWeaknesses?: string
  statutoryAttachments: RetirementConceptTemplateAttachment[]
  privateAttachments: RetirementConceptTemplateAttachment[]
  recommendation?: string
  recommendationDelta?: string
  recommendationDeltaRaw?: number | null
  generatedAtIso: string
  statutoryAttachment1Url?: string
  statutoryAttachment1Name?: string
  statutoryAttachment2Url?: string
  statutoryAttachment2Name?: string
  statutoryGrossCurrent?: string
  statutoryGrossCurrentRaw?: number | null
  statutoryNetCurrent?: string
  statutoryNetCurrentRaw?: number | null
  statutoryGrossFuture?: string
  statutoryGrossFutureRaw?: number | null
  statutoryNetFuture?: string
  statutoryNetFutureRaw?: number | null
  privateGrossCurrent?: string
  privateGrossCurrentRaw?: number | null
  privateNetCurrent?: string
  privateNetCurrentRaw?: number | null
  privateGrossFuture?: string
  privateGrossFutureRaw?: number | null
  privateNetFuture?: string
  privateNetFutureRaw?: number | null
  plannedGrossFuture?: string
  plannedGrossFutureRaw?: number | null
  plannedGrossCurrent?: string
  plannedGrossCurrentRaw?: number | null
  plannedNetFuture?: string
  plannedNetFutureRaw?: number | null
  plannedNetCurrent?: string
  plannedNetCurrentRaw?: number | null
  gapBefore?: string
  gapBeforeRaw?: number | null
  gapAfter?: string
  gapAfterRaw?: number | null
  gapCoveragePercent?: string
  gapCoveragePercentRaw?: number | null
  requiredSavingsMonthly?: string
  requiredSavingsMonthlyRaw?: number | null
  requiredSavingsMonthlyCurrent?: string
  requiredSavingsMonthlyCurrentRaw?: number | null
  requiredSavingsNetFuture?: string
  requiredSavingsNetFutureRaw?: number | null
  requiredSavingsNetCurrent?: string
  requiredSavingsNetCurrentRaw?: number | null
  scenarioBaseNet?: string
  scenarioBaseNetRaw?: number | null
  scenarioBaseGap?: string
  scenarioBaseGapRaw?: number | null
  scenarioCurrentNet?: string
  scenarioCurrentNetRaw?: number | null
  scenarioCurrentGap?: string
  scenarioCurrentGapRaw?: number | null
  scenarioOptimizedNet?: string
  scenarioOptimizedNetRaw?: number | null
  scenarioOptimizedGap?: string
  scenarioOptimizedGapRaw?: number | null
  scenarioOptimizedCoverage?: string
  scenarioOptimizedCoverageRaw?: number | null
  employmentType?: 'employee' | 'civil-servant'
  civilServantGross?: string
  civilServantGrossRaw?: number | null
  civilServantNet?: string
  civilServantNetRaw?: number | null
  civilServantTaxes?: string
  civilServantTaxesRaw?: number | null
  civilServantKvpv?: string
  civilServantKvpvRaw?: number | null
  civilServantRuhegehaltssatz?: string
  civilServantRuhegehaltssatzRaw?: number | null
  civilServantEntryDate?: string
  civilServantState?: string
  civilServantBesoldungsgruppe?: string
  civilServantErfahrungsstufe?: number | null
  civilServantAdditional?: number | null
  civilServantPensionIncrease?: number | null
  civilServantHasPromotion?: boolean
  civilServantFutureGroup?: string
  civilServantFutureLevel?: number | null
  civilServantInsuranceType?: string
  civilServantInsuranceTypeRaw?: 'statutory' | 'private' | null
  civilServantContributionCurrent?: string
  civilServantContributionCurrentRaw?: number | null
  civilServantContributionFuture?: string
  civilServantContributionFutureRaw?: number | null
  civilServantBeihilfeCurrent?: string
  civilServantBeihilfeCurrentRaw?: number | null
  civilServantBeihilfeRetirement?: string
  civilServantBeihilfeRetirementRaw?: number | null
}

interface RenderOptions {
  resolveAttachmentUrl: (attachment: TemplateAttachment, conceptId: string) => string | null
}

const formatEuroValue = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined
  }
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function buildRetirementConceptTemplateData(
  concept: TemplateConcept & { calculationSnapshot?: string | null },
  options: RenderOptions,
): RetirementConceptTemplateData {
  const buildAttachmentList = (category: string): RetirementConceptTemplateAttachment[] =>
    concept.attachments
      ?.filter((attachment) => attachment.category === category)
      .map((attachment) => {
        const fileUrl = options.resolveAttachmentUrl(attachment, concept.id)
        if (!fileUrl) {
          return null
        }
        return {
          originalName: attachment.originalName,
          fileUrl,
        }
      })
      .filter((attachment): attachment is RetirementConceptTemplateAttachment => Boolean(attachment)) ?? []

  const clientNameRaw = `${concept.client?.firstName ?? ''} ${concept.client?.lastName ?? ''}`.trim() || null
  const targetPensionNettoRaw =
    typeof concept.targetPensionNetto === 'number' && !Number.isNaN(concept.targetPensionNetto)
      ? concept.targetPensionNetto
      : null
  const statutorySummaryRaw =
    typeof concept.calculatedPensionAtRetirement === 'number' && !Number.isNaN(concept.calculatedPensionAtRetirement)
      ? concept.calculatedPensionAtRetirement
      : null

  const hasTarget = typeof targetPensionNettoRaw === 'number'
  const hasTotalProvision =
    typeof concept.totalPensionWithProvision === 'number' && !Number.isNaN(concept.totalPensionWithProvision)

  const pensionGapRaw =
    hasTarget && hasTotalProvision ? targetPensionNettoRaw! - concept.totalPensionWithProvision! : null

  const statutoryAttachments = buildAttachmentList('statutory')
  const privateAttachments = buildAttachmentList('private')

  let snapshot: CalculationSnapshot | null = null
  if ('calculationSnapshot' in concept && typeof (concept as any).calculationSnapshot === 'string') {
    try {
      snapshot = JSON.parse((concept as any).calculationSnapshot) as CalculationSnapshot
    } catch (error) {
      console.warn('Konnte calculationSnapshot nicht parsen:', error)
      snapshot = null
    }
  }

  const formatPercentValue = (value: number | null | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return undefined
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
  }

  const statutoryNetFutureRaw = snapshot?.statutory?.netFuture ?? null
  const privateNetFutureRaw = snapshot?.privateExisting?.netFuture ?? null
  const plannedNetFutureRaw = snapshot?.planned?.netFuture ?? null

  const scenarioBaseNetRaw =
    typeof statutoryNetFutureRaw === 'number' && !Number.isNaN(statutoryNetFutureRaw)
      ? statutoryNetFutureRaw
      : null

  const scenarioCurrentNetRaw = (() => {
    const statutoryPart = typeof statutoryNetFutureRaw === 'number' && !Number.isNaN(statutoryNetFutureRaw) ? statutoryNetFutureRaw : 0
    const privatePart = typeof privateNetFutureRaw === 'number' && !Number.isNaN(privateNetFutureRaw) ? privateNetFutureRaw : 0
    if (statutoryPart === 0 && privatePart === 0) {
      return null
    }
    return statutoryPart + privatePart
  })()

  const scenarioOptimizedNetRaw = (() => {
    const currentPart = typeof scenarioCurrentNetRaw === 'number' ? scenarioCurrentNetRaw : 0
    const plannedPart = typeof plannedNetFutureRaw === 'number' && !Number.isNaN(plannedNetFutureRaw) ? plannedNetFutureRaw : 0
    if (currentPart === 0 && plannedPart === 0) {
      return null
    }
    return currentPart + plannedPart
  })()

  const calcGap = (target: number | null, actual: number | null) => {
    if (typeof target !== 'number' || Number.isNaN(target) || target <= 0) return null
    if (typeof actual !== 'number' || Number.isNaN(actual)) return target
    return Math.max(0, target - actual)
  }

  const scenarioBaseGapRaw = calcGap(targetPensionNettoRaw ?? null, scenarioBaseNetRaw)
  const scenarioCurrentGapRaw = calcGap(targetPensionNettoRaw ?? null, scenarioCurrentNetRaw)
  const scenarioOptimizedGapRaw = calcGap(targetPensionNettoRaw ?? null, scenarioOptimizedNetRaw)

  const scenarioOptimizedCoverageRaw =
    typeof targetPensionNettoRaw === 'number' &&
    !Number.isNaN(targetPensionNettoRaw) &&
    targetPensionNettoRaw > 0 &&
    typeof scenarioOptimizedNetRaw === 'number' &&
    !Number.isNaN(scenarioOptimizedNetRaw)
      ? Math.min(100, Math.max(0, (scenarioOptimizedNetRaw / targetPensionNettoRaw) * 100))
      : null

  const employmentType: 'employee' | 'civil-servant' =
    snapshot?.meta?.employmentType === 'civil-servant' ? 'civil-servant' : 'employee'
  const civilServantInputs = snapshot?.meta?.civilServant?.inputs
  const civilServantResults = snapshot?.meta?.civilServant?.results

  const insuranceTypeLabel = civilServantResults?.insuranceType
    ? civilServantResults.insuranceType === 'private'
      ? 'Private Krankenversicherung'
      : 'Gesetzliche Krankenversicherung'
    : undefined

  return {
    clientName: clientNameRaw ?? 'Kunde',
    clientNameRaw,
    targetPensionNetto: formatEuroValue(targetPensionNettoRaw ?? null),
    targetPensionNettoRaw,
    statutorySummary: formatEuroValue(statutorySummaryRaw ?? null),
    statutorySummaryRaw,
    pensionGap: formatEuroValue(pensionGapRaw),
    pensionGapRaw,
    statutoryStrengths: concept.statutoryStrengths ?? undefined,
    statutoryWeaknesses: concept.statutoryWeaknesses ?? undefined,
    privateStrengths: concept.privateStrengths ?? undefined,
    privateWeaknesses: concept.privateWeaknesses ?? undefined,
    statutoryAttachments,
    privateAttachments,
    recommendation: concept.notes ?? undefined,
    recommendationDelta: formatEuroValue(concept.recommendationDelta ?? null),
    recommendationDeltaRaw: concept.recommendationDelta ?? null,
    generatedAtIso: new Date().toISOString(),
    employmentType,
    civilServantGross: formatEuroValue(civilServantResults?.brutto ?? null),
    civilServantGrossRaw: civilServantResults?.brutto ?? null,
    civilServantNet: formatEuroValue(civilServantResults?.netto ?? null),
    civilServantNetRaw: civilServantResults?.netto ?? null,
    civilServantTaxes: formatEuroValue(civilServantResults?.steuern ?? null),
    civilServantTaxesRaw: civilServantResults?.steuern ?? null,
    civilServantKvpv: formatEuroValue(civilServantResults?.kvpv ?? null),
    civilServantKvpvRaw: civilServantResults?.kvpv ?? null,
    civilServantRuhegehaltssatz:
      typeof civilServantResults?.ruhegehaltssatz === 'number'
        ? `${civilServantResults.ruhegehaltssatz.toLocaleString('de-DE', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}%`
        : undefined,
    civilServantRuhegehaltssatzRaw: civilServantResults?.ruhegehaltssatz ?? null,
    civilServantEntryDate: civilServantInputs?.entryDate,
    civilServantState: civilServantInputs?.state,
    civilServantBesoldungsgruppe: civilServantInputs?.besoldungsgruppe,
    civilServantErfahrungsstufe: civilServantInputs?.erfahrungsstufe ?? null,
    civilServantAdditional: civilServantInputs?.additional ?? null,
    civilServantPensionIncrease: civilServantInputs?.pensionIncrease ?? null,
    civilServantHasPromotion: civilServantInputs?.hasPromotion ?? undefined,
    civilServantFutureGroup: civilServantInputs?.futureGroup,
    civilServantFutureLevel: civilServantInputs?.futureLevel ?? null,
    civilServantInsuranceType: insuranceTypeLabel,
    civilServantInsuranceTypeRaw: civilServantResults?.insuranceType ?? null,
    civilServantContributionCurrent: formatEuroValue(civilServantResults?.contributionsCurrent ?? null),
    civilServantContributionCurrentRaw: civilServantResults?.contributionsCurrent ?? null,
    civilServantContributionFuture: formatEuroValue(civilServantResults?.contributionsFuture ?? null),
    civilServantContributionFutureRaw: civilServantResults?.contributionsFuture ?? null,
    civilServantBeihilfeCurrent:
      typeof civilServantResults?.beihilfeRateCurrent === 'number'
        ? `${(civilServantResults.beihilfeRateCurrent * 100).toLocaleString('de-DE', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}%`
        : undefined,
    civilServantBeihilfeCurrentRaw: civilServantResults?.beihilfeRateCurrent ?? null,
    civilServantBeihilfeRetirement:
      typeof civilServantResults?.beihilfeRateRetirement === 'number'
        ? `${(civilServantResults.beihilfeRateRetirement * 100).toLocaleString('de-DE', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}%`
        : undefined,
    civilServantBeihilfeRetirementRaw: civilServantResults?.beihilfeRateRetirement ?? null,
    statutoryAttachment1Url: statutoryAttachments[0]?.fileUrl,
    statutoryAttachment1Name: statutoryAttachments[0]?.originalName,
    statutoryAttachment2Url: statutoryAttachments[1]?.fileUrl,
    statutoryAttachment2Name: statutoryAttachments[1]?.originalName,
    statutoryGrossCurrent: formatEuroValue(snapshot?.statutory?.grossCurrent ?? null),
    statutoryGrossCurrentRaw: snapshot?.statutory?.grossCurrent ?? null,
    statutoryNetCurrent: formatEuroValue(snapshot?.statutory?.netCurrent ?? null),
    statutoryNetCurrentRaw: snapshot?.statutory?.netCurrent ?? null,
    statutoryGrossFuture: formatEuroValue(snapshot?.statutory?.grossFuture ?? null),
    statutoryGrossFutureRaw: snapshot?.statutory?.grossFuture ?? null,
    statutoryNetFuture: formatEuroValue(snapshot?.statutory?.netFuture ?? null),
    statutoryNetFutureRaw: snapshot?.statutory?.netFuture ?? null,
    privateGrossCurrent: formatEuroValue(snapshot?.privateExisting?.grossCurrent ?? null),
    privateGrossCurrentRaw: snapshot?.privateExisting?.grossCurrent ?? null,
    privateNetCurrent: formatEuroValue(snapshot?.privateExisting?.netCurrent ?? null),
    privateNetCurrentRaw: snapshot?.privateExisting?.netCurrent ?? null,
    privateGrossFuture: formatEuroValue(snapshot?.privateExisting?.grossFuture ?? null),
    privateGrossFutureRaw: snapshot?.privateExisting?.grossFuture ?? null,
    privateNetFuture: formatEuroValue(snapshot?.privateExisting?.netFuture ?? null),
    privateNetFutureRaw: snapshot?.privateExisting?.netFuture ?? null,
    plannedGrossFuture: formatEuroValue(snapshot?.planned?.grossFuture ?? null),
    plannedGrossFutureRaw: snapshot?.planned?.grossFuture ?? null,
    plannedGrossCurrent: formatEuroValue(snapshot?.planned?.grossCurrent ?? null),
    plannedGrossCurrentRaw: snapshot?.planned?.grossCurrent ?? null,
    plannedNetFuture: formatEuroValue(snapshot?.planned?.netFuture ?? null),
    plannedNetFutureRaw: snapshot?.planned?.netFuture ?? null,
    plannedNetCurrent: formatEuroValue(snapshot?.planned?.netCurrent ?? null),
    plannedNetCurrentRaw: snapshot?.planned?.netCurrent ?? null,
    gapBefore: formatEuroValue(snapshot?.gaps?.before ?? null),
    gapBeforeRaw: snapshot?.gaps?.before ?? null,
    gapAfter: formatEuroValue(snapshot?.gaps?.after ?? null),
    gapAfterRaw: snapshot?.gaps?.after ?? null,
    gapCoveragePercent: formatPercentValue(snapshot?.gaps?.coveragePercent ?? null),
    gapCoveragePercentRaw: snapshot?.gaps?.coveragePercent ?? null,
    requiredSavingsMonthly: formatEuroValue(snapshot?.requiredSavings?.monthlySavings ?? null),
    requiredSavingsMonthlyRaw: snapshot?.requiredSavings?.monthlySavings ?? null,
    requiredSavingsMonthlyCurrent: formatEuroValue(snapshot?.requiredSavings?.monthlySavings ?? null),
    requiredSavingsMonthlyCurrentRaw: snapshot?.requiredSavings?.monthlySavings ?? null,
    requiredSavingsNetFuture: formatEuroValue(snapshot?.requiredSavings?.netFuture ?? null),
    requiredSavingsNetFutureRaw: snapshot?.requiredSavings?.netFuture ?? null,
    requiredSavingsNetCurrent: formatEuroValue(snapshot?.requiredSavings?.netCurrent ?? null),
    requiredSavingsNetCurrentRaw: snapshot?.requiredSavings?.netCurrent ?? null,
    scenarioBaseNet: formatEuroValue(scenarioBaseNetRaw),
    scenarioBaseNetRaw,
    scenarioBaseGap: formatEuroValue(scenarioBaseGapRaw),
    scenarioBaseGapRaw,
    scenarioCurrentNet: formatEuroValue(scenarioCurrentNetRaw),
    scenarioCurrentNetRaw,
    scenarioCurrentGap: formatEuroValue(scenarioCurrentGapRaw),
    scenarioCurrentGapRaw,
    scenarioOptimizedNet: formatEuroValue(scenarioOptimizedNetRaw),
    scenarioOptimizedNetRaw,
    scenarioOptimizedGap: formatEuroValue(scenarioOptimizedGapRaw),
    scenarioOptimizedGapRaw,
    scenarioOptimizedCoverage: formatPercentValue(scenarioOptimizedCoverageRaw),
    scenarioOptimizedCoverageRaw,
  }
}

export async function renderRetirementConceptHtml(concept: TemplateConcept & { calculationSnapshot?: string | null }, options: RenderOptions) {
  const templatePath = path.join(
    process.cwd(),
    'templates',
    'rentenkonzepte',
    'rentenkonzept-individuell.hbs',
  )

  const templateSource =
    (concept.customTemplateHtml && concept.customTemplateHtml.length > 0)
      ? concept.customTemplateHtml
      : await fs.readFile(templatePath, 'utf-8')
  const template = Handlebars.compile(templateSource)
  const data = buildRetirementConceptTemplateData(concept, options)

  return {
    html: template(data),
    data,
    templateSource,
    isCustom: Boolean(concept.customTemplateHtml && concept.customTemplateHtml.length > 0),
  }
}

