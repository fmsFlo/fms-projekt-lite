"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import ConceptNavigation from '@/app/components/retirement/ConceptNavigation'
import { useFormPersistence } from '@/app/hooks/useFormPersistence'
import DraftRestoreDialog from '@/app/components/retirement/DraftRestoreDialog'
import type { RetirementConceptTemplateData } from '@/lib/retirementConceptTemplate'
import berechneBeamtenpension, { berechneSteuern } from '@/lib/beamtenpension/beamtenpension-rechner'
import type { BeamtenpensionErgebnis } from '@/lib/beamtenpension/types'
import { BEAMTEN_BESOLDUNG, BESOLDUNG_DATA_STAND } from '../../../../../lib/beamtenpension/besoldungstabellen'
import type { Bundesland } from '../../../../../lib/beamtenpension/besoldungstabellen'
import RetirementCalculator from '@/app/components/retirement/RetirementCalculator'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'

type ProvisionType = 
  | 'Privatrente'
  | 'Basis-Rente'
  | 'Riester-Rente'
  | 'Betriebliche Altersvorsorge'
  | 'Immobilieneinkünfte'
  | 'Sonstige Einkünfte'
  | 'Depotwert nach Steuern'
  | 'Sonstige wiederkehrende Bezüge'
  | 'Sparen'

type Provision = {
  id: string
  type: ProvisionType
  amount: number
  name?: string
  strengths?: string
  weaknesses?: string
  recommendation?: string
  attachmentIds?: string[]
}

type ConceptAttachment = {
  id: string
  category: string
  originalName: string
  mimeType: string
  createdAt: string
  expiresAt: string
  url: string
}

const SUPPORTED_BESOLDUNGSORDNUNGEN = ['A', 'B', 'W', 'R'] as const
type SupportedBesoldungsordnung = (typeof SUPPORTED_BESOLDUNGSORDNUNGEN)[number]

const extractBesoldungsordnungFromGroup = (gruppe?: string): SupportedBesoldungsordnung | null => {
  if (!gruppe) return null
  const match = gruppe.match(/^([ABWR])\d+/i)
  if (!match) return null
  return match[1].toUpperCase() as SupportedBesoldungsordnung
}

const PROVISION_TAXABLE_SHARE: Partial<Record<ProvisionType, number>> = {
  'Riester-Rente': 1,
  'Basis-Rente': 1,
  'Privatrente': 1,
  'Betriebliche Altersvorsorge': 1,
  'Immobilieneinkünfte': 1,
  'Sonstige Einkünfte': 1,
  'Sonstige wiederkehrende Bezüge': 1,
  'Depotwert nach Steuern': 0,
  Sparen: 1,
}

const DEFAULT_PROVISION_TAXABLE_SHARE = 0.7

const CAPITAL_GAINS_ALLOWANCE_ANNUAL = 1000

const ERTRAGSANTEIL_BY_AGE: Record<number, number> = {
  55: 26,
  56: 25,
  57: 24,
  58: 23,
  59: 22,
  60: 22,
  61: 21,
  62: 21,
  63: 20,
  64: 19,
  65: 18,
  66: 18,
  67: 17,
  68: 16,
  69: 15,
  70: 15,
  71: 14,
  72: 13,
  73: 12,
  74: 11,
  75: 10,
  76: 9,
  77: 8,
  78: 7,
  79: 6,
  80: 5,
  81: 5,
  82: 4,
  83: 4,
  84: 3,
  85: 3,
  86: 2,
  87: 2,
  88: 1,
  89: 1,
  90: 1,
}

const getErtragsanteilForAge = (age: number) => {
  if (!Number.isFinite(age)) return 27
  const roundedAge = Math.min(Math.max(Math.floor(age), 0), 100)
  if (roundedAge < 55) {
    return 27
  }
  if (ERTRAGSANTEIL_BY_AGE[roundedAge] !== undefined) {
    return ERTRAGSANTEIL_BY_AGE[roundedAge]
  }
  return Math.max(1, ERTRAGSANTEIL_BY_AGE[90] ?? 1)
}

const getProvisionTaxableShare = (type: ProvisionType) =>
  PROVISION_TAXABLE_SHARE[type] ?? DEFAULT_PROVISION_TAXABLE_SHARE

const getProvisionTaxableShareForProvision = (provision: Provision, retirementAge: number) => {
  if (provision.type === 'Privatrente') {
    const ertragsanteil = getErtragsanteilForAge(retirementAge)
    return Math.max(0, Math.min(1, ertragsanteil / 100))
  }
  if (PROVISION_TAXABLE_SHARE[provision.type] !== undefined) {
    return PROVISION_TAXABLE_SHARE[provision.type] as number
  }
  return DEFAULT_PROVISION_TAXABLE_SHARE
}

// InfoButton-Komponente für Tooltips
const InfoButton = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors ml-1.5 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-72 p-3 mt-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-xl left-0 top-full">
          <p className="leading-relaxed">{content}</p>
        </div>
      )}
    </div>
  )
}

// Collapsible-Komponente für klappbare Sektionen
const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="p-5">
          {children}
        </div>
      )}
    </div>
  )
}

const calculateProvisionMonthlyTax = (
  monthlyGross: number,
  type: ProvisionType,
  churchRate: number,
  options?: {
    capitalAmount?: number
    annualAllowance?: number
    withdrawalRate?: number
    taxableShareOverride?: number
    partialExemption?: number // in Prozent (z.B. 30 für 30%)
    acquisitionCosts?: number
    capitalGainsTaxRate?: number // in Prozent (z.B. 26.375 für 26,375%)
    capitalGainsAllowance?: number
  },
) => {
  if (monthlyGross <= 0) {
    return 0
  }
  const taxableShare =
    options?.taxableShareOverride ?? getProvisionTaxableShare(type)
  if (taxableShare <= 0) {
    return 0
  }

  const allowanceAnnual = Math.max(0, options?.annualAllowance ?? CAPITAL_GAINS_ALLOWANCE_ANNUAL)
  const effectiveChurchRate = Math.max(0, churchRate)

  if (type === 'Sparen') {
    const capitalAmount = Math.max(0, options?.capitalAmount ?? 0)
    const withdrawalRate = Math.max(0, options?.withdrawalRate ?? 0)

    if (capitalAmount <= 0 || withdrawalRate <= 0 || monthlyGross <= 0) {
      return 0
    }

    // Teilfreistellung aus Formular (Standard: 30% bei Aktienfonds/ETFs)
    // Diese Werte können in der Detailansicht angepasst werden
    const partialExemption = (options?.partialExemption ?? 0.30) / 100
    const acquisitionCosts = options?.acquisitionCosts ?? 0
    const capitalGainsTaxRate = (options?.capitalGainsTaxRate ?? 26.375) / 100
    const capitalGainsAllowance = options?.capitalGainsAllowance ?? 1000
    
    // monthlyGross ist bereits die monatliche Entnahme
    // Jahresentnahme = monatliche Entnahme * 12
    const annualWithdrawal = monthlyGross * 12
    
    // Berechnung des steuerpflichtigen Gewinns:
    // 1. Gewinnanteil der Entnahme = (Kapital - Anschaffungskosten) / Kapital
    //    Wenn Anschaffungskosten >= Kapital, dann ist der gesamte Gewinnanteil = 0
    const gainPortion = capitalAmount > 0 ? Math.max(0, capitalAmount - acquisitionCosts) / capitalAmount : 0
    const annualGain = annualWithdrawal * gainPortion
    
    // 2. Teilfreistellung anwenden (nur (1 - Teilfreistellung) der Gewinne sind steuerpflichtig)
    //    Bei 30% Teilfreistellung sind 70% der Gewinne steuerpflichtig
    const taxableGainBeforeAllowance = annualGain * (1 - partialExemption)
    
    // 3. Freibetrag abziehen
    const taxableGain = Math.max(0, taxableGainBeforeAllowance - capitalGainsAllowance)
    
    if (taxableGain <= 0) {
      return 0
    }

    // 4. Steuer berechnen (Kapitalertragsteuer + Soli + Kirchensteuer)
    const baseTaxAnnual = taxableGain * capitalGainsTaxRate
    const soliAnnual = baseTaxAnnual * 0.055
    const churchAnnual = baseTaxAnnual * effectiveChurchRate

    return (baseTaxAnnual + soliAnnual + churchAnnual) / 12
  }

  const taxablePortion = monthlyGross * taxableShare
  const baseTax = taxablePortion * 0.25
  const soli = baseTax * 0.055
  const church = baseTax * effectiveChurchRate

  return baseTax + soli + church
}

type RetirementConcept = {
  id: string
  clientId: string
  birthDate: string | null
  desiredRetirementAge: number | null
  targetPensionNetto: number | null
  hasCurrentPensionInfo: boolean | null
  pensionAtRetirement: number | null
  pensionIncrease: number | null
  inflationRate: number | null
  calculatedPensionAtRetirement: number | null
  existingProvisionData: string | null
  lifeExpectancy?: number | null
  monthlySavings?: number | null
  returnRate?: number | null
  withdrawalRate?: number | null
  hasChildren?: boolean | null
  isCompulsoryInsured?: boolean | null
  kvBaseRate?: number | null
  kvAdditionalRate?: number | null
  kvContributionIncrease?: number | null
  statutoryStrengths?: string | null
  statutoryWeaknesses?: string | null
  privateStrengths?: string | null
  privateWeaknesses?: string | null
  customTemplateHtml?: string | null
  recommendationDelta?: number | null
  notes: string | null
  calculationSnapshot?: string | null
  client?: {
    id: string
    firstName: string
    lastName: string
    birthDate: Date | null
  }
}

interface RetirementConceptFormProps {
  initialConcept: RetirementConcept
  clientBirthDate: Date | null
  initialAttachments: ConceptAttachment[]
}

type CalculationSnapshot = {
  statutory: {
    grossCurrent: number | null
    grossFuture: number | null
    netCurrent: number | null
    netFuture: number | null
    contributionsCurrent: number | null
    contributionsFuture: number | null
    kvRateProjected: number | null
    careRate: number | null
    totalRate: number | null
    taxCurrent: number | null
    taxFuture: number | null
    taxableShare: number | null
    annualAllowance: number | null
    grossCurrentValue: number | null
    grossFutureValue: number | null
    taxableMonthlyGross: number | null
    adjustedTaxFreeAmount: number | null
    taxAnnual: number | null
    netFutureBeforeTax: number | null
    insuranceType: CivilServantInsuranceType | null
    beihilfeRateCurrent: number | null
    beihilfeRateRetirement: number | null
  }
  privateExisting: {
    grossCurrent: number
    grossFuture: number
    netCurrent: number
    netFuture: number
  }
  planned: {
    grossCurrent: number
    grossFuture: number
    netCurrent: number
    netFuture: number
  }
  gaps: {
    before: number
    after: number
    coveragePercent: number
  }
  requiredSavings: {
    monthlySavings: number
    netFuture: number
    netCurrent: number
  }
  meta?: {
    employmentType: EmploymentType
    civilServant?: CivilServantSnapshot
  }
}

const TEMPLATE_VARIABLES: Array<{ key: keyof RetirementConceptTemplateData; description: string }> = [
  { key: 'clientName', description: 'Vor- und Nachname des Kunden (Fallback "Kunde").' },
  { key: 'clientNameRaw', description: 'Unformatierter Kundenname (kann leer sein).' },
  { key: 'targetPensionNetto', description: 'Gewünschte Netto-Monatsrente, formatiert.' },
  { key: 'targetPensionNettoRaw', description: 'Gewünschte Netto-Monatsrente als Zahl.' },
  { key: 'statutorySummary', description: 'Gesetzliche Rente (String, formatiert).' },
  { key: 'statutorySummaryRaw', description: 'Gesetzliche Rente als Zahl.' },
  { key: 'pensionGap', description: 'Ermittelte Rentenlücke (String, formatiert).' },
  { key: 'pensionGapRaw', description: 'Ermittelte Rentenlücke als Zahl.' },
  { key: 'statutoryStrengths', description: 'Freitext: Stärken aus der gesetzlichen Analyse.' },
  { key: 'statutoryWeaknesses', description: 'Freitext: Schwächen aus der gesetzlichen Analyse.' },
  { key: 'privateStrengths', description: 'Freitext: Stärken der privaten Vorsorge.' },
  { key: 'privateWeaknesses', description: 'Freitext: Schwächen der privaten Vorsorge.' },
  { key: 'statutoryAttachments', description: 'Array hochgeladener Dokumente (Gesetzlich).' },
  { key: 'privateAttachments', description: 'Array hochgeladener Dokumente (Privat).' },
  { key: 'recommendation', description: 'Empfohlene Maßnahmen als Freitext.' },
  { key: 'recommendationDelta', description: 'Zusätzliche Monatsrente (String, formatiert).' },
  { key: 'recommendationDeltaRaw', description: 'Zusätzliche Monatsrente als Zahl.' },
  { key: 'generatedAtIso', description: 'Zeitstempel der letzten HTML-Erstellung (ISO-String).' },
  { key: 'statutoryAttachment1Url', description: 'URL zum ersten gesetzlichen Anhang.' },
  { key: 'statutoryAttachment1Name', description: 'Dateiname des ersten gesetzlichen Anhangs.' },
  { key: 'statutoryAttachment2Url', description: 'URL zum zweiten gesetzlichen Anhang.' },
  { key: 'statutoryAttachment2Name', description: 'Dateiname des zweiten gesetzlichen Anhangs.' },
  { key: 'statutoryGrossCurrent', description: 'Bruttorente gesetzlich (heutige Kaufkraft).' },
  { key: 'statutoryNetCurrent', description: 'Nettorente gesetzlich (heutige Kaufkraft).' },
  { key: 'statutoryGrossFuture', description: 'Bruttorente gesetzlich (nominal zur Rente).' },
  { key: 'statutoryNetFuture', description: 'Nettorente gesetzlich (nominal zur Rente).' },
  { key: 'privateGrossCurrent', description: 'Bruttorente bestehende private Vorsorge (heutige Kaufkraft).' },
  { key: 'privateNetCurrent', description: 'Nettorente bestehende private Vorsorge (heutige Kaufkraft).' },
  { key: 'privateGrossFuture', description: 'Bruttorente bestehende private Vorsorge (nominal zur Rente).' },
  { key: 'privateNetFuture', description: 'Nettorente bestehende private Vorsorge (nominal zur Rente).' },
  { key: 'plannedGrossFuture', description: 'Bruttorente geplante Vorsorge (nominal zur Rente).' },
  { key: 'plannedGrossCurrent', description: 'Bruttorente geplante Vorsorge (heutige Kaufkraft).' },
  { key: 'plannedNetFuture', description: 'Nettorente geplante Vorsorge (nominal zur Rente).' },
  { key: 'plannedNetCurrent', description: 'Nettorente geplante Vorsorge (heutige Kaufkraft).' },
  { key: 'gapBefore', description: 'Versorgungslücke vor Umsetzung (nominal).' },
  { key: 'gapAfter', description: 'Versorgungslücke nach Umsetzung (nominal).' },
  { key: 'gapCoveragePercent', description: 'Abgedeckter Anteil der Versorgungslücke in Prozent.' },
  { key: 'requiredSavingsMonthly', description: 'Erforderliche monatliche Sparrate, um die Lücke vollständig zu schließen (nominal).' },
  { key: 'requiredSavingsMonthlyCurrent', description: 'Erforderliche monatliche Sparrate in heutiger Kaufkraft.' },
  { key: 'requiredSavingsNetFuture', description: 'Nettorente (nominal) aus der erforderlichen Sparrate.' },
  { key: 'requiredSavingsNetCurrent', description: 'Nettorente (heutige Kaufkraft) aus der erforderlichen Sparrate.' },
]

const PROVISION_TYPES: ProvisionType[] = [
  'Privatrente',
  'Basis-Rente',
  'Riester-Rente',
  'Betriebliche Altersvorsorge',
  'Immobilieneinkünfte',
  'Sonstige Einkünfte',
  'Depotwert nach Steuern',
  'Sonstige wiederkehrende Bezüge',
  'Sparen',
]

const INCOME_TAX_PROVISION_TYPES: ProvisionType[] = [
  'Basis-Rente',
  'Riester-Rente',
  'Privatrente',
  'Betriebliche Altersvorsorge',
  'Immobilieneinkünfte',
  'Sonstige Einkünfte',
  'Sonstige wiederkehrende Bezüge',
]

type EmploymentType = 'employee' | 'civil-servant' | 'self-employed'

type CivilServantInputs = {
  entryDate: string
  state: string
  besoldungsgruppe: string
  erfahrungsstufe: number
  besoldungsordnung: SupportedBesoldungsordnung
  pensionIncrease: number
  additional: number
  hasPromotion: boolean
  futureOrder?: SupportedBesoldungsordnung
  futureGroup?: string
  futureLevel?: number
  churchTax: boolean
  insuranceType: CivilServantInsuranceType
  statutoryHasBeihilfe?: boolean
  beihilfeRateCurrent?: number
  beihilfeRateRetirement?: number
  privateContributionCurrent?: number
}

type CivilServantResults = {
  brutto: number
  netto: number
  steuern: number
  kvpv: number
  ruhegehaltssatz: number
  insuranceType: CivilServantInsuranceType
  contributionsCurrent: number
  contributionsFuture: number
  beihilfeRateCurrent?: number
  beihilfeRateRetirement?: number
}

type CivilServantSnapshot = {
  inputs: CivilServantInputs
  results: CivilServantResults
}
type CivilServantInsuranceType = 'statutory' | 'private'

