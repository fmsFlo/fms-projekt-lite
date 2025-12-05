export type RetirementConceptTemplateAttachment = {
  originalName: string
  fileUrl: string
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
  statutoryAttachments: RetirementConceptTemplateAttachment[]
  recommendation?: string
  generatedAtIso: string
}