export default function RetirementConceptForm({ initialConcept, clientBirthDate, initialAttachments }: RetirementConceptFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const totalSteps = 4
  
  // Lese Step aus URL-Parametern oder verwende Standard
  const stepFromUrl = searchParams.get('step')
  const initialStep = stepFromUrl ? parseInt(stepFromUrl, 10) : 1
  const [currentStep, setCurrentStep] = useState(initialStep)
  
  // Aktualisiere Step wenn URL-Parameter sich ändern
  useEffect(() => {
    const stepFromUrl = searchParams.get('step')
    if (stepFromUrl) {
      const step = parseInt(stepFromUrl, 10)
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step)
      }
    } else {
      // Wenn kein Step-Parameter, setze auf 1 (Datenerfassung)
      setCurrentStep(1)
    }
  }, [searchParams, totalSteps])
  
  const [showInCurrentPurchasingPower, setShowInCurrentPurchasingPower] = useState(false)
  
  // Bestimme aktive Ansicht für Navigation
  const activeView = 
    currentStep === 4 ? 'personal' : 
    currentStep === 3 ? 'dashboard' : 
    'datenerfassung'
  
  // Hole conceptId aus URL-Params (sicherer als initialConcept.id)
  const params = useParams()
  const conceptId = (params?.conceptId as string) || initialConcept.id
  const [attachments, setAttachments] = useState<ConceptAttachment[]>(initialAttachments ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  
  // Prüfe Admin-Status beim Laden
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const user = await response.json()
          setIsAdmin(user.role === 'admin')
        }
      } catch (error) {
        // Fehler ignorieren - nicht Admin
        setIsAdmin(false)
      }
    }
    checkAdminStatus()
  }, [])
  const [isMounted, setIsMounted] = useState(false)
  
  // Verhindere Hydration-Probleme durch client-seitiges Rendering
  useEffect(() => {
    setIsMounted(true)
    // Banner soll jedes Mal wieder erscheinen - kein localStorage-Check mehr
  }, [conceptId])

  const handleDismissAdvisoryNotice = () => {
    // Nur für die aktuelle Session ausblenden, nicht in localStorage speichern
    setAdvisoryNoticeDismissed(true)
  }

  const [htmlPreview, setHtmlPreview] = useState<string>('')
  const [htmlPreviewOriginal, setHtmlPreviewOriginal] = useState<string | null>(null)
  const [loadingHtmlPreview, setLoadingHtmlPreview] = useState(false)
  const [showTaxDetailsModal, setShowTaxDetailsModal] = useState(false)
  const [htmlPreviewError, setHtmlPreviewError] = useState<string | null>(null)
  const [htmlCopyFeedback, setHtmlCopyFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [htmlTemplateData, setHtmlTemplateData] = useState<RetirementConceptTemplateData | null>(null)
  const [savingHtml, setSavingHtml] = useState(false)
  const [overviewMode, setOverviewMode] = useState<'detail' | 'dashboard'>('dashboard')
  const [dashboardTheme, setDashboardTheme] = useState<'dark' | 'light'>('dark')
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [advisoryMode, setAdvisoryMode] = useState(false)
  const [advisoryNoticeDismissed, setAdvisoryNoticeDismissed] = useState(false)
  
  // Banner wieder anzeigen, wenn Beratungsmodus aktiviert wird
  useEffect(() => {
    if (advisoryMode) {
      setAdvisoryNoticeDismissed(false)
    }
  }, [advisoryMode])
  const provisionFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const statutoryFileInputRef = useRef<HTMLInputElement | null>(null)
  const privateFileInputRef = useRef<HTMLInputElement | null>(null)
  const htmlFileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Berechne Geburtsdatum (aus Client oder Konzept)
  const initialBirthDate = initialConcept.birthDate 
    ? new Date(initialConcept.birthDate).toISOString().split('T')[0]
    : clientBirthDate 
      ? new Date(clientBirthDate).toISOString().split('T')[0]
      : ''

  // Parse bestehende Vorsorge (wird nur einmal definiert)
  const initialProvisions: Provision[] = initialConcept.existingProvisionData
    ? (JSON.parse(initialConcept.existingProvisionData) as Provision[]).map((p) => ({
      id:
        typeof p.id === 'string' && p.id.length > 0
          ? p.id
          : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        type: p.type,
      amount: typeof p.amount === 'number' ? p.amount : parseFloat(String((p as any).amount ?? '0')) || 0,
        name: p.name || '',
      strengths: (p as any).strengths || '',
      weaknesses: (p as any).weaknesses || '',
      recommendation: (p as any).recommendation || '',
      attachmentIds: Array.isArray((p as any).attachmentIds) ? ((p as any).attachmentIds as string[]) : [],
      }))
    : []
  
  // Form-Persistenz: Provisions State
  const [provisions, setProvisions] = useState<Provision[]>(initialProvisions)

  const initialCalculationSnapshot = useMemo(() => {
    const snapshotRaw = (initialConcept as any).calculationSnapshot
    if (!snapshotRaw || typeof snapshotRaw !== 'string') return null
    try {
      return JSON.parse(snapshotRaw) as CalculationSnapshot
    } catch (error) {
      console.warn('Konnte gespeicherten calculationSnapshot nicht parsen:', error)
      return null
    }
  }, [(initialConcept as any).calculationSnapshot])

  const initialCivilServantMeta = initialCalculationSnapshot?.meta?.civilServant
  const initialEmploymentType: EmploymentType = initialCalculationSnapshot?.meta?.employmentType ?? 'employee'
  const initialCivilServantOrder: SupportedBesoldungsordnung =
    (initialCivilServantMeta?.inputs?.besoldungsordnung as SupportedBesoldungsordnung | undefined) ??
    extractBesoldungsordnungFromGroup(initialCivilServantMeta?.inputs?.besoldungsgruppe) ??
    'A'
  const initialFutureOrder: SupportedBesoldungsordnung | '' =
    (initialCivilServantMeta?.inputs?.futureOrder as SupportedBesoldungsordnung | undefined) ??
    extractBesoldungsordnungFromGroup(initialCivilServantMeta?.inputs?.futureGroup) ??
    ''

  const [formData, setFormData] = useState({
    birthDate: initialBirthDate,
    desiredRetirementAge: initialConcept.desiredRetirementAge?.toString() || '67',
      targetPensionNetto: initialConcept.targetPensionNetto !== null && initialConcept.targetPensionNetto !== undefined ? initialConcept.targetPensionNetto.toString() : '',
    hasCurrentPensionInfo: initialConcept.hasCurrentPensionInfo ?? true,
      pensionAtRetirement: initialConcept.pensionAtRetirement !== null && initialConcept.pensionAtRetirement !== undefined ? initialConcept.pensionAtRetirement.toString() : '',
      pensionIncrease: initialConcept.pensionIncrease !== null && initialConcept.pensionIncrease !== undefined ? initialConcept.pensionIncrease.toString() : '',
      inflationRate: initialConcept.inflationRate !== null && initialConcept.inflationRate !== undefined ? initialConcept.inflationRate.toString() : '2.0',
    lifeExpectancy: (initialConcept as any).lifeExpectancy?.toString() || '90',
      monthlySavings: (initialConcept as any).monthlySavings !== null && (initialConcept as any).monthlySavings !== undefined ? (initialConcept as any).monthlySavings.toString() : '',
    delayStartYearsY: '0',
    delayStartYearsZ: '5',
    returnRate: (initialConcept as any).returnRate?.toString() || '5.0',
    withdrawalRate: (initialConcept as any).withdrawalRate?.toString() || '3.0',
    hasChildren: (initialConcept as any).hasChildren ?? true,
    isCompulsoryInsured: (initialConcept as any).isCompulsoryInsured ?? true,
    kvBaseRate: (initialConcept as any).kvBaseRate?.toString() || '7.3',
    kvAdditionalRate: (initialConcept as any).kvAdditionalRate?.toString() || '2.5',
    kvContributionIncrease: (initialConcept as any).kvContributionIncrease?.toString() || '0',
    taxFilingStatus: (initialConcept as any).taxFilingStatus || 'single',
    taxFreeAmount: (initialConcept as any).taxFreeAmount?.toString() || '12096',
    taxIncreaseRate: (initialConcept as any).taxIncreaseRate?.toString() || '0',
    taxFreePercentage: (initialConcept as any).taxFreePercentage?.toString() || '83.5',
    statutoryStrengths: initialConcept.statutoryStrengths || '',
    statutoryWeaknesses: initialConcept.statutoryWeaknesses || '',
    privateStrengths: (initialConcept as any).privateStrengths || '',
    privateWeaknesses: (initialConcept as any).privateWeaknesses || '',
    recommendation: initialConcept.notes || '',
    recommendationDelta: (initialConcept as any).recommendationDelta?.toString() || '',
    recommendationProvider: (initialConcept as any).recommendationProvider || '',
    recommendationAdvantages: (initialConcept as any).recommendationAdvantages || '',
    expectedRente: (initialConcept as any).expectedRente?.toString() || '',
    customTemplateHtml: (initialConcept as any).customTemplateHtml || '',
    employmentType: initialEmploymentType,
    civilServiceEntryDate: initialCivilServantMeta?.inputs.entryDate || '',
    civilServiceState: initialCivilServantMeta?.inputs.state || 'Baden-Württemberg',
    civilServiceBesoldungsgruppe: initialCivilServantMeta?.inputs.besoldungsgruppe || 'A7',
    civilServiceErfahrungsstufe: initialCivilServantMeta?.inputs.erfahrungsstufe?.toString() || '1',
    civilServiceBesoldungsordnung: initialCivilServantOrder,
    civilServiceAdditional: initialCivilServantMeta?.inputs.additional?.toString() || '0',
    civilServicePensionIncrease: initialCivilServantMeta?.inputs.pensionIncrease?.toString() || '1.5',
    civilServiceHasPromotion: initialCivilServantMeta?.inputs.hasPromotion ?? false,
    civilServiceFutureGroup: initialCivilServantMeta?.inputs.futureGroup || '',
    civilServiceFutureLevel: initialCivilServantMeta?.inputs.futureLevel?.toString() || '',
    civilServiceFutureBesoldungsordnung: initialFutureOrder,
    civilServiceChurchTax: initialCivilServantMeta?.inputs.churchTax ?? true,
    insuranceType:
      initialCivilServantMeta?.inputs.insuranceType === 'private' ? 'private' : 'statutory',
    statutoryHasBeihilfe: Boolean(initialCivilServantMeta?.inputs.statutoryHasBeihilfe),
    beihilfeRateCurrent:
      initialCivilServantMeta?.inputs.beihilfeRateCurrent != null
        ? String(initialCivilServantMeta.inputs.beihilfeRateCurrent)
        : '',
    beihilfeRateRetirement:
      initialCivilServantMeta?.inputs.beihilfeRateRetirement != null
        ? String(initialCivilServantMeta.inputs.beihilfeRateRetirement)
        : '',
    privateContributionCurrent:
      initialCivilServantMeta?.inputs.privateContributionCurrent != null
        ? String(initialCivilServantMeta.inputs.privateContributionCurrent)
        : '',
    // Felder für Punkte-Schätzung (wenn keine Renteninfo vorhanden)
    currentGrossIncome: (initialConcept as any).currentGrossIncome?.toString() || '',
    pastWorkingYears: (initialConcept as any).pastWorkingYears?.toString() || '',
    trainingYears: (initialConcept as any).trainingYears?.toString() || '',
    childrenYears: (initialConcept as any).childrenYears?.toString() || '',
    // Steuerdetails für Sparrate
    partialExemption: (initialConcept as any).partialExemption?.toString() || '30.0',
    acquisitionCosts: (initialConcept as any).acquisitionCosts?.toString() || '',
    capitalGainsTaxRate: (initialConcept as any).capitalGainsTaxRate?.toString() || '26.375',
    capitalGainsAllowance: (initialConcept as any).capitalGainsAllowance?.toString() || '1000',
  })

  // Aktualisiere formData wenn initialConcept sich ändert (z.B. beim Neuladen)
  // Verwende initialConcept.id als Key, um sicherzustellen, dass bei jedem Neuladen aktualisiert wird
  useEffect(() => {
    const newBirthDate = initialConcept.birthDate 
      ? new Date(initialConcept.birthDate).toISOString().split('T')[0]
      : clientBirthDate 
        ? new Date(clientBirthDate).toISOString().split('T')[0]
        : ''
    
    setFormData((prev) => {
      // Prüfe, ob sich Werte geändert haben, um unnötige Updates zu vermeiden
      const newData = {
        birthDate: newBirthDate || prev.birthDate,
        desiredRetirementAge: initialConcept.desiredRetirementAge?.toString() || prev.desiredRetirementAge,
        targetPensionNetto: initialConcept.targetPensionNetto !== null && initialConcept.targetPensionNetto !== undefined ? initialConcept.targetPensionNetto.toString() : prev.targetPensionNetto,
        hasCurrentPensionInfo: initialConcept.hasCurrentPensionInfo ?? prev.hasCurrentPensionInfo,
        pensionAtRetirement: initialConcept.pensionAtRetirement !== null && initialConcept.pensionAtRetirement !== undefined ? initialConcept.pensionAtRetirement.toString() : prev.pensionAtRetirement,
        pensionIncrease: initialConcept.pensionIncrease !== null && initialConcept.pensionIncrease !== undefined ? initialConcept.pensionIncrease.toString() : prev.pensionIncrease,
        inflationRate: initialConcept.inflationRate !== null && initialConcept.inflationRate !== undefined ? initialConcept.inflationRate.toString() : prev.inflationRate,
        lifeExpectancy: (initialConcept as any).lifeExpectancy?.toString() || prev.lifeExpectancy,
        monthlySavings: (initialConcept as any).monthlySavings !== null && (initialConcept as any).monthlySavings !== undefined ? (initialConcept as any).monthlySavings.toString() : prev.monthlySavings,
        returnRate: (initialConcept as any).returnRate?.toString() || prev.returnRate,
        withdrawalRate: (initialConcept as any).withdrawalRate?.toString() || prev.withdrawalRate,
        hasChildren: (initialConcept as any).hasChildren ?? prev.hasChildren,
        isCompulsoryInsured: (initialConcept as any).isCompulsoryInsured ?? prev.isCompulsoryInsured,
        kvBaseRate: (initialConcept as any).kvBaseRate?.toString() || prev.kvBaseRate,
        kvAdditionalRate: (initialConcept as any).kvAdditionalRate?.toString() || prev.kvAdditionalRate,
        kvContributionIncrease: (initialConcept as any).kvContributionIncrease?.toString() || prev.kvContributionIncrease,
        taxFilingStatus: (initialConcept as any).taxFilingStatus || prev.taxFilingStatus,
        taxFreeAmount: (initialConcept as any).taxFreeAmount?.toString() || prev.taxFreeAmount,
        taxIncreaseRate: (initialConcept as any).taxIncreaseRate?.toString() || prev.taxIncreaseRate,
        taxFreePercentage: (initialConcept as any).taxFreePercentage?.toString() || prev.taxFreePercentage,
        statutoryStrengths: initialConcept.statutoryStrengths || prev.statutoryStrengths,
        statutoryWeaknesses: initialConcept.statutoryWeaknesses || prev.statutoryWeaknesses,
        privateStrengths: (initialConcept as any).privateStrengths || prev.privateStrengths,
        privateWeaknesses: (initialConcept as any).privateWeaknesses || prev.privateWeaknesses,
        recommendation: initialConcept.notes || prev.recommendation,
        recommendationDelta: (initialConcept as any).recommendationDelta?.toString() || prev.recommendationDelta,
        recommendationProvider: (initialConcept as any).recommendationProvider || prev.recommendationProvider,
        recommendationAdvantages: (initialConcept as any).recommendationAdvantages || prev.recommendationAdvantages,
        expectedRente: (initialConcept as any).expectedRente?.toString() || prev.expectedRente,
        customTemplateHtml: (initialConcept as any).customTemplateHtml || prev.customTemplateHtml,
        // Behalte alle anderen Felder
        delayStartYearsY: prev.delayStartYearsY,
        delayStartYearsZ: prev.delayStartYearsZ,
        employmentType: prev.employmentType,
        civilServiceEntryDate: prev.civilServiceEntryDate,
        civilServiceState: prev.civilServiceState,
        civilServiceBesoldungsgruppe: prev.civilServiceBesoldungsgruppe,
        civilServiceErfahrungsstufe: prev.civilServiceErfahrungsstufe,
        civilServiceBesoldungsordnung: prev.civilServiceBesoldungsordnung,
        civilServiceAdditional: prev.civilServiceAdditional,
        civilServicePensionIncrease: prev.civilServicePensionIncrease,
        civilServiceHasPromotion: prev.civilServiceHasPromotion,
        civilServiceFutureGroup: prev.civilServiceFutureGroup,
        civilServiceFutureLevel: prev.civilServiceFutureLevel,
        civilServiceFutureBesoldungsordnung: prev.civilServiceFutureBesoldungsordnung,
        civilServiceChurchTax: prev.civilServiceChurchTax,
        insuranceType: prev.insuranceType,
        statutoryHasBeihilfe: prev.statutoryHasBeihilfe,
        beihilfeRateCurrent: prev.beihilfeRateCurrent,
        beihilfeRateRetirement: prev.beihilfeRateRetirement,
        privateContributionCurrent: prev.privateContributionCurrent,
        currentGrossIncome: prev.currentGrossIncome,
        pastWorkingYears: prev.pastWorkingYears,
        trainingYears: prev.trainingYears,
        childrenYears: prev.childrenYears,
        partialExemption: prev.partialExemption,
        acquisitionCosts: prev.acquisitionCosts,
        capitalGainsTaxRate: prev.capitalGainsTaxRate,
        capitalGainsAllowance: prev.capitalGainsAllowance,
      }
      return newData
    })
    
    // Aktualisiere auch Provisions
    if (initialConcept.existingProvisionData) {
      try {
        const parsedProvisions = JSON.parse(initialConcept.existingProvisionData) as Provision[]
        setProvisions(parsedProvisions.map((p) => ({
          id: typeof p.id === 'string' && p.id.length > 0
            ? p.id
            : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`,
          type: p.type,
          amount: typeof p.amount === 'number' ? p.amount : parseFloat(String((p as any).amount ?? '0')) || 0,
          name: p.name || '',
          strengths: (p as any).strengths || '',
          weaknesses: (p as any).weaknesses || '',
          recommendation: (p as any).recommendation || '',
          attachmentIds: Array.isArray((p as any).attachmentIds) ? ((p as any).attachmentIds as string[]) : [],
        })))
      } catch (error) {
        console.warn('Fehler beim Parsen der Provisions:', error)
      }
    }
  }, [
    initialConcept.id,
    initialConcept.birthDate,
    initialConcept.desiredRetirementAge,
    initialConcept.targetPensionNetto,
    initialConcept.hasCurrentPensionInfo,
    initialConcept.pensionAtRetirement,
    initialConcept.pensionIncrease,
    initialConcept.inflationRate,
    (initialConcept as any).lifeExpectancy,
    (initialConcept as any).monthlySavings,
    (initialConcept as any).returnRate,
    (initialConcept as any).withdrawalRate,
    initialConcept.existingProvisionData,
    clientBirthDate
  ]) // Alle relevanten Felder als Dependencies, damit beim Neuladen aktualisiert wird

  // Kombinierte Daten für Persistenz (formData + provisions)
  const combinedFormData = useMemo(() => ({
    ...formData,
    provisions,
  }), [formData, provisions])
  
  // Interne Save-Funktion (wird vom Hook und manuell verwendet)
  const handleSaveInternalRef = useRef<((dataToSave?: typeof combinedFormData, navigateToResult?: boolean) => Promise<void>) | null>(null)
  
  // Form-Persistenz Hook
  const {
    draftData,
    showRestoreDialog,
    hasUnsavedChanges,
    restoreDraft,
    discardDraft,
    saveAndClearDraft,
  } = useFormPersistence({
    draftKey: `${initialConcept.clientId}_retirement_concept_${conceptId}`,
    formData: combinedFormData,
    onSave: async (data) => {
      // Wrapper für handleSave - wird vom Hook aufgerufen
      if (handleSaveInternalRef.current) {
        await handleSaveInternalRef.current(data, false)
      }
    },
    debounceMs: 500,
    storageType: 'localStorage',
    maxAgeHours: 24,
  })
  
  // Wiederherstellung der Draft-Daten
  useEffect(() => {
    if (draftData && showRestoreDialog) {
      // Warte auf User-Interaktion
    }
  }, [draftData, showRestoreDialog])
  
  const handleRestoreDraft = () => {
    if (draftData) {
      const restored = restoreDraft(draftData)
      if (restored) {
        // Entferne provisions aus restored, da es separat behandelt wird
        const { provisions: restoredProvisions, ...restoredFormData } = restored
        setFormData(restoredFormData as typeof formData)
        if (restoredProvisions && Array.isArray(restoredProvisions)) {
          setProvisions(restoredProvisions)
        }
      }
    }
  }
  
  const handleDiscardDraft = () => {
    discardDraft()
  }
  
  // Lade Draft-Timestamp für Dialog
  const draftTimestamp = draftData && typeof draftData === 'object' && 'timestamp' in draftData
    ? (draftData as any).timestamp
    : undefined

  const [openProvisionId, setOpenProvisionId] = useState<string | null>(null)
  const [dashboardMonthlySavings, setDashboardMonthlySavings] = useState(() => {
    const parsed = parseFloat((initialConcept as any).monthlySavings?.toString?.() ?? formData.monthlySavings ?? '0')
    return Number.isFinite(parsed) ? parsed : 0
  })
  const getProvisionCategory = (provisionId: string) => `provision:${provisionId}`

  const attachmentsByProvision = useMemo(() => {
    const byProvision: Record<string, ConceptAttachment[]> = {}
    attachments.forEach((attachment) => {
      if (attachment.category && attachment.category.startsWith('provision:')) {
        const provisionId = attachment.category.split(':')[1] ?? ''
        if (!byProvision[provisionId]) {
          byProvision[provisionId] = []
        }
        byProvision[provisionId].push(attachment)
      }
    })
    return byProvision
  }, [attachments])

  useEffect(() => {
    const parsed = parseFloat(formData.monthlySavings || '0')
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      setDashboardMonthlySavings(parsed)
    }
  }, [formData.monthlySavings])

  // Debug: Logge formData-Änderungen (nur in Entwicklung)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Form-Werte NACHHER (useEffect):', {
        birthDate: formData.birthDate,
        desiredRetirementAge: formData.desiredRetirementAge,
        targetPensionNetto: formData.targetPensionNetto,
        lifeExpectancy: formData.lifeExpectancy,
        monthlySavings: formData.monthlySavings,
      })
    }
  }, [formData.birthDate, formData.desiredRetirementAge, formData.targetPensionNetto, formData.lifeExpectancy, formData.monthlySavings])

  const [showStatutoryTooltip, setShowStatutoryTooltip] = useState(false)
  const [provisionTooltipType, setProvisionTooltipType] = useState<'existing' | 'planned' | null>(null)
  const htmlHasChanges = htmlPreviewOriginal !== null && htmlPreview !== htmlPreviewOriginal

  const handleProvisionAttachmentUpload = async (provisionId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || uploading) return
    const category = getProvisionCategory(provisionId)
    const existing = attachmentsByProvision[provisionId] ?? []
    const remainingSlots = Math.max(0, 3 - existing.length)
    const files = Array.from(fileList).slice(0, remainingSlots)
    if (files.length === 0) return

    setUploading(true)
    setUploadError(null)
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        form.append('category', category)

        const res = await fetch(`/api/retirement-concepts/${conceptId}/attachments`, {
          method: 'POST',
          body: form,
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || 'Upload fehlgeschlagen')
        }
        const json = (await res.json()) as ConceptAttachment
        setAttachments((prev) => [...prev, json])
        setProvisions((prev) =>
          prev.map((prov) =>
            prov.id === provisionId
              ? {
                  ...prov,
                  attachmentIds: [...(prov.attachmentIds ?? []), json.id],
                }
              : prov,
          ),
        )
      }

      if (provisionFileInputRefs.current[provisionId]) {
        provisionFileInputRefs.current[provisionId]!.value = ''
      }
    } catch (err: any) {
      console.error('Attachment upload error', err)
      setUploadError(err?.message || 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  const triggerFileInput = (category: 'statutory' | 'private') => {
    if (category === 'statutory') {
      statutoryFileInputRef.current?.click()
    } else {
      privateFileInputRef.current?.click()
    }
  }

  const handleAttachmentUpload = async (category: 'statutory' | 'private', fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || uploading) return

    const existingForCategory = attachments.filter((attachment) => attachment.category === category)
    const remainingSlots = Math.max(0, 3 - existingForCategory.length)
    const files = Array.from(fileList).slice(0, remainingSlots)
    if (files.length === 0) return

    setUploading(true)
    setUploadError(null)
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        form.append('category', category)

        const res = await fetch(`/api/retirement-concepts/${conceptId}/attachments`, {
          method: 'POST',
          body: form,
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || 'Upload fehlgeschlagen')
        }

        const json = (await res.json()) as ConceptAttachment
        setAttachments((prev) => [...prev, json])
      }
    } catch (err: any) {
      console.error('Attachment upload error', err)
      setUploadError(err?.message || 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
      if (category === 'statutory') {
        if (statutoryFileInputRef.current) statutoryFileInputRef.current.value = ''
      } else if (category === 'private') {
        if (privateFileInputRef.current) privateFileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (deletingAttachmentId || uploading) return
    setDeletingAttachmentId(attachmentId)
    setUploadError(null)
    try {
      const res = await fetch(
        `/api/retirement-concepts/${conceptId}/attachments?attachmentId=${encodeURIComponent(attachmentId)}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Löschen fehlgeschlagen')
      }
      let removedAttachment: ConceptAttachment | undefined
      setAttachments((prev) => {
        removedAttachment = prev.find((item) => item.id === attachmentId)
        return prev.filter((item) => item.id !== attachmentId)
      })
      if (removedAttachment?.category && removedAttachment.category.startsWith('provision:')) {
        const provisionId = removedAttachment.category.split(':')[1] ?? ''
        setProvisions((prev) => (
          prev.map((prov) =>
            prov.id === provisionId
              ? {
                  ...prov,
                  attachmentIds: (prov.attachmentIds ?? []).filter((id) => id !== attachmentId),
                }
              : prov,
          )
        ))
      }
    } catch (err: any) {
      console.error('Attachment delete error', err)
      setUploadError(err?.message || 'Löschen fehlgeschlagen')
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  const loadHtmlPreview = async () => {
    setLoadingHtmlPreview(true)
    setHtmlPreviewError(null)
    try {
      const res = await fetch(`/api/retirement-concepts/${conceptId}/html`, { method: 'GET', cache: 'no-store' })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.message || `Fehler ${res.status}`)
      }
      const templateSource = typeof payload?.templateSource === 'string'
        ? payload.templateSource
        : typeof payload?.html === 'string'
          ? payload.html
          : null

      if (templateSource === null) {
        throw new Error('Kein HTML-Inhalt verfügbar. Bitte Konzept speichern und erneut versuchen.')
      }

      setHtmlPreview(templateSource)
      setHtmlPreviewOriginal(templateSource)
      setHtmlTemplateData(payload.data ?? null)
      setHtmlCopyFeedback(null)
      setFormData((prev) => ({
        ...prev,
        customTemplateHtml: payload?.isCustom ? templateSource : '',
      }))
    } catch (err: any) {
      console.error('HTML preview error:', err)
      setHtmlPreviewError(err?.message || 'HTML konnte nicht geladen werden.')
    } finally {
      setLoadingHtmlPreview(false)
    }
  }

  const copyHtmlPreview = async () => {
    if (!htmlPreview || htmlPreview.length === 0) {
      setHtmlCopyFeedback({
        message: 'Bitte lade zunächst den HTML-Code.',
        tone: 'error',
      })
      return
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard API nicht verfügbar')
      }
      await navigator.clipboard.writeText(htmlPreview)
      setHtmlCopyFeedback({
        message: 'In Zwischenablage kopiert.',
        tone: 'success',
      })
      setTimeout(() => setHtmlCopyFeedback(null), 3000)
    } catch (err) {
      console.error('Clipboard copy error:', err)
      setHtmlCopyFeedback({
        message: 'Kopieren nicht möglich. Bitte markiere den Code und kopiere ihn manuell.',
        tone: 'error',
      })
    }
  }

  const handleHtmlPreviewChange = (value: string) => {
    setHtmlPreview(value)
    setHtmlCopyFeedback(null)
  }

  const resetHtmlPreview = () => {
    if (htmlPreviewOriginal !== null) {
      setHtmlPreview(htmlPreviewOriginal)
      setHtmlCopyFeedback(null)
    }
  }

  const handleHtmlFileSelection = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const file = fileList[0]
    try {
      const text = await file.text()
      setHtmlPreview(text)
      setHtmlCopyFeedback({
        message: `Datei "${file.name}" geladen – Code kann angepasst werden.`,
        tone: 'success',
      })
    } catch (err) {
      console.error('HTML file read error:', err)
      setHtmlCopyFeedback({
        message: 'Datei konnte nicht gelesen werden.',
        tone: 'error',
      })
    } finally {
      if (htmlFileInputRef.current) {
        htmlFileInputRef.current.value = ''
      }
    }
  }

  const handleSaveHtml = async (options?: { reset?: boolean }) => {
    if (savingHtml) return
    setSavingHtml(true)
    try {
      const body = {
        customTemplateHtml: options?.reset ? null : (htmlPreview && htmlPreview.trim().length > 0 ? htmlPreview : null),
      }

      const res = await fetch(`/api/retirement-concepts/${conceptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'HTML konnte nicht gespeichert werden.')
      }

      if (options?.reset) {
        setFormData((prev) => ({ ...prev, customTemplateHtml: '' }))
        await loadHtmlPreview()
        setHtmlCopyFeedback({ message: 'Template auf Standard zurückgesetzt.', tone: 'success' })
        setTimeout(() => setHtmlCopyFeedback(null), 3000)
      } else {
        setFormData((prev) => ({ ...prev, customTemplateHtml: htmlPreview.trim().length > 0 ? htmlPreview : '' }))
        setHtmlPreviewOriginal(htmlPreview)
        setHtmlCopyFeedback({ message: 'Template gespeichert.', tone: 'success' })
        setTimeout(() => setHtmlCopyFeedback(null), 3000)
      }
    } catch (err: any) {
      console.error('HTML save error:', err)
      setHtmlCopyFeedback({ message: err?.message || 'Speichern fehlgeschlagen.', tone: 'error' })
    } finally {
      setSavingHtml(false)
    }
  }

  // Berechne Jahre bis zur Rente
  const calculateYearsToRetirement = (): number | null => {
    if (!formData.birthDate || !formData.desiredRetirementAge) return null
    const birthDate = new Date(formData.birthDate)
    const today = new Date()
    const retirementAge = parseInt(formData.desiredRetirementAge) || 67
    
    // Exakte Berechnung mit Monaten und Tagen (nicht gerundet)
    const retirementDate = new Date(birthDate)
    retirementDate.setFullYear(birthDate.getFullYear() + retirementAge)
    
    const diffTime = retirementDate.getTime() - today.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    const exactYears = diffDays / 365.25 // Berücksichtigt Schaltjahre
    
    return Math.max(0, exactYears)
  }

  // Berechne erstes Rentenjahr
  const calculateFirstRetirementYear = (): number | null => {
    if (!formData.birthDate || !formData.desiredRetirementAge) return null
    const birthDate = new Date(formData.birthDate)
    const retirementAge = parseInt(formData.desiredRetirementAge) || 67
    const retirementYear = birthDate.getFullYear() + retirementAge
    return retirementYear
  }

  // Berechne steuerpflichtigen Anteil basierend auf Rentenjahr
  // Start: 84% (2025), steigt um 0,5% pro Jahr, max 100% (bis 2058)
  const calculateTaxableShareForRetirementYear = (retirementYear: number): number => {
    const baseYear = 2025
    const basePercentage = 84.0
    const maxPercentage = 100.0
    const incrementPerYear = 0.5
    
    if (retirementYear < baseYear) {
      return basePercentage
    }
    
    const yearsFromBase = retirementYear - baseYear
    const calculatedPercentage = basePercentage + (yearsFromBase * incrementPerYear)
    return Math.min(maxPercentage, Math.max(basePercentage, calculatedPercentage))
  }

  // Berechne aktuelles Alter
  const calculateCurrentAge = (): number | null => {
    if (!formData.birthDate) return null
    const birthDate = new Date(formData.birthDate)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
  }

  // Schätze Rentenpunkte basierend auf aktuellem Einkommen und Arbeitsjahren
  const estimatePensionPoints = (): number => {
    // Jahresentgeltgrenze 2026: 51.944€ (da wir Mitte Dezember haben, können wir 2026 nehmen)
    const JAHRESENTGELTGRENZE = 51944
    
    // Aktuelles Bruttoeinkommen (jährlich)
    const currentGrossIncomeAnnual = parseFloat(formData.currentGrossIncome || '0')
    if (currentGrossIncomeAnnual <= 0) return 0
    
    // Aktuelle Punkte pro Jahr = Verhältnis zu Jahresentgeltgrenze
    // Maximal 2.0 Punkte pro Jahr (bei doppelter Entgeltgrenze)
    const pointsPerYear = Math.min(2.0, currentGrossIncomeAnnual / JAHRESENTGELTGRENZE)
    
    // Vergangene Arbeitsjahre (direkt eingegeben)
    const pastWorkingYears = Math.max(0, parseFloat(formData.pastWorkingYears || '0'))
    
    // Zukünftige Arbeitsjahre
    const yearsToRetirement = calculateYearsToRetirement() || 0
    
    // Vergangene Punkte (Annahme: gleiche Punkte wie heute)
    const pastPoints = pastWorkingYears * pointsPerYear
    
    // Zukünftige Punkte (Annahme: gleiche Punkte wie heute)
    const futurePoints = yearsToRetirement * pointsPerYear
    
    // Zusätzliche Punkte für Ausbildung
    // 0,75 Punkte pro Jahr, maximal 3 Jahre = 2,25 Punkte gesamt
    // Aber auch 2,5 oder 2 Jahre möglich (dann entsprechend multiplizieren)
    const trainingYears = Math.min(3, Math.max(0, parseFloat(formData.trainingYears || '0')))
    const trainingPoints = trainingYears * 0.75
    
    // Zusätzliche Punkte für Kindererziehung
    // 3 Entgeltpunkte wenn nach 1992 geboren, davor 2,5 Punkte
    // Wir fragen nicht nach Geburtsjahr, nehmen daher 3 Punkte als Standard (konservativ)
    // childrenYears wird als Anzahl Kinder interpretiert (nicht Jahre)
    const numberOfChildren = Math.max(0, Math.floor(parseFloat(formData.childrenYears || '0')))
    const childrenPoints = numberOfChildren * 3 // 3 Punkte pro Kind (nach 1992)
    
    // Gesamtpunkte
    const totalPoints = pastPoints + futurePoints + trainingPoints + childrenPoints
    
    return Math.max(0, totalPoints)
  }

  // Berechne geschätzte Rente aus Punkten
  const calculateEstimatedPensionFromPoints = (points: number): number => {
    // Rentenwert 2024: ~37,60€ pro Punkt (wird jährlich angepasst)
    // Wir verwenden 37,60€ als Basis und rechnen mit Inflation hoch
    const RENTENWERT_BASIS = 37.60
    const yearsToRetirement = calculateYearsToRetirement() || 0
    const inflationRate = parseFloat(formData.inflationRate || '2.0') / 100
    
    // Rentenwert zum Rentenbeginn (inflationsbereinigt)
    const rentenwertFuture = RENTENWERT_BASIS * Math.pow(1 + inflationRate, yearsToRetirement)
    
    // Monatliche Rente (Brutto)
    const monthlyGrossPension = points * rentenwertFuture
    
    return Math.max(0, monthlyGrossPension)
  }

  const isCivilServant: boolean = formData.employmentType === 'civil-servant'
  const isSelfEmployed: boolean = formData.employmentType === 'self-employed'

  const selectedBundesland = (formData.civilServiceState as Bundesland) || 'Baden-Württemberg'

  const availableOrders = useMemo<SupportedBesoldungsordnung[]>(() => {
    const gruppen = Object.keys(BEAMTEN_BESOLDUNG[selectedBundesland] ?? {})
    const orders = new Set<SupportedBesoldungsordnung>()
    gruppen.forEach((gruppe) => {
      const extracted = extractBesoldungsordnungFromGroup(gruppe)
      if (extracted) {
        orders.add(extracted)
      }
    })
    const ordered = SUPPORTED_BESOLDUNGSORDNUNGEN.filter((order) => orders.has(order))
    return ordered.length > 0 ? ordered : ['A']
  }, [selectedBundesland])

  useEffect(() => {
    if (availableOrders.length === 0) return
    const currentOrder = formData.civilServiceBesoldungsordnung as SupportedBesoldungsordnung | undefined
    if (!currentOrder || !availableOrders.includes(currentOrder)) {
      setFormData((prev) => ({
        ...prev,
        civilServiceBesoldungsordnung: availableOrders[0],
      }))
    }
  }, [availableOrders, formData.civilServiceBesoldungsordnung, setFormData])

  const selectedOrder: SupportedBesoldungsordnung =
    (formData.civilServiceBesoldungsordnung as SupportedBesoldungsordnung | undefined) &&
    availableOrders.includes(formData.civilServiceBesoldungsordnung as SupportedBesoldungsordnung)
      ? (formData.civilServiceBesoldungsordnung as SupportedBesoldungsordnung)
      : availableOrders[0]
  const selectedFutureOrder: SupportedBesoldungsordnung =
    (formData.civilServiceHasPromotion &&
    formData.civilServiceFutureBesoldungsordnung &&
    availableOrders.includes(formData.civilServiceFutureBesoldungsordnung as SupportedBesoldungsordnung))
      ? (formData.civilServiceFutureBesoldungsordnung as SupportedBesoldungsordnung)
      : selectedOrder

  useEffect(() => {
    if (!formData.civilServiceHasPromotion) return
    const currentFutureOrder = formData.civilServiceFutureBesoldungsordnung as SupportedBesoldungsordnung | undefined
    if (!currentFutureOrder || !availableOrders.includes(currentFutureOrder)) {
      setFormData((prev) => ({
        ...prev,
        civilServiceFutureBesoldungsordnung: selectedOrder,
      }))
    }
  }, [
    availableOrders,
    formData.civilServiceFutureBesoldungsordnung,
    formData.civilServiceHasPromotion,
    selectedOrder,
    setFormData,
  ])

  useEffect(() => {
    if (formData.civilServiceHasPromotion) return
    if (
      formData.civilServiceFutureGroup ||
      formData.civilServiceFutureLevel ||
      formData.civilServiceFutureBesoldungsordnung
    ) {
      setFormData((prev) => ({
        ...prev,
        civilServiceFutureGroup: '',
        civilServiceFutureLevel: '',
        civilServiceFutureBesoldungsordnung: '',
      }))
    }
  }, [
    formData.civilServiceFutureBesoldungsordnung,
    formData.civilServiceFutureGroup,
    formData.civilServiceFutureLevel,
    formData.civilServiceHasPromotion,
    setFormData,
  ])

  const sortBesoldungsgruppen = (gruppen: string[]) =>
    gruppen.sort((a, b) => {
      const matchA = a.match(/^(\D*?)(\d+)/)
      const matchB = b.match(/^(\D*?)(\d+)/)
      if (matchA && matchB) {
        const [, prefixA, numA] = matchA
        const [, prefixB, numB] = matchB
        if (prefixA === prefixB) {
          return Number(numA) - Number(numB)
        }
        return prefixA.localeCompare(prefixB)
      }
      return a.localeCompare(b)
    })

  const availableBesoldungsgruppen = useMemo(() => {
    const gruppen = Object.keys(BEAMTEN_BESOLDUNG[selectedBundesland] ?? {}).filter(
      (gruppe) => extractBesoldungsordnungFromGroup(gruppe) === selectedOrder,
    )
    return sortBesoldungsgruppen(gruppen)
  }, [selectedBundesland, selectedOrder])

  const availableFutureBesoldungsgruppen = useMemo(() => {
    const gruppen = Object.keys(BEAMTEN_BESOLDUNG[selectedBundesland] ?? {}).filter(
      (gruppe) => extractBesoldungsordnungFromGroup(gruppe) === selectedFutureOrder,
    )
    return sortBesoldungsgruppen(gruppen)
  }, [selectedBundesland, selectedFutureOrder])

  const availableStages = useMemo(() => {
    const gruppe = formData.civilServiceBesoldungsgruppe
    const tabelle = BEAMTEN_BESOLDUNG[selectedBundesland]?.[gruppe]
    if (!tabelle) return []
    return Object.keys(tabelle)
      .map((key) => Number.parseInt(key, 10))
      .filter((value) => !Number.isNaN(value))
      .sort((a, b) => a - b)
  }, [selectedBundesland, formData.civilServiceBesoldungsgruppe])

  const availableFutureStages = useMemo(() => {
    if (!formData.civilServiceHasPromotion) return []
    const futureGroup =
      formData.civilServiceFutureGroup && availableFutureBesoldungsgruppen.includes(formData.civilServiceFutureGroup)
        ? formData.civilServiceFutureGroup
        : availableFutureBesoldungsgruppen[0]
    if (!futureGroup) return []
    const tabelle = BEAMTEN_BESOLDUNG[selectedBundesland]?.[futureGroup]
    if (!tabelle) return []
    return Object.keys(tabelle)
      .map((key) => Number.parseInt(key, 10))
      .filter((value) => !Number.isNaN(value))
      .sort((a, b) => a - b)
  }, [
    availableFutureBesoldungsgruppen,
    formData.civilServiceFutureGroup,
    formData.civilServiceHasPromotion,
    selectedBundesland,
  ])

  useEffect(() => {
    if (availableStages.length === 0) {
      if (formData.civilServiceErfahrungsstufe !== '') {
        setFormData((prev) => ({
          ...prev,
          civilServiceErfahrungsstufe: '',
        }))
      }
      return
    }
    const currentStage = Number.parseInt(formData.civilServiceErfahrungsstufe || '', 10)
    if (!availableStages.includes(currentStage)) {
      setFormData((prev) => ({
        ...prev,
        civilServiceErfahrungsstufe: String(availableStages[0]),
      }))
    }
  }, [availableStages, formData.civilServiceErfahrungsstufe, setFormData])

  useEffect(() => {
    if (availableBesoldungsgruppen.length === 0) return
    if (!availableBesoldungsgruppen.includes(formData.civilServiceBesoldungsgruppe)) {
      setFormData((prev) => ({
        ...prev,
        civilServiceBesoldungsgruppe: availableBesoldungsgruppen[0],
      }))
    }
  }, [availableBesoldungsgruppen, formData.civilServiceBesoldungsgruppe, setFormData])

  useEffect(() => {
    if (!formData.civilServiceHasPromotion) return
    if (availableFutureBesoldungsgruppen.length === 0) {
      if (formData.civilServiceFutureGroup) {
        setFormData((prev) => ({
          ...prev,
          civilServiceFutureGroup: '',
        }))
      }
      return
    }
    if (!availableFutureBesoldungsgruppen.includes(formData.civilServiceFutureGroup)) {
      setFormData((prev) => ({
        ...prev,
        civilServiceFutureGroup: availableFutureBesoldungsgruppen[0],
      }))
    }
  }, [
    availableFutureBesoldungsgruppen,
    formData.civilServiceFutureGroup,
    formData.civilServiceHasPromotion,
    setFormData,
  ])
  useEffect(() => {
    if (!formData.civilServiceHasPromotion) return
    if (availableFutureStages.length === 0) {
      if (formData.civilServiceFutureLevel !== '') {
        setFormData((prev) => ({
          ...prev,
          civilServiceFutureLevel: '',
        }))
      }
      return
    }
    const stage = Number.parseInt(formData.civilServiceFutureLevel || '', 10)
    if (!availableFutureStages.includes(stage)) {
      setFormData((prev) => ({
        ...prev,
        civilServiceFutureLevel: String(availableFutureStages[0]),
      }))
    }
  }, [
    availableFutureStages,
    formData.civilServiceFutureLevel,
    formData.civilServiceHasPromotion,
    setFormData,
  ])

  const resolvedCurrentGroup =
    formData.civilServiceBesoldungsgruppe && availableBesoldungsgruppen.includes(formData.civilServiceBesoldungsgruppe)
      ? formData.civilServiceBesoldungsgruppe
      : availableBesoldungsgruppen[0] ?? ''

  const resolvedCurrentStage = (() => {
    const stage = Number.parseInt(formData.civilServiceErfahrungsstufe || '', 10)
    if (!Number.isNaN(stage) && availableStages.includes(stage)) {
      return stage
    }
    return availableStages[0] ?? null
  })()

  const resolvedFutureGroup =
    formData.civilServiceHasPromotion && formData.civilServiceFutureGroup
      ? formData.civilServiceFutureGroup
      : resolvedCurrentGroup

  const resolvedFutureStage = formData.civilServiceHasPromotion
    ? (() => {
        const stage = Number.parseInt(formData.civilServiceFutureLevel || '', 10)
        if (!Number.isNaN(stage) && availableFutureStages.includes(stage)) {
          return stage
        }
        return availableFutureStages[0] ?? null
      })()
    : resolvedCurrentStage

  const currentGrossValue = useMemo(() => {
    if (!isCivilServant) return null
    if (!resolvedCurrentGroup || resolvedCurrentStage == null) return null
    const tabelle = BEAMTEN_BESOLDUNG[selectedBundesland]?.[resolvedCurrentGroup]
    if (!tabelle) return null
    const value = tabelle[resolvedCurrentStage]
    return typeof value === 'number' ? value : null
  }, [isCivilServant, resolvedCurrentGroup, resolvedCurrentStage, selectedBundesland])

  const perspectiveGrossValue = useMemo(() => {
    if (!isCivilServant) return null
    if (!resolvedFutureGroup || resolvedFutureStage == null) return currentGrossValue
    const tabelle = BEAMTEN_BESOLDUNG[selectedBundesland]?.[resolvedFutureGroup]
    if (!tabelle) return currentGrossValue
    const value = tabelle[resolvedFutureStage]
    return typeof value === 'number' ? value : currentGrossValue
  }, [currentGrossValue, isCivilServant, resolvedFutureGroup, resolvedFutureStage, selectedBundesland])

  const formatCurrency = (value: number | null) =>
    typeof value === 'number' && Number.isFinite(value)
      ? `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
      : '—'

  const civilServantCalculation = useMemo<BeamtenpensionErgebnis | null>(() => {
    if (!isCivilServant) return null
    if (!formData.birthDate || !formData.civilServiceEntryDate) return null

    const retirementAge = parseInt(formData.desiredRetirementAge || '0', 10)
    const lifeExpectancy = parseInt(formData.lifeExpectancy || '0', 10)
    if (!retirementAge || retirementAge < 55) return null

    if (!resolvedCurrentGroup || resolvedCurrentStage == null) return null

    const besoldungsordnung: 'A' | 'B' | 'W' | 'R' =
      selectedOrder === 'B' ? 'B' : selectedOrder === 'W' ? 'W' : selectedOrder === 'R' ? 'R' : 'A'

    const futureGroup =
      formData.civilServiceHasPromotion && resolvedFutureGroup && resolvedFutureGroup !== resolvedCurrentGroup
        ? resolvedFutureGroup
        : formData.civilServiceHasPromotion
        ? resolvedFutureGroup
        : undefined
    const futureStage =
      formData.civilServiceHasPromotion && resolvedFutureStage != null ? resolvedFutureStage : undefined

    try {
      const result = berechneBeamtenpension({
        geburtsdatum: formData.birthDate,
        diensteintritt: formData.civilServiceEntryDate,
        kirchensteuerpflichtig: Boolean(formData.civilServiceChurchTax),
        bundesland: selectedBundesland,
        besoldungsordnung,
        besoldungsgruppe: resolvedCurrentGroup,
        erfahrungsstufe: resolvedCurrentStage,
        zusaetzliche_ruhegehaltsansprueche: parseFloat(formData.civilServiceAdditional || '0') || 0,
        lebenserwartung: lifeExpectancy || 88,
        pensionseintrittsalter: retirementAge,
        pensionssteigerung: parseFloat(formData.civilServicePensionIncrease || '1.5') || 0,
        aufstieg_besoldungsgruppe: Boolean(formData.civilServiceHasPromotion),
        zukuenftige_besoldungsgruppe: formData.civilServiceHasPromotion ? futureGroup || undefined : undefined,
        zukuenftige_erfahrungsstufe: futureStage,
      })
      return result
    } catch (error) {
      console.warn('Beamtenpension konnte nicht berechnet werden:', error)
      return null
    }
  }, [
    availableBesoldungsgruppen,
    availableFutureBesoldungsgruppen,
    availableFutureStages,
    availableStages,
    formData.birthDate,
    formData.civilServiceAdditional,
    formData.civilServiceChurchTax,
    formData.civilServiceEntryDate,
    formData.civilServiceFutureGroup,
    formData.civilServiceFutureLevel,
    formData.civilServiceHasPromotion,
    formData.civilServicePensionIncrease,
    formData.desiredRetirementAge,
    formData.lifeExpectancy,
    isCivilServant,
    resolvedCurrentGroup,
    resolvedCurrentStage,
    resolvedFutureGroup,
    resolvedFutureStage,
    selectedBundesland,
    selectedOrder,
  ])
  const statutoryLabel = isCivilServant ? 'Beamtenversorgung' : 'Gesetzliche Versorgung'
  const statutoryShortLabel = isCivilServant ? 'Beamtenpension' : 'Gesetzliche Rente'
  const statutoryAnalysisTitle = isCivilServant ? 'Beamtenversorgung – Analyse' : 'Gesetzliche Rentenversicherung – Analyse'
  // Berechne Rentenwert zur Rente (Gesetzliche Rente)
  const calculatePensionAtRetirement = (): { currentValue: number | null; futureValue: number | null } => {
    const yearsToRetirement = calculateYearsToRetirement()
    const inflationRate = parseFloat(formData.inflationRate || '0') / 100

    const round = (value: number) => Math.round(value * 100) / 100

    if (isCivilServant) {
      if (!civilServantCalculation || !yearsToRetirement || yearsToRetirement <= 0) {
        return { currentValue: null, futureValue: null }
      }
      const futureValue = civilServantCalculation.bruttoPension.bruttoPensionMonatlich
      const currentValue = futureValue / Math.pow(1 + inflationRate, yearsToRetirement)
      return {
        currentValue: round(currentValue),
        futureValue: round(futureValue),
      }
    }

    // Wenn keine Renteninfo vorhanden, aber selbstständig/nicht versichert → Schätzung
    if (!formData.hasCurrentPensionInfo && formData.employmentType === 'self-employed') {
      const estimatedPoints = estimatePensionPoints()
      const estimatedGrossPension = calculateEstimatedPensionFromPoints(estimatedPoints)
      
      if (estimatedGrossPension <= 0 || !yearsToRetirement || yearsToRetirement <= 0) {
        return { currentValue: null, futureValue: null }
      }
      
      // Annahme: Rentensteigerung wie bei gesetzlicher Rente (ca. 1-2% p.a.)
      const pensionIncrease = parseFloat(formData.pensionIncrease || '1.5') / 100
      const futureValue = estimatedGrossPension * Math.pow(1 + pensionIncrease, yearsToRetirement)
      const currentValue = futureValue / Math.pow(1 + inflationRate, yearsToRetirement)
      
      return {
        currentValue: round(currentValue),
        futureValue: round(futureValue),
      }
    }

    // Wenn keine Renteninfo vorhanden, aber Angestellter → Schätzung basierend auf Punkten
    if (!formData.hasCurrentPensionInfo && formData.employmentType === 'employee') {
      const estimatedPoints = estimatePensionPoints()
      const estimatedGrossPension = calculateEstimatedPensionFromPoints(estimatedPoints)
      
      if (estimatedGrossPension <= 0 || !yearsToRetirement || yearsToRetirement <= 0) {
        return { currentValue: null, futureValue: null }
      }
      
      // Annahme: Rentensteigerung wie bei gesetzlicher Rente (ca. 1-2% p.a.)
      const pensionIncrease = parseFloat(formData.pensionIncrease || '1.5') / 100
      const futureValue = estimatedGrossPension * Math.pow(1 + pensionIncrease, yearsToRetirement)
      const currentValue = futureValue / Math.pow(1 + inflationRate, yearsToRetirement)
      
      return {
        currentValue: round(currentValue),
        futureValue: round(futureValue),
      }
    }

    // Normale Berechnung mit vorhandener Renteninfo
    const pensionAtRetirement = parseFloat(formData.pensionAtRetirement || '0')
    const pensionIncrease = parseFloat(formData.pensionIncrease || '0') / 100

    if (!pensionAtRetirement || !yearsToRetirement || yearsToRetirement <= 0) {
      return { currentValue: null, futureValue: null }
    }

    const futureValue = pensionAtRetirement * Math.pow(1 + pensionIncrease, yearsToRetirement)
    const currentValue = futureValue / Math.pow(1 + inflationRate, yearsToRetirement)

    return { 
      currentValue: round(currentValue),
      futureValue: round(futureValue),
    }
  }

  const calculateIncomeTaxAnnual = (income: number, filingStatus: string) => {
    if (income <= 0) return 0

    const applyBasicProgression = (baseIncome: number) => {
      if (baseIncome <= 0) return 0
      if (baseIncome <= 62810) {
        return baseIncome * 0.14
      }
      if (baseIncome <= 277825) {
        return baseIncome * 0.42 - 9000
      }
      return baseIncome * 0.45 - 17000
    }

    if (filingStatus === 'married') {
      const splitIncome = income / 2
      return applyBasicProgression(splitIncome) * 2
    }

    return applyBasicProgression(income)
  }
  const calculateStatutoryNetPension = () => {
    const fallback = {
        netCurrent: null,
        netFuture: null,
        contributionsCurrent: 0,
        contributionsFuture: 0,
        kvRateProjected: 0,
        careRate: 0,
        totalRate: 0,
        taxCurrent: 0,
        taxFuture: 0,
        taxableShare: 0,
        annualAllowance: 0,
      grossFuture: null as number | null,
      grossCurrent: null as number | null,
      taxableMonthlyGross: 0,
      adjustedTaxFreeAmount: 0,
      taxAnnual: 0,
      netFutureBeforeTax: 0,
      insuranceType: 'statutory' as CivilServantInsuranceType,
      beihilfeRateCurrent: 0,
      beihilfeRateRetirement: 0,
    }

    if (isCivilServant) {
      const yearsToRetirement = calculateYearsToRetirement() || 0
      if (!civilServantCalculation || yearsToRetirement <= 0) {
        return fallback
      }

      const inflationRate = parseFloat(formData.inflationRate || '0') / 100
      const discountFactor = yearsToRetirement > 0 ? Math.pow(1 + inflationRate, yearsToRetirement) : 1
      const grossFuture = civilServantCalculation.bruttoPension.bruttoPensionMonatlich
      const grossCurrent = grossFuture / discountFactor

      const baseContributionsFuture = civilServantCalculation.abzuege.kvpv.sozialversicherungMonatlich
      const baseContributionsCurrent = baseContributionsFuture / discountFactor
      const baseBeihilfe = civilServantCalculation.abzuege.kvpv.beihilfesatz ?? 0

      const insuranceType: CivilServantInsuranceType =
        formData.insuranceType === 'statutory' ? 'statutory' : 'private'

      const hasBeihilfe = insuranceType === 'statutory' && Boolean(formData.statutoryHasBeihilfe)
      const clampPercent = (value?: string | number | null) => {
        if (value === null || value === undefined) return 0
        const numeric = typeof value === 'number' ? value : parseFloat(value || '0')
        if (!Number.isFinite(numeric)) return 0
        return Math.min(100, Math.max(0, numeric))
      }

      const beihilfeCurrentPercent = hasBeihilfe ? clampPercent(formData.beihilfeRateCurrent) : 0
      const beihilfeFuturePercent = hasBeihilfe
        ? clampPercent(
            formData.beihilfeRateRetirement === '' || formData.beihilfeRateRetirement === undefined
              ? formData.beihilfeRateCurrent
              : formData.beihilfeRateRetirement,
          )
        : 0

      let contributionsCurrent = baseContributionsCurrent
      let contributionsFuture = baseContributionsFuture
      let effectiveBeihilfeCurrent = beihilfeCurrentPercent / 100
      let effectiveBeihilfeRetirement = beihilfeFuturePercent / 100

      if (insuranceType === 'statutory') {
        const baseEigenAnteil = Math.max(0.01, 1 - baseBeihilfe)
        const eigenCurrent = Math.max(0, 1 - effectiveBeihilfeCurrent)
        const eigenFuture = Math.max(0, 1 - effectiveBeihilfeRetirement)
        contributionsCurrent = (baseContributionsCurrent / baseEigenAnteil) * eigenCurrent
        contributionsFuture = (baseContributionsFuture / baseEigenAnteil) * eigenFuture
      } else {
        const privateContributionCurrentRaw =
          typeof formData.privateContributionCurrent === 'number'
            ? formData.privateContributionCurrent
            : parseFloat(formData.privateContributionCurrent || '0')
        const privateContributionCurrent = Number.isFinite(privateContributionCurrentRaw)
          ? Math.max(0, privateContributionCurrentRaw)
          : 0
        contributionsCurrent = privateContributionCurrent
        contributionsFuture = privateContributionCurrent * discountFactor
        effectiveBeihilfeCurrent = 0
        effectiveBeihilfeRetirement = 0
      }

      const steuerdaten = berechneSteuern(
        civilServantCalculation.bruttoPension.bruttoPensionJaehrlich,
        contributionsFuture * 12,
        civilServantCalculation.berechnungsdaten.jahrPensionseintritt,
        Boolean(formData.civilServiceChurchTax),
        selectedBundesland,
      )

      const taxFuture = steuerdaten.steuernGesamtMonatlich
      const taxCurrent = taxFuture / discountFactor

      const netFutureBeforeTax = Math.max(0, grossFuture - contributionsFuture)
      const netFuture = Math.max(0, netFutureBeforeTax - taxFuture)
      const netCurrentBeforeTax = Math.max(0, grossCurrent - contributionsCurrent)
      const netCurrent = Math.max(0, netCurrentBeforeTax - taxCurrent)

      const kvRateProjected = grossFuture > 0 ? contributionsFuture / grossFuture : 0

      const {
        netCurrent: statutoryNetCurrent,
        netFuture: statutoryNetFuture,
        contributionsCurrent: statutoryContributionsCurrent,
        contributionsFuture: statutoryContributionsFuture,
        kvRateProjected: statutoryKvRateProjected,
        careRate: statutoryCareRate,
        totalRate: statutoryTotalRate,
        taxCurrent: statutoryTaxCurrent,
        taxFuture: statutoryTaxFuture,
        taxableShare: statutoryTaxableShare,
        annualAllowance: statutoryAnnualAllowance,
        grossCurrent: statutoryGrossCurrentValue,
        grossFuture: statutoryGrossFutureValue,
        taxableMonthlyGross: statutoryTaxableMonthlyGross,
        adjustedTaxFreeAmount: statutoryAdjustedTaxFreeAmount,
        taxAnnual: statutoryTaxAnnual,
        netFutureBeforeTax: statutoryNetFutureBeforeTax,
        insuranceType: statutoryInsuranceType,
        beihilfeRateCurrent: statutoryBeihilfeRateCurrent,
        beihilfeRateRetirement: statutoryBeihilfeRateRetirement,
      } = {
        netCurrent: Math.round(netCurrent * 100) / 100,
        netFuture: Math.round(netFuture * 100) / 100,
        contributionsCurrent: Math.round(contributionsCurrent * 100) / 100,
        contributionsFuture: Math.round(contributionsFuture * 100) / 100,
        kvRateProjected,
        careRate: 0,
        totalRate: kvRateProjected,
        taxCurrent: Math.round(taxCurrent * 100) / 100,
        taxFuture: Math.round(taxFuture * 100) / 100,
        taxableShare: 100,
        annualAllowance: Math.round(steuerdaten.versorgungsfreibetrag.gesamt),
        grossFuture: Math.round(grossFuture * 100) / 100,
        grossCurrent: Math.round(grossCurrent * 100) / 100,
        taxableMonthlyGross: Math.round(grossFuture * 100) / 100,
        adjustedTaxFreeAmount: steuerdaten.versorgungsfreibetrag.gesamt,
        taxAnnual: Math.round(steuerdaten.steuernGesamtJaehrlich * 100) / 100,
        netFutureBeforeTax: Math.round(netFutureBeforeTax * 100) / 100,
        insuranceType,
        beihilfeRateCurrent: effectiveBeihilfeCurrent,
        beihilfeRateRetirement: effectiveBeihilfeRetirement,
      }

      const statutoryGrossCurrent = Math.round(statutoryGrossCurrentValue * 100) / 100
      const statutoryGrossFuture = Math.round(statutoryGrossFutureValue * 100) / 100
      const statutoryTaxCurrentRounded = Math.round(statutoryTaxCurrent * 100) / 100
      const statutoryTaxFutureRounded = Math.round(statutoryTaxFuture * 100) / 100

      return {
        netCurrent: statutoryNetCurrent,
        netFuture: statutoryNetFuture,
        contributionsCurrent: statutoryContributionsCurrent,
        contributionsFuture: statutoryContributionsFuture,
        kvRateProjected: statutoryKvRateProjected,
        careRate: statutoryCareRate,
        totalRate: statutoryTotalRate,
        taxCurrent: statutoryTaxCurrentRounded,
        taxFuture: statutoryTaxFutureRounded,
        taxableShare: statutoryTaxableShare,
        annualAllowance: statutoryAnnualAllowance,
        grossFuture: statutoryGrossFuture,
        grossCurrent: statutoryGrossCurrent,
        taxableMonthlyGross: statutoryTaxableMonthlyGross,
        adjustedTaxFreeAmount: statutoryAdjustedTaxFreeAmount,
        taxAnnual: statutoryTaxAnnual,
        netFutureBeforeTax: statutoryNetFutureBeforeTax,
        insuranceType: statutoryInsuranceType,
        beihilfeRateCurrent: statutoryBeihilfeRateCurrent,
        beihilfeRateRetirement: statutoryBeihilfeRateRetirement,
      }
    }

    // Wenn keine Renteninfo vorhanden, verwende Schätzung
    let currentValue: number | null = null
    let futureValue: number | null = null
    
    if (!formData.hasCurrentPensionInfo && (formData.employmentType === 'employee' || formData.employmentType === 'self-employed')) {
      // Verwende Punkte-Schätzung
      const estimatedPoints = estimatePensionPoints()
      const estimatedGrossPension = calculateEstimatedPensionFromPoints(estimatedPoints)
      const yearsToRetirement = calculateYearsToRetirement() || 0
      const pensionIncrease = parseFloat(formData.pensionIncrease || '1.5') / 100
      
      if (estimatedGrossPension > 0 && yearsToRetirement > 0) {
        futureValue = estimatedGrossPension * Math.pow(1 + pensionIncrease, yearsToRetirement)
        const inflationRate = parseFloat(formData.inflationRate || '2.0') / 100
        currentValue = futureValue / Math.pow(1 + inflationRate, yearsToRetirement)
      }
    } else {
      // Normale Berechnung
      const result = calculatePensionAtRetirement()
      currentValue = result.currentValue
      futureValue = result.futureValue
    }

    if (currentValue === null || futureValue === null) {
      return fallback
    }

    const yearsToRetirement = calculateYearsToRetirement() || 0
    const inflationRate = parseFloat(formData.inflationRate || '0') / 100
    const discountFactor = yearsToRetirement > 0 ? Math.pow(1 + inflationRate, yearsToRetirement) : 1

    const kvBaseRate = parseFloat(formData.kvBaseRate || '7.3') / 100
    const kvAdditionalRate = parseFloat(formData.kvAdditionalRate || '0') / 100
    const kvIncreaseRate = parseFloat(formData.kvContributionIncrease || '0') / 100
    const kvRateProjected = (kvBaseRate + kvAdditionalRate) * Math.pow(1 + kvIncreaseRate, Math.max(0, yearsToRetirement))

    const careRate = (formData.hasChildren ? 3.6 : 4.2) / 100
    const totalRate = kvRateProjected + careRate

    const contributionsFuture = futureValue * totalRate
    const contributionsCurrent = contributionsFuture / discountFactor

    const netFutureBeforeTax = Math.max(0, futureValue - contributionsFuture)
    const netCurrentBeforeTax = Math.max(0, currentValue - contributionsCurrent)

    const currentYear = new Date().getFullYear()
    const retirementYear = currentYear + yearsToRetirement
    // Automatische Berechnung: 84% (2025) + 0,5% pro Jahr, max 100%
    const computedTaxableShare = calculateTaxableShareForRetirementYear(retirementYear)

    const taxableMonthlyGross = futureValue * (computedTaxableShare / 100)
    const taxFreeAmountBase = parseFloat(formData.taxFreeAmount || '12096')
    const taxIncreaseRate = parseFloat(formData.taxIncreaseRate || '0') / 100
    const adjustedTaxFreeAmount = taxFreeAmountBase * Math.pow(1 + taxIncreaseRate, Math.max(0, yearsToRetirement))
    const filingStatus = formData.taxFilingStatus || 'single'

    const taxableAnnualIncome = taxableMonthlyGross * 12
    const taxableAfterAllowance = Math.max(0, taxableAnnualIncome - adjustedTaxFreeAmount)
    const taxAnnual = calculateIncomeTaxAnnual(taxableAfterAllowance, filingStatus)
    const taxFuture = Math.max(0, taxAnnual / 12)
    const taxCurrent = taxFuture / discountFactor

    const netFuture = Math.max(0, netFutureBeforeTax - taxFuture)
    const netCurrent = Math.max(0, netCurrentBeforeTax - taxCurrent)

    return {
      netCurrent: Math.round(netCurrent * 100) / 100,
      netFuture: Math.round(netFuture * 100) / 100,
      contributionsCurrent: Math.round(contributionsCurrent * 100) / 100,
      contributionsFuture: Math.round(contributionsFuture * 100) / 100,
      kvRateProjected,
      careRate,
      totalRate,
      taxCurrent: Math.round(taxCurrent * 100) / 100,
      taxFuture: Math.round(taxFuture * 100) / 100,
      taxableShare: Math.round(computedTaxableShare * 10) / 10,
      annualAllowance: Math.round(adjustedTaxFreeAmount),
      grossFuture: Math.round(futureValue * 100) / 100,
      grossCurrent: Math.round(currentValue * 100) / 100,
      taxableMonthlyGross: Math.round(taxableMonthlyGross * 100) / 100,
      adjustedTaxFreeAmount,
      taxAnnual,
      netFutureBeforeTax: Math.round(netFutureBeforeTax * 100) / 100,
      insuranceType: 'statutory' as CivilServantInsuranceType,
      beihilfeRateCurrent: 0,
      beihilfeRateRetirement: 0,
    }
  }

  // Berechne Rente aus Kapital (für "Sparen"-Vorsorge)
  const calculatePensionFromCapital = (capital: number): number => {
    const retirementAge = parseInt(formData.desiredRetirementAge || '67')
    const lifeExpectancy = parseInt(formData.lifeExpectancy || '90')
    const yearsInRetirement = lifeExpectancy - retirementAge
    const withdrawalRate = parseFloat(formData.withdrawalRate || '0') / 100
    
    if (yearsInRetirement <= 0 || capital <= 0) return 0
    
    const months = yearsInRetirement * 12
    const monthlyWithdrawalRate = withdrawalRate / 12
    
    if (monthlyWithdrawalRate <= 0) {
      return capital / months
    }
    
    // Annuitätenformel: Monatliche Rente basierend auf Kapital und Entnahmerendite
    const annuityFactor = (1 - Math.pow(1 + monthlyWithdrawalRate, -months)) / monthlyWithdrawalRate
    return capital / annuityFactor
  }

  // Berechne Vorsorge abdiskontiert
  // calculateProvisionTotals (siehe oben)

  // Berechne Gesamtrente mit Vorsorge
  const calculateTotalPension = () => {
    const { netCurrent, netFuture } = calculateStatutoryNetPension()
    const provisionTotals = calculateProvisionTotals()
    
    if (netCurrent === null || netFuture === null) {
      return { totalCurrent: null, totalFuture: null }
    }

    return {
      totalCurrent: Math.round((netCurrent + provisionTotals.totalCurrent) * 100) / 100,
      totalFuture: Math.round((netFuture + provisionTotals.totalFuture) * 100) / 100,
    }
  }

  // Berechne gewünschte Rente hochgerechnet
  const calculateTargetPensionFuture = (): number | null => {
    const targetPension = parseFloat(formData.targetPensionNetto || '0')
    const inflationRate = parseFloat(formData.inflationRate || '0') / 100
    const yearsToRetirement = calculateYearsToRetirement()

    if (!targetPension || !yearsToRetirement || yearsToRetirement <= 0) {
      return null
    }

    return Math.round(targetPension * Math.pow(1 + inflationRate, yearsToRetirement) * 100) / 100
  }

  // Berechne Kapitalbedarf (immer absoluter Wert, nicht abdiskontiert)
  const calculateCapitalRequirement = (provisionTotals?: ReturnType<typeof calculateProvisionTotals>) => {
    const { netFuture } = calculateStatutoryNetPension()
    const requiredFuture = calculateTargetPensionFuture() || 0
    const totals = provisionTotals ?? calculateProvisionTotals()
    const projection = calculateSavingsProjection()
    const manualFuture = totals.manualFuture
    const existingSavingsFuture = totals.savingsFuture
    const statutoryFuture = netFuture || 0

    const retirementAge = parseInt(formData.desiredRetirementAge || '67')
    const lifeExpectancy = parseInt(formData.lifeExpectancy || '90')
    const yearsInRetirement = lifeExpectancy - retirementAge

    if (yearsInRetirement <= 0) {
      const gapFutureBase = Math.max(0, requiredFuture - (statutoryFuture + manualFuture + existingSavingsFuture))
      const gapFutureAfterPlan = Math.max(0, gapFutureBase - projection.monthlyPensionFuture)
      return {
        capitalRequirement: 0,
        baseCapitalRequirement: 0,
        yearsInRetirement,
        gapFuture: Math.round(gapFutureAfterPlan * 100) / 100,
        gapFutureBase: Math.round(gapFutureBase * 100) / 100,
      }
    }

    const gapFutureBase = Math.max(0, requiredFuture - (statutoryFuture + manualFuture + existingSavingsFuture))
    const gapFuture = Math.max(0, gapFutureBase - projection.monthlyPensionFuture)
    const baseCapitalRequirement = Math.round(gapFutureBase * 12 * yearsInRetirement * 100) / 100

    if (gapFuture === 0) {
      return {
        capitalRequirement: 0,
        baseCapitalRequirement,
        yearsInRetirement,
        gapFuture,
        gapFutureBase: Math.round(gapFutureBase * 100) / 100,
      }
    }

    const capitalRequirement = gapFuture * 12 * yearsInRetirement

    return {
      capitalRequirement: Math.round(capitalRequirement * 100) / 100,
      baseCapitalRequirement,
      yearsInRetirement,
      gapFuture: Math.round(gapFuture * 100) / 100,
      gapFutureBase: Math.round(gapFutureBase * 100) / 100,
    }
  }

  const calculateSavingsCoverage = (projectionOverride?: ReturnType<typeof calculateSavingsProjection>) => {
    const projection = projectionOverride ?? calculateSavingsProjection()
    const totals = calculateProvisionTotals()
    const { netFuture: statutoryNetFutureRaw } = calculateStatutoryNetPension()
    const statutoryNetFuture = statutoryNetFutureRaw ?? 0
    const requiredFuture = calculateTargetPensionFuture() || 0

    const retirementAge = parseInt(formData.desiredRetirementAge || '67')
    const lifeExpectancy = parseInt(formData.lifeExpectancy || '90')
    const yearsInRetirement = Math.max(0, lifeExpectancy - retirementAge)

    const provisionTaxBreakdown = calculateProvisionTaxBreakdown()
    const manualCapitalTaxFuture = provisionTaxBreakdown.totalPrivateTaxMonthly
    const incomeTaxPrivateMonthly = provisionTaxBreakdown.totalIncomeTaxMonthly
    const capitalTaxPrivateMonthly = provisionTaxBreakdown.totalCapitalTaxMonthly

    const bavThreshold = 187.25
    const bavKvRate = 0.171
    const bavPvRate = formData.hasChildren ? 0.036 : 0.042
    const totalBavFuture = provisions
      .filter((provision) => provision.type === 'Betriebliche Altersvorsorge')
      .reduce((sum, provision) => {
        const amount = parseFloat((provision.amount as unknown as string) || '0') || 0
        return sum + amount
      }, 0)
    const privateSvDeductionFuture = Math.max(0, totalBavFuture - bavThreshold) * (bavKvRate + bavPvRate)

    const existingPrivateNetFuture = Math.max(
      0,
      totals.manualFuture + totals.savingsFuture - privateSvDeductionFuture - manualCapitalTaxFuture,
    )

    const gapBefore = Math.max(0, requiredFuture - (statutoryNetFuture + existingPrivateNetFuture))
    const gapAfter = Math.max(0, gapBefore - projection.monthlyPensionFuture)

    const capitalEquivalentBase = yearsInRetirement > 0 ? gapBefore * 12 * yearsInRetirement : 0
    const capitalEquivalentRemaining = yearsInRetirement > 0 ? gapAfter * 12 * yearsInRetirement : 0
    const capitalEquivalentCovered = Math.max(0, capitalEquivalentBase - capitalEquivalentRemaining)
    // capitalEquivalent sollte das tatsächliche Kapital sein, nicht die monatliche Rente × Jahre
    const capitalEquivalent = projection.futureCapital

    const coversPercent = gapBefore > 0
      ? Math.min(100, ((gapBefore - gapAfter) / gapBefore) * 100)
      : (projection.monthlyPensionFuture > 0 ? 100 : 0)

    return {
      ...projection,
      coversPercent: Math.round(coversPercent * 100) / 100,
      gapBefore,
      gapAfter,
      yearsInRetirement,
      capitalEquivalentBase,
      capitalEquivalentCovered,
      capitalEquivalentRemaining,
      capitalEquivalent,
      totalPrivateTaxMonthly: manualCapitalTaxFuture,
      incomeTaxPrivateMonthly,
      capitalTaxPrivateMonthly,
      combinedAverageTaxRate: provisionTaxBreakdown.combinedAverageRate,
      baseAverageTaxRate: provisionTaxBreakdown.baseAverageRate,
      marginalTaxRate: provisionTaxBreakdown.marginalRate,
    }
  }

  const calculateProvisionTotals = () => {
    const inflationRate = parseFloat(formData.inflationRate || '0') / 100
    const yearsToRetirement = calculateYearsToRetirement() || 0

    let manualFuture = 0
    let savingsCapitalList = 0
    let savingsFutureList = 0
    let savingsCurrentList = 0

    provisions.forEach((provision) => {
      const amount = parseFloat((provision.amount as unknown as string) || '0') || 0
      if (!amount) return

      if (provision.type === 'Sparen') {
        savingsCapitalList += amount
        const futureIncome = calculatePensionFromCapital(amount)
        savingsFutureList += futureIncome
        savingsCurrentList += yearsToRetirement > 0 ? futureIncome / Math.pow(1 + inflationRate, yearsToRetirement) : futureIncome
      } else {
        manualFuture += amount
      }
    })

    const manualCurrent = yearsToRetirement > 0 ? manualFuture / Math.pow(1 + inflationRate, yearsToRetirement) : manualFuture

    return {
      manualFuture: Math.round(manualFuture * 100) / 100,
      manualCurrent: Math.round(manualCurrent * 100) / 100,
      savingsFuture: Math.round(savingsFutureList * 100) / 100,
      savingsCurrent: Math.round(savingsCurrentList * 100) / 100,
      savingsCapital: Math.round(savingsCapitalList * 100) / 100,
      totalFuture: Math.round((manualFuture + savingsFutureList) * 100) / 100,
      totalCurrent: Math.round((manualCurrent + savingsCurrentList) * 100) / 100,
    }
  }

  const calculateProvisionTaxBreakdown = (
    statutoryOverride?: ReturnType<typeof calculateStatutoryNetPension>,
  ) => {
    const statutoryData = statutoryOverride ?? calculateStatutoryNetPension()
    const taxableStatutoryMonthly = statutoryData.taxableMonthlyGross ?? 0
    const adjustedTaxFreeAmount =
      statutoryData.adjustedTaxFreeAmount ?? parseFloat(formData.taxFreeAmount || '12096')
    const filingStatus = formData.taxFilingStatus || 'single'
    const withdrawalRate = parseFloat(formData.withdrawalRate || '0') / 100
    const retirementAge = parseInt(formData.desiredRetirementAge || '67') || 67

    type IncomeProvision = { id: string; taxableMonthly: number }
    const incomeTaxProvisions: IncomeProvision[] = []
    const capitalTaxByProvision: Record<string, number> = {}
    const taxableShareByProvision: Record<string, number> = {}

    let totalTaxablePrivateMonthly = 0
    let totalCapitalTaxMonthly = 0

    provisions.forEach((provision) => {
      const amount = parseFloat((provision.amount as unknown as string) || '0') || 0
      if (!amount) return

      const taxableShare = getProvisionTaxableShareForProvision(provision, retirementAge)
      taxableShareByProvision[provision.id] = taxableShare

      if (provision.type === 'Sparen') {
        const monthlyGross = calculatePensionFromCapital(amount)
        const taxMonthly = calculateProvisionMonthlyTax(monthlyGross, provision.type, 0, {
          capitalAmount: amount,
          annualAllowance: CAPITAL_GAINS_ALLOWANCE_ANNUAL,
          withdrawalRate,
        })
        const rounded = Math.round(taxMonthly * 100) / 100
        capitalTaxByProvision[provision.id] = rounded
        totalCapitalTaxMonthly += taxMonthly
        return
      }

      if (taxableShare <= 0) {
        return
      }

      if (INCOME_TAX_PROVISION_TYPES.includes(provision.type)) {
        const taxableMonthly = amount * taxableShare
        if (taxableMonthly <= 0) return
        incomeTaxProvisions.push({ id: provision.id, taxableMonthly })
        totalTaxablePrivateMonthly += taxableMonthly
      }
    })

    const baseAnnualTaxable = Math.max(0, taxableStatutoryMonthly * 12 - adjustedTaxFreeAmount)
    const baseAnnualTax = calculateIncomeTaxAnnual(baseAnnualTaxable, filingStatus)

    const combinedAnnualTaxable = Math.max(
      0,
      (taxableStatutoryMonthly + totalTaxablePrivateMonthly) * 12 - adjustedTaxFreeAmount,
    )
    const combinedAnnualTax = calculateIncomeTaxAnnual(combinedAnnualTaxable, filingStatus)
    const incrementalAnnual = Math.max(0, combinedAnnualTax - baseAnnualTax)
    const incrementalMonthly = incrementalAnnual / 12

    const incomeTaxByProvision: Record<string, number> = {}
    incomeTaxProvisions.forEach((entry) => {
      const share =
        totalTaxablePrivateMonthly > 0 ? entry.taxableMonthly / totalTaxablePrivateMonthly : 0
      incomeTaxByProvision[entry.id] = Math.round(incrementalMonthly * share * 100) / 100
    })

    const combinedAverageRateRaw =
      taxableStatutoryMonthly + totalTaxablePrivateMonthly > 0
        ? combinedAnnualTax /
          ((taxableStatutoryMonthly + totalTaxablePrivateMonthly) * 12)
        : 0
    const baseAverageRate =
      taxableStatutoryMonthly > 0 ? baseAnnualTax / (taxableStatutoryMonthly * 12) : 0
    const combinedAverageRate =
      totalTaxablePrivateMonthly > 0
        ? Math.max(baseAverageRate, combinedAverageRateRaw)
        : combinedAverageRateRaw
    const marginalRate =
      totalTaxablePrivateMonthly > 0
        ? incrementalAnnual / (totalTaxablePrivateMonthly * 12)
        : 0

    const totalIncomeTaxMonthly = incrementalMonthly

    return {
      incomeTaxByProvision,
      capitalTaxByProvision,
      totalIncomeTaxMonthly,
      totalCapitalTaxMonthly,
      totalPrivateTaxMonthly: totalIncomeTaxMonthly + totalCapitalTaxMonthly,
      combinedAverageRate,
      baseAverageRate,
      marginalRate,
      taxableStatutoryMonthly,
      totalTaxablePrivateMonthly,
      adjustedTaxFreeAmount,
      filingStatus,
      baseAnnualTax,
      combinedAnnualTax,
      taxableShareByProvision,
    }
  }
  const calculateSavingsProjection = (options?: { monthlySavings?: number; delayYears?: number }) => {
    const monthlySavings = options?.monthlySavings ?? parseFloat(formData.monthlySavings || '0')
    const returnRate = parseFloat(formData.returnRate || '0') / 100
    const totalYearsToRetirement = calculateYearsToRetirement()
    const delayYearsRaw = options?.delayYears ?? 0
    const delayYears = Number.isFinite(delayYearsRaw) ? Math.max(0, delayYearsRaw) : 0

    if (!totalYearsToRetirement || totalYearsToRetirement <= 0) {
      return {
        futureCapital: 0,
        monthlyPensionFuture: 0,
        monthlyPensionCurrent: 0,
        monthlyPensionFutureGross: 0,
        capitalTaxMonthly: 0,
        capitalTaxMonthlyCurrent: 0,
      }
    }

    const savingYears = totalYearsToRetirement - delayYears

    if (!monthlySavings || savingYears <= 0) {
      return {
        futureCapital: 0,
        monthlyPensionFuture: 0,
        monthlyPensionCurrent: 0,
        monthlyPensionFutureGross: 0,
        capitalTaxMonthly: 0,
        capitalTaxMonthlyCurrent: 0,
      }
    }

    const monthlyReturn = Math.pow(1 + returnRate, 1 / 12) - 1
    const months = Math.max(0, savingYears * 12)

    // Vorschüssige Zahlungen (Annuity Due): Zahlung am Anfang jeder Periode
    // Formel: FV = PMT * (((1+r)^n - 1) / r) * (1+r)
    const futureCapitalRaw =
      monthlyReturn === 0
        ? monthlySavings * months
        : monthlySavings * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn)

    const futureCapital = Math.round(futureCapitalRaw * 100) / 100
    
    // Eingezahltes Kapital (Summe aller Einzahlungen ohne Zinsen)
    const totalPaidIn = monthlySavings * months

    const withdrawalRate = parseFloat(formData.withdrawalRate || '0') / 100
    const monthlyPensionFutureRaw = calculatePensionFromCapital(futureCapital)
    const inflationRate = parseFloat(formData.inflationRate || '0') / 100
    const discountFactor = totalYearsToRetirement > 0 ? Math.pow(1 + inflationRate, totalYearsToRetirement) : 1

    const churchRate = 0
    const partialExemption = parseFloat(formData.partialExemption || '30.0')
    // Anschaffungskosten: Falls nicht eingegeben, verwende eingezahltes Kapital
    const acquisitionCosts = parseFloat(formData.acquisitionCosts || '0') || totalPaidIn
    const capitalGainsTaxRate = parseFloat(formData.capitalGainsTaxRate || '26.375')
    const capitalGainsAllowance = parseFloat(formData.capitalGainsAllowance || '1000')
    
    const capitalTaxMonthly = calculateProvisionMonthlyTax(monthlyPensionFutureRaw, 'Sparen', churchRate, {
      capitalAmount: futureCapital,
      annualAllowance: capitalGainsAllowance,
      withdrawalRate,
      partialExemption,
      acquisitionCosts,
      capitalGainsTaxRate,
    })

    const monthlyPensionFutureNet = Math.max(0, monthlyPensionFutureRaw - capitalTaxMonthly)
    const monthlyPensionCurrentRaw = monthlyPensionFutureNet / discountFactor
    const capitalTaxMonthlyCurrent = capitalTaxMonthly / discountFactor

    return {
      futureCapital,
      totalPaidIn, // Eingezahltes Kapital (ohne Zinsen)
      monthlyPensionFuture: Math.round(monthlyPensionFutureNet * 100) / 100,
      monthlyPensionFutureGross: Math.round(monthlyPensionFutureRaw * 100) / 100,
      monthlyPensionCurrent: Math.round(monthlyPensionCurrentRaw * 100) / 100,
      capitalTaxMonthly: Math.round(capitalTaxMonthly * 100) / 100,
      capitalTaxMonthlyCurrent: Math.round(capitalTaxMonthlyCurrent * 100) / 100,
      acquisitionCosts, // Für Anzeige im Modal
    }
  }

  const calculateRequiredSavingsForGap = (options?: { delayYears?: number; gapTarget?: number }) => {
    const gapTarget = options?.gapTarget ?? calculateSavingsCoverage().gapBefore
    const totalYearsToRetirement = calculateYearsToRetirement()
    const delayYearsRaw = options?.delayYears ?? 0
    const delayYears = Number.isFinite(delayYearsRaw) ? Math.max(0, delayYearsRaw) : 0
    const savingYears = totalYearsToRetirement ? totalYearsToRetirement - delayYears : 0

    if (!gapTarget || gapTarget <= 0 || !totalYearsToRetirement || totalYearsToRetirement <= 0 || savingYears <= 0) {
      return {
        monthlySavings: 0,
        netFuture: 0,
        netCurrent: 0,
        feasible: false,
        savingYears: Math.max(0, savingYears),
      }
    }

    let low = 0
    let high = Math.max(500, gapTarget * 5)

    const projectionAt = (amount: number) => calculateSavingsProjection({ monthlySavings: amount, delayYears })

    while (projectionAt(high).monthlyPensionFuture < gapTarget && high < 50000) {
      high *= 2
    }

    const projectionHigh = projectionAt(high)
    if (projectionHigh.monthlyPensionFuture < gapTarget) {
      return {
        monthlySavings: 0,
        netFuture: 0,
        netCurrent: 0,
        feasible: false,
        savingYears,
      }
    }

    for (let i = 0; i < 40; i += 1) {
      const mid = (low + high) / 2
      const projection = projectionAt(mid)
      if (projection.monthlyPensionFuture >= gapTarget) {
        high = mid
      } else {
        low = mid
      }
    }

    const result = projectionAt(high)

    return {
      monthlySavings: Math.round(high * 100) / 100,
      netFuture: result.monthlyPensionFuture,
      netCurrent: result.monthlyPensionCurrent,
      feasible: true,
      savingYears,
    }
  }

  const computeDelayScenario = (
    delayYearsRaw: number,
    options?: {
      gapTarget?: number
      baselineProjection?: ReturnType<typeof calculateSavingsProjection>
      monthlySavings?: number
    },
  ) => {
    const totalYearsToRetirement = calculateYearsToRetirement()
    const delayYears = Number.isFinite(delayYearsRaw) ? Math.max(0, delayYearsRaw) : 0
    const savingYears = totalYearsToRetirement ? Math.max(0, totalYearsToRetirement - delayYears) : 0
    const monthlySavingsValue = options?.monthlySavings ?? parseFloat(formData.monthlySavings || '0')
    const baselineProjection =
      options?.baselineProjection ?? calculateSavingsProjection({ monthlySavings: monthlySavingsValue })
    const gapTarget =
      typeof options?.gapTarget === 'number' ? options.gapTarget : calculateSavingsCoverage().gapBefore

    const projectionWithDelay = calculateSavingsProjection({ monthlySavings: monthlySavingsValue, delayYears })
    const required = calculateRequiredSavingsForGap({ delayYears, gapTarget })
    const interestLoss = Math.max(0, baselineProjection.futureCapital - projectionWithDelay.futureCapital)

    return {
      delayYears,
      savingYears,
      requiredMonthly: required.monthlySavings,
      requiredNetFuture: required.netFuture,
      requiredNetCurrent: required.netCurrent,
      requiredFeasible: required.feasible,
      capitalWithCurrentSavings: projectionWithDelay.futureCapital,
      interestLoss,
      baselineCapital: baselineProjection.futureCapital,
      baselineMonthlySavings: monthlySavingsValue,
      gapTarget,
    }
  }
  const buildCalculationSnapshot = (): CalculationSnapshot => {
    const statutoryTaxData = calculateStatutoryNetPension()
    const {
      netCurrent: statutoryNetCurrent,
      netFuture: statutoryNetFuture,
      contributionsCurrent: statutoryContributionsCurrent,
      contributionsFuture: statutoryContributionsFuture,
      kvRateProjected: statutoryKvRateProjected,
      careRate: statutoryCareRate,
      totalRate: statutoryTotalRate,
      taxCurrent: statutoryTaxCurrent,
      taxFuture: statutoryTaxFuture,
      taxableShare: statutoryTaxableShare,
      annualAllowance: statutoryAnnualAllowance,
      grossCurrent: statutoryGrossCurrentValue,
      grossFuture: statutoryGrossFutureValue,
      taxableMonthlyGross: statutoryTaxableMonthlyGross,
      adjustedTaxFreeAmount: statutoryAdjustedTaxFreeAmount,
      taxAnnual: statutoryTaxAnnual,
      netFutureBeforeTax: statutoryNetFutureBeforeTax,
      insuranceType: statutoryInsuranceType,
      beihilfeRateCurrent: statutoryBeihilfeRateCurrent,
      beihilfeRateRetirement: statutoryBeihilfeRateRetirement,
    } = statutoryTaxData

    const statutoryGrossCurrentRounded = Math.round((statutoryGrossCurrentValue ?? 0) * 100) / 100
    const statutoryGrossFutureRounded = Math.round((statutoryGrossFutureValue ?? 0) * 100) / 100
    const statutoryTaxCurrentRounded = Math.round(statutoryTaxCurrent * 100) / 100
    const statutoryTaxFutureRounded = Math.round(statutoryTaxFuture * 100) / 100

    const provisionTotals = calculateProvisionTotals()
    const savingsProjection = calculateSavingsProjection()
    const savingsCoverage = calculateSavingsCoverage()
    const requiredSavings = calculateRequiredSavingsForGap()

    const inflationRate = parseFloat(formData.inflationRate || '0') / 100
    const yearsToRetirement = calculateYearsToRetirement() || 0
    const discountFactor = yearsToRetirement > 0 ? Math.pow(1 + inflationRate, yearsToRetirement) : 1

    const provisionTaxBreakdown = calculateProvisionTaxBreakdown(statutoryTaxData)
    const manualCapitalTaxFuture = provisionTaxBreakdown.totalPrivateTaxMonthly

    const manualCapitalTaxCurrent = manualCapitalTaxFuture / discountFactor

    const bavThreshold = 187.25
    const bavKvRate = 0.171
    const bavPvRate = formData.hasChildren ? 0.036 : 0.042

    const totalBavFuture = provisions
      .filter((provision) => provision.type === 'Betriebliche Altersvorsorge')
      .reduce((sum, provision) => {
        const amount = parseFloat((provision.amount as unknown as string) || '0') || 0
        return sum + amount
      }, 0)

    const totalBavCurrent = totalBavFuture / discountFactor

    const privateSvDeductionFuture = Math.max(0, totalBavFuture - bavThreshold) * (bavKvRate + bavPvRate)
    const privateSvDeductionCurrent = privateSvDeductionFuture / discountFactor

    const privateGrossFuture = (provisionTotals.manualFuture || 0) + (provisionTotals.savingsFuture || 0)
    const privateGrossCurrent = (provisionTotals.manualCurrent || 0) + (provisionTotals.savingsCurrent || 0)

    const privateNetFuture = Math.max(
      0,
      privateGrossFuture - privateSvDeductionFuture - manualCapitalTaxFuture,
    )
    const privateNetCurrent = Math.max(
      0,
      privateGrossCurrent - privateSvDeductionCurrent - manualCapitalTaxCurrent,
    )

    return {
      statutory: {
        grossCurrent: statutoryGrossCurrentRounded,
        grossFuture: statutoryGrossFutureRounded,
        netCurrent: statutoryNetCurrent,
        netFuture: statutoryNetFuture,
        contributionsCurrent: statutoryContributionsCurrent,
        contributionsFuture: statutoryContributionsFuture,
        kvRateProjected: statutoryKvRateProjected,
        careRate: statutoryCareRate,
        totalRate: statutoryTotalRate,
        taxCurrent: statutoryTaxCurrentRounded,
        taxFuture: statutoryTaxFutureRounded,
        taxableShare: statutoryTaxableShare,
        annualAllowance: statutoryAnnualAllowance,
        grossCurrentValue: statutoryGrossCurrentValue,
        grossFutureValue: statutoryGrossFutureValue,
        taxableMonthlyGross: statutoryTaxableMonthlyGross,
        adjustedTaxFreeAmount: statutoryAdjustedTaxFreeAmount,
        taxAnnual: statutoryTaxAnnual,
        netFutureBeforeTax: statutoryNetFutureBeforeTax,
        insuranceType: statutoryInsuranceType,
        beihilfeRateCurrent: statutoryBeihilfeRateCurrent,
        beihilfeRateRetirement: statutoryBeihilfeRateRetirement,
      },
      privateExisting: {
        grossCurrent: Math.round(privateGrossCurrent * 100) / 100,
        grossFuture: Math.round(privateGrossFuture * 100) / 100,
        netCurrent: Math.round(privateNetCurrent * 100) / 100,
        netFuture: Math.round(privateNetFuture * 100) / 100,
      },
      planned: {
        grossCurrent: Math.round((savingsProjection.monthlyPensionFutureGross / discountFactor) * 100) / 100,
        grossFuture: savingsProjection.monthlyPensionFutureGross,
        netCurrent: savingsProjection.monthlyPensionCurrent,
        netFuture: savingsProjection.monthlyPensionFuture,
      },
      gaps: {
        before: Math.round(savingsCoverage.gapBefore * 100) / 100,
        after: Math.round(savingsCoverage.gapAfter * 100) / 100,
        coveragePercent: Math.round(savingsCoverage.coversPercent * 10) / 10,
      },
      requiredSavings: {
        monthlySavings: requiredSavings.monthlySavings,
        netFuture: requiredSavings.netFuture,
        netCurrent: requiredSavings.netCurrent,
      },
      meta: {
        employmentType: formData.employmentType as EmploymentType,
        civilServant: civilServantCalculation
          ? {
              inputs: {
                entryDate: formData.civilServiceEntryDate,
                state: formData.civilServiceState,
                besoldungsgruppe: formData.civilServiceBesoldungsgruppe,
                erfahrungsstufe: parseInt(formData.civilServiceErfahrungsstufe || '1', 10) || 1,
                besoldungsordnung: selectedOrder,
                pensionIncrease: parseFloat(formData.civilServicePensionIncrease || '1.5') || 0,
                additional: parseFloat(formData.civilServiceAdditional || '0') || 0,
                hasPromotion: Boolean(formData.civilServiceHasPromotion),
                futureOrder: formData.civilServiceHasPromotion
                  ? formData.civilServiceFutureBesoldungsordnung || selectedOrder
                  : undefined,
                futureGroup: formData.civilServiceHasPromotion ? resolvedFutureGroup || undefined : undefined,
                futureLevel: formData.civilServiceHasPromotion ? resolvedFutureStage ?? undefined : undefined,
                churchTax: Boolean(formData.civilServiceChurchTax),
                insuranceType: formData.insuranceType as CivilServantInsuranceType,
                statutoryHasBeihilfe: Boolean(formData.statutoryHasBeihilfe),
                beihilfeRateCurrent:
                  formData.beihilfeRateCurrent && formData.beihilfeRateCurrent !== ''
                    ? parseFloat(formData.beihilfeRateCurrent)
                    : undefined,
                beihilfeRateRetirement:
                  formData.beihilfeRateRetirement && formData.beihilfeRateRetirement !== ''
                    ? parseFloat(formData.beihilfeRateRetirement)
                    : undefined,
                privateContributionCurrent:
                  formData.privateContributionCurrent && formData.privateContributionCurrent !== ''
                    ? parseFloat(formData.privateContributionCurrent)
                    : undefined,
              },
              results: {
                brutto: civilServantCalculation.bruttoPension.bruttoPensionMonatlich,
                netto: statutoryNetFuture ?? 0,
                steuern: statutoryTaxFuture,
                kvpv: statutoryContributionsFuture,
                ruhegehaltssatz: civilServantCalculation.berechnungsdaten.ruhegehaltssatz.ruhegehaltssatz,
                insuranceType: statutoryInsuranceType,
                contributionsCurrent: contributionsCurrent,
                contributionsFuture: contributionsFuture,
                beihilfeRateCurrent: statutoryBeihilfeRateCurrent,
                beihilfeRateRetirement: statutoryBeihilfeRateRetirement,
              },
            }
          : undefined,
      },
    }
  }

  const { currentValue, futureValue } = calculatePensionAtRetirement()
  const statutoryTaxData = calculateStatutoryNetPension()
  const {
    netCurrent,
    netFuture,
    contributionsCurrent,
    contributionsFuture,
    kvRateProjected,
    careRate,
    taxCurrent,
    taxFuture,
    taxableShare,
    annualAllowance,
    insuranceType: statutoryInsuranceType,
    beihilfeRateCurrent: statutoryBeihilfeRateCurrent,
    beihilfeRateRetirement: statutoryBeihilfeRateRetirement,
  } = statutoryTaxData

  const statutoryNetFuture = netFuture
  const statutoryTaxFuture = taxFuture
  const statutoryContributionsFuture = contributionsFuture
  const { totalCurrent, totalFuture } = calculateTotalPension()
  const targetPensionFuture = calculateTargetPensionFuture()
  const yearsToRetirement = calculateYearsToRetirement()

  // Vorsorge hinzufügen
  const addProvision = (type: ProvisionType = 'Privatrente') => {
    if (provisions.length >= 5) return
    setProvisions([
      ...provisions,
      {
        id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(),
        type,
      amount: 0,
        name: '',
        strengths: '',
        weaknesses: '',
        recommendation: '',
        attachmentIds: [],
      },
    ])
  }
  
  // Sparen-Vorsorge hinzufügen (aus Kapitalbedarf-Berechnung)
  const addSavingsProvision = () => {
    const { futureCapital } = calculateSavingsProjection()
    if (futureCapital <= 0) return

    setProvisions((prev) => {
      const existingIndex = prev.findIndex((p) => p.type === 'Sparen')
      if (existingIndex >= 0) {
        const updated = [...prev]
        const existing = updated[existingIndex]
        updated[existingIndex] = {
          ...existing,
          amount: futureCapital,
          name: existing.name && existing.name.trim().length > 0 ? existing.name : 'Sparen (berechnet)',
        }
        return updated
      }
      return [
        ...prev,
        {
          id:
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : Date.now().toString(),
          type: 'Sparen',
          amount: futureCapital,
          name: 'Sparen (berechnet)',
          strengths: '',
          weaknesses: '',
          recommendation: '',
          attachmentIds: [],
        },
      ]
    })
    setFormData((prev) => ({ ...prev, monthlySavings: '' }))
  }

  // Vorsorge entfernen
  const removeProvision = (id: string) => {
    setProvisions(provisions.filter(p => p.id !== id))
  }

  // Vorsorge aktualisieren
  const updateProvision = (id: string, field: keyof Provision, value: any) => {
    setProvisions(provisions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  // Interne Save-Funktion (wird vom Hook und manuell verwendet)
  const handleSaveInternal = useCallback(async (dataToSave?: typeof combinedFormData, navigateToResult: boolean = true) => {
    setSaving(true)
    try {
      // Verwende die übergebenen Daten oder aktuellen formData/provisions
      const data = dataToSave || combinedFormData
      const currentFormData = data && 'formData' in data ? (data as any).formData : formData
      const currentProvisions = data && 'provisions' in data ? (data as any).provisions : provisions
      
      const { totalCurrent, totalFuture } = calculateTotalPension()
      const { totalCurrent: provisionCurrent } = calculateProvisionTotals()
      const calculationSnapshot = buildCalculationSnapshot()
      const targetPensionFuture = calculateTargetPensionFuture()
      const { currentValue } = calculatePensionAtRetirement()

      const bodyData = {
      birthDate: currentFormData.birthDate || null,
      desiredRetirementAge: currentFormData.desiredRetirementAge && currentFormData.desiredRetirementAge.trim() !== '' ? parseInt(currentFormData.desiredRetirementAge) : null,
      targetPensionNetto: currentFormData.targetPensionNetto && currentFormData.targetPensionNetto.trim() !== '' ? parseFloat(currentFormData.targetPensionNetto) : null,
      hasCurrentPensionInfo: currentFormData.hasCurrentPensionInfo,
      pensionAtRetirement: currentFormData.pensionAtRetirement && currentFormData.pensionAtRetirement.trim() !== '' ? parseFloat(currentFormData.pensionAtRetirement) : null,
      pensionIncrease: currentFormData.pensionIncrease && currentFormData.pensionIncrease.trim() !== '' ? parseFloat(currentFormData.pensionIncrease) : null,
      inflationRate: currentFormData.inflationRate && currentFormData.inflationRate.trim() !== '' ? parseFloat(currentFormData.inflationRate) : null,
      calculatedPensionAtRetirement: currentValue,
      existingProvisionData: JSON.stringify(currentProvisions),
          totalExistingProvision: provisionCurrent, // Abdiskontierte Vorsorge
      totalPensionWithProvision: totalCurrent,
      calculatedTargetPension: targetPensionFuture,
          statutoryStrengths: currentFormData.statutoryStrengths || null,
          statutoryWeaknesses: currentFormData.statutoryWeaknesses || null,
          privateStrengths: currentFormData.privateStrengths || null,
          privateWeaknesses: currentFormData.privateWeaknesses || null,
          customTemplateHtml: currentFormData.customTemplateHtml && currentFormData.customTemplateHtml.trim().length > 0 ? currentFormData.customTemplateHtml : null,
          recommendationDelta: currentFormData.recommendationDelta ? parseFloat(currentFormData.recommendationDelta) : null,
          notes: currentFormData.recommendation || null,
          recommendationProvider: currentFormData.recommendationProvider || null,
          recommendationAdvantages: currentFormData.recommendationAdvantages || null,
          expectedRente: currentFormData.expectedRente ? parseFloat(currentFormData.expectedRente) : null,
          // Neue Felder für Kapitalbedarf (wird später im Schema hinzugefügt)
      lifeExpectancy: currentFormData.lifeExpectancy && currentFormData.lifeExpectancy.trim() !== '' ? parseInt(currentFormData.lifeExpectancy) : null,
      monthlySavings: currentFormData.monthlySavings && currentFormData.monthlySavings.trim() !== '' ? parseFloat(currentFormData.monthlySavings) : null,
      returnRate: currentFormData.returnRate && currentFormData.returnRate.trim() !== '' ? parseFloat(currentFormData.returnRate) : null,
      withdrawalRate: currentFormData.withdrawalRate && currentFormData.withdrawalRate.trim() !== '' ? parseFloat(currentFormData.withdrawalRate) : null,
      hasChildren: Boolean(currentFormData.hasChildren),
      isCompulsoryInsured: Boolean(currentFormData.isCompulsoryInsured),
      kvBaseRate: currentFormData.kvBaseRate && currentFormData.kvBaseRate.trim() !== '' ? parseFloat(currentFormData.kvBaseRate) : null,
      kvAdditionalRate: currentFormData.kvAdditionalRate && currentFormData.kvAdditionalRate.trim() !== '' ? parseFloat(currentFormData.kvAdditionalRate) : null,
      kvContributionIncrease: currentFormData.kvContributionIncrease && currentFormData.kvContributionIncrease.trim() !== '' ? parseFloat(currentFormData.kvContributionIncrease) : null,
          taxFilingStatus: currentFormData.taxFilingStatus,
      taxFreeAmount: currentFormData.taxFreeAmount && currentFormData.taxFreeAmount.trim() !== '' ? parseFloat(currentFormData.taxFreeAmount) : null,
      taxIncreaseRate: currentFormData.taxIncreaseRate && currentFormData.taxIncreaseRate.trim() !== '' ? parseFloat(currentFormData.taxIncreaseRate) : null,
      taxFreePercentage: (() => {
        const firstRetirementYear = calculateFirstRetirementYear()
        return firstRetirementYear ? calculateTaxableShareForRetirementYear(firstRetirementYear) : null
      })(),
          calculationSnapshot: JSON.stringify(calculationSnapshot),
        }
      
      console.log('💾 SPEICHERN - Gesendete Daten:', {
        targetPensionNetto: bodyData.targetPensionNetto,
        pensionAtRetirement: bodyData.pensionAtRetirement,
        monthlySavings: bodyData.monthlySavings,
        desiredRetirementAge: bodyData.desiredRetirementAge,
        lifeExpectancy: bodyData.lifeExpectancy,
      })
      console.log('💾 SPEICHERN - Vollständiger Body:', bodyData)
      
      const res = await fetch(`/api/retirement-concepts/${conceptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Speichern fehlgeschlagen')
      }

      // Lade aktualisierte Daten und aktualisiere State
      const updatedConcept = await res.json()
      
      // Aktualisiere formData mit gespeicherten Werten
      setFormData((prev) => ({
        ...prev,
        birthDate: updatedConcept.birthDate ? new Date(updatedConcept.birthDate).toISOString().split('T')[0] : prev.birthDate,
        desiredRetirementAge: updatedConcept.desiredRetirementAge?.toString() || prev.desiredRetirementAge,
        targetPensionNetto: updatedConcept.targetPensionNetto !== null && updatedConcept.targetPensionNetto !== undefined ? updatedConcept.targetPensionNetto.toString() : prev.targetPensionNetto,
        hasCurrentPensionInfo: updatedConcept.hasCurrentPensionInfo ?? prev.hasCurrentPensionInfo,
        pensionAtRetirement: updatedConcept.pensionAtRetirement !== null && updatedConcept.pensionAtRetirement !== undefined ? updatedConcept.pensionAtRetirement.toString() : prev.pensionAtRetirement,
        pensionIncrease: updatedConcept.pensionIncrease !== null && updatedConcept.pensionIncrease !== undefined ? updatedConcept.pensionIncrease.toString() : prev.pensionIncrease,
        inflationRate: updatedConcept.inflationRate !== null && updatedConcept.inflationRate !== undefined ? updatedConcept.inflationRate.toString() : prev.inflationRate,
        lifeExpectancy: updatedConcept.lifeExpectancy?.toString() || prev.lifeExpectancy,
        monthlySavings: updatedConcept.monthlySavings !== null && updatedConcept.monthlySavings !== undefined ? updatedConcept.monthlySavings.toString() : prev.monthlySavings,
        returnRate: updatedConcept.returnRate?.toString() || prev.returnRate,
        withdrawalRate: updatedConcept.withdrawalRate?.toString() || prev.withdrawalRate,
        hasChildren: updatedConcept.hasChildren ?? prev.hasChildren,
        isCompulsoryInsured: updatedConcept.isCompulsoryInsured ?? prev.isCompulsoryInsured,
        kvBaseRate: updatedConcept.kvBaseRate?.toString() || prev.kvBaseRate,
        kvAdditionalRate: updatedConcept.kvAdditionalRate?.toString() || prev.kvAdditionalRate,
        kvContributionIncrease: updatedConcept.kvContributionIncrease?.toString() || prev.kvContributionIncrease,
        taxFilingStatus: updatedConcept.taxFilingStatus || prev.taxFilingStatus,
        taxFreeAmount: updatedConcept.taxFreeAmount?.toString() || prev.taxFreeAmount,
        taxIncreaseRate: updatedConcept.taxIncreaseRate?.toString() || prev.taxIncreaseRate,
        taxFreePercentage: updatedConcept.taxFreePercentage?.toString() || prev.taxFreePercentage,
        statutoryStrengths: updatedConcept.statutoryStrengths || prev.statutoryStrengths,
        statutoryWeaknesses: updatedConcept.statutoryWeaknesses || prev.statutoryWeaknesses,
        privateStrengths: updatedConcept.privateStrengths || prev.privateStrengths,
        privateWeaknesses: updatedConcept.privateWeaknesses || prev.privateWeaknesses,
        recommendation: updatedConcept.notes || prev.recommendation,
        recommendationDelta: updatedConcept.recommendationDelta?.toString() || prev.recommendationDelta,
        recommendationProvider: updatedConcept.recommendationProvider || prev.recommendationProvider,
        recommendationAdvantages: updatedConcept.recommendationAdvantages || prev.recommendationAdvantages,
        expectedRente: updatedConcept.expectedRente?.toString() || prev.expectedRente,
      }))
      
      // Aktualisiere Provisions aus existingProvisionData
      if (updatedConcept.existingProvisionData) {
        try {
          const parsedProvisions = JSON.parse(updatedConcept.existingProvisionData) as Provision[]
          setProvisions(parsedProvisions.map((p) => ({
            ...p,
            id: p.id || crypto.randomUUID(),
            name: p.name || '',
            strengths: p.strengths || '',
            weaknesses: p.weaknesses || '',
            recommendation: p.recommendation || '',
            attachmentIds: Array.isArray(p.attachmentIds) ? p.attachmentIds : [],
          })))
        } catch (error) {
          console.error('Fehler beim Parsen der Provisions:', error)
        }
      }

      router.refresh()
      
      // Navigiere zur Ergebnisseite nur wenn explizit gewünscht
      if (navigateToResult) {
        router.push(`/clients/${initialConcept.clientId}/retirement-concept/${initialConcept.id}/ergebnis`)
      }
    } catch (err: any) {
      alert(`❌ Fehler: ${err.message}`)
      console.error('Fehler beim Speichern:', err)
      throw err // Weiterwerfen für Hook
    } finally {
      setSaving(false)
    }
  }, [formData, provisions, calculateTotalPension, calculateProvisionTotals, buildCalculationSnapshot, calculateTargetPensionFuture, calculatePensionAtRetirement, initialConcept, router, combinedFormData, setSaving])
  
  // Speichere Referenz für Hook
  useEffect(() => {
    handleSaveInternalRef.current = handleSaveInternal
  }, [handleSaveInternal])
  
  // Öffentliche Save-Funktion (verwendet Hook für Draft-Cleanup)
  const handleSave = useCallback(async (navigateToResult: boolean = true) => {
    await saveAndClearDraft()
    if (navigateToResult) {
      router.push(`/clients/${initialConcept.clientId}/retirement-concept/${initialConcept.id}/ergebnis`)
    }
  }, [saveAndClearDraft, router, initialConcept])

  // Funktion zum Laden der Daten aus der Datenbank
  const handleLoadData = useCallback(async () => {
    setSaving(true)
    try {
      console.log('🔄 Lade Konzept - conceptId aus URL:', conceptId)
      console.log('🔄 Lade Konzept - initialConcept.id:', initialConcept.id)
      console.log('🔄 Lade Konzept - IDs stimmen überein?', conceptId === initialConcept.id)
      
      const res = await fetch(`/api/retirement-concepts/${conceptId}`)
      if (!res.ok) {
        throw new Error('Fehler beim Laden der Daten')
      }
      const concept = await res.json()
      
      console.log('📥 Geladene Daten (RAW - vollständig):', concept)
      console.log('📥 Geladene Daten - targetPensionNetto:', concept.targetPensionNetto)
      console.log('📥 Geladene Daten - targetPensionNetto Type:', typeof concept.targetPensionNetto)
      console.log('📥 Geladene Daten - concept.id:', concept.id)
      console.log('📥 Geladene Daten - initialConcept.id:', initialConcept.id)
      console.log('📥 Geladene Daten - IDs stimmen überein?', concept.id === initialConcept.id)
      console.log('🔍 Geladene Daten - Wichtige Felder (RAW):', {
        birthDate: concept.birthDate,
        desiredRetirementAge: concept.desiredRetirementAge,
        targetPensionNetto: concept.targetPensionNetto,
        pensionAtRetirement: concept.pensionAtRetirement,
        monthlySavings: concept.monthlySavings,
        lifeExpectancy: concept.lifeExpectancy,
        pensionIncrease: concept.pensionIncrease,
        inflationRate: concept.inflationRate,
        returnRate: concept.returnRate,
        withdrawalRate: concept.withdrawalRate,
      })
      console.log('🔍 Typen der geladenen Werte:', {
        targetPensionNetto: typeof concept.targetPensionNetto,
        targetPensionNettoValue: concept.targetPensionNetto,
        pensionAtRetirement: typeof concept.pensionAtRetirement,
        pensionAtRetirementValue: concept.pensionAtRetirement,
        monthlySavings: typeof concept.monthlySavings,
        monthlySavingsValue: concept.monthlySavings,
      })
      console.log('🔍 Form-Werte VORHER:', formData)
      
      // Aktualisiere formData mit geladenen Werten - verwende Funktions-Updater um auf aktuelle formData zuzugreifen
      const newBirthDate = concept.birthDate 
        ? new Date(concept.birthDate).toISOString().split('T')[0]
        : clientBirthDate 
          ? new Date(clientBirthDate).toISOString().split('T')[0]
          : ''
      
      // Erstelle das neue formData-Objekt
      console.log('🔍 Konvertiere targetPensionNetto:', {
        rawValue: concept.targetPensionNetto,
        rawType: typeof concept.targetPensionNetto,
        isNull: concept.targetPensionNetto === null,
        isUndefined: concept.targetPensionNetto === undefined,
        converted: concept.targetPensionNetto !== null && concept.targetPensionNetto !== undefined ? concept.targetPensionNetto.toString() : '',
      })
      
      const loadedFormData = {
        ...formData, // Behalte alle bestehenden Werte als Fallback
        birthDate: newBirthDate || '',
        desiredRetirementAge: concept.desiredRetirementAge !== null && concept.desiredRetirementAge !== undefined ? concept.desiredRetirementAge.toString() : '67',
        targetPensionNetto: concept.targetPensionNetto !== null && concept.targetPensionNetto !== undefined ? concept.targetPensionNetto.toString() : '',
        hasCurrentPensionInfo: concept.hasCurrentPensionInfo ?? true,
        pensionAtRetirement: concept.pensionAtRetirement !== null && concept.pensionAtRetirement !== undefined ? concept.pensionAtRetirement.toString() : '',
        pensionIncrease: concept.pensionIncrease !== null && concept.pensionIncrease !== undefined ? concept.pensionIncrease.toString() : '',
        inflationRate: concept.inflationRate !== null && concept.inflationRate !== undefined ? concept.inflationRate.toString() : '2.0',
        lifeExpectancy: concept.lifeExpectancy !== null && concept.lifeExpectancy !== undefined ? concept.lifeExpectancy.toString() : '90',
        monthlySavings: concept.monthlySavings !== null && concept.monthlySavings !== undefined ? concept.monthlySavings.toString() : '',
        returnRate: concept.returnRate !== null && concept.returnRate !== undefined ? concept.returnRate.toString() : '5.0',
        withdrawalRate: concept.withdrawalRate !== null && concept.withdrawalRate !== undefined ? concept.withdrawalRate.toString() : '3.0',
        hasChildren: concept.hasChildren ?? true,
        isCompulsoryInsured: concept.isCompulsoryInsured ?? true,
        kvBaseRate: concept.kvBaseRate !== null && concept.kvBaseRate !== undefined ? concept.kvBaseRate.toString() : '7.3',
        kvAdditionalRate: concept.kvAdditionalRate !== null && concept.kvAdditionalRate !== undefined ? concept.kvAdditionalRate.toString() : '2.5',
        kvContributionIncrease: concept.kvContributionIncrease !== null && concept.kvContributionIncrease !== undefined ? concept.kvContributionIncrease.toString() : '0',
        taxFilingStatus: concept.taxFilingStatus || 'single',
        taxFreeAmount: concept.taxFreeAmount !== null && concept.taxFreeAmount !== undefined ? concept.taxFreeAmount.toString() : '12096',
        taxIncreaseRate: concept.taxIncreaseRate !== null && concept.taxIncreaseRate !== undefined ? concept.taxIncreaseRate.toString() : '0',
        taxFreePercentage: concept.taxFreePercentage !== null && concept.taxFreePercentage !== undefined ? concept.taxFreePercentage.toString() : '83.5',
        statutoryStrengths: concept.statutoryStrengths || '',
        statutoryWeaknesses: concept.statutoryWeaknesses || '',
        privateStrengths: concept.privateStrengths || '',
        privateWeaknesses: concept.privateWeaknesses || '',
        recommendation: concept.notes || '',
        recommendationDelta: concept.recommendationDelta !== null && concept.recommendationDelta !== undefined ? concept.recommendationDelta.toString() : '',
        recommendationProvider: concept.recommendationProvider || '',
        recommendationAdvantages: concept.recommendationAdvantages || '',
        expectedRente: concept.expectedRente !== null && concept.expectedRente !== undefined ? concept.expectedRente.toString() : '',
        customTemplateHtml: concept.customTemplateHtml || '',
        currentGrossIncome: concept.currentGrossIncome !== null && concept.currentGrossIncome !== undefined ? concept.currentGrossIncome.toString() : formData.currentGrossIncome,
        pastWorkingYears: concept.pastWorkingYears !== null && concept.pastWorkingYears !== undefined ? concept.pastWorkingYears.toString() : formData.pastWorkingYears,
        trainingYears: concept.trainingYears !== null && concept.trainingYears !== undefined ? concept.trainingYears.toString() : formData.trainingYears,
        childrenYears: concept.childrenYears !== null && concept.childrenYears !== undefined ? concept.childrenYears.toString() : formData.childrenYears,
        partialExemption: concept.partialExemption !== null && concept.partialExemption !== undefined ? concept.partialExemption.toString() : formData.partialExemption,
        acquisitionCosts: concept.acquisitionCosts !== null && concept.acquisitionCosts !== undefined ? concept.acquisitionCosts.toString() : formData.acquisitionCosts,
        capitalGainsTaxRate: concept.capitalGainsTaxRate !== null && concept.capitalGainsTaxRate !== undefined ? concept.capitalGainsTaxRate.toString() : formData.capitalGainsTaxRate,
        capitalGainsAllowance: concept.capitalGainsAllowance !== null && concept.capitalGainsAllowance !== undefined ? concept.capitalGainsAllowance.toString() : formData.capitalGainsAllowance,
      }
      
      console.log('🔍 Geladene formData (NEU):', loadedFormData)
      console.log('🔍 Wichtige Felder (geladen):', {
        birthDate: loadedFormData.birthDate,
        desiredRetirementAge: loadedFormData.desiredRetirementAge,
        targetPensionNetto: loadedFormData.targetPensionNetto,
        lifeExpectancy: loadedFormData.lifeExpectancy,
        monthlySavings: loadedFormData.monthlySavings,
        pensionAtRetirement: loadedFormData.pensionAtRetirement,
        pensionIncrease: loadedFormData.pensionIncrease,
      })
      console.log('🔍 Vergleich VORHER vs NACHHER:', {
        vorher: {
          birthDate: formData.birthDate,
          desiredRetirementAge: formData.desiredRetirementAge,
          targetPensionNetto: formData.targetPensionNetto,
        },
        nachher: {
          birthDate: loadedFormData.birthDate,
          desiredRetirementAge: loadedFormData.desiredRetirementAge,
          targetPensionNetto: loadedFormData.targetPensionNetto,
        },
        hatSichGeaendert: {
          birthDate: formData.birthDate !== loadedFormData.birthDate,
          desiredRetirementAge: formData.desiredRetirementAge !== loadedFormData.desiredRetirementAge,
          targetPensionNetto: formData.targetPensionNetto !== loadedFormData.targetPensionNetto,
        }
      })
      
      // Setze formData mit Funktions-Updater
      console.log('📥 Form-Daten für setFormData():', {
        targetPensionNetto: loadedFormData.targetPensionNetto,
        pensionAtRetirement: loadedFormData.pensionAtRetirement,
        monthlySavings: loadedFormData.monthlySavings,
        desiredRetirementAge: loadedFormData.desiredRetirementAge,
        lifeExpectancy: loadedFormData.lifeExpectancy,
      })
      
      setFormData((prev) => {
        console.log('🔍 setFormData wird aufgerufen, prev:', {
          targetPensionNetto: prev.targetPensionNetto,
          pensionAtRetirement: prev.pensionAtRetirement,
        })
        console.log('🔍 setFormData wird aufgerufen, loadedFormData:', {
          targetPensionNetto: loadedFormData.targetPensionNetto,
          pensionAtRetirement: loadedFormData.pensionAtRetirement,
        })
        return loadedFormData
      })
      
      // Warte kurz und prüfe dann die Werte über useEffect
      setTimeout(() => {
        console.log('✅ Form-Werte nach setFormData() (über setTimeout):', {
          // Diese Werte werden über useEffect geloggt
        })
      }, 200)
      
      // Aktualisiere Provisions
      if (concept.existingProvisionData) {
        try {
          const parsedProvisions = JSON.parse(concept.existingProvisionData) as Provision[]
          console.log('Geladene Provisions:', parsedProvisions) // Debug-Log
          setProvisions(parsedProvisions.map((p) => ({
            id: typeof p.id === 'string' && p.id.length > 0
              ? p.id
              : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            type: p.type,
            amount: typeof p.amount === 'number' ? p.amount : parseFloat(String((p as any).amount ?? '0')) || 0,
            name: p.name || '',
            strengths: (p as any).strengths || '',
            weaknesses: (p as any).weaknesses || '',
            recommendation: (p as any).recommendation || '',
            attachmentIds: Array.isArray((p as any).attachmentIds) ? ((p as any).attachmentIds as string[]) : [],
          })))
        } catch (error) {
          console.warn('Fehler beim Parsen der Provisions:', error)
        }
      } else {
        // Wenn keine Provisions vorhanden sind, setze leeres Array
        setProvisions([])
      }
      
      alert('✅ Daten erfolgreich geladen!')
    } catch (err: any) {
      console.error('Fehler beim Laden:', err)
      alert(`❌ Fehler beim Laden: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }, [initialConcept.id, clientBirthDate])

  // Funktion zum manuellen Speichern (ohne Navigation)
  const handleSaveData = useCallback(async () => {
    if (handleSaveInternalRef.current) {
      await handleSaveInternalRef.current(undefined, false)
      alert('✅ Daten erfolgreich gespeichert!')
    }
  }, [])

  const nextStep = async () => {
    if (currentStep < totalSteps) {
      // Automatisches Speichern beim Weiter-Klick (nur in Datenerfassung, Schritte 1-2)
      if (currentStep <= 2) {
        try {
          await handleSave(false) // false = nicht zur Ergebnis-Seite navigieren
        } catch (error) {
          console.error('Fehler beim automatischen Speichern:', error)
          // Weiterhin zum nächsten Schritt, auch wenn Speichern fehlschlägt
        }
      }
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      // Aktualisiere URL mit neuem Step
      router.push(`/clients/${initialConcept.clientId}/retirement-concept/${conceptId}?step=${newStep}`, { scroll: false })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      // Aktualisiere URL mit neuem Step
      if (newStep === 1) {
        // Bei Schritt 1 keine Query-Parameter
        router.push(`/clients/${initialConcept.clientId}/retirement-concept/${conceptId}`, { scroll: false })
      } else {
        router.push(`/clients/${initialConcept.clientId}/retirement-concept/${conceptId}?step=${newStep}`, { scroll: false })
      }
    }
  }
  // Formatierungsfunktion für Jahre (eine Nachkommastelle oder Jahre und Monate)
  const formatYears = (years: number): string => {
    if (years <= 0) return '0 Jahre'
    const wholeYears = Math.floor(years)
    const months = Math.round((years - wholeYears) * 12)
    
    if (months === 0) {
      return `${wholeYears} Jahre`
    } else if (wholeYears === 0) {
      return `${months} Monate`
    } else {
      return `${wholeYears} Jahre ${months} Monate`
    }
  }

  // Formatierungsfunktion für Euro-Beträge
  const formatEuro = (value?: number | null) => {
    if (value === null || value === undefined) return '0,00'
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Schritt 1: Basis-Daten + Vorsorge
  const renderStep1 = () => {
    const yearsInRetirement = Math.max(
      0,
      (parseInt(formData.lifeExpectancy || '0') || 0) - (parseInt(formData.desiredRetirementAge || '0') || 0)
    )
    const yearsToRetirement = isMounted ? calculateYearsToRetirement() : null

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Basis-Daten</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Geburtsdatum *</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gewünschtes Rentenalter *</label>
            <input
              type="number"
              min="60"
              max="75"
              value={formData.desiredRetirementAge}
              onChange={(e) => setFormData({ ...formData, desiredRetirementAge: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="67"
              required
            />
            {yearsToRetirement !== null && (
              <p className="text-xs text-gray-500 mt-1">
                {formatYears(yearsToRetirement)} bis zur Rente
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Wunschrente (Netto, €/mtl.) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.targetPensionNetto}
              onChange={(e) => setFormData({ ...formData, targetPensionNetto: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="2000.00"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Lebenserwartung (Jahre) *</label>
            <input
              type="number"
              min="65"
              max="110"
              value={formData.lifeExpectancy}
              onChange={(e) => setFormData({ ...formData, lifeExpectancy: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="90"
              required
            />
            {yearsInRetirement > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {yearsInRetirement} Jahre geplante Ruhestandsdauer
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Beschäftigungsstatus *</label>
            <select
              value={formData.employmentType}
              onChange={(e) => {
                const employmentType = e.target.value as EmploymentType
                setFormData((prev) => ({
                  ...prev,
                  employmentType,
                }))
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="employee">Angestellt / gesetzlich versichert</option>
              <option value="civil-servant">Beamter / Versorgung (Beihilfe)</option>
              <option value="self-employed">Selbstständig / nicht gesetzlich versichert</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Die Berechnungslogik passt sich automatisch an deinen Status an.
            </p>
          </div>
        </div>

        {isCivilServant && (
          <div className="border rounded-xl bg-blue-50/50 px-4 py-5 space-y-4">
            <h3 className="text-lg font-semibold text-blue-900">Beamtenversorgung – Eingaben</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Diensteintritt *</label>
                <input
                  type="date"
                  value={formData.civilServiceEntryDate}
                  onChange={(e) => setFormData({ ...formData, civilServiceEntryDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bundesland</label>
                <select
                  value={formData.civilServiceState}
                  onChange={(e) => setFormData({ ...formData, civilServiceState: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="Baden-Württemberg">Baden-Württemberg</option>
                  <option value="Bayern">Bayern</option>
                  <option value="Berlin">Berlin</option>
                  <option value="Brandenburg">Brandenburg</option>
                  <option value="Bremen">Bremen</option>
                  <option value="Bund">Bund</option>
                  <option value="Hessen">Hessen</option>
                  <option value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern</option>
                  <option value="Niedersachsen">Niedersachsen</option>
                  <option value="Nordrhein-Westfalen">Nordrhein-Westfalen</option>
                  <option value="Rheinland-Pfalz">Rheinland-Pfalz</option>
                  <option value="Saarland">Saarland</option>
                  <option value="Sachsen">Sachsen</option>
                  <option value="Sachsen-Anhalt">Sachsen-Anhalt</option>
                  <option value="Schleswig-Holstein">Schleswig-Holstein</option>
                  <option value="Thüringen">Thüringen</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Datenbasis: {BESOLDUNG_DATA_STAND}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(formData.civilServiceChurchTax)}
                  onChange={(e) => setFormData({ ...formData, civilServiceChurchTax: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Kirchensteuerpflichtig</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Besoldungsordnung *</label>
                <select
                  value={formData.civilServiceBesoldungsordnung}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      civilServiceBesoldungsordnung: e.target.value as SupportedBesoldungsordnung,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {availableOrders.map((order) => (
                    <option key={order} value={order}>
                      {order}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Besoldungsgruppe *</label>
                <select
                  value={formData.civilServiceBesoldungsgruppe}
                  onChange={(e) => setFormData({ ...formData, civilServiceBesoldungsgruppe: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {availableBesoldungsgruppen.map((gruppe) => (
                    <option key={gruppe} value={gruppe}>
                      {gruppe}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Erfahrungsstufe *</label>
                <select
                  value={formData.civilServiceErfahrungsstufe}
                  onChange={(e) => setFormData({ ...formData, civilServiceErfahrungsstufe: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {availableStages.length === 0 ? (
                    <option value="">Bitte Besoldungsgruppe wählen</option>
                  ) : (
                    availableStages.map((stufe) => (
                      <option key={stufe} value={stufe.toString()}>
                        Stufe {stufe}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Zusätzliche Ansprüche (€/mtl.)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.civilServiceAdditional}
                  onChange={(e) => setFormData({ ...formData, civilServiceAdditional: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-blue-500">Mtl. Brutto aktuell</p>
                <p className="text-lg font-semibold text-blue-900">{formatCurrency(currentGrossValue)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {resolvedCurrentGroup
                    ? `${resolvedCurrentGroup} · Stufe ${resolvedCurrentStage ?? '—'}`
                    : 'Bitte Besoldungsgruppe auswählen'}
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-blue-500">Mtl. Brutto perspektivisch</p>
                <p className="text-lg font-semibold text-blue-900">{formatCurrency(perspectiveGrossValue)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {formData.civilServiceHasPromotion
                    ? resolvedFutureGroup
                      ? `${resolvedFutureGroup} · Stufe ${resolvedFutureStage ?? '—'}`
                      : 'Bitte geplante Besoldung auswählen'
                    : 'Ohne Aufstieg identisch zum aktuellen Wert'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Besoldungssteigerung bis Pension (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.civilServicePensionIncrease}
                  onChange={(e) => setFormData({ ...formData, civilServicePensionIncrease: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="1.5"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(formData.civilServiceHasPromotion)}
                  onChange={(e) => setFormData({ ...formData, civilServiceHasPromotion: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Geplanter Aufstieg bis zur Pension</span>
              </div>
            </div>

            {formData.civilServiceHasPromotion && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Besoldungsordnung (geplant)</label>
                  <select
                    value={formData.civilServiceFutureBesoldungsordnung || selectedFutureOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        civilServiceFutureBesoldungsordnung: e.target.value as SupportedBesoldungsordnung,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    {availableOrders.map((order) => (
                      <option key={order} value={order}>
                        {order}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Zukünftige Besoldungsgruppe</label>
                  <select
                    value={
                      formData.civilServiceFutureGroup ||
                      (availableFutureBesoldungsgruppen.length > 0 ? availableFutureBesoldungsgruppen[0] : '')
                    }
                    onChange={(e) => setFormData({ ...formData, civilServiceFutureGroup: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="">-- auswählen --</option>
                    {availableFutureBesoldungsgruppen.map((gruppe) => (
                      <option key={gruppe} value={gruppe}>
                        {gruppe}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Zukünftige Erfahrungsstufe</label>
                  <select
                    value={
                      formData.civilServiceFutureLevel ||
                      (availableFutureStages.length > 0 ? availableFutureStages[0].toString() : '')
                    }
                    onChange={(e) => setFormData({ ...formData, civilServiceFutureLevel: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="">-- auswählen --</option>
                    {availableFutureStages.map((stufe) => (
                      <option key={stufe} value={stufe}>
                        Stufe {stufe}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <p className="text-xs text-blue-700">
              Hinweis: Familienzuschläge sind nicht ruhegehaltfähig und werden daher nicht berücksichtigt.
            </p>
          </div>
        )}
        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Bestehende Vorsorge</h2>
          
          <div className="space-y-4">
            {provisions.map((provision) => {
              const provisionAttachments = attachmentsByProvision[provision.id] ?? []
              const remainingSlots = Math.max(0, 3 - provisionAttachments.length)
              return (
              <div key={provision.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bezeichnung</label>
                    <input
                      type="text"
                      value={provision.name || ''}
                      onChange={(e) => updateProvision(provision.id, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="z. B. Basisrente XY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Art der Vorsorge</label>
                    <select
                      value={provision.type}
                      onChange={(e) => updateProvision(provision.id, 'type', e.target.value as ProvisionType)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    >
                        {PROVISION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {provision.type === 'Sparen' ? 'Kapital (€)' : 'Brutto-Rente (€/mtl.)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                        value={Number.isFinite(provision.amount) ? provision.amount : 0}
                      onChange={(e) => updateProvision(provision.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="0.00"
                    />
                    {provision.type === 'Sparen' && provision.amount > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                          Ergibt ca.{' '}
                          {calculatePensionFromCapital(provision.amount).toLocaleString('de-DE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          €/mtl. Rente
                      </p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <button
                        type="button"
                      onClick={() => removeProvision(provision.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Entfernen
                    </button>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Stärken</label>
                      <textarea
                        value={provision.strengths || ''}
                        onChange={(e) => updateProvision(provision.id, 'strengths', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        rows={3}
                        placeholder="Was läuft gut? (z. B. hohe Fördersätze, günstige Kostenstruktur)"
                      />
              </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Schwächen / Risiken</label>
                      <textarea
                        value={provision.weaknesses || ''}
                        onChange={(e) => updateProvision(provision.id, 'weaknesses', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        rows={3}
                        placeholder="Wo bestehen Lücken oder Handlungsbedarf?"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Empfehlung / Kommentar</label>
                      <textarea
                        value={provision.recommendation || ''}
                        onChange={(e) => updateProvision(provision.id, 'recommendation', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        rows={3}
                        placeholder="Z. B. Beitrag anpassen, Vertrag beitragsfrei stellen oder Produkte vergleichen."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Diese Hinweise erscheinen später im Dashboard &amp; Export.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Dokumente / Screenshots</label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
            <button
                            type="button"
                            onClick={() => provisionFileInputRefs.current[provision.id]?.click()}
                            disabled={uploading || remainingSlots <= 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                          >
                            {uploading ? 'Lade hoch…' : 'Dateien hinzufügen'}
                          </button>
                          <span className="text-xs text-gray-500">
                            {remainingSlots > 0
                              ? `Noch ${remainingSlots} von 3 Dateien möglich`
                              : 'Limit erreicht (max. 3 Dateien)'}
                          </span>
                        </div>
                        <input
                          ref={(el) => {
                            provisionFileInputRefs.current[provision.id] = el
                          }}
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          className="hidden"
                          onChange={(event) => handleProvisionAttachmentUpload(provision.id, event.target.files)}
                          disabled={uploading}
                        />
                        {provisionAttachments.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {provisionAttachments.map((attachment) => {
                              const isImage = attachment.mimeType.startsWith('image/')
                              return (
                                <div
                                  key={attachment.id}
                                  className="border rounded-lg bg-white shadow-sm overflow-hidden flex"
                                >
                                  {isImage ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.originalName}
                                      className="w-24 h-24 object-cover"
                                    />
                                  ) : (
                                    <div className="w-24 h-24 flex items-center justify-center bg-slate-100 text-xs font-medium text-slate-600">
                                      PDF
                                    </div>
                                  )}
                                  <div className="flex-1 p-3 text-xs text-gray-600">
                                    <div className="text-sm font-medium text-gray-800 truncate">
                                      {attachment.originalName}
                                    </div>
                                    <div className="mt-1">
                                      Hochgeladen am{' '}
                                      {new Date(attachment.createdAt).toLocaleString('de-DE', {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                      })}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        Öffnen
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAttachment(attachment.id)}
                                        disabled={deletingAttachmentId === attachment.id || uploading}
                                        className="text-red-600 hover:underline disabled:text-gray-400"
                                      >
                                        {deletingAttachmentId === attachment.id ? 'Entfernen…' : 'Entfernen'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 bg-white">
                            Noch keine Dateien hochgeladen.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              type="button"
              onClick={() => addProvision()}
              disabled={provisions.length >= 5}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
            >
              + Vorsorge hinzufügen
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Schritt 2: Renteninformation
  const renderStep2 = () => {
    if (isCivilServant) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Renteninformation</h2>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-5 space-y-3">
            <h3 className="text-lg font-semibold text-blue-900">Beamtenpension – automatisch berechnet</h3>
            {civilServantCalculation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg border border-blue-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-blue-500">Brutto-Pension (mtl.)</p>
                  <p className="text-xl font-semibold text-blue-900">
                    {civilServantCalculation.bruttoPension.bruttoPensionMonatlich.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}€
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ruhegehaltssatz: {civilServantCalculation.berechnungsdaten.ruhegehaltssatz.ruhegehaltssatz.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-blue-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-blue-500">Netto-Pension (mtl.)</p>
                  <p className="text-xl font-semibold text-blue-900">
                    {formatCurrency(statutoryNetFuture)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Steuern: {formatCurrency(statutoryTaxFuture)} · KV/PV: {formatCurrency(statutoryContributionsFuture)}
                  </p>
                </div>
                <div className="md:col-span-2 text-xs text-blue-700/80 flex items-center">
                  Versicherungsart: {statutoryInsuranceType === 'private' ? 'Private Krankenversicherung' : 'Gesetzliche Krankenversicherung'}
                  {statutoryInsuranceType === 'statutory' && statutoryBeihilfeRateRetirement > 0
                    ? ` · Beihilfe im Alter: ${(statutoryBeihilfeRateRetirement * 100).toLocaleString('de-DE', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}%`
                    : ''}
                </div>
              </div>
            ) : (
              <p className="text-sm text-blue-800">Bitte trage im ersten Schritt Diensteintritt, Besoldungsgruppe und Erfahrungsstufe ein, damit die Beamtenpension berechnet werden kann.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-100/60 mt-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Gewünschte Sparrate (€/mtl.)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.monthlySavings}
                  onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                  placeholder="z. B. 200"
                />
              </div>
              <div className="text-xs text-blue-700/80 flex items-center">
                Die Sparrate fließt in die Kapitalbedarfs- und Gap-Berechnung ein – inklusive Steuer- und Sozialabzüge aus der Beamtenpension.
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Renteninformation</h2>
        
        <div>
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={formData.hasCurrentPensionInfo}
              onChange={(e) => setFormData({ ...formData, hasCurrentPensionInfo: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">Hat aktuelle Renteninformation</span>
          </label>
        </div>

        {formData.hasCurrentPensionInfo ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Wert zum Rentenbeginn (€/mtl.) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.pensionAtRetirement}
                onChange={(e) => setFormData({ ...formData, pensionAtRetirement: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="1500.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rentensteigerung (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.pensionIncrease}
                onChange={(e) => setFormData({ ...formData, pensionIncrease: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="1.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gewünschte Sparrate (€/mtl.)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={formData.monthlySavings}
              onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                    nextStep()
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="z. B. 200"
            />
              <p className="text-xs text-gray-500 mt-1">Dieser Betrag fließt in die Kapitalbedarfs- und Vorsorgeberechnung ein.</p>
          </div>
        </>
      ) : (
        <>
          {/* Schätzungsfelder wenn keine Renteninfo vorhanden */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>💡 Schätzung basierend auf Rentenpunkten:</strong> Wir berechnen eine Schätzung deiner gesetzlichen Rente 
              basierend auf deinem aktuellen Einkommen und deinen Arbeitsjahren.
            </p>
          </div>

          {/* Hinweisbox */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Hinweis:</strong> Bitte gib an, wie viele Jahre du bereits <strong>vollzeit gearbeitet und eingezahlt</strong> hast. 
              Teilzeitjahre zählen entsprechend (z.B. 2 Jahre Teilzeit = 1 Jahr Vollzeit).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Aktuelles Bruttoeinkommen (€/Jahr) *</label>
              <input
                type="number"
                step="100"
                min="0"
                value={formData.currentGrossIncome}
                onChange={(e) => setFormData({ ...formData, currentGrossIncome: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z.B. 50000"
                required={!formData.hasCurrentPensionInfo}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird verwendet, um deine aktuellen Rentenpunkte zu berechnen (Verhältnis zu Jahresentgeltgrenze 51.944€ für 2026)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vollzeit-Arbeitsjahre (bereits gearbeitet) *</label>
              <input
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={formData.pastWorkingYears}
                onChange={(e) => setFormData({ ...formData, pastWorkingYears: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z.B. 15"
                required={!formData.hasCurrentPensionInfo}
              />
              <p className="text-xs text-gray-500 mt-1">
                Anzahl Jahre, die du bereits vollzeit gearbeitet und in die Rentenversicherung eingezahlt hast
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ausbildungsjahre (optional)</label>
              <input
                type="number"
                min="0"
                max="3"
                step="0.5"
                value={formData.trainingYears}
                onChange={(e) => setFormData({ ...formData, trainingYears: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z.B. 3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Anzahl Ausbildungsjahre (max. 3 Jahre, je 0,75 Punkte = max. 2,25 Punkte gesamt)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Anzahl Kinder (optional)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                value={formData.childrenYears}
                onChange={(e) => setFormData({ ...formData, childrenYears: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z.B. 2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Anzahl Kinder (für zusätzliche Rentenpunkte: 3 Punkte pro Kind, wenn nach 1992 geboren)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rentensteigerung (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.pensionIncrease}
                onChange={(e) => setFormData({ ...formData, pensionIncrease: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="1.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Erwartete jährliche Rentensteigerung bis zum Rentenbeginn
              </p>
            </div>
          </div>

          {/* Anzeige der Schätzung */}
          {(() => {
            const estimatedPoints = estimatePensionPoints()
            const estimatedGrossPension = calculateEstimatedPensionFromPoints(estimatedPoints)
            const yearsToRetirement = calculateYearsToRetirement() || 0
            const pensionIncrease = parseFloat(formData.pensionIncrease || '1.5') / 100
            const estimatedFuturePension = estimatedGrossPension * Math.pow(1 + pensionIncrease, yearsToRetirement)
            
            if (estimatedPoints > 0 && estimatedGrossPension > 0) {
              return (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">📊 Geschätzte Rente:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Geschätzte Rentenpunkte:</span>
                      <span className="ml-2 font-semibold text-green-700">{estimatedPoints.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Aktuelle Rente (heute):</span>
                      <span className="ml-2 font-semibold text-green-700">
                        {estimatedGrossPension.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/mtl.
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rente zum Rentenbeginn:</span>
                      <span className="ml-2 font-semibold text-green-700">
                        {estimatedFuturePension.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/mtl.
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    ⚠️ Dies ist eine Schätzung basierend auf deinen Angaben. Die tatsächliche Rente kann abweichen.
                  </p>
                </div>
              )
            }
            return null
          })()}

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Gewünschte Sparrate (€/mtl.)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={formData.monthlySavings}
              onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                    nextStep()
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="z. B. 200"
            />
              <p className="text-xs text-gray-500 mt-1">Dieser Betrag fließt in die Kapitalbedarfs- und Vorsorgeberechnung ein.</p>
          </div>
        </>
        )}

        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Sozialabgaben (Schätzung)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">KV-Beitrag (Arbeitnehmeranteil, %)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={formData.kvBaseRate}
                onChange={(e) => setFormData({ ...formData, kvBaseRate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">Standard: 7,3% + Zusatzbeitrag (aktuell {formData.kvAdditionalRate}%).</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Zusatzbeitrag Krankenversicherung (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.kvAdditionalRate}
                onChange={(e) => setFormData({ ...formData, kvAdditionalRate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pflegeversicherung (mit Kindern)</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasChildren}
                  onChange={(e) => setFormData({ ...formData, hasChildren: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Kinder</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isCompulsoryInsured}
                  onChange={(e) => setFormData({ ...formData, isCompulsoryInsured: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Pflichtversichert in der KVdR</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">Hinweis: Die Werte dienen der Hochrechnung der Sozialabgaben auf gesetzliche Rentenansprüche. Pflegeversicherung: {formData.hasChildren ? '3,6' : '4,2'} %. Anpassungen wirken bis zum Rentenbeginn, Zusatzbeiträge werden mit der angegebenen jährlichen Steigerung hochgerechnet.</p>
        </div>

        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Steuerannahmen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Steuerklasse</label>
              <select
                value={formData.taxFilingStatus}
                onChange={(e) => setFormData({ ...formData, taxFilingStatus: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="single">Alleinstehend</option>
                <option value="married">Verheiratet / Zusammenveranlagung</option>
                <option value="widowed">Verwitwet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Grundfreibetrag (€/Jahr)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.taxFreeAmount}
                onChange={(e) => setFormData({ ...formData, taxFreeAmount: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="12096"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">jährliche Erhöhung Grundfreibetrag (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.taxIncreaseRate}
                onChange={(e) => setFormData({ ...formData, taxIncreaseRate: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Steuerpflichtiger Rentenanteil (%)</label>
              {(() => {
                const firstRetirementYear = calculateFirstRetirementYear()
                const computedTaxableShare = firstRetirementYear 
                  ? calculateTaxableShareForRetirementYear(firstRetirementYear)
                  : 84.0
                
                return (
                  <>
                    <div className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-700">
                      {computedTaxableShare.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {firstRetirementYear 
                        ? `Automatisch berechnet für Rentenbeginn ${firstRetirementYear}: ${computedTaxableShare.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} % (Start: 84% in 2025, steigt jährlich +0,5% bis max. 100% in 2058).`
                        : 'Berechnet automatisch basierend auf Rentenbeginn (Start: 84% in 2025, steigt jährlich +0,5% bis max. 100% in 2058).'
                      }
                    </p>
                  </>
                )
              })()}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">Hinweis: Der Grundfreibetrag wird bis zum Rentenbeginn mit der angegebenen Steigerung fortgeschrieben. Der steuerpflichtige Rentenanteil steigt gemäß gesetzlicher Vorgabe (+0,5 % p. a.) an.</p>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Berechneter Rentenwert zur Rente</h3>
            <div>
              <p className="text-sm text-gray-600 mb-1">Rente mit Steigerung zur Rente</p>
              <p className="text-2xl font-bold text-green-700">
                {futureValue !== null ? futureValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'} €
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Basierend auf {formData.pensionAtRetirement} €/mtl. mit {formData.pensionIncrease || '0'}% Steigerung über {yearsToRetirement} Jahre
              </p>
              {netFuture !== null && futureValue !== null && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-gray-600">Geschätzte Netto-Rente nach Sozialabgaben</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {netFuture.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                  <p className="text-xs text-gray-500">
                    Abzüge (KV/PV) geschätzt: -{(futureValue - netFuture).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  // Schritt 3: Gesamtübersicht mit Diagramm
  const renderStep3 = () => {
    const targetBaseValue = parseFloat(formData.targetPensionNetto || '0')
    const inflationRateValue = parseFloat(formData.inflationRate || '0') / 100
    const yearsToRetirementValue = calculateYearsToRetirement() || 0
    const targetPensionWithInflation = targetPensionFuture || targetBaseValue
    const targetInflationCurrent = yearsToRetirementValue > 0
      ? targetPensionWithInflation / Math.pow(1 + inflationRateValue, yearsToRetirementValue)
      : targetPensionWithInflation

    const provisionData = calculateProvisionTotals()
    const capitalRequirementData = calculateCapitalRequirement(provisionData)
    const savingsCoverage = calculateSavingsCoverage()
    const savingsProjection = calculateSavingsProjection()

    const targetBaseDisplay = targetBaseValue
    const targetInflationDisplay = showInCurrentPurchasingPower ? targetInflationCurrent : targetPensionWithInflation

    const statutoryGrossDisplay = showInCurrentPurchasingPower ? (currentValue || 0) : (futureValue || 0)
    const statutoryDisplay = showInCurrentPurchasingPower ? (netCurrent || 0) : (netFuture || 0)
    const contributionsDisplay = showInCurrentPurchasingPower ? contributionsCurrent : contributionsFuture
    const manualProvisionDisplay = showInCurrentPurchasingPower ? provisionData.manualCurrent : provisionData.manualFuture
    const storedSavingsDisplay = showInCurrentPurchasingPower ? provisionData.savingsCurrent : provisionData.savingsFuture
    const projectedSavingsDisplay = showInCurrentPurchasingPower ? savingsProjection.monthlyPensionCurrent : savingsProjection.monthlyPensionFuture

    const convertToDisplay = (futureAmount: number) => {
      if (showInCurrentPurchasingPower && yearsToRetirementValue > 0) {
        return futureAmount / Math.pow(1 + inflationRateValue, yearsToRetirementValue)
      }
      return futureAmount
    }

    const formatPercent = (value?: number) =>
      (value ?? 0).toLocaleString('de-DE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

    const provisionTaxBreakdown = calculateProvisionTaxBreakdown(statutoryTaxData)

    const desiredRetirementAgeValue = parseInt(formData.desiredRetirementAge || '67') || 67

    const existingProvisionDetails = provisions
      .map((provision) => {
        const name = provision.name && provision.name.trim().length > 0 ? provision.name.trim() : provision.type
        const futureAmount = provision.type === 'Sparen'
          ? calculatePensionFromCapital(provision.amount)
          : provision.amount
        const displayAmount = convertToDisplay(futureAmount)
        const taxableShare =
          provisionTaxBreakdown.taxableShareByProvision[provision.id] ??
          getProvisionTaxableShareForProvision(provision, desiredRetirementAgeValue)
      return {
          id: provision.id,
          label: `${name}${provision.type !== 'Sparen' ? '' : ' (Kapitalanlage)'}`,
          amount: Math.round(displayAmount * 100) / 100,
          type: provision.type,
          taxableShare,
        }
      })
      .filter((item) => item.amount > 0)

    const manualCapitalTaxFuture = provisionTaxBreakdown.totalPrivateTaxMonthly
    const manualCapitalTaxDisplay = convertToDisplay(manualCapitalTaxFuture)
    const plannedCapitalTaxDisplay = convertToDisplay(savingsProjection.capitalTaxMonthly)
    const manualCapitalTaxDisplayRounded = Math.round(manualCapitalTaxDisplay * 100) / 100
    const plannedCapitalTaxDisplayRounded = Math.round(plannedCapitalTaxDisplay * 100) / 100
    const capitalTaxMonthlyDisplay = showInCurrentPurchasingPower ? plannedCapitalTaxDisplayRounded : savingsProjection.capitalTaxMonthly
    const privateIncomeTaxDisplay = convertToDisplay(provisionTaxBreakdown.totalIncomeTaxMonthly)
    const privateCapitalTaxDisplay = convertToDisplay(provisionTaxBreakdown.totalCapitalTaxMonthly)
    const combinedTaxMonthlyDisplay = convertToDisplay(provisionTaxBreakdown.combinedAnnualTax / 12)

    const kvRatePercent =
      typeof kvRateProjected === 'number' && Number.isFinite(kvRateProjected)
        ? (kvRateProjected * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : '0,0'
    const careRatePercent =
      typeof careRate === 'number' && Number.isFinite(careRate)
        ? (careRate * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : '0,0'
    const taxDisplay = showInCurrentPurchasingPower ? taxCurrent : taxFuture
    const bavDetails = existingProvisionDetails.filter((item) => item.type === 'Betriebliche Altersvorsorge')
    const totalBavMonthly = bavDetails.reduce((sum, item) => sum + item.amount, 0)
    const bavThreshold = 187.25
    const bavExeeding = Math.max(0, totalBavMonthly - bavThreshold)
    const bavKvRate = 0.171 // 14.6% + 2.5%
    const bavPvRate = formData.hasChildren ? 0.036 : 0.042
    const privateSvDeduction = Math.round(bavExeeding * (bavKvRate + bavPvRate) * 100) / 100

    const manualNetExisting = manualProvisionDisplay + storedSavingsDisplay - privateSvDeduction - manualCapitalTaxDisplay
    const comparisonTarget = showInCurrentPurchasingPower ? targetBaseDisplay : targetPensionWithInflation
    const totalProvisionDisplay = manualNetExisting + projectedSavingsDisplay
    const gapDisplay = Math.max(0, comparisonTarget - (statutoryDisplay + totalProvisionDisplay))
    const gapBeforeSavingsDisplay = Math.max(0, comparisonTarget - (statutoryDisplay + manualNetExisting))
    const gapAfterSavingsDisplay = Math.max(0, comparisonTarget - (statutoryDisplay + totalProvisionDisplay))

    const privateNetExistingDisplay = manualNetExisting
    const privateSvRatePercent = totalBavMonthly > 0 ? ((bavKvRate + bavPvRate) * 100).toFixed(1) : '0.0'

    const {
      capitalRequirement,
      baseCapitalRequirement = capitalRequirement,
      yearsInRetirement,
    } = capitalRequirementData
    const yearsInRetirementSafe = Math.max(0, yearsInRetirement)
    const additionalNetIncomeFuture = savingsProjection.monthlyPensionFuture
    const additionalNetIncomeDisplay = showInCurrentPurchasingPower
      ? savingsProjection.monthlyPensionCurrent
      : additionalNetIncomeFuture
    const remainingGapDisplay = Math.max(0, gapBeforeSavingsDisplay - additionalNetIncomeDisplay)

    const convertCapitalForDisplay = (value: number) => {
      if (!value) return 0
      if (showInCurrentPurchasingPower && yearsToRetirementValue > 0) {
        return value / Math.pow(1 + inflationRateValue, yearsToRetirementValue)
      }
      return value
    }

    const baseCapitalRequirementDisplayValue = convertCapitalForDisplay(baseCapitalRequirement)
    const remainingCapitalRequirementDisplayValue = convertCapitalForDisplay(capitalRequirement)
    const remainingCapitalRequirementDisplay = remainingCapitalRequirementDisplayValue
    const capitalRequirementCoveredDisplayValue = Math.max(
      0,
      baseCapitalRequirementDisplayValue - remainingCapitalRequirementDisplayValue,
    )
    const capitalEquivalentDisplayValue = convertCapitalForDisplay(savingsCoverage.capitalEquivalent || 0)
    const capitalEquivalentDisplayFormatted = formatEuro(capitalEquivalentDisplayValue)
    const yearsInRetirementText = yearsInRetirement > 0 ? `${yearsInRetirement} Jahre` : 'den geplanten Zeitraum'

    const minSegmentHeight = 14
    const stackTotal =
      statutoryDisplay + manualNetExisting + projectedSavingsDisplay + gapDisplay || 1
    let formattedGapHeight = gapDisplay > 0 ? Math.max(minSegmentHeight, (gapDisplay / stackTotal) * 100) : 0
    let privateExistingHeight = manualNetExisting > 0 ? Math.max(minSegmentHeight, (manualNetExisting / stackTotal) * 100) : 0
    let projectedSavingsHeight =
      projectedSavingsDisplay > 0 ? Math.max(minSegmentHeight, (projectedSavingsDisplay / stackTotal) * 100) : 0
    let formattedStatutoryHeight = statutoryDisplay > 0 ? Math.max(minSegmentHeight, (statutoryDisplay / stackTotal) * 100) : 0

    const totalHeight = formattedGapHeight + privateExistingHeight + projectedSavingsHeight + formattedStatutoryHeight
    if (totalHeight > 100) {
      const scale = 100 / totalHeight
      formattedGapHeight *= scale
      privateExistingHeight *= scale
      projectedSavingsHeight *= scale
      formattedStatutoryHeight *= scale
    }

    const baseCalculationVariableRows = [
      { key: 'gapBefore', description: 'Aktuelle Rentenlücke vor geplanter Vorsorge', value: formatEuro(gapBeforeSavingsDisplay) + ' €' },
      { key: 'monthlyPensionFutureGross', description: 'Geplante Zusatzeinnahmen aus Sparrate (brutto, ohne Steuer)', value: formatEuro(savingsProjection.monthlyPensionFutureGross) + ' €' },
      { key: 'monthlyPensionFutureNet', description: 'Geplante Zusatzeinnahmen aus Sparrate (netto, nach Steuer)', value: formatEuro(savingsProjection.monthlyPensionFuture) + ' €' },
      { key: 'capitalTaxMonthly', description: 'Steuerabzug auf Sparrate (monatl.)', value: formatEuro(savingsProjection.capitalTaxMonthly) + ' €' },
      { key: 'gapAfter', description: 'Verbleibende Rentenlücke nach Sparrate', value: formatEuro(Math.max(0, gapAfterSavingsDisplay)) + ' €' },
      { key: 'coversPercent', description: 'Abgedeckter Anteil der Lücke durch Sparrate', value: savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %' },
      { key: 'futureCapital', description: 'Erwartetes Kapital aus Sparrate zum Rentenbeginn', value: formatEuro(savingsProjection.futureCapital) + ' €' },
      { key: 'capitalRequirementTotal', description: 'Kapitalbedarf gesamt (heutige Kaufkraft)', value: formatEuro(baseCapitalRequirementDisplayValue) + ' €' },
      { key: 'capitalRequirementOpen', description: 'Offener Kapitalbedarf nach Sparrate', value: formatEuro(remainingCapitalRequirementDisplayValue) + ' €' },
      { key: 'yearsInRetirement', description: 'Annahmen: Jahre im Ruhestand', value: String(yearsInRetirementSafe) },
    ]

    const parseDelayYearsInput = (value: string) => {
      const parsed = parseFloat(value || '0')
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
    }

    const delayStartYValue = parseDelayYearsInput(formData.delayStartYearsY)
    const delayStartZValue = parseDelayYearsInput(formData.delayStartYearsZ)
    const baseMonthlySavingsValue = parseFloat(formData.monthlySavings || '0') || 0

    const delayScenarioEntries = [
      {
        id: 'scenarioY' as const,
        title: 'Start in Y Jahren',
        delayYears: delayStartYValue,
        formKey: 'delayStartYearsY' as const,
      },
      {
        id: 'scenarioZ' as const,
        title: 'Start in Z Jahren',
        delayYears: delayStartZValue,
        formKey: 'delayStartYearsZ' as const,
      },
    ]

    const delayScenarioData = delayScenarioEntries.map((entry) => {
      const scenario = computeDelayScenario(entry.delayYears, {
        gapTarget: savingsCoverage.gapBefore,
        baselineProjection: savingsProjection,
        monthlySavings: baseMonthlySavingsValue,
      })

      const delayLabel = scenario.delayYears.toLocaleString('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })

      const savingYearsLabel = scenario.savingYears.toLocaleString('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })

      const capitalDisplay = formatEuro(convertCapitalForDisplay(scenario.capitalWithCurrentSavings))
      const interestLossDisplay = formatEuro(convertCapitalForDisplay(scenario.interestLoss))
      const requiredMonthlyDisplay = scenario.requiredFeasible ? `${formatEuro(scenario.requiredMonthly)} €` : 'Nicht erreichbar'
      const requiredNetFutureDisplay = scenario.requiredFeasible ? `${formatEuro(scenario.requiredNetFuture)} €` : 'Nicht erreichbar'

      return {
        ...entry,
        ...scenario,
        delayLabel,
        savingYearsLabel,
        capitalDisplay,
        interestLossDisplay,
        requiredMonthlyDisplay,
        requiredNetFutureDisplay,
      }
    })

    const formatYears = (years: number) => {
      const rounded = Math.max(0, Math.round(years * 10) / 10)
      const hasFraction = Math.abs(rounded - Math.round(rounded)) > 0.00001
      const value = rounded.toLocaleString('de-DE', {
        minimumFractionDigits: hasFraction ? 1 : 0,
        maximumFractionDigits: hasFraction ? 1 : 0,
      })
      return `${value} ${rounded === 1 ? 'Jahr' : 'Jahre'}`
    }

    const baselineCapitalDisplay = formatEuro(convertCapitalForDisplay(savingsProjection.futureCapital))
    const capitalComparisonRows = [
      {
        key: 'baseline',
        label: 'Start heute',
        valueDisplay: `${baselineCapitalDisplay} €`,
        helper: `mit ${formatEuro(baseMonthlySavingsValue)} € Sparrate`,
        interestLossDisplay: `${formatEuro(0)} €`,
        hasInterestLoss: false,
      },
      ...delayScenarioData.map((scenario) => ({
        key: scenario.id,
        label: `Start in ${scenario.delayLabel} Jahren`,
        valueDisplay: `${scenario.capitalDisplay} €`,
        helper: scenario.requiredFeasible
          ? `Erforderliche Sparrate: ${scenario.requiredMonthlyDisplay}`
          : 'Keine verbleibende Laufzeit',
        interestLossDisplay: scenario.interestLossDisplay,
        hasInterestLoss: scenario.interestLoss > 0,
      })),
    ]

    const scenarioCalculationRows = delayScenarioData.flatMap((scenario, index) => {
      const labelSuffix = index === 0 ? ' (Y)' : ' (Z)'
      return [
        {
          key: `delayScenario${scenario.id}Required`,
          description: `Benötigte Sparrate bei Start in ${scenario.delayLabel} Jahren`,
          value: scenario.requiredMonthlyDisplay,
        },
        {
          key: `delayScenario${scenario.id}Capital`,
          description: `Kapital aus aktueller Sparrate bei Start in ${scenario.delayLabel} Jahren`,
          value: `${scenario.capitalDisplay} €`,
        },
        {
          key: `delayScenario${scenario.id}InterestLoss`,
          description: `Zinsverlust bei Start in ${scenario.delayLabel} Jahren`,
          value: `${scenario.interestLossDisplay} €`,
        },
        {
          key: `delayScenario${scenario.id}NetFuture`,
          description: `Netto-Zusatzrente nach Aufholung${labelSuffix}`,
          value: scenario.requiredNetFutureDisplay,
        },
      ]
    })

    const calculationVariableRows = [...baseCalculationVariableRows, ...scenarioCalculationRows]

    const renderDelayScenarioSection = (variant: 'detail' | 'dashboard') => {
      const isDashboard = variant === 'dashboard'
      const isLightTheme = isDashboard && dashboardTheme === 'light'
      const containerClass = isDashboard
        ? isLightTheme
          ? 'relative rounded-3xl bg-white/35 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-6 py-6 space-y-6'
          : 'rounded-3xl bg-gradient-to-br from-[#0B1326] via-[#142047] to-[#1F2F63] border border-white/15 backdrop-blur px-6 py-6 space-y-6 text-white shadow-[0_24px_60px_rgba(8,15,40,0.45)]'
        : 'border rounded-xl p-6 bg-white shadow-sm space-y-6'
      const titleClass = isDashboard 
        ? isLightTheme ? 'text-lg font-semibold text-slate-900' : 'text-lg font-semibold text-white'
        : 'text-lg font-semibold text-slate-900'
      const helperClass = isDashboard 
        ? isLightTheme ? 'text-xs text-slate-600 max-w-2xl' : 'text-xs text-white/60 max-w-2xl'
        : 'text-xs text-gray-500 max-w-2xl'
      const inputLabelClass = isDashboard
        ? isLightTheme 
          ? 'flex flex-col text-xs uppercase tracking-wide text-slate-600 gap-1'
          : 'flex flex-col text-xs uppercase tracking-wide text-white/70 gap-1'
        : 'flex flex-col text-xs uppercase tracking-wide text-gray-500 gap-1'
      const inputClass = isDashboard
        ? isLightTheme
          ? 'w-24 rounded-lg border border-slate-300 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200'
          : 'w-24 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40'
        : 'w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200'
      const infoTextClass = isDashboard 
        ? isLightTheme ? 'text-xs text-slate-500 mt-1' : 'text-xs text-white/60 mt-1'
        : 'text-xs text-gray-500 mt-1'
      const baselineCardClass = isDashboard
        ? isLightTheme
          ? 'relative rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl p-4 space-y-2 shadow-sm'
          : 'rounded-2xl border border-white/20 bg-white/10 p-4 space-y-2'
        : 'rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2'
      const scenarioCardClass = isDashboard
        ? isLightTheme
          ? 'relative rounded-2xl border border-white/40 bg-white/35 backdrop-blur-xl p-4 space-y-3 shadow-sm'
          : 'rounded-2xl border border-white/20 bg-[#0F1B36]/80 p-4 space-y-3'
        : 'rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm'
      const cardTitleClass = isDashboard 
        ? isLightTheme ? 'text-sm font-semibold text-slate-900' : 'text-sm font-semibold text-white'
        : 'text-sm font-semibold text-slate-900'
      const cardSubtitleClass = isDashboard 
        ? isLightTheme ? 'text-[11px] uppercase tracking-wide text-slate-500' : 'text-[11px] uppercase tracking-wide text-white/50'
        : 'text-[11px] uppercase tracking-wide text-gray-500'
      const metricLabelClass = isDashboard 
        ? isLightTheme ? 'text-[11px] uppercase tracking-wide text-slate-600' : 'text-[11px] uppercase tracking-wide text-white/60'
        : 'text-[11px] uppercase tracking-wide text-gray-500'
      const metricValueClass = isDashboard 
        ? isLightTheme ? 'text-lg font-semibold text-slate-900' : 'text-lg font-semibold text-white'
        : 'text-lg font-semibold text-slate-900'
      const summaryContainerClass = isDashboard
        ? isLightTheme
          ? 'relative rounded-2xl border border-white/40 bg-white/35 backdrop-blur-xl p-5 space-y-3 shadow-sm'
          : 'rounded-2xl border border-white/15 bg-white/10 p-5 space-y-3'
        : 'rounded-xl border border-gray-200 bg-slate-50 p-5 space-y-3'
      const summaryTitleClass = isDashboard 
        ? isLightTheme ? 'text-xs uppercase tracking-wide text-slate-600' : 'text-xs uppercase tracking-wide text-white/60'
        : 'text-xs uppercase tracking-wide text-gray-500'
      const summaryRowLabelClass = isDashboard 
        ? isLightTheme ? 'text-xs text-slate-600 uppercase tracking-wide' : 'text-xs text-white/60 uppercase tracking-wide'
        : 'text-xs text-gray-500 uppercase tracking-wide'
      const summaryRowValueClass = isDashboard 
        ? isLightTheme ? 'text-lg font-semibold text-slate-900' : 'text-lg font-semibold text-white'
        : 'text-lg font-semibold text-slate-900'
      const summaryHelperClass = isDashboard 
        ? isLightTheme ? 'text-xs text-slate-500' : 'text-xs text-white/60'
        : 'text-xs text-gray-500'
      const summaryLossClass = isDashboard 
        ? isLightTheme ? 'text-xs text-red-600' : 'text-xs text-rose-200'
        : 'text-xs text-red-600'

      const baselineInfo = [
        { label: 'Restlaufzeit', value: `${formatYears(Math.max(0, yearsToRetirementValue))}` },
        { label: 'Kapital bei Start heute', value: `${baselineCapitalDisplay} €` },
        { label: 'Aktuelle Sparrate', value: `${formatEuro(baseMonthlySavingsValue)} €` },
      ]

    const content = (
      <>
        <div className="space-y-2 mb-4">
            <h3 className={titleClass}>Wie verändern sich Beitrag & Kapital bei späterem Start?</h3>
            <p className={helperClass}>
              Trage zwei alternative Startpunkte ein und vergleiche den benötigten Monatsbeitrag, das erreichbare Kapital
              und den entstehenden Zinsverlust gegenüber dem sofortigen Beginn.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {delayScenarioEntries.map((entry) => (
              <label key={entry.id} className={inputLabelClass}>
                <span>{entry.title}</span>
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, yearsToRetirementValue)}
                  step={0.5}
                  value={formData[entry.formKey]}
                  onChange={(event) => setFormData((prev) => ({ ...prev, [entry.formKey]: event.target.value }))}
                  className={inputClass}
                />
                <span className={infoTextClass}>
                  Restlaufzeit: {formatYears(Math.max(0, delayScenarioData.find((scenario) => scenario.id === entry.id)?.savingYears ?? 0))}
                </span>
              </label>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={baselineCardClass}>
              <p className={cardSubtitleClass}>Start heute</p>
              <p className={cardTitleClass}>{formatEuro(baseMonthlySavingsValue)} € Sparrate</p>
              <div className="space-y-2 text-sm">
                {baselineInfo.map((item) => (
                  <div key={item.label}>
                    <p className={metricLabelClass}>{item.label}</p>
                    <p className={metricValueClass}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {delayScenarioData.map((scenario) => (
              <div key={scenario.id} className={scenarioCardClass}>
                <div className="space-y-1">
                  <p className={cardSubtitleClass}>Szenario</p>
                  <p className={cardTitleClass}>Start in {scenario.delayLabel} Jahren</p>
                  <p className={helperClass}>
                    Verfügbare Laufzeit: {scenario.savingYearsLabel} Jahre
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className={metricLabelClass}>Benötigte Sparrate</p>
                    <p className={scenario.requiredFeasible ? metricValueClass : `${metricValueClass} ${isDashboard ? 'text-rose-200' : 'text-red-600'}`}>
                      {scenario.requiredMonthlyDisplay}
                    </p>
                  </div>
                  <div>
                    <p className={metricLabelClass}>Netto-Zusatzrente</p>
                    <p className={metricValueClass}>{scenario.requiredNetFutureDisplay}</p>
                  </div>
                  <div>
                    <p className={metricLabelClass}>Kapital (aktuelle Sparrate)</p>
                    <p className={metricValueClass}>{scenario.capitalDisplay} €</p>
                  </div>
                  <div>
                    <p className={metricLabelClass}>Zinsverlust</p>
                    <p className={scenario.interestLoss > 0 ? `${metricValueClass} ${isDashboard ? 'text-rose-200' : 'text-red-600'}` : metricValueClass}>
                      {scenario.interestLossDisplay} €
                    </p>
                  </div>
                </div>
                {!scenario.requiredFeasible && (
                  <p className={isDashboard ? 'text-xs text-rose-200' : 'text-xs text-red-600'}>
                    Mit nur {scenario.savingYearsLabel} Jahren Laufzeit reicht selbst eine hohe Sparrate nicht mehr aus.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className={summaryContainerClass}>
            <p className={summaryTitleClass}>Kapitalvergleich bei Rentenbeginn (aktuelle Sparrate)</p>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              {capitalComparisonRows.map((row) => (
                <div key={row.key} className="space-y-1">
                  <p className={summaryRowLabelClass}>{row.label}</p>
                  <p className={summaryRowValueClass}>{row.valueDisplay}</p>
                  {row.hasInterestLoss ? (
                    <p className={summaryLossClass}>Zinsverlust: {row.interestLossDisplay}</p>
                  ) : (
                    <p className={summaryHelperClass}>{row.helper}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
      </>
    )

    if (variant === 'detail') {
      return (
        <CollapsibleSection title="Sparstart simulieren" defaultOpen={false}>
          <div className="space-y-6">
            {content}
          </div>
        </CollapsibleSection>
      )
    }

    // Dashboard Variante mit CollapsibleSection
    return (
      <CollapsibleSection title="Wie verändern sich Beitrag & Kapital bei späterem Start?" defaultOpen={false}>
      <div className={containerClass}>
        {content}
      </div>
      </CollapsibleSection>
    )
  }
    const renderControlPanel = (variant: 'default' | 'dashboard' | 'detail-desktop' = 'default') => {
      const isDashboard = variant === 'dashboard'
      const isDetailDesktop = variant === 'detail-desktop'
      const wrapperClasses = isDashboard
        ? dashboardTheme === 'light'
          ? 'rounded-[24px] bg-white/35 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-4 md:p-6'
          : 'rounded-[24px] bg-gradient-to-r from-[#161B2D] via-[#1C2551] to-[#1D3D8F] text-white p-4 md:p-6 shadow-lg'
        : isDetailDesktop
        ? 'bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-2xl p-8 mb-8 border border-slate-700/50 shadow-xl'
        : 'border rounded-lg p-4 bg-gray-50'
      const labelClass = isDashboard
        ? dashboardTheme === 'light'
          ? 'text-sm font-medium text-slate-700'
          : 'block text-xs font-medium text-white/80 uppercase tracking-wide'
        : isDetailDesktop
        ? 'text-sm font-medium text-slate-50'
        : 'block text-xs font-medium text-gray-600 uppercase tracking-wide'
      const helperClass = isDashboard
        ? dashboardTheme === 'light'
          ? 'flex justify-between text-xs text-slate-500 mt-1'
          : 'grid grid-cols-3 items-center text-xs text-white/50 whitespace-nowrap'
        : isDetailDesktop
        ? 'flex justify-between text-xs text-slate-300 mt-1'
        : 'grid grid-cols-3 items-center text-xs text-gray-500 whitespace-nowrap'
      const numberInputClass = (width = 'w-16') =>
        `${width} border rounded px-2 py-1 text-sm ${
          isDashboard
            ? dashboardTheme === 'light'
              ? 'px-2 py-1 text-right bg-white/80 backdrop-blur-sm rounded border border-slate-300 text-sm text-slate-900 focus:border-blue-500 focus:ring-blue-200'
              : 'border-white/25 bg-white/10 text-white placeholder-white/40 focus:border-white focus:ring-white/30'
            : isDetailDesktop
            ? 'px-2 py-1 text-right bg-slate-800/60 rounded border border-slate-600/50 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/50 focus:bg-slate-800/80'
            : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200'
        }`
      const checkboxLabelClass = isDashboard
        ? dashboardTheme === 'light'
          ? 'text-sm font-medium text-slate-700 whitespace-nowrap'
          : 'text-sm font-medium text-white whitespace-nowrap'
        : isDetailDesktop
        ? 'text-sm font-medium text-slate-50'
        : 'text-sm font-medium text-gray-700 whitespace-nowrap'

      const checkboxClass = isDashboard
        ? 'w-4 h-4 rounded border-white/25 bg-white/10 text-white focus:ring-white/40 accent-white'
        : 'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'

      // Desktop-Detail Variante
      if (isDetailDesktop) {
      return (
        <div className={wrapperClasses}>
            <h3 className="text-lg font-semibold mb-6 uppercase tracking-wide text-white">
              Simulation anpassen
            </h3>

            {/* Toggles */}
            <div className="flex gap-6 mb-8">
              <label htmlFor="advisory-mode-detail" className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
                  id="advisory-mode-detail"
              checked={advisoryMode}
              onChange={(e) => setAdvisoryMode(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
                  advisoryMode ? 'bg-blue-500' : 'bg-slate-600/70'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    advisoryMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                <span className={checkboxLabelClass}>Beratungsmodus</span>
            </label>

              <label htmlFor="purchasing-power-detail" className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="purchasing-power-detail"
                  checked={showInCurrentPurchasingPower}
                  onChange={(e) => setShowInCurrentPurchasingPower(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
                  showInCurrentPurchasingPower ? 'bg-blue-500' : 'bg-slate-600/70'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    showInCurrentPurchasingPower ? 'translate-x-6' : 'translate-x-1'
                  }`} />
          </div>
                <span className={checkboxLabelClass}>In heutiger Kaufkraft</span>
              </label>
            </div>

            {/* Sliders - 2x2 GRID für Desktop */}
            <div className="hidden xl:grid grid-cols-2 gap-x-8 gap-y-6">
              {/* Slider 1 - Inflationsrate */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Inflationsrate</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.inflationRate}
                      onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                      className={numberInputClass('w-16')}
                    />
                    <span className="text-sm text-slate-200">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.inflationRate}
                  onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                  className="w-full accent-blue-600"
                />
                <div className={helperClass}>
                  <span>0%</span>
                  <span className="font-semibold">{parseFloat(formData.inflationRate || '0').toFixed(1)}%</span>
                  <span>5%</span>
                </div>
              </div>

              {/* Slider 2 - Rendite Ansparphase */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Rendite Ansparphase</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.1"
                      value={formData.returnRate}
                      onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                      className={numberInputClass('w-16')}
                    />
                    <span className="text-sm text-slate-200">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formData.returnRate}
                  onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                  className="w-full accent-blue-600"
                />
                <div className={helperClass}>
                  <span>0%</span>
                  <span className="font-semibold">{parseFloat(formData.returnRate || '0').toFixed(1)}%</span>
                  <span>12%</span>
                </div>
              </div>

              {/* Slider 3 - Rendite Entnahmephase */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Rendite Entnahmephase</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="8"
                      step="0.1"
                      value={formData.withdrawalRate}
                      onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                      className={numberInputClass('w-16')}
                    />
                    <span className="text-sm text-slate-200">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={formData.withdrawalRate}
                  onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                  className="w-full accent-blue-600"
                />
                <div className={helperClass}>
                  <span>0%</span>
                  <span className="font-semibold">{parseFloat(formData.withdrawalRate || '0').toFixed(1)}%</span>
                  <span>8%</span>
                </div>
              </div>

              {/* Slider 4 - Monatliche Sparrate */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Monatliche Sparrate</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={formData.monthlySavings}
                      onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                      className={numberInputClass('w-20')}
                    />
                    <span className="text-sm text-slate-300">€</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="50"
                  value={Number(formData.monthlySavings || '0')}
                  onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                  className="w-full accent-blue-600"
                />
                <div className={helperClass}>
                  <span>0 €</span>
                  <span className="font-semibold">{formatEuro(Number(formData.monthlySavings || '0'))} €</span>
                  <span>3.000 €</span>
                </div>
              </div>
            </div>

            {/* Mobile/Tablet - Original Layout */}
            <div className="xl:hidden w-full grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="w-full space-y-2">
            <label className={labelClass}>Inflationsrate (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={formData.inflationRate}
                onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                className="flex-1 accent-blue-600"
              />
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.inflationRate}
                onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                    className={numberInputClass('w-20')}
              />
            </div>
            <div className={helperClass}>
              <span>0%</span>
              <span className="font-semibold">{parseFloat(formData.inflationRate || '0').toFixed(1)}%</span>
              <span>5%</span>
            </div>
          </div>

              <div className="w-full space-y-2">
            <label className={labelClass}>Rendite Ansparphase (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="12"
                step="0.1"
                value={formData.returnRate}
                onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                className="flex-1 accent-blue-600"
              />
              <input
                type="number"
                min="0"
                max="12"
                step="0.1"
                value={formData.returnRate}
                onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                    className={numberInputClass('w-20')}
              />
            </div>
            <div className={helperClass}>
              <span>0%</span>
              <span className="font-semibold">{parseFloat(formData.returnRate || '0').toFixed(1)}%</span>
              <span>12%</span>
            </div>
          </div>

              <div className="w-full space-y-2">
            <label className={labelClass}>Rendite Entnahmephase (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="8"
                step="0.1"
                value={formData.withdrawalRate}
                onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                className="flex-1 accent-blue-600"
              />
              <input
                type="number"
                min="0"
                max="8"
                step="0.1"
                value={formData.withdrawalRate}
                onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                    className={numberInputClass('w-20')}
              />
            </div>
            <div className={helperClass}>
              <span>0%</span>
              <span className="font-semibold">{parseFloat(formData.withdrawalRate || '0').toFixed(1)}%</span>
              <span>8%</span>
            </div>
          </div>

              <div className="w-full space-y-2">
            <label className={labelClass}>Monatliche Sparrate (€)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="3000"
                step="10"
                value={Number(formData.monthlySavings || '0')}
                onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                className="flex-1 accent-blue-600"
              />
              <input
                type="number"
                min="0"
                step="10"
                value={formData.monthlySavings}
                onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                    className={numberInputClass('w-20')}
              />
            </div>
            <div className={helperClass}>
              <span>0 €</span>
            <span className="font-semibold">{formatEuro(Number(formData.monthlySavings || '0'))} €</span>
              <span>3.000 €</span>
            </div>
          </div>
            </div>
          </div>
        )
      }

      // Dashboard Desktop Variante mit 2x2 Grid
      if (isDashboard) {
        const isLightTheme = dashboardTheme === 'light'
        return (
          <div className={wrapperClasses}>
            {/* Toggle Switches oben einheitlich */}
            <div className={`w-full flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 mb-4 md:mb-6 pb-4 md:pb-6 border-b ${isLightTheme ? 'border-slate-200/50' : 'border-white/10'}`}>
              {/* Beratungsmodus Toggle */}
              <label htmlFor="advisory-mode-dashboard" className="flex items-center cursor-pointer">
            <input
              type="checkbox"
                  id="advisory-mode-dashboard"
                  checked={advisoryMode}
                  onChange={(e) => setAdvisoryMode(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
                  advisoryMode 
                    ? isLightTheme ? 'bg-blue-600' : 'bg-purple-600'
                    : isLightTheme ? 'bg-slate-300' : 'bg-white/20'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    advisoryMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                <span className={`${checkboxLabelClass} ml-4`}>
                  Beratungsmodus
                </span>
              </label>

              {/* In heutiger Kaufkraft Toggle */}
              <label htmlFor="purchasing-power-dashboard" className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="purchasing-power-dashboard"
              checked={showInCurrentPurchasingPower}
              onChange={(e) => setShowInCurrentPurchasingPower(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
                  showInCurrentPurchasingPower 
                    ? isLightTheme ? 'bg-blue-600' : 'bg-purple-600'
                    : isLightTheme ? 'bg-slate-300' : 'bg-white/20'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    showInCurrentPurchasingPower ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                <span className={`${checkboxLabelClass} ml-4`}>In heutiger Kaufkraft</span>
              </label>
            </div>

            {/* Sliders - 2x2 GRID für Desktop Dashboard */}
            <div className="hidden xl:grid grid-cols-2 gap-x-8 gap-y-6">
              {/* Slider 1 - Inflationsrate */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Inflationsrate</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.inflationRate}
                      onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                      className={numberInputClass('w-16')}
                    />
                    <span className={`text-sm ${isLightTheme ? 'text-slate-600' : 'text-white/60'}`}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.inflationRate}
                  onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                  className="w-full accent-blue-400"
                />
                <div className={helperClass}>
                  <span>0%</span>
                  <span className="font-semibold">{parseFloat(formData.inflationRate || '0').toFixed(1)}%</span>
                  <span>5%</span>
                </div>
              </div>

              {/* Slider 2 - Rendite Ansparphase */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Rendite Ansparphase</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.1"
                      value={formData.returnRate}
                      onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                      className={numberInputClass('w-16')}
                    />
                    <span className={`text-sm ${isLightTheme ? 'text-slate-600' : 'text-white/60'}`}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formData.returnRate}
                  onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                  className="w-full accent-blue-400"
                />
                <div className={helperClass}>
                  <span>0%</span>
                  <span className="font-semibold">{parseFloat(formData.returnRate || '0').toFixed(1)}%</span>
                  <span>12%</span>
                </div>
              </div>

              {/* Slider 3 - Rendite Entnahmephase */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Rendite Entnahmephase</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="8"
                      step="0.1"
                      value={formData.withdrawalRate}
                      onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                      className={numberInputClass('w-16')}
                    />
                    <span className={`text-sm ${isLightTheme ? 'text-slate-600' : 'text-white/60'}`}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={formData.withdrawalRate}
                  onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                  className="w-full accent-blue-400"
                />
                <div className={helperClass}>
                  <span>0%</span>
                  <span className="font-semibold">{parseFloat(formData.withdrawalRate || '0').toFixed(1)}%</span>
                  <span>8%</span>
                </div>
              </div>

              {/* Slider 4 - Monatliche Sparrate */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Monatliche Sparrate</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={formData.monthlySavings}
                      onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                      className={numberInputClass('w-20')}
                    />
                    <span className={`text-sm ${isLightTheme ? 'text-slate-600' : 'text-white/60'}`}>€</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="50"
                  value={Number(formData.monthlySavings || '0')}
                  onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                  className="w-full accent-blue-400"
                />
                <div className={helperClass}>
                  <span>0 €</span>
                  <span className="font-semibold">{formatEuro(Number(formData.monthlySavings || '0'))} €</span>
                  <span>3.000 €</span>
                </div>
              </div>
            </div>

            {/* Mobile/Tablet Dashboard - Original Layout */}
            <div className="xl:hidden w-full grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="w-full space-y-2">
                <label className={labelClass}>Inflationsrate (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.inflationRate}
                    onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                    className="flex-1 accent-blue-600"
                  />
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.inflationRate}
                    onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                    className={numberInputClass('w-20')}
                  />
                </div>
                <div className={helperClass}>
                  <span className="text-left">0%</span>
                  <span className="font-semibold text-center">{parseFloat(formData.inflationRate || '0').toFixed(1)}%</span>
                  <span className="text-right">5%</span>
                </div>
              </div>

              <div className="w-full space-y-2">
                <label className={labelClass}>Rendite Ansparphase (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.1"
                    value={formData.returnRate}
                    onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                    className="flex-1 accent-blue-600"
                  />
                  <input
                    type="number"
                    min="0"
                    max="12"
                    step="0.1"
                    value={formData.returnRate}
                    onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                    className={numberInputClass('w-20')}
                  />
                </div>
                <div className={helperClass}>
                  <span className="text-left">0%</span>
                  <span className="font-semibold text-center">{parseFloat(formData.returnRate || '0').toFixed(1)}%</span>
                  <span className="text-right">12%</span>
                </div>
              </div>

              <div className="w-full space-y-2">
                <label className={labelClass}>Rendite Entnahmephase (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.1"
                    value={formData.withdrawalRate}
                    onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                    className="flex-1 accent-blue-600"
                  />
                  <input
                    type="number"
                    min="0"
                    max="8"
                    step="0.1"
                    value={formData.withdrawalRate}
                    onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                    className={numberInputClass('w-20')}
                  />
                </div>
                <div className={helperClass}>
                  <span className="text-left">0%</span>
                  <span className="font-semibold text-center">{parseFloat(formData.withdrawalRate || '0').toFixed(1)}%</span>
                  <span className="text-right">8%</span>
                </div>
              </div>

              <div className="w-full space-y-2">
                <label className={labelClass}>Monatliche Sparrate (€)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="10"
                    value={Number(formData.monthlySavings || '0')}
                    onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                    className="flex-1 accent-blue-600"
                  />
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formData.monthlySavings}
                    onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                    className={numberInputClass('w-20')}
                  />
                </div>
                <div className={helperClass}>
                  <span className="text-left">0 €</span>
                  <span className="font-semibold text-center">{formatEuro(Number(formData.monthlySavings || '0'))} €</span>
                  <span className="text-right">3.000 €</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className={wrapperClasses}>
          {/* Toggle Switches oben einheitlich */}
          <div className={`w-full flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 mb-4 md:mb-6 pb-4 md:pb-6 border-b ${isDashboard ? 'border-white/10' : 'border-gray-200'}`}>
            {/* Beratungsmodus Toggle */}
            <label htmlFor="advisory-mode" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="advisory-mode"
                checked={advisoryMode}
                onChange={(e) => setAdvisoryMode(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
                advisoryMode 
                  ? isDashboard ? 'bg-purple-600' : 'bg-blue-600'
                  : isDashboard ? 'bg-white/20' : 'bg-gray-300'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  advisoryMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className={`ml-3 ${checkboxLabelClass}`}>
                Beratungsmodus
              </span>
            </label>

            {/* In heutiger Kaufkraft Toggle */}
            <label htmlFor="purchasing-power" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="purchasing-power"
                checked={showInCurrentPurchasingPower}
                onChange={(e) => setShowInCurrentPurchasingPower(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
                showInCurrentPurchasingPower 
                  ? isDashboard ? 'bg-purple-600' : 'bg-blue-600'
                  : isDashboard ? 'bg-white/20' : 'bg-gray-300'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  showInCurrentPurchasingPower ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className={`ml-3 ${checkboxLabelClass} whitespace-nowrap`}>
                In heutiger Kaufkraft
              </span>
            </label>
          </div>

          {/* Slider Controls */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            <div className="w-full space-y-2">
              <label className={labelClass}>Inflationsrate (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.inflationRate}
                  onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                  className="flex-1 accent-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.inflationRate}
                  onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                  className={numberInputClass('w-20')}
                />
              </div>
              <div className={helperClass}>
                <span className="text-left">0%</span>
                <span className="font-semibold text-center">{parseFloat(formData.inflationRate || '0').toFixed(1)}%</span>
                <span className="text-right">5%</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <label className={labelClass}>Rendite Ansparphase (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.1"
                  value={formData.returnRate}
                  onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                  className="flex-1 accent-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.1"
                  value={formData.returnRate}
                  onChange={(e) => setFormData({ ...formData, returnRate: e.target.value })}
                  className={numberInputClass('w-20')}
                />
              </div>
              <div className={helperClass}>
                <span className="text-left">0%</span>
                <span className="font-semibold text-center">{parseFloat(formData.returnRate || '0').toFixed(1)}%</span>
                <span className="text-right">12%</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <label className={labelClass}>Rendite Entnahmephase (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.1"
                  value={formData.withdrawalRate}
                  onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                  className="flex-1 accent-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  max="8"
                  step="0.1"
                  value={formData.withdrawalRate}
                  onChange={(e) => setFormData({ ...formData, withdrawalRate: e.target.value })}
                  className={numberInputClass('w-20')}
                />
              </div>
              <div className={helperClass}>
                <span className="text-left">0%</span>
                <span className="font-semibold text-center">{parseFloat(formData.withdrawalRate || '0').toFixed(1)}%</span>
                <span className="text-right">8%</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <label className={labelClass}>Monatliche Sparrate (€)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="10"
                  value={Number(formData.monthlySavings || '0')}
                  onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                  className="flex-1 accent-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.monthlySavings}
                  onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                  className={numberInputClass('w-20')}
                />
              </div>
              <div className={helperClass}>
                <span className="text-left">0 €</span>
                <span className="font-semibold text-center">{formatEuro(Number(formData.monthlySavings || '0'))} €</span>
                <span className="text-right">3.000 €</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const combinedExistingNet = statutoryDisplay + manualNetExisting
    const totalCoverageNet = combinedExistingNet + additionalNetIncomeDisplay
    const coveragePercentDisplay =
      comparisonTarget > 0
        ? Math.max(0, Math.min(100, (totalCoverageNet / comparisonTarget) * 100))
        : 0
    const hasIncomeTaxPrivate = provisionTaxBreakdown.totalIncomeTaxMonthly > 0.0001
    const hasCapitalTaxPrivate = provisionTaxBreakdown.totalCapitalTaxMonthly > 0.0001
    const privateTaxLabel = hasIncomeTaxPrivate
      ? hasCapitalTaxPrivate
        ? 'Steuern private Vorsorge'
        : 'Steuerlast private Vorsorge'
      : 'Kapitalsteuer private Vorsorge'
    const renderDashboardView = () => {
      const isLightTheme = dashboardTheme === 'light'
      
      // Helle Glassmorphism-Variante
      if (isLightTheme) {
        return (
          <div className="space-y-8">
            {/* Hauptcontainer mit Glassmorphism - mehr Transparenz */}
            <div className="rounded-[32px] bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative overflow-hidden">
              {/* Dynamische Gradient-Overlays für Glassmorphism-Effekt */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 via-blue-50/30 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-100/30 via-emerald-50/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-50/20 via-transparent to-transparent rounded-full blur-3xl" />
              </div>
              
              <div className="relative p-8 md:p-10 lg:p-12 space-y-10">
                <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
                  <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                        Finance Made Simple
                      </span>
                      <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-slate-900">
                        Rentenlücke verstehen und schließen
                      </h2>
                      <p className="text-base md:text-lg text-slate-600 max-w-xl">
                        deine einfache Rentenübersicht
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {['Individuelle Analyse', 'Live-Simulation'].map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 px-4 py-2 text-xs font-medium tracking-wide text-slate-700"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">Stand:</span> {new Date().toLocaleDateString('de-DE')}
                    </div>
                  </div>

                  {/* Quick-Preview Card mit Glassmorphism - mehr Transparenz */}
                  <div className="w-full lg:w-auto lg:min-w-[320px]">
                    <div className="relative rounded-3xl bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6 space-y-6">
                      {/* Subtiler innerer Glow */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                      <div className="relative space-y-2">
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-600">Quick-Preview</p>
                        <p className="text-lg font-semibold text-slate-900">Deckungsgrad deiner Zielrente</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-2">
                          <span>aktuell</span>
                          <span className="font-semibold text-slate-900">{coveragePercentDisplay.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-blue-400 to-blue-500 transition-all duration-700"
                            style={{ width: `${coveragePercentDisplay}%` }}
                          />
                        </div>
                      </div>
                      <div className="relative grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-slate-600">Bisher gedeckt</p>
                          <p className="text-lg font-semibold text-slate-900">{formatEuro(combinedExistingNet)} €</p>
                          <p className="text-xs text-slate-500">gesetzlich + privat</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-600">Ziel (Netto)</p>
                          <p className="text-lg font-semibold text-slate-900">{formatEuro(comparisonTarget)} €</p>
                          <p className="text-xs text-slate-500">monatliches Wunschziel</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-600">Aktuelle Lücke</p>
                          <p className="text-lg font-semibold text-rose-600">{formatEuro(gapBeforeSavingsDisplay)} €</p>
                          <p className="text-xs text-slate-500">vor neuer Sparrate</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-600">Kapitalbedarf gesamt</p>
                          <p className="text-lg font-semibold text-slate-900">{formatEuro(baseCapitalRequirementDisplayValue)} €</p>
                          <p className="text-xs text-slate-500">für {yearsInRetirement} Jahre Ruhestand</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation anpassen mit Glassmorphism - mehr Transparenz */}
                <div className="relative rounded-3xl bg-white/35 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-6 py-5">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  <div className="relative">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-600 mb-3">Simulation anpassen</p>
                    {renderControlPanel('dashboard')}
                  </div>
                </div>

                {/* Zwei Hauptkacheln mit Glassmorphism */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Linke Kachel - Rentenlücke */}
                  <div className="relative rounded-3xl bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-6 py-5 space-y-5">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Deine aktuelle Rentenlücke</p>
                          <p className="text-2xl font-semibold text-slate-900 mt-1">{formatEuro(gapBeforeSavingsDisplay)} €</p>
                        </div>
                        <div className="rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 px-3 py-1 text-xs text-slate-700">
                          Zielrente {formatEuro(comparisonTarget)} €
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>{statutoryShortLabel} (netto)</span>
                          <span className="text-slate-900 font-medium">{formatEuro(statutoryDisplay)} €</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Private Vorsorge (netto)</span>
                          <span className="text-slate-900 font-medium">{formatEuro(manualNetExisting)} €</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-semibold pt-2 border-t border-white/30">
                          <span>Versorgungslücke</span>
                          <span>{formatEuro(gapBeforeSavingsDisplay)} €</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rechte Kachel - Sparrate */}
                  <div className="relative rounded-3xl bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-6 py-5 space-y-5">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Was leistet die Sparrate?</p>
                          <p className="text-2xl font-semibold text-slate-900 mt-1">
                            {formatEuro(additionalNetIncomeDisplay)} € zusätzliche Netto-Rente
                          </p>
                          <p className="text-xs text-slate-500">nach Steuern und Abzügen</p>
                        </div>
                        <div className="rounded-full bg-emerald-100/80 backdrop-blur-sm border border-emerald-200/60 px-3 py-1 text-xs text-emerald-700 font-semibold">
                          Deckung {savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 p-3 shadow-sm">
                          <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Monatliche Sparrate</p>
                          <p className="text-lg font-semibold text-slate-900">{formatEuro(parseFloat(formData.monthlySavings || '0'))} €</p>
                        </div>
                        <div className="rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 p-3 shadow-sm">
                          <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Netto-Zusatzrente</p>
                          <p className="text-lg font-semibold text-emerald-600">{formatEuro(additionalNetIncomeDisplay)} €</p>
                        </div>
                        <div className="rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 p-3 shadow-sm">
                          <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Restlücke</p>
                          <p className={`text-lg font-semibold ${remainingGapDisplay > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {formatEuro(remainingGapDisplay)} €
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 p-3 shadow-sm">
                          <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Offener Kapitalbedarf</p>
                          <p className={`text-lg font-semibold ${remainingCapitalRequirementDisplay > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                            {formatEuro(remainingCapitalRequirementDisplay)} €
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 pt-2 border-t border-white/30">
                        Kapitalbedarf gesamt: <span className="font-semibold text-slate-800">{formatEuro(baseCapitalRequirementDisplayValue)} €</span> · Bereits abgedeckt <span className="font-semibold text-slate-800">{formatEuro(capitalRequirementCoveredDisplayValue)} €</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Berechnung mit Krankenversicherungsbeitrag {kvRatePercent}% (zzgl. Pflegeversicherung {careRatePercent}%).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weitere Sections mit hellem Theme */}
            {renderDelayScenarioSection('dashboard')}

            {/* 4 Kacheln mit hellem Glassmorphism - mehr Transparenz */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="relative rounded-2xl bg-white/35 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <div className="relative">
                  <p className="text-xs uppercase tracking-wide text-slate-600 mb-2">Aktuelle Lücke</p>
                  <p className="text-3xl font-semibold text-slate-900">{formatEuro(gapBeforeSavingsDisplay)} €</p>
                  <p className="text-sm text-slate-600 mt-2">Differenz zwischen Zielrente und bestehender Vorsorge.</p>
                </div>
              </div>
              <div className="relative rounded-2xl bg-emerald-50/30 backdrop-blur-2xl border border-emerald-200/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50/20 to-transparent pointer-events-none" />
                <div className="relative">
                  <p className="text-xs uppercase tracking-wide text-emerald-700 mb-2">Verbleibende Lücke</p>
                  <p className="text-3xl font-semibold text-emerald-700">{formatEuro(Math.max(0, gapAfterSavingsDisplay))} €</p>
                  <p className="text-sm text-emerald-700/80 mt-2">Nach Umsetzung der geplanten Sparrate.</p>
                </div>
              </div>
              <div className="relative rounded-2xl bg-blue-50/30 backdrop-blur-2xl border border-blue-200/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/20 to-transparent pointer-events-none" />
                <div className="relative">
                  <p className="text-xs uppercase tracking-wide text-blue-700 mb-2">Deckungsgrad</p>
                  <p className="text-3xl font-semibold text-blue-700">
                    {savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </p>
                  <p className="text-sm text-blue-700/80 mt-2">Abgedeckter Anteil der Versorgungslücke.</p>
                </div>
              </div>
              <div className="relative rounded-2xl bg-amber-50/30 backdrop-blur-2xl border border-amber-200/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-50/20 to-transparent pointer-events-none" />
                <div className="relative">
                  <p className="text-xs uppercase tracking-wide text-amber-700 mb-2">Kapitalbedarf</p>
                  <p className="text-3xl font-semibold text-amber-700">{formatEuro(baseCapitalRequirementDisplayValue)} €</p>
                  <p className="text-sm text-amber-700/80 mt-2">
                    Für {yearsInRetirement > 0 ? `${yearsInRetirement} Jahre Ruhestand` : 'den geplanten Zeitraum'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // Dunkle Variante (Original - unverändert)
      return (
      <div className="space-y-8">
        <div className="rounded-[32px] bg-gradient-to-br from-[#050A1A] via-[#101E3F] to-[#1A3A7C] text-white shadow-[0_35px_80px_rgba(8,15,40,0.45)] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 h-72 w-72 bg-[#2f5bff]/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-80 w-80 bg-[#6dd5ff]/20 rounded-full blur-[140px]" />
          </div>
          <div className="relative p-8 md:p-10 lg:p-12 space-y-10">
            <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
              <div className="flex-1 space-y-6">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
                    Finance Made Simple
            </span>
                  <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
                    Rentenlücke verstehen und schließen
                  </h2>
                  <p className="text-base md:text-lg text-white/70 max-w-xl">
                    deine einfache Rentenübersicht
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {['Individuelle Analyse', 'Live-Simulation'].map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-xs font-medium tracking-wide text-white/80 backdrop-blur"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                  <div className="text-sm text-white/60">
                    <span className="font-semibold text-white">Stand:</span> {new Date().toLocaleDateString('de-DE')}
          </div>
        </div>

              <div className="w-full lg:w-auto lg:min-w-[320px]">
                <div className="relative rounded-3xl bg-white/5 border border-white/10 shadow-[0_18px_60px_rgba(8,15,40,0.45)] p-6 space-y-6 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/40">Quick-Preview</p>
                    <p className="text-lg font-semibold text-white">Deckungsgrad deiner Zielrente</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-2">
                      <span>aktuell</span>
                      <span>{coveragePercentDisplay.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#4ADE80] via-[#22D3EE] to-[#60A5FA] transition-all duration-700"
                        style={{ width: `${coveragePercentDisplay}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-white/50">Bisher gedeckt</p>
                      <p className="text-lg font-semibold text-white">{formatEuro(combinedExistingNet)} €</p>
                      <p className="text-xs text-white/40">gesetzlich + privat</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/50">Ziel (Netto)</p>
                      <p className="text-lg font-semibold text-white">{formatEuro(comparisonTarget)} €</p>
                      <p className="text-xs text-white/40">monatliches Wunschziel</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/50">Aktuelle Lücke</p>
                      <p className="text-lg font-semibold text-rose-300">{formatEuro(gapBeforeSavingsDisplay)} €</p>
                      <p className="text-xs text-white/40">vor neuer Sparrate</p>
                    </div>
                    <div className="space-y-1">
                    <p className="text-white/50">Kapitalbedarf gesamt</p>
                    <p className="text-lg font-semibold text-white">{formatEuro(baseCapitalRequirementDisplayValue)} €</p>
                    <p className="text-xs text-white/40">für {yearsInRetirement} Jahre Ruhestand</p>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur px-6 py-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Simulation anpassen</p>
              {renderControlPanel('dashboard')}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur px-6 py-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/40">Deine aktuelle Rentenlücke</p>
                    <p className="text-2xl font-semibold text-white mt-1">{formatEuro(gapBeforeSavingsDisplay)} €</p>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                    Zielrente {formatEuro(comparisonTarget)} €
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>{statutoryShortLabel} (netto)</span>
                    <span className="text-white">{formatEuro(statutoryDisplay)} €</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Private Vorsorge (netto)</span>
                    <span className="text-white">{formatEuro(manualNetExisting)} €</span>
                  </div>
                  <div className="flex justify-between text-rose-300 font-semibold">
                    <span>Versorgungslücke</span>
                    <span>{formatEuro(gapBeforeSavingsDisplay)} €</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur px-6 py-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/40">Was leistet die Sparrate?</p>
                    <p className="text-2xl font-semibold text-white mt-1">
                      {formatEuro(additionalNetIncomeDisplay)} € zusätzliche Netto-Rente
                    </p>
                    <p className="text-xs text-white/60">nach Steuern und Abzügen</p>
                  </div>
                  <div className="rounded-full bg-emerald-400/20 border border-emerald-300/30 px-3 py-1 text-xs text-emerald-200 font-semibold">
                    Deckung {savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Monatliche Sparrate</p>
                    <p className="text-lg font-semibold text-white">{formatEuro(parseFloat(formData.monthlySavings || '0'))} €</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Netto-Zusatzrente</p>
                    <p className="text-lg font-semibold text-white">{formatEuro(additionalNetIncomeDisplay)} €</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Restlücke</p>
                    <p className={`text-lg font-semibold ${remainingGapDisplay > 0 ? 'text-rose-300' : 'text-emerald-200'}`}>
                      {formatEuro(remainingGapDisplay)} €
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Offener Kapitalbedarf</p>
                    <p className={`text-lg font-semibold ${remainingCapitalRequirementDisplay > 0 ? 'text-white' : 'text-emerald-200'}`}>
                      {formatEuro(remainingCapitalRequirementDisplay)} €
                    </p>
                  </div>
                </div>
                <div className="text-xs text-white/60">
                  Kapitalbedarf gesamt: {formatEuro(baseCapitalRequirementDisplayValue)} € · Bereits abgedeckt {formatEuro(capitalRequirementCoveredDisplayValue)} €
                </div>
                <p className="text-[11px] text-white/50">
                  Berechnung mit Krankenversicherungsbeitrag {kvRatePercent}% (zzgl. Pflegeversicherung {careRatePercent}%).
                </p>
              </div>
            </div>
          </div>
        </div>

        {renderDelayScenarioSection('dashboard')}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#121a2f] via-[#1c2546] to-[#24356a] text-white p-6 shadow-xl">
            <p className="text-xs uppercase tracking-wide text-white/60 mb-2">Aktuelle Lücke</p>
            <p className="text-3xl font-semibold">{formatEuro(gapBeforeSavingsDisplay)} €</p>
            <p className="text-sm text-white/70 mt-2">Differenz zwischen Zielrente und bestehender Vorsorge.</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6 shadow-sm border border-emerald-200">
            <p className="text-xs uppercase tracking-wide text-emerald-700 mb-2">Verbleibende Lücke</p>
            <p className="text-3xl font-semibold text-emerald-700">{formatEuro(Math.max(0, gapAfterSavingsDisplay))} €</p>
            <p className="text-sm text-emerald-700/80 mt-2">Nach Umsetzung der geplanten Sparrate.</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-sm border border-blue-200">
            <p className="text-xs uppercase tracking-wide text-blue-700 mb-2">Deckungsgrad</p>
            <p className="text-3xl font-semibold text-blue-700">
              {savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
            </p>
            <p className="text-sm text-blue-700/80 mt-2">Abgedeckter Anteil der Versorgungslücke.</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-100 p-6 shadow-sm border border-amber-200">
            <p className="text-xs uppercase tracking-wide text-amber-700 mb-2">Kapitalbedarf</p>
            <p className="text-3xl font-semibold text-amber-700">{formatEuro(baseCapitalRequirementDisplayValue)} €</p>
            <p className="text-sm text-amber-700/80 mt-2">
              Für {yearsInRetirement > 0 ? `${yearsInRetirement} Jahre Ruhestand` : 'den geplanten Zeitraum'}.
            </p>
          </div>
        </div>
        <div className="rounded-[28px] bg-white shadow-sm border border-slate-200/70">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/60 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Bestehende Vorsorge</h3>
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {existingProvisionDetails.length} {existingProvisionDetails.length === 1 ? 'Eintrag' : 'Einträge'}
                  </span>
                </div>
                {existingProvisionDetails.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
                    Noch keine Vorsorge erfasst.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {existingProvisionDetails.map((item) => {
                      const provisionMeta = provisions.find((prov) => prov.id === item.id)
                      const provisionAttachments = attachmentsByProvision[item.id] ?? []
                      const opened = openProvisionId === item.id
                      const isBasisRente = item.type === 'Basis-Rente'
                      const isRiester = item.type === 'Riester-Rente'
                      const isBetrieblicheAltersvorsorge = item.type === 'Betriebliche Altersvorsorge'
                      const currentYear = new Date().getFullYear()
                      const retirementYearEstimate = currentYear + yearsToRetirementValue
                      const taxableShareForEntry = Math.round(calculateTaxableShareForRetirementYear(retirementYearEstimate) * 10) / 10
                      const taxableExampleMonthly = Math.round(item.amount * (taxableShareForEntry / 100) * 100) / 100
                      const provisionIncomeTaxFuture =
                        provisionTaxBreakdown.incomeTaxByProvision[item.id] ?? 0
                      const provisionIncomeTaxDisplay = convertToDisplay(provisionIncomeTaxFuture)
                      const provisionCapitalTaxDisplay =
                        convertToDisplay(provisionTaxBreakdown.capitalTaxByProvision[item.id] ?? 0)
                      const bavSocialShare =
                        isBetrieblicheAltersvorsorge && totalBavMonthly > 0
                          ? Math.round(
                              (privateSvDeduction *
                                Math.max(0, item.amount) /
                                totalBavMonthly) *
                                100,
                            ) / 100
                          : 0
                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenProvisionId((prev) => (prev === item.id ? null : item.id))}
                            className="w-full px-5 py-4 flex items-center justify-between text-left"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                              <p className="text-xs uppercase tracking-wide text-slate-400 mt-0.5">{item.type}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900">{formatEuro(item.amount)} €</p>
                                <p className="text-xs text-slate-400 mt-1">monatlich</p>
                              </div>
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transform transition-transform ${
                                  opened ? 'rotate-90' : ''
                                }`}
                              >
                                ▸
                              </span>
                            </div>
                          </button>
                          {opened && (
                            <div className="px-5 pb-5 space-y-4 border-t border-slate-200 bg-slate-50">
                              {isBasisRente && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-wide font-semibold text-amber-700">
                                      Besonderheiten Basis-Rente (Rürup)
                                    </span>
                                    <span className="text-xs text-amber-700">
                                      Rentenbeginn {retirementYearEstimate}
                                    </span>
                                  </div>
                                  <p>
                                    Die Basis-Rente wird ausschließlich als lebenslange Rente ausgezahlt und unterliegt der nachgelagerten
                                    Besteuerung. Der steuerpflichtige Anteil steigt jedes Jahr an.
                                  </p>
                                  <ul className="space-y-1 list-disc list-inside text-amber-900/90">
                                    <li>2025 sind 83,5&nbsp;% der Leistungen steuerpflichtig, danach jährlich +0,5&nbsp;%-Punkte bis 100&nbsp;% in 2058.</li>
                                    <li>
                                      Geplanter Rentenbeginn {retirementYearEstimate}: {taxableShareForEntry}% deiner Rürup-Rente gelten als steuerpflichtig.
                                    </li>
                                    <li>Besteuerung erfolgt mit deinem persönlichen Einkommensteuersatz im Rentenjahr – meist niedriger als in der Ansparphase.</li>
                                    <li>Keine Kapitalauszahlung möglich; die Leistungen werden gemeinsam mit der gesetzlichen Rente versteuert.</li>
                                  </ul>
                                  <p className="text-xs text-amber-700/80">
                                    Durchschnittssteuer aktuell vs. mit Rürup: {formatPercent(provisionTaxBreakdown.baseAverageRate)} →{' '}
                                    {formatPercent(provisionTaxBreakdown.combinedAverageRate)}. Grenzsteuersatz auf zusätzliche Rürup-Leistungen:{' '}
                                    {formatPercent(provisionTaxBreakdown.marginalRate)}.
                                  </p>
                                  <p className="text-xs text-amber-700/80">
                                    Aktuelle Steuerlast auf diese Basis-Rente: {formatEuro(provisionIncomeTaxDisplay)} € pro Monat.
                                  </p>
                                  <p className="text-xs text-amber-700/80">
                                    Beispiel: Bei {formatEuro(item.amount)} € Monatsrente wären ca. {formatEuro(taxableExampleMonthly)} € steuerpflichtig
                                    ({taxableShareForEntry}%).
                                  </p>
                                </div>
                              )}
                              {item.type === 'Privatrente' && (
                                <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-wide font-semibold text-purple-700">
                                      Private Rente – Ertragsanteilsbesteuerung
                                    </span>
                                    <span className="text-xs text-purple-600">
                                      Rentenbeginn {retirementYearEstimate}
                                    </span>
                                  </div>
                                  <p>
                                    Nur der Ertragsanteil ist steuerpflichtig. Er richtet sich nach deinem Rentenalter zum Beginn und bleibt dann konstant.
                                  </p>
                                  <ul className="space-y-1 list-disc list-inside text-purple-900/90">
                                    <li>Ertragsanteil bei Rentenbeginn {desiredRetirementAgeValue}: {formatPercent(item.taxableShare)}</li>
                                    <li>Besteuerung erfolgt mit deinem persönlichen Satz im Rentenjahr.</li>
                                    <li>Bei Kapitalauszahlung (statt Rente) greift ggf. das Halbeinkünfteverfahren (50&nbsp;% des Gewinns steuerpflichtig).</li>
                                  </ul>
                                  <p className="text-xs text-purple-700/80">
                                    Aktuelle Steuerlast auf diese Privat-Rente: {formatEuro(provisionIncomeTaxDisplay)} € pro Monat.
                                  </p>
                                  <p className="text-xs text-purple-700/80">
                                    Durchschnittssteuer (ohne → mit privater Rente): {formatPercent(provisionTaxBreakdown.baseAverageRate)} →{' '}
                                    {formatPercent(provisionTaxBreakdown.combinedAverageRate)} · Grenzsteuersatz:{' '}
                                    {formatPercent(provisionTaxBreakdown.marginalRate)}.
                                  </p>
                                </div>
                              )}
                              {isRiester && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-wide font-semibold text-emerald-700">
                                      Riester-Rente in der Auszahlungsphase
                                    </span>
                                    <span className="text-xs text-emerald-700">
                                      Rentenbeginn {retirementYearEstimate}
                                    </span>
                                  </div>
                                  <p>Riester-Leistungen werden nachgelagert voll versteuert.</p>
                                  <ul className="space-y-1 list-disc list-inside text-emerald-900/90">
                                    <li>100&nbsp;% der Auszahlung gelten als steuerpflichtiges Einkommen.</li>
                                    <li>Die Versteuerung erfolgt mit deinem persönlichen Satz im Auszahlungsjahr.</li>
                                    <li>Zulagen und Steuerförderung aus der Ansparphase werden dadurch „nachgeholt".</li>
                                  </ul>
                                  <p className="text-xs text-emerald-700/80">
                                    Aktuelle Steuerlast auf diesen Vertrag: {formatEuro(provisionIncomeTaxDisplay)} € pro Monat.
                                  </p>
                                  <p className="text-xs text-emerald-700/80">
                                    Durchschnittssteuer (ohne → mit Riester): {formatPercent(provisionTaxBreakdown.baseAverageRate)} →{' '}
                                    {formatPercent(provisionTaxBreakdown.combinedAverageRate)} · Grenzsteuersatz:{' '}
                                    {formatPercent(provisionTaxBreakdown.marginalRate)}.
                                  </p>
                                </div>
                              )}
                              {isBetrieblicheAltersvorsorge && (
                                <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-wide font-semibold text-slate-700">
                                      Betriebliche Altersvorsorge – Auszahlungsphase
                                    </span>
                                    <span className="text-xs text-slate-600">
                                      Rentenbeginn {retirementYearEstimate}
                                    </span>
                                  </div>
                                  <p>Die bAV wird vollständig nachgelagert besteuert und unterliegt zusätzlich der Kranken-/Pflegeversicherung.</p>
                                  <ul className="space-y-1 list-disc list-inside text-slate-800/90">
                                    <li>100&nbsp;% der Monatsrente gelten als steuerpflichtiges Einkommen.</li>
                                    <li>Auf Anteile über 187,25&nbsp;€ fallen KV/PV-Beiträge an (aktuell in Summe {privateSvRatePercent}%).</li>
                                    <li>Versorgungsfreibeträge nehmen jährlich ab und entfallen ab 2040 vollständig.</li>
                                  </ul>
                                  <p className="text-xs text-slate-600">
                                    Steuerlast auf diesen Vertrag: {formatEuro(provisionIncomeTaxDisplay)} € pro Monat · Sozialabzug (Anteil):{' '}
                                    {formatEuro(bavSocialShare)} €.
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl border border-slate-200 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Stärken</p>
                                  <p className="text-sm text-slate-700 leading-relaxed">
                                    {provisionMeta?.strengths?.trim() ? provisionMeta.strengths : '–'}
                                  </p>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Schwächen</p>
                                  <p className="text-sm text-slate-700 leading-relaxed">
                                    {provisionMeta?.weaknesses?.trim() ? provisionMeta.weaknesses : '–'}
                                  </p>
                                </div>
                              </div>
                              {provisionMeta?.recommendation?.trim() && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                                  <span className="text-xs uppercase tracking-wide font-semibold text-blue-600 block mb-1">
                                    Empfehlung
                                  </span>
                                  {provisionMeta.recommendation}
                                </div>
                              )}
                              {provisionAttachments.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs uppercase tracking-wide text-slate-400">Screenshots</p>
                                  <div className="flex gap-3 overflow-x-auto pb-1">
                                    {provisionAttachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group relative w-36 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm"
                                      >
                                        <img
                                          src={attachment.url}
                                          alt={attachment.originalName}
                                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 text-white text-[10px] px-2 py-1 truncate">
                                          {attachment.originalName}
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-[#101A33] text-white border border-white/10 shadow-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold">Schnellübersicht</h3>
                <p className="text-[11px] uppercase tracking-wide text-white/50">Monatliche Werte</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Monatliche Sparrate</span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatEuro(parseFloat(formData.monthlySavings || '0'))} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Zusatzrente netto</span>
                    <span className="font-semibold whitespace-nowrap">{formatEuro(savingsProjection.monthlyPensionFuture)} €</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Zusatzrente brutto</span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatEuro(savingsProjection.monthlyPensionFutureGross)} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Steuerabzug (mtl.)</span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatEuro(capitalTaxMonthlyDisplay)} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Inflationsbereinigte Zielrente</span>
                    <span className="font-semibold whitespace-nowrap">{formatEuro(targetInflationDisplay)} €</span>
                  </div>
                </div>
              </div>
            </div>

            <CollapsibleSection title="Berechnete Werte" defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {calculationVariableRows.map((row) => (
                  <div key={row.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{row.description}</p>
                    <p className="text-xl font-semibold text-slate-900">{row.value}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    )
    }

    const renderOverviewHeader = (title: string) => (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <div className="flex items-center gap-3">
          {overviewMode === 'dashboard' && (
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setDashboardTheme('dark')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                  dashboardTheme === 'dark'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Dunkel
              </button>
              <button
                type="button"
                onClick={() => setDashboardTheme('light')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                  dashboardTheme === 'light'
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Hell
              </button>
            </div>
          )}
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setOverviewMode('detail')}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
              overviewMode === 'detail'
                ? 'bg-white text-slate-900 shadow'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Detail
          </button>
          <button
            type="button"
            onClick={() => setOverviewMode('dashboard')}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
              overviewMode === 'dashboard'
                ? 'bg-white text-slate-900 shadow'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dashboard
          </button>
          </div>
        </div>
      </div>
    )


    if (overviewMode === 'dashboard') {
      return (
        <div className="space-y-6">
          {renderOverviewHeader('Renten-Dashboard')}
          {renderDashboardView()}
        </div>
      )
    }
    return (
      <div className="space-y-6">
        {renderOverviewHeader('Gesamtübersicht')}
        {/* Desktop Detail View */}
        <div className="hidden xl:block">
          {renderControlPanel('detail-desktop')}
        </div>
        {/* Mobile/Tablet Detail View */}
        <div className="xl:hidden">
          {renderControlPanel('default')}
        </div>

        {(targetBaseValue > 0 || totalProvisionDisplay > 0 || statutoryDisplay > 0 || gapDisplay > 0) && (
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="font-semibold text-lg mb-6">Vorsorgeverteilung</h3>
            <div className="relative flex flex-wrap items-end justify-around gap-6 h-72">
              <div className="flex flex-col items-center gap-2 h-full">
                <div className="w-24 h-full bg-gray-200 rounded-t-lg relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-slate-500"
                    style={{ height: `${Math.min(100, (targetBaseDisplay / Math.max(targetBaseDisplay, 1)) * 100)}%` }}
                  />
                </div>
                <div className="text-sm font-medium text-gray-700 text-center">Versorgungsziel</div>
                <div className="text-sm font-semibold text-gray-900">{formatEuro(targetBaseDisplay)} €</div>
              </div>

              <div className="flex flex-col items-center gap-2 h-full">
                <div className="w-24 h-full bg-gray-200 rounded-t-lg relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gray-500"
                    style={{ height: `${Math.min(100, (targetInflationDisplay / Math.max(targetInflationDisplay, 1)) * 100)}%` }}
                  />
                </div>
                <div className="text-sm font-medium text-gray-700 text-center">Versorgungsziel mit Inflation</div>
                <div className="text-sm font-semibold text-gray-900">{formatEuro(targetInflationDisplay)} €</div>
              </div>

              <div className="flex flex-col items-center gap-2 h-full">
                <div className="relative w-24 flex-1 bg-gray-200 rounded-t-lg overflow-visible">
                  <div className="absolute top-1 right-1 bg-white/80 text-[10px] font-semibold text-gray-700 px-2 py-0.5 rounded">
                    Netto (Schätzung)
                  </div>
                  {gapDisplay > 0 && (
                    <div
                      className="absolute left-0 right-0 top-0 bg-red-500 flex flex-col items-center justify-center text-white text-[10px] font-semibold px-1"
                      style={{ height: `${formattedGapHeight}%` }}
                    >
                      <span>{formatEuro(gapDisplay)} €</span>
                      <span className="text-[9px] font-medium text-center leading-tight">Versorgungslücke</span>
                    </div>
                  )}
                  {manualNetExisting > 0 && (
                    <div
                      onMouseEnter={() => setProvisionTooltipType('existing')}
                      onMouseLeave={() => setProvisionTooltipType(null)}
                      className="absolute left-0 right-0 bg-emerald-600 flex flex-col items-center justify-center text-white text-[10px] font-semibold px-1"
                      style={{
                        height: `${privateExistingHeight}%`,
                        top: `${formattedGapHeight}%`,
                      }}
                    >
                      <span>{formatEuro(manualNetExisting)} €</span>
                      <span className="text-[9px] font-medium text-center leading-tight">Private Vorsorge netto</span>
                    </div>
                  )}
                  {projectedSavingsDisplay > 0 && (
                    <div
                      onMouseEnter={() => setProvisionTooltipType('planned')}
                      onMouseLeave={() => setProvisionTooltipType(null)}
                      className="absolute left-0 right-0 bg-emerald-400 flex flex-col items-center justify-center text-emerald-950 text-[10px] font-semibold px-1"
                      style={{
                        height: `${projectedSavingsHeight}%`,
                        top: `${formattedGapHeight + privateExistingHeight}%`,
                      }}
                    >
                      <span>{formatEuro(projectedSavingsDisplay)} €</span>
                      <span className="text-[9px] font-medium text-center leading-tight">Simulation Sparrate</span>
                    </div>
                  )}
                  {statutoryDisplay > 0 && (
                    <div
                      onMouseEnter={() => setShowStatutoryTooltip(true)}
                      onMouseLeave={() => setShowStatutoryTooltip(false)}
                      className="absolute left-0 right-0 bg-blue-600 flex flex-col items-center justify-center text-white text-[10px] font-semibold px-1"
                      style={{
                        height: `${formattedStatutoryHeight}%`,
                        top: `${formattedGapHeight + privateExistingHeight + projectedSavingsHeight}%`,
                      }}
                    >
                      <span>{formatEuro(statutoryDisplay)} €</span>
                      <span className="text-[9px] font-medium text-center leading-tight">{`${statutoryShortLabel} netto`}</span>
                    </div>
                  )}
                  {showStatutoryTooltip && statutoryDisplay > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-28 bg-gray-900/95 text-white rounded-2xl px-4 py-3 shadow-xl text-xs space-y-1 pointer-events-none w-52">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
                        {`${statutoryShortLabel} netto`}
                      </div>
                      <div className="flex justify-between">
                        <span>Brutto</span>
                        <span>{formatEuro(statutoryGrossDisplay)} €</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Krankenversicherung</span>
                        <span>-{formatEuro(contributionsDisplay)} €</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Steuerlast</span>
                        <span>-{formatEuro(taxDisplay)} €</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Netto</span>
                        <span>{formatEuro(statutoryDisplay)} €</span>
                      </div>
                    </div>
                  )}
                  {provisionTooltipType && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-32 bg-slate-900/95 text-white rounded-2xl px-4 py-3 shadow-xl text-xs space-y-1 pointer-events-none w-60">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-300" />
                        {provisionTooltipType === 'existing'
                          ? 'Private Vorsorge netto'
                          : 'Simulation Sparrate netto'}
                      </div>
                      {provisionTooltipType === 'existing' ? (
                        <>
                          <div className="flex justify-between">
                            <span>Brutto</span>
                            <span>{formatEuro(manualProvisionDisplay + storedSavingsDisplay)} €</span>
                          </div>
                          <div
                            className={`flex justify-between ${
                              privateSvDeduction > 0 ? 'text-rose-300/90' : 'text-slate-400'
                            }`}
                          >
                            <span>Sozialabgaben</span>
                            <span>-{formatEuro(privateSvDeduction)} €</span>
                          </div>
                          <div
                            className={`flex justify-between ${
                              manualCapitalTaxDisplayRounded > 0 ? 'text-rose-300/90' : 'text-slate-400'
                            }`}
                          >
                            <span>{privateTaxLabel}</span>
                            <span>-{formatEuro(manualCapitalTaxDisplayRounded)} €</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Netto</span>
                            <span>{formatEuro(manualNetExisting)} €</span>
                        </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>Brutto</span>
                            <span>{formatEuro(convertToDisplay(savingsProjection.monthlyPensionFutureGross))} €</span>
                          </div>
                          <div
                            className={`flex justify-between ${
                              plannedCapitalTaxDisplayRounded > 0 ? 'text-rose-300/90' : 'text-slate-400'
                            }`}
                          >
                              <span>Kapitalsteuer</span>
                              <span>-{formatEuro(plannedCapitalTaxDisplayRounded)} €</span>
                            </div>
                          <div className="flex justify-between font-semibold">
                            <span>Netto</span>
                            <span>{formatEuro(projectedSavingsDisplay)} €</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-700 text-center">Rentenaufteilung (Netto, geschätzt)</div>
                <div className="text-sm font-semibold text-gray-900">{formatEuro(statutoryDisplay + totalProvisionDisplay)} €</div>
              </div>
            </div>
          </div>
        )}
        <div className="border rounded-lg p-6 bg-white">
          <h3 className="font-semibold text-lg mb-4">Kapitalbedarf</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lebenserwartung (Jahre) *</label>
              <input
                type="number"
                min="70"
                max="110"
                value={formData.lifeExpectancy}
                onChange={(e) => setFormData({ ...formData, lifeExpectancy: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monatlicher Sparbetrag (€)</label>
              <input
                type="number"
                min="0"
                step="10"
                value={formData.monthlySavings}
                onChange={(e) => setFormData({ ...formData, monthlySavings: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSavingsProvision()
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z. B. 200"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Die Schieberegler oben steuern Inflationsrate sowie Renditen in der Anspar- und Entnahmephase.
          </p>

          <div className="space-y-3 mt-4 pt-4 border-t">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Benötigtes Kapital (absoluter Wert):</span>
                <span className="text-xl font-bold text-blue-700">{formatEuro(baseCapitalRequirementDisplayValue)} €</span>
              </div>
              <p className="text-xs text-gray-500">
                Berechnung: Versorgungslücke ({formatEuro(gapBeforeSavingsDisplay)} €) × 12 × {yearsInRetirement} Jahre
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Noch offener Kapitalbedarf:</span>
                <span className={`text-xl font-bold ${remainingCapitalRequirementDisplay > 0 ? 'text-blue-700' : 'text-emerald-600'}`}>
                  {formatEuro(remainingCapitalRequirementDisplay)} €
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Bei einer verbleibenden Rentenlücke von {formatEuro(remainingGapDisplay)} € monatlich.
              </p>
            </div>

            {formData.monthlySavings && parseFloat(formData.monthlySavings) > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Kapital aus Sparbetrag (äquivalent):</span>
                  <span className="text-xl font-bold text-green-700">{capitalEquivalentDisplayFormatted} €</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {formData.monthlySavings} €/mtl. mit {parseFloat(formData.returnRate || '0').toFixed(1)}% Rendite über {formatYears(yearsToRetirementValue)}
                </p>
                <button
                  onClick={() => setShowTaxDetailsModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline mb-2"
                >
                  Steuerdetails anpassen
                </button>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Schließt die Rentenlücke zu:</span>
                    <span className={`text-2xl font-bold ${savingsCoverage.coversPercent >= 100 ? 'text-green-600' : savingsCoverage.coversPercent >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">
                    Ergibt ca. {formatEuro(savingsCoverage.monthlyPensionFuture)} €/mtl. zusätzliche Rente
                    (≈ {capitalEquivalentDisplayFormatted} € Kapital über {yearsInRetirementText})
                  </p>
                  <button
                    onClick={addSavingsProvision}
                    disabled={savingsCoverage.futureCapital <= 0}
                    className={`w-full px-4 py-2 text-sm rounded-lg transition-colors ${
                      savingsCoverage.futureCapital > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    + Als Vorsorge "Sparen" hinzufügen
                  </button>
                  {savingsCoverage.gapAfter > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Noch fehlend: {formatEuro(savingsCoverage.gapAfter)} €/mtl.
                    </p>
                  )}
                  {savingsCoverage.gapAfter <= 0 && (
                    <p className="text-xs text-green-600 mt-2 font-semibold">
                      ✓ Ziel erreicht! Der Sparbetrag deckt den Kapitalbedarf.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {(currentValue !== null || provisions.length > 0 || targetBaseValue > 0) && (
          <div className="border-t pt-6 mt-6">
            <CollapsibleSection 
              title={`Detailbetrachtung ${showInCurrentPurchasingPower ? '(Inflation berücksichtigt)' : '(Nominalwerte)'}`}
              defaultOpen={false}
            >

              {/* Desktop Kacheln */}
              <div className="hidden xl:grid grid-cols-2 gap-6 mt-2">
                {/* Linke Kachel - Rentenlücke */}
                <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-2xl p-8 border border-slate-700/50 shadow-xl">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                        Deine aktuelle Rentenlücke
                      </p>
                      <h2 className="text-6xl font-bold text-white mb-2">
                        {formatEuro(gapBeforeSavingsDisplay)} €
                      </h2>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-600/20 rounded-lg text-xs border border-blue-500/30 backdrop-blur-sm">
                      <span className="text-blue-300">Zielrente</span>
                      <span className="ml-2 font-semibold text-blue-100">{formatEuro(comparisonTarget)} €</span>
                    </div>
                  </div>

                  <div className="space-y-4 pb-6 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{statutoryShortLabel} (netto)</span>
                      <span className="text-lg font-semibold text-white">{formatEuro(statutoryDisplay)} €</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Private Vorsorge (netto)</span>
                      <span className="text-lg font-semibold text-white">{formatEuro(manualNetExisting)} €</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <span className="text-base font-bold text-orange-400">Versorgungslücke</span>
                    <span className="text-2xl font-bold text-orange-400">{formatEuro(gapBeforeSavingsDisplay)} €</span>
                  </div>
                </div>

                {/* Rechte Kachel - Sparrate */}
                <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-2xl p-8 border border-slate-700/50 shadow-xl">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                        Was leistet die Sparrate?
                      </p>
                      <h2 className="text-6xl font-bold text-emerald-400 mb-2">
                        {formatEuro(additionalNetIncomeDisplay)} €
                      </h2>
                      <p className="text-sm text-slate-300">
                        zusätzliche Netto-Rente nach Steuern und Abzügen
                      </p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-400/40 backdrop-blur-sm">
                      <span className="text-xs font-semibold text-emerald-400">
                        Deckung {savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </span>
                    </div>
                  </div>

                  {/* 2x2 Grid für die Zahlen */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Box 1 - Monatliche Sparrate */}
                    <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                        Monatliche Sparrate
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {formatEuro(parseFloat(formData.monthlySavings || '0'))} €
                      </p>
                    </div>

                    {/* Box 2 - Netto-Zusatzrente */}
                    <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                        Netto-Zusatzrente
                      </p>
                      <p className="text-3xl font-bold text-emerald-400">
                        {formatEuro(additionalNetIncomeDisplay)} €
                      </p>
                    </div>

                    {/* Box 3 - Restlücke */}
                    <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                        Restlücke
                      </p>
                      <p className={`text-3xl font-bold ${remainingGapDisplay > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {formatEuro(remainingGapDisplay)} €
                      </p>
                    </div>

                    {/* Box 4 - Offener Kapitalbedarf */}
                    <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                        Offener Kapitalbedarf
                      </p>
                      <p className={`text-3xl font-bold ${remainingCapitalRequirementDisplay > 0 ? 'text-white' : 'text-emerald-400'}`}>
                        {formatEuro(remainingCapitalRequirementDisplay)} €
                      </p>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="space-y-2 pt-4 border-t border-slate-700/50">
                    <p className="text-sm text-slate-300">
                      Kapitalbedarf gesamt: <span className="font-semibold text-white">{formatEuro(baseCapitalRequirementDisplayValue)} €</span> · 
                      Bereits abgedeckt <span className="font-semibold text-white">{formatEuro(capitalRequirementCoveredDisplayValue)} €</span>
                    </p>
                    <p className="text-sm text-slate-400">
                      Berechnung mit Krankenversicherungsbeitrag {kvRatePercent}% (zzgl. Pflegeversicherung {careRatePercent}%).
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile/Tablet Kacheln */}
              <div className="xl:hidden grid gap-4 md:grid-cols-2 mt-2">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Aktuelle Rentenlücke</p>
                  <p className="text-2xl font-bold text-red-600">{formatEuro(gapBeforeSavingsDisplay)} €</p>
                  <p className="text-xs text-red-700/80">
                    Zielrente {formatEuro(comparisonTarget)} € minus heutige Netto-Renten {formatEuro(statutoryDisplay + manualNetExisting)} €.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Deckungsgrad mit Sparrate</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %
                  </p>
                  <p className="text-xs text-emerald-700/80">
                    Zusätzliche Netto-Rente {formatEuro(savingsCoverage.monthlyPensionFuture)} € entspricht {capitalEquivalentDisplayFormatted} € Kapital über {yearsInRetirementText}.
                  </p>
                </div>
                </div>

              <div className="mt-6 space-y-5 text-sm">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-semibold">1. Notwendige monatliche Rente</span>
                    <InfoButton content="Dies ist die Zielrente, die du im Ruhestand benötigst, um deinen gewünschten Lebensstandard zu halten. Sie wird basierend auf deinen Eingaben berechnet." />
                  </div>
                  <span className="text-xl font-bold text-gray-900">{formatEuro(comparisonTarget)} €</span>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="text-gray-700 font-semibold flex items-center gap-2">
                          2. {statutoryLabel}
                          <InfoButton content={`Dies ist deine ${isCivilServant ? 'Beamtenpension' : 'gesetzliche Rente'} zum Rentenbeginn. Der Wert wird hochgerechnet, um die erwartete Rente zum Renteneintrittsalter zu zeigen.`} />
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Brutto-Wert inkl. Hochrechnung</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{formatEuro(statutoryGrossDisplay)} €</span>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Sozialabzüge (KV/PV)</span>
                        <InfoButton content={`Von der gesetzlichen Rente werden Sozialabgaben abgezogen: Krankenversicherung (KV) ${kvRatePercent}% und Pflegeversicherung (PV) ${careRatePercent}%. Diese werden auf den Bruttobetrag angewendet.`} />
                      </div>
                      <span className="font-medium text-gray-700">-{formatEuro(contributionsDisplay)} €</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 pl-7">
                      <span>Ansatz: KV {kvRatePercent}% · PV {careRatePercent}%</span>
                      <span />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Steuern (ESt)</span>
                        <InfoButton content="Die Einkommensteuer wird auf den steuerpflichtigen Teil der Rente berechnet. Der Freibetrag wird dabei berücksichtigt. Die Berechnung erfolgt nach dem geltenden Steuertarif." />
                      </div>
                      <span className="font-medium text-gray-700">-{formatEuro(taxDisplay)} €</span>
                    </div>
                    {hasIncomeTaxPrivate && (
                      <div className="flex justify-between text-[11px] text-gray-400 pl-7">
                        <span>Gesamtsteuer inkl. privater Vorsorge</span>
                        <span>-{formatEuro(combinedTaxMonthlyDisplay)} €</span>
                      </div>
                    )}
                    {hasIncomeTaxPrivate && (
                      <div className="flex justify-between text-[11px] text-gray-400 pl-7">
                        <span>Mehrsteuer durch private Vorsorge</span>
                        <span>-{formatEuro(privateIncomeTaxDisplay)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-800">Netto gesetzliche Rente</span>
                      <span className="font-bold text-gray-900">{formatEuro(statutoryDisplay)} €</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="text-gray-700 font-semibold flex items-center gap-2">
                          3. Bestehende private Vorsorge
                          <InfoButton content="Dies sind alle privaten Vorsorgeprodukte, die du bereits hast (z.B. Riester-Rente, private Rentenversicherung, etc.). Die Werte werden zum Rentenbeginn hochgerechnet." />
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Brutto-Werte inkl. Sparprodukte</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {formatEuro(manualProvisionDisplay + storedSavingsDisplay)} €
                    </span>
                  </div>
                  {existingProvisionDetails.length > 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-600 divide-y divide-gray-200">
                      {existingProvisionDetails.map((item) => (
                        <div key={item.id} className="px-3 py-2.5 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-700">{item.label}</p>
                            <p className="text-[11px] uppercase tracking-wide text-gray-400">{item.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-700">{formatEuro(item.amount)} €</p>
                            <p className="text-[11px] text-gray-400">monatlich</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Keine privaten Vorsorgeprodukte hinterlegt.</p>
                  )}
                  <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Sozialabzüge (nur bAV)</span>
                        <InfoButton content="Betriebliche Altersvorsorge (bAV) ist sozialversicherungspflichtig. Auf den Betrag oberhalb des Freibetrags von 187,25 € werden Sozialabgaben fällig." />
                      </div>
                      <span className={`font-medium ${privateSvDeduction > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                        -{formatEuro(privateSvDeduction)} €
                      </span>
                    </div>
                    {privateSvDeduction > 0 && (
                      <div className="flex justify-between text-[11px] text-gray-400 pl-7">
                        <span>Freibetrag 187,25 € berücksichtigt</span>
                        <span>{privateSvRatePercent}%</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{privateTaxLabel}</span>
                        <InfoButton content="Private Vorsorgeprodukte unterliegen der Besteuerung. Je nach Produkttyp (Riester, Basis-Rente, etc.) werden unterschiedliche Steuersätze angewendet." />
                      </div>
                      <span className={`font-medium ${manualCapitalTaxDisplayRounded > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                        -{formatEuro(manualCapitalTaxDisplayRounded)} €
                      </span>
                    </div>
                    {hasIncomeTaxPrivate && (
                      <div className="flex justify-between text-[11px] text-gray-400 pl-7">
                        <span>davon Einkommensteuer</span>
                        <span>-{formatEuro(privateIncomeTaxDisplay)} €</span>
                      </div>
                    )}
                    {hasCapitalTaxPrivate && (
                      <div className="flex justify-between text-[11px] text-gray-400 pl-7">
                        <span>davon Kapitalertragsteuer</span>
                        <span>-{formatEuro(privateCapitalTaxDisplay)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-800">Netto bestehende private Vorsorge</span>
                      <span className="font-bold text-gray-900">{formatEuro(privateNetExistingDisplay)} €</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 pt-1">
                      <span>Durchschnittssteuer (ohne → mit privat)</span>
                      <span>
                        {formatPercent(provisionTaxBreakdown.baseAverageRate)} →{' '}
                        {formatPercent(provisionTaxBreakdown.combinedAverageRate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Grenzsteuersatz zusätzliche Vorsorge</span>
                      <span>{formatPercent(provisionTaxBreakdown.marginalRate)}</span>
                    </div>
                  </div>
                </div>

                {projectedSavingsDisplay > 0 && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="text-blue-900 font-semibold flex items-center gap-2">
                            4. Zusätzliche Rente aus neuer Sparrate
                            <InfoButton content="Dies ist die zusätzliche monatliche Rente, die du durch deine neue Sparrate erhältst. Sie wird basierend auf Sparrate, Rendite und Laufzeit berechnet." />
                          </p>
                          <p className="text-xs text-blue-900/70 mt-1">
                            {formData.monthlySavings} € · {parseFloat(formData.returnRate || '0').toFixed(1)} % Rendite · {formatYears(yearsToRetirementValue)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-blue-900">{formatEuro(projectedSavingsDisplay)} €</span>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-white/80 text-xs text-blue-900 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Brutto</span>
                        <span className="font-medium">{formatEuro(convertToDisplay(savingsProjection.monthlyPensionFutureGross))} €</span>
                      </div>
                      <div className={`flex justify-between items-center ${plannedCapitalTaxDisplayRounded > 0 ? 'text-rose-600' : 'text-blue-500'}`}>
                        <div className="flex items-center gap-2">
                          <span>Kapitalertragsteuer</span>
                          <InfoButton content="Auf die Erträge aus der Sparrate wird Kapitalertragsteuer fällig. Die Berechnung berücksichtigt den Sparer-Pauschbetrag und die Teilfreistellung." />
                        </div>
                        <span className="font-medium">-{formatEuro(plannedCapitalTaxDisplayRounded)} €</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                        <span className="font-semibold">Netto neue Sparrate</span>
                        <span className="font-bold">{formatEuro(projectedSavingsDisplay)} €</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-blue-900/70 pt-1">
                      <div className="flex items-center gap-2">
                        <span>Kapitaläquivalent</span>
                        <InfoButton content="Das Kapitaläquivalent zeigt, welches einmalige Kapital nötig wäre, um die gleiche monatliche Rente zu erzielen. Es wird berechnet als: Monatliche Rente × 12 × Jahre im Ruhestand." />
                      </div>
                      <span className="font-medium">{capitalEquivalentDisplayFormatted} €</span>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-semibold">5. Lücke nach Sparrate</span>
                      <InfoButton content="Dies ist die verbleibende Rentenlücke nach Berücksichtigung der neuen Sparrate. Sie ergibt sich aus der ursprünglichen Lücke minus der zusätzlichen Netto-Rente aus der Sparrate." />
                    </div>
                    <span className={`text-xl font-bold ${remainingGapDisplay > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatEuro(remainingGapDisplay)} €
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Ausgangslücke {formatEuro(gapBeforeSavingsDisplay)} € minus zusätzliche Netto-Rente {formatEuro(projectedSavingsDisplay)} €.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-semibold">6. Notwendiger Kapitalbedarf</span>
                      <InfoButton content={`Um die verbleibende Lücke vollständig zu schließen, wäre ein einmaliges Kapital von ${formatEuro(remainingCapitalRequirementDisplay)} € erforderlich. Dies wird berechnet als: Verbleibende Lücke × 12 × Jahre im Ruhestand / Entnahmerendite (${parseFloat(formData.withdrawalRate || '0').toFixed(1)}%).`} />
                    </div>
                    <span className="text-xl font-bold text-blue-700">{formatEuro(remainingCapitalRequirementDisplay)} €</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Um die verbleibende monatliche Lücke von {formatEuro(remainingGapDisplay)} € zu schließen, wäre bei
                    {` ${parseFloat(formData.withdrawalRate || '0').toFixed(1)} %`} Entnahmerendite ein Kapital von
                    {` ${formatEuro(remainingCapitalRequirementDisplay)} €`} erforderlich. Mit der aktuellen Sparrate erreichst du
                    {` ${savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                    Deckung der ursprünglichen Lücke.
                  </p>
                </div>
              </div>

            </CollapsibleSection>
          </div>
        )}

        {renderDelayScenarioSection('detail')}
      </div>
    )
  }

  const renderStep4 = () => {
    const savingsCoverage = calculateSavingsCoverage()
    const savingsProjection = calculateSavingsProjection()
    const provisionData = calculateProvisionTotals()
    const capitalRequirementData = calculateCapitalRequirement(provisionData)
    const yearsToRetirementValueStep4 = calculateYearsToRetirement() || 0
    const inflationRateValueStep4 = parseFloat(formData.inflationRate || '0') / 100
    const discountFactorStep4 =
      showInCurrentPurchasingPower && yearsToRetirementValueStep4 > 0
        ? Math.pow(1 + inflationRateValueStep4, yearsToRetirementValueStep4)
        : 1
    const convertCapitalDisplayStep4 = (value: number) => {
      if (!value) return 0
      if (showInCurrentPurchasingPower && yearsToRetirementValueStep4 > 0) {
        return value / discountFactorStep4
      }
      return value
    }
    const baseCapitalRequirementDisplayStep4 = convertCapitalDisplayStep4(
      capitalRequirementData.baseCapitalRequirement ?? capitalRequirementData.capitalRequirement,
    )
    const remainingCapitalRequirementDisplayStep4 = convertCapitalDisplayStep4(
      capitalRequirementData.capitalRequirement,
    )
    const capitalEquivalentDisplayStep4 = convertCapitalDisplayStep4(savingsCoverage.capitalEquivalent || 0)
    const gapBeforeDisplayStep4 =
      showInCurrentPurchasingPower ? savingsCoverage.gapBefore / discountFactorStep4 : savingsCoverage.gapBefore
    const gapAfterDisplayStep4 =
      showInCurrentPurchasingPower ? savingsCoverage.gapAfter / discountFactorStep4 : savingsCoverage.gapAfter
    const additionalNetIncomeDisplayStep4 =
      showInCurrentPurchasingPower ? savingsProjection.monthlyPensionCurrent : savingsProjection.monthlyPensionFuture
    const statutoryAttachments = attachments.filter((attachment) => attachment.category === 'statutory')
    const privateAttachments = attachments.filter((attachment) => attachment.category === 'private')
    const remainingStatutorySlots = Math.max(0, 3 - statutoryAttachments.length)
    const remainingPrivateSlots = Math.max(0, 3 - privateAttachments.length)
    const calculationSnapshot = buildCalculationSnapshot()
    const stringifyTemplateValue = (value: unknown): string => {
      if (value === null || value === undefined || value === '') {
        return '–'
      }
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]'
        if (typeof value[0] === 'object') {
          return value
            .map((item) => {
              if (!item) return ''
              if (typeof item === 'object' && 'originalName' in item) {
                return (item as { originalName?: string }).originalName ?? '[Anhang]'
              }
              return JSON.stringify(item)
            })
            .filter(Boolean)
            .join(', ')
        }
        return value.join(', ')
      }
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      return String(value)
    }

    const formatPercentStep4 = (value?: number) =>
      (value ?? 0).toLocaleString('de-DE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

    const templateVariableRows = TEMPLATE_VARIABLES.map(({ key, description }) => {
      const value = htmlTemplateData ? htmlTemplateData[key] : undefined
      return {
        key: String(key),
        description,
        value: htmlTemplateData ? stringifyTemplateValue(value) : '–',
      }
    })

    const baseCalculationVariableRows = [
      { key: 'gapBefore', description: 'Aktuelle Rentenlücke vor geplanter Vorsorge', value: formatEuro(savingsCoverage.gapBefore) + ' €' },
      { key: 'monthlyPensionFutureGross', description: 'Geplante Zusatzeinnahmen aus Sparrate (brutto, ohne Steuer)', value: formatEuro(savingsProjection.monthlyPensionFutureGross) + ' €' },
      { key: 'monthlyPensionFutureNet', description: 'Geplante Zusatzeinnahmen aus Sparrate (netto, nach Steuer)', value: formatEuro(savingsProjection.monthlyPensionFuture) + ' €' },
      { key: 'capitalTaxMonthly', description: 'Steuerabzug auf Sparrate (monatl.)', value: formatEuro(savingsProjection.capitalTaxMonthly) + ' €' },
      { key: 'gapAfter', description: 'Verbleibende Rentenlücke nach Sparrate', value: formatEuro(Math.max(0, savingsCoverage.gapAfter)) + ' €' },
      { key: 'coversPercent', description: 'Abgedeckter Anteil der Lücke durch Sparrate', value: savingsCoverage.coversPercent.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %' },
      { key: 'futureCapital', description: 'Erwartetes Kapital aus Sparrate zum Rentenbeginn', value: formatEuro(savingsProjection.futureCapital) + ' €' },
      { key: 'capitalEquivalent', description: 'Kapitaläquivalent der Sparrate (Lücke × Laufzeit)', value: formatEuro(capitalEquivalentDisplayStep4) + ' €' },
      { key: 'capitalRequirement', description: 'Erforderliches Kapital zur vollständigen Schließung', value: formatEuro(remainingCapitalRequirementDisplayStep4) + ' €' },
      { key: 'combinedAverageTaxRate', description: 'Durchschnittssteuersatz (mit privater Vorsorge)', value: formatPercentStep4(savingsCoverage.combinedAverageTaxRate) },
      { key: 'marginalTaxRate', description: 'Grenzsteuersatz zusätzliche Vorsorge', value: formatPercentStep4(savingsCoverage.marginalTaxRate) },
      { key: 'yearsInRetirement', description: 'Annahmen: Jahre im Ruhestand', value: String(capitalRequirementData.yearsInRetirement ?? 0) },
      { key: 'statutoryGrossCurrent', description: 'Gesetzliche Rente brutto (heutige Kaufkraft)', value: formatEuro(calculationSnapshot.statutory.grossCurrent ?? 0) + ' €' },
      { key: 'statutoryNetCurrent', description: 'Gesetzliche Rente netto (heutige Kaufkraft)', value: formatEuro(calculationSnapshot.statutory.netCurrent ?? 0) + ' €' },
      { key: 'statutoryGrossFuture', description: 'Gesetzliche Rente brutto (nominal zur Rente)', value: formatEuro(calculationSnapshot.statutory.grossFuture ?? 0) + ' €' },
      { key: 'statutoryNetFuture', description: 'Gesetzliche Rente netto (nominal zur Rente)', value: formatEuro(calculationSnapshot.statutory.netFuture ?? 0) + ' €' },
      { key: 'privateGrossCurrent', description: 'Private Vorsorge brutto (heutige Kaufkraft)', value: formatEuro(calculationSnapshot.privateExisting.grossCurrent) + ' €' },
      { key: 'privateNetCurrent', description: 'Private Vorsorge netto (heutige Kaufkraft)', value: formatEuro(calculationSnapshot.privateExisting.netCurrent) + ' €' },
      { key: 'privateGrossFuture', description: 'Private Vorsorge brutto (nominal zur Rente)', value: formatEuro(calculationSnapshot.privateExisting.grossFuture) + ' €' },
      { key: 'privateNetFuture', description: 'Private Vorsorge netto (nominal zur Rente)', value: formatEuro(calculationSnapshot.privateExisting.netFuture) + ' €' },
      { key: 'plannedGrossFuture', description: 'Geplante Vorsorge brutto (nominal zur Rente)', value: formatEuro(calculationSnapshot.planned.grossFuture) + ' €' },
      { key: 'plannedNetFuture', description: 'Geplante Vorsorge netto (nominal zur Rente)', value: formatEuro(calculationSnapshot.planned.netFuture) + ' €' },
      { key: 'plannedNetCurrent', description: 'Geplante Vorsorge netto (heutige Kaufkraft)', value: formatEuro(calculationSnapshot.planned.netCurrent) + ' €' },
      { key: 'requiredSavingsMonthly', description: 'Erforderliche Sparrate zur vollständigen Schließung', value: formatEuro(calculationSnapshot.requiredSavings.monthlySavings) + ' €' },
      { key: 'requiredSavingsNetFuture', description: 'Nettorente aus erforderlicher Sparrate (nominal)', value: formatEuro(calculationSnapshot.requiredSavings.netFuture) + ' €' },
      { key: 'requiredSavingsNetCurrent', description: 'Nettorente aus erforderlicher Sparrate (heutige Kaufkraft)', value: formatEuro(calculationSnapshot.requiredSavings.netCurrent) + ' €' },
    ]

    const parseDelayYearsValueStep4 = (value: string) => {
      const parsed = parseFloat(value || '0')
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
    }

    const delayStartYValueStep4 = parseDelayYearsValueStep4(formData.delayStartYearsY)
    const delayStartZValueStep4 = parseDelayYearsValueStep4(formData.delayStartYearsZ)
    const baseMonthlySavingsValueStep4 = parseFloat(formData.monthlySavings || '0') || 0

    const delayScenarioEntriesStep4 = [
      { id: 'scenarioY' as const, delayYears: delayStartYValueStep4, label: 'Y' },
      { id: 'scenarioZ' as const, delayYears: delayStartZValueStep4, label: 'Z' },
    ]

    const delayScenarioDataStep4 = delayScenarioEntriesStep4.map((entry) => {
      const scenario = computeDelayScenario(entry.delayYears, {
        gapTarget: savingsCoverage.gapBefore,
        baselineProjection: savingsProjection,
        monthlySavings: baseMonthlySavingsValueStep4,
      })
      const delayLabel = scenario.delayYears.toLocaleString('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })
      const capitalDisplay = formatEuro(convertCapitalDisplayStep4(scenario.capitalWithCurrentSavings))
      const interestLossDisplay = formatEuro(convertCapitalDisplayStep4(scenario.interestLoss))
      const requiredMonthlyDisplay = scenario.requiredFeasible ? `${formatEuro(scenario.requiredMonthly)} €` : 'Nicht erreichbar'
      const requiredNetFutureDisplay = scenario.requiredFeasible ? `${formatEuro(scenario.requiredNetFuture)} €` : 'Nicht erreichbar'

      return {
        ...scenario,
        id: entry.id,
        delayLabel,
        capitalDisplay,
        interestLossDisplay,
        requiredMonthlyDisplay,
        requiredNetFutureDisplay,
      }
    })

    const scenarioCalculationRowsStep4 = delayScenarioDataStep4.flatMap((scenario) => [
      {
        key: `delayScenario${scenario.id}Required`,
        description: `Benötigte Sparrate bei Start in ${scenario.delayLabel} Jahren`,
        value: scenario.requiredMonthlyDisplay,
      },
      {
        key: `delayScenario${scenario.id}Capital`,
        description: `Kapital aus aktueller Sparrate bei Start in ${scenario.delayLabel} Jahren`,
        value: `${scenario.capitalDisplay} €`,
      },
      {
        key: `delayScenario${scenario.id}InterestLoss`,
        description: `Zinsverlust bei Start in ${scenario.delayLabel} Jahren`,
        value: `${scenario.interestLossDisplay} €`,
      },
      {
        key: `delayScenario${scenario.id}NetFuture`,
        description: `Netto-Zusatzrente nach Aufholung (${scenario.delayLabel})`,
        value: scenario.requiredNetFutureDisplay,
      },
    ])

    const calculationVariableRows = [...baseCalculationVariableRows, ...scenarioCalculationRowsStep4]

    const renderAnalysisSection = ({
      title,
      icon,
      category,
      attachmentsList,
      strengths,
      weaknesses,
      onStrengthsChange,
      onWeaknessesChange,
      remainingSlots,
      fileInputRef,
    }: {
      title: string
      icon: string
      category: 'statutory' | 'private'
      attachmentsList: ConceptAttachment[]
      strengths: string
      weaknesses: string
      onStrengthsChange: (value: string) => void
      onWeaknessesChange: (value: string) => void
      remainingSlots: number
      fileInputRef: RefObject<HTMLInputElement>
    }) => (
        <div className="space-y-4">
        {title && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!title && <span className="text-xl">{icon}</span>}
          </div>
          <div className="flex items-center gap-2">
              <button
                type="button"
              onClick={() => triggerFileInput(category)}
              disabled={uploading || remainingSlots <= 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
              {uploading ? 'Lade hoch…' : 'Screenshot hochladen'}
              </button>
            <span className="text-xs text-gray-500">
              {remainingSlots > 0 ? `Noch ${remainingSlots} von 3 Dateien möglich` : 'Limit erreicht'}
              </span>
            </div>
          </div>
            <input
              ref={fileInputRef}
              type="file"
          accept="image/*,.pdf"
              multiple
              className="hidden"
          onChange={(event) => handleAttachmentUpload(category, event.target.files)}
          disabled={uploading}
        />
        {uploadError && (
          <p className="text-xs text-red-600">
            {uploadError}
          </p>
        )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachmentsList.length === 0 ? (
              <div className="col-span-full">
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500 bg-gray-50">
                  Noch keine Dokumente hochgeladen.
                </div>
              </div>
            ) : (
            attachmentsList.map((attachment) => (
              <div key={attachment.id} className="border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={attachment.url}
                      alt={attachment.originalName}
                      className="object-contain max-h-full max-w-full"
                    />
                  </div>
                <div className="p-3 space-y-1 text-xs text-gray-600 flex-1 flex flex-col">
                    <div className="font-medium text-gray-800 truncate">{attachment.originalName}</div>
                    <div>Hochgeladen am {new Date(attachment.createdAt).toLocaleString('de-DE')}</div>
                    <div className="text-[11px] text-gray-500">
                      Abrufbar bis {new Date(attachment.expiresAt).toLocaleString('de-DE')}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      disabled={deletingAttachmentId === attachment.id || uploading}
                      className="mt-2 w-full px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {deletingAttachmentId === attachment.id ? 'Entferne…' : 'Entfernen'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Stärken</label>
            <textarea
              value={strengths}
              onChange={(event) => onStrengthsChange(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              rows={4}
              placeholder="Beschreibe, was gut funktioniert."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Schwächen</label>
            <textarea
              value={weaknesses}
              onChange={(event) => onWeaknessesChange(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              rows={4}
              placeholder="Wo entstehen Risiken oder Handlungsbedarf?"
            />
          </div>
        </div>
      </div>
    )

    return (
      <div className="space-y-10">
        {/* Rentenlücke im Überblick - nach oben verschoben */}
        <div className="border rounded-xl p-6 bg-white shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">📉</span>
            <h3 className="text-lg font-semibold text-gray-800">Rentenlücke im Überblick</h3>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                Monatliche Sparrate (€/mtl.)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={formData.monthlySavings}
                onChange={(event) => setFormData((prev) => ({ ...prev, monthlySavings: event.target.value }))}
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          <p className="text-xs text-gray-500">
              Passe den Betrag an, um die Simulation live zu testen. Speichern nicht vergessen, wenn der Wert übernommen werden soll.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-1">Aktuelle Lücke</p>
              <p className="text-2xl font-bold text-blue-800">{formatEuro(gapBeforeDisplayStep4)} €</p>
              <p className="text-[11px] text-blue-700 mt-1">Monatlich, vor geplanter Vorsorge</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-xs uppercase tracking-wide text-green-600 font-semibold mb-1">Geplante Zusatzeinnahmen</p>
              <p className="text-2xl font-bold text-green-700">{formatEuro(additionalNetIncomeDisplayStep4)} €</p>
              <p className="text-[11px] text-green-700 mt-1">Aus Sparrate &amp; Simulation</p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="text-xs uppercase tracking-wide text-purple-600 font-semibold mb-1">Verbleibende Lücke</p>
              <p className={`text-2xl font-bold ${gapAfterDisplayStep4 > 0 ? 'text-purple-700' : 'text-purple-500'}`}>
                {formatEuro(Math.max(0, gapAfterDisplayStep4))} €
              </p>
              <p className="text-[11px] text-purple-700 mt-1">
                Noch offen nach geplanter Vorsorge
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold mb-1">Kapitalbedarf gesamt</p>
              <p className="text-2xl font-bold text-amber-700">
                {formatEuro(baseCapitalRequirementDisplayStep4)} €
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                Davon offen: {formatEuro(remainingCapitalRequirementDisplayStep4)} € ·{' '}
                {capitalRequirementData.yearsInRetirement > 0
                  ? `${capitalRequirementData.yearsInRetirement} Jahre Ruhestand`
                  : 'Aktuell kein Bedarf'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <CollapsibleSection title="📊 Gesetzliche Rentenversicherung – Analyse" defaultOpen={false}>
          {renderAnalysisSection({
              title: '', // Titel wird jetzt vom CollapsibleSection übernommen
            icon: '📊',
            category: 'statutory',
            attachmentsList: statutoryAttachments,
            strengths: formData.statutoryStrengths,
            weaknesses: formData.statutoryWeaknesses,
            onStrengthsChange: (value) => setFormData((prev) => ({ ...prev, statutoryStrengths: value })),
            onWeaknessesChange: (value) => setFormData((prev) => ({ ...prev, statutoryWeaknesses: value })),
            remainingSlots: remainingStatutorySlots,
            fileInputRef: statutoryFileInputRef,
          })}
          </CollapsibleSection>
          <CollapsibleSection title="🏦 Private Vorsorge – Analyse" defaultOpen={false}>
            {renderAnalysisSection({
              title: '', // Titel wird jetzt vom CollapsibleSection übernommen
              icon: '🏦',
              category: 'private',
              attachmentsList: privateAttachments,
              strengths: formData.privateStrengths,
              weaknesses: formData.privateWeaknesses,
              onStrengthsChange: (value) => setFormData((prev) => ({ ...prev, privateStrengths: value })),
              onWeaknessesChange: (value) => setFormData((prev) => ({ ...prev, privateWeaknesses: value })),
              remainingSlots: remainingPrivateSlots,
              fileInputRef: privateFileInputRef,
            })}
          </CollapsibleSection>
        </div>

        {/* DISC Personality-Based Views */}
        <CollapsibleSection title="Persönliche Rentenansicht" defaultOpen={false}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Wähle deine bevorzugte Darstellung der Rentenberechnung
            </p>
          </div>
          {(() => {
            // Berechne requiredSavings für die DISC-Ansichten
            const requiredSavingsForViews = calculateRequiredSavingsForGap()
            const provisionTotalsForViews = calculateProvisionTotals()
            const provisionTaxBreakdownForViews = calculateProvisionTaxBreakdown()
            const manualCapitalTaxFutureForViews = provisionTaxBreakdownForViews.totalPrivateTaxMonthly
            const bavThreshold = 187.25
            const bavKvRate = 0.171
            const bavPvRate = formData.hasChildren ? 0.036 : 0.042
            const totalBavFuture = provisions
              .filter((p) => p.type === 'Betriebliche Altersvorsorge')
              .reduce((sum, p) => sum + (parseFloat(String(p.amount || '0')) || 0), 0)
            const privateSvDeductionFuture = Math.max(0, totalBavFuture - bavThreshold) * (bavKvRate + bavPvRate)
            const privateNetFutureForViews = Math.max(
              0,
              (provisionTotalsForViews.manualFuture || 0) + (provisionTotalsForViews.savingsFuture || 0) - privateSvDeductionFuture - manualCapitalTaxFutureForViews
            )
            
            return (
              <RetirementCalculator 
                calculationData={{
                  gaps: {
                    before: savingsCoverage.gapBefore || 0,
                    after: savingsCoverage.gapAfter || 0,
                    coveragePercent: savingsCoverage.coversPercent || 0,
                  },
                  statutory: {
                    netFuture: statutoryNetFuture || 0,
                  },
                  privateExisting: {
                    netFuture: privateNetFutureForViews,
                  },
                  requiredSavings: {
                    monthlySavings: requiredSavingsForViews.monthlySavings || 0,
                    netFuture: requiredSavingsForViews.netFuture || 0,
                    netCurrent: requiredSavingsForViews.netCurrent || 0,
                  },
                  targetPensionFuture: targetPensionFuture || 0,
                  yearsToRetirement: yearsToRetirement || 0,
                  yearsInRetirement: (() => {
                    const retirementAge = parseInt(formData.desiredRetirementAge || '67')
                    const lifeExpectancy = parseInt(formData.lifeExpectancy || '90')
                    return Math.max(0, lifeExpectancy - retirementAge)
                  })(),
                  capitalNeeded: capitalRequirementData.capitalRequirement || capitalRequirementData.baseCapitalRequirement || 0,
                  retirementAge: parseInt(formData.desiredRetirementAge || '67'),
                  lifeExpectancy: parseInt(formData.lifeExpectancy || '90'),
                  inflationRate: parseFloat(formData.inflationRate || '2.0') / 100,
                  returnRate: parseFloat(formData.returnRate || '4.0') / 100,
                }}
                onActionClick={() => {
                  // Navigiere zur Ergebnis-Seite
                  router.push(`/clients/${initialConcept.clientId}/retirement-concept/${initialConcept.id}/ergebnis`)
                }}
              />
            )
          })()}
        </CollapsibleSection>

        <CollapsibleSection title="Unsere Empfehlung" defaultOpen={false} data-section="recommendation">
          <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="text-lg font-semibold text-gray-800">Unsere Empfehlung</h3>
          </div>
          
          {/* Empfohlene Maßnahmen */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Empfohlene Maßnahmen <span className="text-gray-500 font-normal">(Die errechneten Werte von Vorsorgeprodukten sind geringer als nur mit Prozentzahlen)</span>
            </label>
            <textarea
              value={formData.recommendation}
              onChange={(event) => setFormData((prev) => ({ ...prev, recommendation: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              rows={5}
              placeholder="Beschreibe kurz, wie die Lücke geschlossen werden soll – Produkte, Umsetzungsschritte etc."
            />
          </div>

          {/* Anbieter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Anbieter</label>
            <input
              type="text"
              value={formData.recommendationProvider}
              onChange={(event) => setFormData((prev) => ({ ...prev, recommendationProvider: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="z. B. Allianz, AXA, HDI, etc."
            />
          </div>

          {/* Vorteile */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Vorteile</label>
            <textarea
              value={formData.recommendationAdvantages}
              onChange={(event) => setFormData((prev) => ({ ...prev, recommendationAdvantages: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              rows={4}
              placeholder="Liste die Vorteile der empfohlenen Lösung auf (z. B. Steuervorteile, Flexibilität, Garantien, etc.)"
            />
          </div>

          {/* Zu erwartende Rente */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Zu erwartende Rente (€/Monat)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={formData.expectedRente}
              onChange={(event) => setFormData((prev) => ({ ...prev, expectedRente: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="z. B. 500"
            />
            <p className="text-xs text-gray-500">
              Die monatliche Rente, die der Kunde mit der empfohlenen Lösung erwarten kann.
            </p>
          </div>

          {/* Zusätzliche monatliche Rente durch Empfehlung */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Zusätzliche monatliche Rente durch Empfehlung (€)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={formData.recommendationDelta}
                onChange={(event) => setFormData((prev) => ({ ...prev, recommendationDelta: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z. B. 350"
              />
          <p className="text-xs text-gray-500">
                Optional: Erwartete Netto-Verbesserung pro Monat, wenn die Empfehlung umgesetzt wird.
          </p>
            </div>

          {/* Vorschau-Sektion - erscheint nach Eingabe der erwarteten Rente */}
          {formData.expectedRente && parseFloat(formData.expectedRente) > 0 && (
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 border-2 border-blue-200 rounded-xl shadow-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-white">💡</span>
          </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Das bedeutet für Sie:
                  </h4>
                  <p className="text-lg text-gray-700 mb-4">
                    Mit unserer Empfehlung können Sie eine monatliche Rente von{' '}
                    <span className="font-bold text-blue-700 text-xl">
                      {formatEuro(parseFloat(formData.expectedRente))} €
                    </span>{' '}
                    erwarten.
                  </p>
                  
                  {/* Vergleich mit aktueller Situation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/80 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Aktuelle Situation</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {formatEuro(gapBeforeDisplayStep4)} €
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Monatliche Lücke</p>
        </div>
                    <div className="bg-white/80 rounded-lg p-4 border border-emerald-200">
                      <p className="text-sm text-gray-600 mb-1">Mit Empfehlung</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatEuro(Math.max(0, gapBeforeDisplayStep4 - parseFloat(formData.expectedRente || '0')))} €
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Verbleibende Lücke</p>
                    </div>
                  </div>

                  {/* Call-to-Action */}
                  <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                    <p className="text-base font-semibold text-gray-900 mb-2">
                      ⚡ Jetzt handeln – Ihre Zukunft sichern!
                    </p>
                    <p className="text-sm text-gray-700">
                      {formData.recommendationProvider 
                        ? `Mit ${formData.recommendationProvider} können Sie diese Rente erreichen.`
                        : 'Mit unserer Empfehlung können Sie diese Rente erreichen.'
                      }
                      {formData.recommendationAdvantages && (
                        <span className="block mt-2 text-gray-600">
                          <strong>Vorteile:</strong> {formData.recommendationAdvantages}
                        </span>
                      )}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-800">
                        💰 <strong>Monatliche Verbesserung:</strong>{' '}
                        <span className="text-emerald-700 font-bold">
                          +{formatEuro(parseFloat(formData.expectedRente))} €
                        </span>
                      </p>
                      <p className="text-sm font-medium text-gray-800 mt-2">
                        📈 <strong>Jährliche Verbesserung:</strong>{' '}
                        <span className="text-emerald-700 font-bold">
                          +{formatEuro(parseFloat(formData.expectedRente) * 12)} €
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </CollapsibleSection>
        {isAdmin && (
          <CollapsibleSection title="HTML-Ansicht & Variablen" defaultOpen={false}>
          <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">🧩</span>
              {formData.customTemplateHtml ? (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                  Benutzerdefiniertes Template aktiv
                </span>
              ) : (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  Standard-Template aktiv
                </span>
              )}
              </div>
              <p className="text-xs text-gray-500 max-w-2xl">
                Lade den generierten HTML-Code, passe ihn bei Bedarf an und nutze die Variablenübersicht, um deine
                Inhalte gezielt einzubauen.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={loadHtmlPreview}
                disabled={loadingHtmlPreview}
                className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {loadingHtmlPreview ? 'Lade HTML…' : 'HTML laden'}
              </button>
              <button
                type="button"
                onClick={() => htmlFileInputRef.current?.click()}
                className="px-3 py-2 border border-gray-300 text-xs rounded-lg text-gray-700 hover:bg-gray-100"
              >
                HTML-Datei wählen
              </button>
              <button
                type="button"
                onClick={copyHtmlPreview}
                disabled={!htmlPreview || htmlPreview.length === 0}
                className="px-3 py-2 border border-gray-300 text-xs rounded-lg text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                In Zwischenablage kopieren
              </button>
              <button
                type="button"
                onClick={resetHtmlPreview}
                disabled={!htmlHasChanges}
                className="px-3 py-2 border border-gray-300 text-xs rounded-lg text-gray-500 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Zurücksetzen
              </button>
              <button
                type="button"
                onClick={() => handleSaveHtml()}
                disabled={savingHtml || !htmlPreview}
                className="px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {savingHtml ? 'Speichere…' : 'HTML speichern'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveHtml({ reset: true })}
                disabled={savingHtml || !formData.customTemplateHtml}
                className="px-3 py-2 border border-red-300 text-xs rounded-lg text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Standard wiederherstellen
              </button>
            </div>
          </div>
          <input
            ref={htmlFileInputRef}
            type="file"
            accept=".html,.hbs,.txt"
            className="hidden"
            onChange={(event) => handleHtmlFileSelection(event.target.files)}
          />

          {htmlPreviewError && <p className="text-xs text-red-600">{htmlPreviewError}</p>}

          <textarea
            value={htmlPreview}
            onChange={(event) => handleHtmlPreviewChange(event.target.value)}
            placeholder="Hier erscheint der HTML-Code nach dem Laden – oder füge eigenen Code ein."
            className="w-full font-mono text-xs border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 min-h-[240px] focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
          />

          {htmlCopyFeedback && (
            <p className={`text-xs ${htmlCopyFeedback.tone === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {htmlCopyFeedback.message}
            </p>
          )}

          <p className="text-[11px] text-gray-500">
            Hinweis: Der HTML-Code basiert auf den zuletzt gespeicherten Daten. Nach Änderungen am Konzept bitte
            speichern und den Code erneut laden.
          </p>

          <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Verfügbare Template-Variablen</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left border border-gray-200">
                <thead className="bg-white text-gray-600 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 border-b w-36">Variable</th>
                    <th className="px-3 py-2 border-b">Beschreibung</th>
                    <th className="px-3 py-2 border-b w-56">Aktueller Wert</th>
                  </tr>
                </thead>
                <tbody>
                  {templateVariableRows.map((row) => (
                    <tr key={row.key} className="odd:bg-white even:bg-gray-100">
                      <td className="px-3 py-2 border-b font-medium text-gray-800 align-top">{row.key}</td>
                      <td className="px-3 py-2 border-b text-gray-600 align-top">{row.description}</td>
                      <td className="px-3 py-2 border-b text-gray-700 align-top whitespace-pre-line">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Berechnete Werte (Vorschau)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left border border-gray-200">
                <thead className="bg-white text-gray-600 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 border-b w-44">Schlüssel</th>
                    <th className="px-3 py-2 border-b">Beschreibung</th>
                    <th className="px-3 py-2 border-b w-48">Wert</th>
                  </tr>
                </thead>
                <tbody>
                  {calculationVariableRows.map((row) => (
                    <tr key={row.key} className="odd:bg-white even:bg-gray-100">
                      <td className="px-3 py-2 border-b font-medium text-gray-800 align-top">{row.key}</td>
                      <td className="px-3 py-2 border-b text-gray-600 align-top">{row.description}</td>
                      <td className="px-3 py-2 border-b text-gray-700 align-top whitespace-pre-wrap">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-500">
              Hinweis: Diese Werte dienen zur Orientierung und werden aktuell aus den Formularangaben berechnet. Die PDF verwendet die gespeicherten Daten.
            </p>
          </div>
        </div>
        </CollapsibleSection>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Draft-Wiederherstellungs-Dialog */}
      <DraftRestoreDialog
        isOpen={showRestoreDialog}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftTimestamp={draftTimestamp}
      />
      
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Schritt {currentStep} von {totalSteps}</span>
          <span className="text-sm text-gray-500">
            {currentStep === 1 && 'Basis-Daten & Vorsorge'}
            {currentStep === 2 && 'Renteninformation'}
            {currentStep === 3 && 'Gesamtübersicht'}
            {currentStep === 4 && 'Dokumente & Empfehlung'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        {/* Navigation zwischen Ansichten */}
        <ConceptNavigation
          clientId={initialConcept.clientId}
          conceptId={conceptId}
          activeView={activeView}
        />
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      <div className="flex gap-3 justify-between">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              ← Zurück
            </button>
          )}
          {/* Daten laden Button */}
          <button
            onClick={handleLoadData}
            disabled={saving}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.opacity = '1'
              }
            }}
            title="Lädt die gespeicherten Daten aus der Datenbank"
          >
            {saving ? '⏳ Lade...' : '📥 Daten laden'}
          </button>
          {/* Daten speichern Button */}
          <button
            onClick={handleSaveData}
            disabled={saving || !formData.birthDate || !formData.desiredRetirementAge || !formData.targetPensionNetto}
            style={{
              backgroundColor: 'var(--color-success)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: (saving || !formData.birthDate || !formData.desiredRetirementAge || !formData.targetPensionNetto) ? 'not-allowed' : 'pointer',
              opacity: (saving || !formData.birthDate || !formData.desiredRetirementAge || !formData.targetPensionNetto) ? 0.5 : 1,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!saving && formData.birthDate && formData.desiredRetirementAge && formData.targetPensionNetto) {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && formData.birthDate && formData.desiredRetirementAge && formData.targetPensionNetto) {
                e.currentTarget.style.opacity = '1'
              }
            }}
            title="Speichert die aktuellen Daten in der Datenbank"
          >
            {saving ? '💾 Speichere...' : '💾 Daten speichern'}
          </button>
        </div>
        <div className="flex gap-3">
          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Weiter →
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSave(true)}
                disabled={saving || !formData.birthDate || !formData.desiredRetirementAge || !formData.targetPensionNetto}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '💾 Speichere...' : '💾 Speichern & Ergebnis anzeigen'}
              </button>
              <a
                href={`/clients/${initialConcept.clientId}/retirement-concept/${initialConcept.id}/ergebnis`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📊 Ergebnis anzeigen
              </a>
            </>
          )}
          <a
            href={`/clients/${initialConcept.clientId}`}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Abbrechen
          </a>
        </div>
      </div>

      {/* Modal für Steuerdetails */}
      {showTaxDetailsModal && (() => {
        const currentProjection = calculateSavingsProjection()
        const defaultAcquisitionCosts = formData.acquisitionCosts || (currentProjection.totalPaidIn ?? 0).toFixed(2)
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Steuerdetails für Sparrate</h2>
                <button
                  onClick={() => setShowTaxDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Teilfreistellung (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.partialExemption}
                    onChange={(e) => setFormData({ ...formData, partialExemption: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="30.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard: 30% bei Aktienfonds/ETFs (Investmentsteuergesetz 2018). 15% bei Mischfonds, 60-80% bei Immobilienfonds.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Anschaffungskosten (€)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={defaultAcquisitionCosts}
                    onChange={(e) => setFormData({ ...formData, acquisitionCosts: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="0"
                  />
                    <p className="text-xs text-gray-500 mt-1">
                    Automatisch berechnet: {formatEuro(currentProjection.totalPaidIn ?? 0)} € (eingezahltes Kapital). Kann manuell angepasst werden.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kapitalertragsteuer-Satz (%)
                  </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="100"
                  value={formData.capitalGainsTaxRate}
                  onChange={(e) => setFormData({ ...formData, capitalGainsTaxRate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="26.375"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Standard: 26,375% (25% Abgeltungssteuer + 5,5% Soli). Kann bei anderen Steuersätzen angepasst werden.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Jährlicher Steuerfreibetrag (€)
                  </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={formData.capitalGainsAllowance}
                  onChange={(e) => setFormData({ ...formData, capitalGainsAllowance: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Standard: 1.000 € pro Jahr (Sparer-Pauschbetrag). Wird jährlich von den steuerpflichtigen Erträgen abgezogen.
                  </p>
                </div>
              </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowTaxDetailsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Abbrechen
              </button>
              <button
                onClick={() => setShowTaxDetailsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Sticky Hinweis-Banner für Brutto/Netto-Berechnungen */}
      {advisoryMode && !advisoryNoticeDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-50 border-t-2 border-amber-300 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-semibold text-amber-900 mb-1">Hinweis zu Brutto/Netto-Berechnungen</h5>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Die dargestellten Brutto- und Netto-Beträge stellen <strong>nur eine Beispielrechnung</strong> dar und dienen der ersten Orientierung. 
                  Die tatsächlichen Steuer- und Abgabensätze können individuell variieren und hängen von verschiedenen Faktoren ab (z.B. persönlicher Steuersatz, 
                  weitere Einkünfte, Steuerklasse, etc.). <strong>Wir erbringen keine steuerliche Beratung.</strong> Für eine genaue Berechnung und 
                  steuerliche Beratung empfehlen wir, einen Steuerberater zu konsultieren.
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={handleDismissAdvisoryNotice}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}