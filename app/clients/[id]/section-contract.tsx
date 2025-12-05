"use client"
import { useMemo, useState, useEffect, useRef } from 'react'

type Template = { id: string; name: string; slug: string; description?: string | null; category?: string | null; fields: string }
type ServiceGroup = { id: string; label: string; slugs: string[]; templates: Template[] }

type ServiceSuggestion = { id?: string; name: string; email?: string; address?: string; category?: string }

const SERVICE_CATEGORY = 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)'
const HONORAR_CATEGORY = 'Honorarberatung'

const CATEGORY_LABELS: Record<string, string> = {
  [HONORAR_CATEGORY]: 'Honorarberatung',
  [SERVICE_CATEGORY]: 'Serviceschreiben',
}

const SERVICE_GROUP_DEFINITIONS = [
  {
    id: 'general',
    label: 'Allgemeine Schreiben',
    slugs: [
      'service-beitragsfreistellung',
      'service-beitragsfreistellung-sepa-widerruf',
      'service-beitragsaenderung',
      'service-unterlagen-anfordern',
      'service-kontaktsperre',
      'service-erstkontaktformular',
    ],
  },
  {
    id: 'cancellations',
    label: 'Kündigungen',
    slugs: ['service-kuendigung-auszahlung', 'service-kuendigung-ohne-auszahlung'],
  },
]

const SERVICE_LABELS: Record<string, string> = {
  'service-beitragsfreistellung': 'Beitragsfreistellung erstellen',
  'service-beitragsfreistellung-sepa-widerruf': 'Beitragsfreistellung erstellen',
  'service-beitragsaenderung': 'Beitragsänderung erstellen',
  'service-unterlagen-anfordern': 'Serviceschreiben erstellen',
  'service-kontaktsperre': 'Kontaktsperre erstellen',
  'service-erstkontaktformular': 'Erstkontaktformular erstellen',
  'service-kuendigung-auszahlung': 'Kündigung erstellen',
  'service-kuendigung-ohne-auszahlung': 'Kündigung erstellen',
}

export default function ContractCreator({ 
  clientId, 
  templates,
  customerName,
  customerAddress,
  customerEmail,
  advisorName,
  customerIban
}: { 
  clientId: string
  templates: Template[]
  customerName?: string
  customerAddress?: string
  customerEmail?: string
  advisorName?: string
  customerIban?: string
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selected, setSelected] = useState<string>('')
  const [globalProductType, setGlobalProductType] = useState<string>('')
  const [globalProvider, setGlobalProvider] = useState<string>('')
  const [globalProduct, setGlobalProduct] = useState<string>('')
  const [globalIsNettoPolice, setGlobalIsNettoPolice] = useState<boolean>(false)
  const [globalImportantOptions, setGlobalImportantOptions] = useState<string[]>([])
  const [globalFocusOptions, setGlobalFocusOptions] = useState<string[]>([])
  const [varsState, setVarsState] = useState<Record<string, string>>({
    applicationDate: new Date().toISOString().split('T')[0] // ✅ Heutiges Datum auto-fill
  })
  const [creating, setCreating] = useState(false)
  const [newContractId, setNewContractId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPerson2, setShowPerson2] = useState(false)
  const [showPerson3, setShowPerson3] = useState(false)
  const [serviceQuery, setServiceQuery] = useState('')
  const [serviceSuggestions, setServiceSuggestions] = useState<ServiceSuggestion[]>([])
  const [serviceLoading, setServiceLoading] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [serviceSaving, setServiceSaving] = useState(false)
  const [serviceSaveStatus, setServiceSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [serviceSaveMessage, setServiceSaveMessage] = useState('')
  const [serviceQueryNonce, setServiceQueryNonce] = useState(0)
  const [serviceSearchFailed, setServiceSearchFailed] = useState(false)
  const [selectedServiceGroup, setSelectedServiceGroup] = useState<string>(SERVICE_GROUP_DEFINITIONS[0]?.id ?? 'general')
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null)
  const [visibleCategories, setVisibleCategories] = useState<string[] | null>(null)

  // Benutzertyp und sichtbare Kategorien beim Laden abfragen
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUserRole(data.role)
        setVisibleCategories(data.visibleCategories)
      })
      .catch(() => {
        setUserRole(null)
        setVisibleCategories(null)
      })
  }, [])

  const categoryOptions = useMemo(() => {
    const discovered = new Set<string>()
    templates.forEach((tpl) => {
      if (tpl.category && tpl.category.trim().length > 0) {
        discovered.add(tpl.category)
      }
    })

    const ordered: string[] = []
    if (discovered.has(HONORAR_CATEGORY)) {
      ordered.push(HONORAR_CATEGORY)
      discovered.delete(HONORAR_CATEGORY)
    }
    if (discovered.has(SERVICE_CATEGORY)) {
      ordered.push(SERVICE_CATEGORY)
      discovered.delete(SERVICE_CATEGORY)
    }

    const remaining = Array.from(discovered).sort((a, b) => a.localeCompare(b))
    ordered.push(...remaining)

    if (!ordered.includes(HONORAR_CATEGORY)) {
      ordered.unshift(HONORAR_CATEGORY)
    }
    if (!ordered.includes(SERVICE_CATEGORY)) {
      ordered.push(SERVICE_CATEGORY)
    }

    const filtered = ordered.filter((value, index, self) => self.indexOf(value) === index)
    
    // Filtere basierend auf sichtbaren Kategorien
    if (visibleCategories !== null) {
      // null = Admin sieht alle, [] = Berater sieht keine Honorarverträge
      if (visibleCategories.length === 0) {
        // Leeres Array = keine Honorarverträge
        return filtered.filter(cat => cat !== HONORAR_CATEGORY)
      } else {
        // Spezifische Kategorien ausgewählt
        return filtered.filter(cat => visibleCategories.includes(cat))
      }
    }
    
    // Admin oder keine Einschränkung = alle Kategorien
    return filtered
  }, [templates, visibleCategories])

  const serviceGroups = useMemo<ServiceGroup[]>(() => {
    const baseGroups = SERVICE_GROUP_DEFINITIONS.map((group) => {
      const groupTemplates = templates.filter(
        (tpl) => tpl.category === SERVICE_CATEGORY && group.slugs.includes(tpl.slug)
      )
      return { ...group, templates: groupTemplates }
    })

    const assignedSlugs = new Set(baseGroups.flatMap((group) => group.templates.map((tpl) => tpl.slug)))
    const leftoverTemplates = templates.filter(
      (tpl) => tpl.category === SERVICE_CATEGORY && !assignedSlugs.has(tpl.slug)
    )

    if (leftoverTemplates.length > 0) {
      const generalIndex = baseGroups.findIndex((group) => group.id === 'general')
      if (generalIndex >= 0) {
        baseGroups[generalIndex] = {
          ...baseGroups[generalIndex],
          templates: [...baseGroups[generalIndex].templates, ...leftoverTemplates],
          slugs: Array.from(
            new Set([...baseGroups[generalIndex].slugs, ...leftoverTemplates.map((tpl) => tpl.slug)])
          ),
        }
      } else {
        baseGroups.unshift({
          id: 'general',
          label: 'Allgemeine Schreiben',
          slugs: leftoverTemplates.map((tpl) => tpl.slug),
          templates: leftoverTemplates,
        })
      }
    }

    return baseGroups
  }, [templates])

  useEffect(() => {
    if (!selectedCategory && categoryOptions.length > 0) {
      setSelectedCategory(categoryOptions[0])
    }
    // Wenn Honorar-Kategorie nicht sichtbar ist, zur ersten verfügbaren Kategorie wechseln
    if (selectedCategory === HONORAR_CATEGORY && !categoryOptions.includes(HONORAR_CATEGORY) && categoryOptions.length > 0) {
      setSelectedCategory(categoryOptions[0])
      setSelected('')
    }
  }, [categoryOptions, selectedCategory])

  useEffect(() => {
    if (selectedCategory !== SERVICE_CATEGORY) return
    const activeGroup = serviceGroups.find(
      (group) => group.id === selectedServiceGroup && group.templates.length > 0
    )
    if (activeGroup) return
    const fallbackGroup = serviceGroups.find((group) => group.templates.length > 0) || serviceGroups[0]
    if (fallbackGroup && fallbackGroup.id !== selectedServiceGroup) {
      setSelectedServiceGroup(fallbackGroup.id)
    }
  }, [selectedCategory, selectedServiceGroup, serviceGroups])

  const displayedTemplates = useMemo(() => {
    if (!selectedCategory) return [] as Template[]
    if (selectedCategory === SERVICE_CATEGORY) {
      const group = serviceGroups.find((g) => g.id === selectedServiceGroup)
      return group ? group.templates : []
    }
    return templates.filter((tpl) => (tpl.category || '') === selectedCategory)
  }, [selectedCategory, selectedServiceGroup, serviceGroups, templates])

  useEffect(() => {
    if (!selectedCategory) return
    if (displayedTemplates.length === 0) {
      if (selected) setSelected('')
      return
    }
    const isSelectedInList = displayedTemplates.some((tpl) => tpl.slug === selected)
    if (!isSelectedInList) {
      setSelected('')
    }
  }, [selectedCategory, displayedTemplates, selected])
  
  // Template-zu-Zahlungsart Mapping
  const templatePaymentMapping: Record<string, string> = {
    'verguetungsvereinbarung-sepa': 'Lastschrift',
    'verguetungsvereinbarung-nettoprodukt-sepa': 'Lastschrift',
    'verguetungsvereinbarung-ueberweisung': 'Überweisung',
    'verguetungsvereinbarung-nettoprodukt-ueberweisung': 'Überweisung',
  }
  
  const selectedTemplate = useMemo(() => templates.find(t => t.slug === selected) || null, [selected, templates])
  const selectedTemplateCategory = selectedTemplate?.category ?? ''
  const isServiceTemplate = selectedTemplateCategory === SERVICE_CATEGORY
  
  // Auto-fill customer data when Beratungsprotokoll template is selected
  useEffect(() => {
    if (selected === 'beratungsprotokoll') {
      setVarsState(prev => {
        const updates: Record<string, string> = {}
        if (customerName && !prev.customerName) {
          updates.customerName = customerName
        }
        if (customerAddress && !prev.customerAddress) {
          updates.customerAddress = customerAddress
        }
        if (customerEmail && !prev.customerEmail) {
          updates.customerEmail = customerEmail
        }
        if (advisorName && !prev.intermediarySignature) {
          updates.intermediarySignature = advisorName
        }
        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev
      })
    }
  }, [selected, customerName, customerAddress, customerEmail, advisorName])

  useEffect(() => {
    if (selectedCategory !== SERVICE_CATEGORY) {
      setServiceQuery('')
      setServiceSuggestions([])
      setServiceError(null)
      setServiceLoading(false)
      setServiceSaveStatus('idle')
      setServiceSaveMessage('')
      setServiceSearchFailed(false)
      return
    }

    const controller = new AbortController()
    const term = serviceQuery.trim()

    async function runSearch() {
      setServiceLoading(true)
      setServiceError(null)
      setServiceSearchFailed(false)
      try {
        const res = await fetch(`/api/service/companies?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        if (!res.ok) throw new Error('Suche fehlgeschlagen')
        const json = await res.json()
        setServiceSuggestions(json.results || [])
        setServiceError(null)
        setServiceSearchFailed(false)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        console.error('Service-Suche fehlgeschlagen', err)
        setServiceError('Suche fehlgeschlagen')
        setServiceSuggestions([])
        setServiceSearchFailed(true)
      } finally {
        setServiceLoading(false)
      }
    }

    runSearch()

    return () => controller.abort()
  }, [selectedCategory, serviceQuery, serviceQueryNonce])

  // Standardtextbausteine für Service-Schreiben
  useEffect(() => {
    if (selectedTemplateCategory !== SERVICE_CATEGORY || !selectedTemplate) return

  const defaults: Record<string, Partial<Record<string, string>>> = {
    'service-allgemeines-schreiben': {
      subject: 'Anfrage zu Ihrem Vertrag',
      customBody: 'ich wende mich bezüglich des oben genannten Vertrages an Sie. Bitte teilen Sie mir mit, welche weiteren Unterlagen oder Informationen Sie benötigen. Vielen Dank im Voraus.',
    },
    'service-beitragsfreistellung': {
      subject: 'Beitragsfreistellung',
      customBody: '',
      fileNameCode: 'BTF',
    },
    'service-kuendigung': {
      subject: 'Kündigung des Vertrages',
      customBody: 'von Nachfragen zu Angeboten während der Kündigungsfrist bitte ich abzusehen. Bitte bestätigen Sie mir die Kündigung schriftlich.',
    },
    'service-kuendigung-auszahlung': {
      subject: 'Kündigung mit Auszahlungsanweisung',
      customBody: '',
      fileNameCode: 'Kuendi',
    },
    'service-kuendigung-ohne-auszahlung': {
      subject: 'Kündigung des Vertrages',
      customBody: '',
      fileNameCode: 'Kuendi',
    },
    'service-beitragsfreistellung-sepa-widerruf': {
      subject: 'Beitragsfreistellung und Widerruf des SEPA-Mandats',
      customBody: '',
      fileNameCode: 'BTFSEPA',
    },
    'service-beitragsaenderung': {
      subject: 'Änderung des Beitrags',
      customBody: '',
      fileNameCode: 'BANDR',
    },
    'service-unterlagen-anfordern': {
      subject: 'Anforderung Vertragsunterlagen',
      customBody: '',
      fileNameCode: 'SERV',
    },
    'service-kontaktsperre': {
      subject: 'Kontaktsperre',
      customBody: '',
      fileNameCode: 'KONTS',
    },
    'service-erstkontaktformular': {
      subject: 'Erstkontaktformular',
      customBody: '',
      fileNameCode: 'ERST',
      contactDate: new Date().toISOString().split('T')[0],
      contactTime: new Date().toTimeString().slice(0, 5),
      advisorName: advisorName || '',
    },
  }

    const templateDefaults = defaults[selectedTemplate.slug]
    if (!templateDefaults) return

    setVarsState(prev => {
      const next = { ...prev }
      for (const [key, value] of Object.entries(templateDefaults)) {
        if (key === 'fileNameCode') {
          next[key] = value as string
          continue
        }
        if (!next[key]) {
          next[key] = value as string
        }
      }
      if (!next.policyNumber) {
        next.policyNumber = ''
      }
      return next
    })
  }, [selectedTemplateCategory, selectedTemplate])

  const optionalFields = [
    'contributionSum',
    'proportionalPercent',
    'notes',
    'iban',
    'paymentFrequency',
    'numberOfInstallments',
    'increasedStartAmount',
    'person2Name',
    'person2Provider',
    'person2Product',
    'person2Amount',
    'person3Name',
    'person3Provider',
    'person3Product',
    'person3Amount',
    'totalAmount',
    'customerName',
    'customerAddress',
    'customerWishes',
    'customerWishesProductType',
    'customerWishesImportant',
    'customerNeeds',
    'customerNeedsFocus',
    'riskAssessment',
    'riskAssessmentProductType',
    'insuranceTypes',
    'insuranceTypesProductType',
    'adviceAndReasoning',
    'adviceAndReasoningProductType',
    'adviceAndReasoningProvider',
    'adviceAndReasoningTariff',
    'adviceAndReasoningReason',
    'suitabilitySuitable',
    'suitabilityNotSuitable',
    'suitabilityAttached',
    'customerDecisionFull',
    'customerDecisionPartial',
    'customerDecisionProductType',
    'customerDecisionProvider',
    'customerDecisionTariff',
    'customerDecisionReason',
    'marketResearchObjective',
    'marketResearchBroker',
    'marketResearchMultiAgent',
    'marketResearchInsurers',
    'marketResearchLimited',
    'placeDate',
    'customerSignature',
    'intermediarySignature',
    'additionalNote',
    'servicePackage',
    'consultationType',
    'consultationHours',
    'hourlyRate',
    'terminationDate',
    'noticePeriod',
    'reason',
    'handoverDate',
    'lastWorkingDay',
    'noticeDetails',
    'contactPerson',
    'customBody',
    'fileNameCode',
    'payoutBic',
    'payoutBankName',
    'sepaMandateReference',
    'sepaRevocationDate',
    'reducedAmount',
    'requestedDocuments',
    'contactDate',
    'contactTime',
    'advisorName',
    'contactReasonRecommendation',
    'contactReasonAdvertising',
    'contactReasonDamageReport',
    'contactReasonEvb',
    'contactReasonAdjustment',
    'contactReasonInformation',
    'contactReasonOtherChecked',
    'contactReasonOther',
    'initiatorWishConsultation',
    'initiatorWishOffer',
    'initiatorWishAppointment',
    'initiatorWishEvb',
    'initiatorWishOtherChecked',
    'initiatorWishOther',
    'furtherContactLandline',
    'furtherContactMobile',
    'furtherContactEmail',
    'contractDocumentsProvided',
    'contractDocumentsSending',
    'contractDocumentsPickup',
  ]

  const selectedTemplateFields = useMemo(() => {
    const t = templates.find(t => t.slug === selected)
    if (!t) return [] as string[]
    try { return JSON.parse(t.fields || '[]') as string[] } catch { return [] as string[] }
  }, [selected, templates])

  const requiredTemplateFields = useMemo(() => {
    return selectedTemplateFields.filter((field) => !optionalFields.includes(field))
  }, [selectedTemplateFields, optionalFields])

  const serviceQueryRef = useRef<string>('')
  useEffect(() => {
    if (selectedTemplateCategory === SERVICE_CATEGORY) {
      setServiceQuery(varsState.recipientCompany || '')
    }
  }, [selectedTemplateCategory, varsState.recipientCompany])

  useEffect(() => {
    serviceQueryRef.current = serviceQuery
  }, [serviceQuery])

  useEffect(() => {
    if (selectedCategory !== SERVICE_CATEGORY) return
    const handle = setTimeout(() => {
      if (serviceQueryRef.current === serviceQuery) {
        setServiceQueryNonce((n) => n + 1)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [selectedCategory, serviceQuery])

  function onChangeVar(name: string, value: string) {
    setVarsState((s) => ({ ...s, [name]: value }))
  }
  
  // Wenn globale Produktart geändert wird, fülle alle Produktart-Felder
  function onChangeGlobalProductType(productType: string) {
    setGlobalProductType(productType)
    
    // Fülle alle Produktart-Felder automatisch
    const productTypeFields = [
      'customerWishesProductType',
      'riskAssessmentProductType',
      'insuranceTypesProductType',
      'adviceAndReasoningProductType',
      'customerDecisionProductType'
    ]
    
    productTypeFields.forEach(field => {
      onChangeVar(field, productType)
    })
  }
  
  // Wenn globaler Anbieter geändert wird, fülle alle Anbieter-Felder
  function onChangeGlobalProvider(provider: string) {
    setGlobalProvider(provider)
    
    // Fülle alle Anbieter-Felder automatisch
    const providerFields = [
      'adviceAndReasoningProvider',
      'customerDecisionProvider'
    ]
    
    providerFields.forEach(field => {
      onChangeVar(field, provider)
    })
  }
  
  // Wenn globales Produkt geändert wird, fülle alle Produkt-Felder
  function onChangeGlobalProduct(product: string) {
    setGlobalProduct(product)
    
    // Fülle alle Produkt-Felder automatisch
    const productFields = [
      'adviceAndReasoningTariff',
      'customerDecisionTariff'
    ]
    
    productFields.forEach(field => {
      onChangeVar(field, product)
    })
  }
  
  // Wenn Nettopolice-Status geändert wird, passe Textbausteine an
  function onChangeGlobalIsNettoPolice(isNetto: boolean) {
    setGlobalIsNettoPolice(isNetto)
    // Kann später für spezifische Textanpassungen genutzt werden
  }
  
  // Wenn "Wichtig ist" Optionen geändert werden, fülle automatisch customerWishes
  function onChangeGlobalImportantOptions(options: string[]) {
    setGlobalImportantOptions(options)
    
    if (globalProductType && options.length > 0) {
      // Baue Textbaustein basierend auf Produktart und wichtigen Optionen
      let importantText = options.join(', ')
      if (options.length > 1) {
        importantText = options.slice(0, -1).join(', ') + ' und ' + options[options.length - 1]
      }
      
      // Generiere customerWishes basierend auf Produktart
      const productTexts: Record<string, string> = {
        'Basisrente': `Der Kunde wünscht eine Basisrente (Rürup), um steuerlich gefördert für das Alter vorzusorgen. Besonderes Augenmerk liegt auf der steuerlichen Absetzbarkeit als Sonderausgabe sowie der langfristigen Vermögensbildung durch ETF-basierte Anlagen. Wichtig ist ${importantText}.`,
        'Riester': `Der Kunde wünscht eine Riester-Rente, um von staatlichen Zulagen und Steuervorteilen zu profitieren. Besonders wichtig ist die Kombination aus staatlicher Förderung und der Möglichkeit, die Zulagen durch eigene Beiträge zu erhöhen. Wichtig ist ${importantText}.`,
        'bAV': `Der Kunde wünscht eine betriebliche Altersvorsorge (bAV), um über den Arbeitgeber steuer- und sozialversicherungsbegünstigt Altersvorsorge zu betreiben. Wichtig ist die Kombination aus Arbeitgeberzuschuss und steuerlichen Vorteilen. Wichtig ist ${importantText}.`,
        'Flexible Rentenversicherung': `Der Kunde wünscht eine flexible Rentenversicherung${globalIsNettoPolice ? ' (Honorar-Nettopolice)' : ''}, um kostentransparent und flexibel Vermögen mit ETFs aufzubauen. Besonders wichtig sind freie Fondswahl, Kostenklarheit und flexible Beitragsanpassungen. Wichtig ist ${importantText}.`
      }
      
      const generatedText = productTexts[globalProductType] || `Der Kunde wünscht eine ${globalProductType}. Wichtig ist ${importantText}.`
      setVarsState(prev => ({ 
        ...prev, 
        customerWishes: generatedText,
        customerWishesImportant: options.join(', ')
      }))
    } else if (options.length === 0 && globalProductType) {
      // Wenn keine Optionen mehr ausgewählt, entferne "Wichtig ist" Teil
      setVarsState(prev => ({ 
        ...prev, 
        customerWishesImportant: ''
      }))
    }
  }
  
  // Wenn "Fokus liegt auf" Optionen geändert werden, fülle automatisch customerNeeds
  function onChangeGlobalFocusOptions(options: string[]) {
    setGlobalFocusOptions(options)
    
    if (options.length > 0) {
      let focusText = options.join(', ')
      if (options.length > 1) {
        focusText = options.slice(0, -1).join(', ') + ' und ' + options[options.length - 1]
      }
      
      const generatedText = `Es besteht ein Bedarf zur Schließung der Rentenlücke und zum langfristigen Vermögensaufbau. Besonderer Fokus liegt auf ${focusText}.`
      setVarsState(prev => ({ 
        ...prev, 
        customerNeeds: generatedText,
        customerNeedsFocus: focusText
      }))
    } else {
      // Wenn keine Optionen mehr ausgewählt, entferne Fokus-Text
      setVarsState(prev => ({ 
        ...prev, 
        customerNeedsFocus: ''
      }))
    }
  }
  
  // Automatisch Textbausteine generieren wenn Produktart oder andere zentrale Werte geändert werden
  useEffect(() => {
    if (selected === 'beratungsprotokoll' && globalProductType) {
      // Generiere riskAssessment automatisch
      const riskTexts: Record<string, string> = {
        'Basisrente': 'Das empfohlene Produkt ist eine Basisrente (Rürup). Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Besonders zu beachten ist die eingeschränkte Kapitalverfügbarkeit bis zur Rente. Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte (Sonderausgabenabzug) wurden berücksichtigt.',
        'Riester': 'Das empfohlene Produkt ist eine Riester-Rente. Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Besonders zu beachten ist die Möglichkeit von Zulagenrückforderungen bei vorzeitigem Ausscheiden. Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte und Zulagen wurden berücksichtigt.',
        'bAV': 'Das empfohlene Produkt ist eine betriebliche Altersvorsorge (bAV). Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte wurden berücksichtigt.',
        'Flexible Rentenversicherung': 'Das empfohlene Produkt ist eine flexible Rentenversicherung. Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte wurden berücksichtigt.'
      }
      
      // Nur setzen wenn noch leer oder Platzhalter enthalten
      if (!varsState.riskAssessment || varsState.riskAssessment.includes('[Produktart]') || varsState.riskAssessment === '') {
        const riskText = riskTexts[globalProductType] || `Das empfohlene Produkt ist eine ${globalProductType}. Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte wurden berücksichtigt.`
        setVarsState(prev => ({ ...prev, riskAssessment: riskText }))
      }
      
      // Generiere insuranceTypes automatisch
      if (!varsState.insuranceTypes || varsState.insuranceTypes === '') {
        const insuranceText = `Verglichen wurden klassische Rentenversicherung, fondsgebundene Rentenversicherung und die gewählte Lösung. Der Kunde hat sich bewusst für die ${globalProductType} entschieden, da diese am besten zu seinen Zielen passt.`
        setVarsState(prev => ({ ...prev, insuranceTypes: insuranceText }))
      }
      
      // Generiere adviceAndReasoning wenn Anbieter und Produkt vorhanden
      if (globalProvider && globalProduct && (!varsState.adviceAndReasoning || varsState.adviceAndReasoning.includes('[Produktart'))) {
        const adviceText = `Die Wahl fiel auf die ${globalProductType} (${globalProvider}, ${globalProduct}), da diese niedrigere Kosten im Vergleich zu klassischen Produkten bietet. Durch die Honorarstruktur und ETF-Basis ergeben sich langfristig erhebliche Kostenvorteile.`
        setVarsState(prev => ({ ...prev, adviceAndReasoning: adviceText }))
      }
    }
  }, [globalProductType, globalProvider, globalProduct, selected])

  function getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      product: 'Produkt/Service',
      amountEUR: 'Honorarhöhe (EUR)',
      iban: 'IBAN',
      notes: 'Notizen',
      interval: 'Intervall',
      bookingStart: 'Buchungsbeginn',
      applicationDate: 'Antragsdatum',
      productProvider: 'Anbieter',
      productDescription: 'Produkt',
      contributionSum: 'Beitragssumme',
      proportionalPercent: 'Anteilige Prozent',
      paymentFrequency: 'Zahlweise',
      paymentMethod: 'Zahlungsart',
      paymentInterval: 'Zahlungsintervall',
      numberOfInstallments: 'Anzahl Raten',
      increasedStartAmount: 'Erhöhte Startpauschale (EUR)',
      installmentAmount: 'Ratenhöhe (EUR)',
      clientIban: 'IBAN Kunde',
      advisorIban: 'IBAN Berater',
      paymentSubject: 'Verwendungszweck',
      servicePackage: 'Servicepauschale',
      person2Name: '2. Person (Name)',
      person2Provider: '2. Person Anbieter',
      person2Product: '2. Person Produkt',
      person2Amount: '2. Person Honorar (EUR)',
      person3Name: '3. Person (Name)',
      person3Provider: '3. Person Anbieter',
      person3Product: '3. Person Produkt',
      person3Amount: '3. Person Honorar (EUR)',
      totalAmount: 'Gesamthonorar (EUR)',
      customerName: 'Kunde (Name)',
      customerAddress: 'Anschrift',
      customerWishes: '1.1 Kundenwünsche / Anlass der Beratung',
      customerWishesProductType: '1.1 Produktart',
      customerWishesImportant: '1.1 Wichtig ist',
      customerWishesImportantCustom: '1.1 Wichtig ist (eigener Text)',
      customerNeeds: '1.2 Kundenbedarf',
      customerNeedsFocus: '1.2 Fokus liegt auf',
      customerNeedsFocusCustom: '1.2 Fokus liegt auf (eigener Text)',
      riskAssessment: '2.1 Risikobewertung / Komplexität',
      riskAssessmentProductType: '2.1 Produktart',
      insuranceTypes: '2.2 In Betracht kommende Versicherungsarten',
      insuranceTypesProductType: '2.2 Produktart',
      adviceAndReasoning: '2.3 Rat und Begründung',
      adviceAndReasoningProductType: '2.3 Produktart',
      adviceAndReasoningProvider: '2.3 Anbieter',
      adviceAndReasoningTariff: '2.3 Tarif',
      adviceAndReasoningReason: 'Zusätzliche Begründung',
      suitabilitySuitable: '2.4 Geeignet und angemessen',
      suitabilityNotSuitable: '2.4 Nicht geeignet oder nicht angemessen (Kunde möchte trotzdem erwerben)',
      suitabilityAttached: '2.4 Geeignetheitsprüfung als Anhang beigefügt',
      customerDecisionFull: '2.5 Kunde folgt Rat vollständig',
      customerDecisionPartial: '2.5 Kunde folgt Rat nicht/nicht vollständig',
      customerDecisionProductType: '2.5 Produktart',
      customerDecisionProvider: '2.5 Anbieter',
      customerDecisionTariff: '2.5 Tarif',
      customerDecisionReason: '2.5 Begründung (wenn nicht vollständig)',
      marketResearchObjective: '3. Objektive, ausgewogene Marktuntersuchung',
      marketResearchBroker: '3. Versicherungsmakler',
      marketResearchMultiAgent: '3. Mehrfachgeneralagent',
      marketResearchInsurers: '3. Versicherer (Liste)',
      marketResearchLimited: '3. Beschränkte Anzahl Versicherer (Kunde hat Namen nicht verlangt)',
      placeDate: 'Ort, Datum',
      customerSignature: 'Kunde (Unterschrift)',
      intermediarySignature: 'Vermittler (Unterschrift)',
      additionalNote: 'Zusatzhinweis (immer einfügen)',
      totalAmount: 'Gesamtbetrag',
      consultationType: 'Beratungsart',
      consultationHours: 'Beratungsstunden',
      hourlyRate: 'Stundensatz',
      terminationDate: 'Kündigungsdatum',
      noticePeriod: 'Kündigungsfrist',
      reason: 'Kündigungsgrund',
      handoverDate: 'Übergabedatum',
      lastWorkingDay: 'Letzter Arbeitstag',
      noticeDetails: 'Details',
      recipientCompany: 'Empfänger (Unternehmen)',
      recipientEmail: 'Empfänger E-Mail',
      recipientAddress: 'Empfänger Anschrift',
      contactPerson: 'Ansprechpartner (optional)',
      policyNumber: 'Vertrags-/Policennummer',
      subject: 'Betreff',
      customBody: 'Optionaler zusätzlicher Text',
      fileNameCode: 'Datei-Kürzel',
      effectiveDate: 'Wirksam zum',
      responseDeadline: 'Frist (Antwort bis)',
      sepaMandateReference: 'SEPA-Mandatsreferenz',
      sepaRevocationDate: 'SEPA-Widerruf gültig ab',
      reducedAmount: 'Gewünschter Beitrag (EUR)',
      requestedDocuments: 'Benötigte Unterlagen',
      payoutIban: 'Auszahlung IBAN',
      payoutBic: 'Auszahlung BIC',
      payoutBankName: 'Auszahlung Bankname',
      contactDate: 'Datum des Erstkontakts (TT.MM.JJJJ)',
      contactTime: 'Uhrzeit des Erstkontakts (HH:MM)',
      advisorName: 'Vermittler (Vor- und Nachname)',
      contactReasonRecommendation: 'Grund – Empfehlung (ankreuzen, wenn zutreffend)',
      contactReasonAdvertising: 'Grund – Werbung (ankreuzen, wenn zutreffend)',
      contactReasonDamageReport: 'Grund – Schadenmeldung (ankreuzen, wenn zutreffend)',
      contactReasonEvb: 'Grund – eVB (ankreuzen, wenn zutreffend)',
      contactReasonAdjustment: 'Grund – Beitragsanpassung / Kündigung (ankreuzen, wenn zutreffend)',
      contactReasonInformation: 'Grund – Informationswunsch (ankreuzen, wenn zutreffend)',
      contactReasonOtherChecked: 'Grund – Sonstiges (ankreuzen und unten beschreiben)',
      contactReasonOther: 'Sonstiges (Grund) – kurzer Freitext',
      initiatorWishConsultation: 'Wunsch – Übernahme der Betreuung (ankreuzen, wenn gewünscht)',
      initiatorWishOffer: 'Wunsch – Angebot (ankreuzen, wenn gewünscht)',
      initiatorWishAppointment: 'Wunsch – Termin (ankreuzen, wenn gewünscht)',
      initiatorWishEvb: 'Wunsch – eVB ausgestellt (ankreuzen und Angaben ergänzen)',
      initiatorWishOtherChecked: 'Wunsch – Sonstiges (ankreuzen und unten beschreiben)',
      initiatorWishOther: 'Sonstiges (Wunsch) – kurzer Freitext',
      furtherContactLandline: 'Weitere Kontaktaufnahme via Festnetz (ankreuzen, wenn zutreffend)',
      furtherContactMobile: 'Weitere Kontaktaufnahme via Mobilnummer (ankreuzen, wenn zutreffend)',
      furtherContactEmail: 'Weitere Kontaktaufnahme via E-Mail (ankreuzen, wenn zutreffend)',
      contractDocumentsProvided: 'Unterlagen bereits übergeben (ankreuzen, wenn zutreffend)',
      contractDocumentsSending: 'Unterlagen werden nachgereicht (ankreuzen, wenn zutreffend)',
      contractDocumentsPickup: 'Unterlagen sollen abgeholt werden (ankreuzen, wenn zutreffend)'
    }
    return labels[field] || field
  }

  function getFieldType(field: string): string {
    if (
      field === 'bookingStart' ||
      field === 'applicationDate' ||
      field === 'terminationDate' ||
      field === 'handoverDate' ||
      field === 'lastWorkingDay' ||
      field === 'effectiveDate' ||
      field === 'responseDeadline' ||
      field === 'sepaRevocationDate' ||
      field === 'contactDate'
    ) return 'date'
    if (field === 'contactTime') return 'time'
    if (
      field === 'amountEUR' ||
      field === 'contributionSum' ||
      field === 'totalAmount' ||
      field === 'hourlyRate' ||
      field === 'increasedStartAmount' ||
      field === 'installmentAmount' ||
      field === 'person2Amount' ||
      field === 'person3Amount' ||
      field === 'reducedAmount'
    ) return 'number'
    if (field === 'proportionalPercent') return 'number'
    if (field === 'consultationHours') return 'number'
    if (field === 'numberOfInstallments') return 'number'
    if (field === 'recipientEmail') return 'email'
    const checkboxFields = new Set([
      'contactReasonRecommendation',
      'contactReasonAdvertising',
      'contactReasonDamageReport',
      'contactReasonEvb',
      'contactReasonAdjustment',
      'contactReasonInformation',
      'contactReasonOtherChecked',
      'initiatorWishConsultation',
      'initiatorWishOffer',
      'initiatorWishAppointment',
      'initiatorWishEvb',
      'initiatorWishOtherChecked',
      'furtherContactLandline',
      'furtherContactMobile',
      'furtherContactEmail',
      'contractDocumentsProvided',
      'contractDocumentsSending',
      'contractDocumentsPickup',
    ])
    if (checkboxFields.has(field)) return 'checkbox'
    return 'text'
  }

  function renderFieldInput(field: string) {
    const value = varsState[field] || ''
    const label = getFieldLabel(field)
    const type = getFieldType(field)

    if (field === 'paymentFrequency') {
      return (
        <select value={value} onChange={(e) => onChangeVar(field, e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="">Bitte wählen…</option>
          <option value="Einmalzahlung">Einmalzahlung</option>
          <option value="Ratenzahlung">Monatliche Ratenzahlung</option>
          <option value="Ratenzahlung mit erhöhter Startzahlung">Erhöhte Anfangspauschale + monatliche Raten</option>
        </select>
      )
    }
    
    // Radio-Buttons für "Geeignet und angemessen" - nur eine Auswahl möglich
    if (field === 'suitabilitySuitable' || field === 'suitabilityNotSuitable') {
      return (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">⚠️ Bitte wählen Sie nur eine Option:</p>
          <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white rounded">
            <input
              type="radio"
              name="suitability"
              checked={value === 'true' || value === true}
              onChange={() => {
                // Wenn diese Option gewählt wird, setze die andere auf false
                if (field === 'suitabilitySuitable') {
                  onChangeVar('suitabilitySuitable', 'true')
                  onChangeVar('suitabilityNotSuitable', '')
                } else {
                  onChangeVar('suitabilityNotSuitable', 'true')
                  onChangeVar('suitabilitySuitable', '')
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm leading-relaxed">{getFieldLabel(field)}</span>
          </label>
        </div>
      )
    }
    
    // Checkbox für "Geeignetheitsprüfung als Anhang" - kann zusätzlich gewählt werden
    if (field === 'suitabilityAttached') {
      return (
        <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
          <input
            type="checkbox"
            checked={value === 'true' || value === true}
            onChange={(e) => onChangeVar(field, e.target.checked ? 'true' : '')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
          />
          <span className="text-sm leading-relaxed">{getFieldLabel(field)}</span>
        </label>
      )
    }

    if (type === 'checkbox') {
      const checked = value === 'true' || value === 'on' || value === '1'
      return (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChangeVar(field, e.target.checked ? 'true' : '')}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      )
    }
    
    // Radio-Buttons für "Kundenentscheidung" - nur eine Auswahl möglich
    if (field === 'customerDecisionFull' || field === 'customerDecisionPartial') {
      return (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">⚠️ Bitte wählen Sie nur eine Option:</p>
          <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white rounded">
            <input
              type="radio"
              name="customerDecision"
              checked={value === 'true' || value === true}
              onChange={() => {
                // Wenn diese Option gewählt wird, setze die andere auf false
                if (field === 'customerDecisionFull') {
                  onChangeVar('customerDecisionFull', 'true')
                  onChangeVar('customerDecisionPartial', '')
                } else {
                  onChangeVar('customerDecisionPartial', 'true')
                  onChangeVar('customerDecisionFull', '')
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm leading-relaxed">{getFieldLabel(field)}</span>
          </label>
        </div>
      )
    }
    
    // Radio-Buttons für Marktuntersuchung - nur eine Auswahl möglich
    // Alle vier Optionen werden zusammen als Gruppe angezeigt (nur wenn marketResearchObjective gerendert wird)
    if (field === 'marketResearchObjective') {
      return (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">⚠️ Bitte wählen Sie nur eine Option:</p>
          <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white rounded">
            <input
              type="radio"
              name="marketResearch"
              checked={varsState['marketResearchObjective'] === 'true'}
              onChange={() => {
                onChangeVar('marketResearchObjective', 'true')
                onChangeVar('marketResearchBroker', '')
                onChangeVar('marketResearchMultiAgent', '')
                onChangeVar('marketResearchLimited', '')
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm leading-relaxed">{getFieldLabel('marketResearchObjective')}</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white rounded">
            <input
              type="radio"
              name="marketResearch"
              checked={varsState['marketResearchBroker'] === 'true'}
              onChange={() => {
                onChangeVar('marketResearchObjective', '')
                onChangeVar('marketResearchBroker', 'true')
                onChangeVar('marketResearchMultiAgent', '')
                onChangeVar('marketResearchLimited', '')
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm leading-relaxed">{getFieldLabel('marketResearchBroker')}</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white rounded">
            <input
              type="radio"
              name="marketResearch"
              checked={varsState['marketResearchMultiAgent'] === 'true'}
              onChange={() => {
                onChangeVar('marketResearchObjective', '')
                onChangeVar('marketResearchBroker', '')
                onChangeVar('marketResearchMultiAgent', 'true')
                onChangeVar('marketResearchLimited', '')
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm leading-relaxed">{getFieldLabel('marketResearchMultiAgent')}</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white rounded">
            <input
              type="radio"
              name="marketResearch"
              checked={varsState['marketResearchLimited'] === 'true'}
              onChange={() => {
                onChangeVar('marketResearchObjective', '')
                onChangeVar('marketResearchBroker', '')
                onChangeVar('marketResearchMultiAgent', '')
                onChangeVar('marketResearchLimited', 'true')
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm leading-relaxed">{getFieldLabel('marketResearchLimited')}</span>
          </label>
        </div>
      )
    }
    
    // Die anderen Marktuntersuchungs-Felder werden nicht einzeln angezeigt (werden oben als Gruppe gerendert)
    if (field === 'marketResearchBroker' || field === 'marketResearchMultiAgent' || field === 'marketResearchLimited') {
      return null
    }
    
    // Dropdown für Produktart-Auswahl
    if (field === 'customerWishesProductType' || field === 'riskAssessmentProductType' || 
        field === 'insuranceTypesProductType' || field === 'adviceAndReasoningProductType' || 
        field === 'customerDecisionProductType') {
      const predefinedOptions = ['Basisrente', 'Riester', 'bAV', 'Flexible Rentenversicherung', 'Honorar-Nettopolice']
      const currentValue = value || ''
      const isPredefined = predefinedOptions.includes(currentValue)
      const showCustomInput = !isPredefined && currentValue !== ''
      
      return (
        <div className="space-y-2">
          <select 
            value={isPredefined ? currentValue : (showCustomInput ? 'custom' : '')} 
            onChange={(e) => {
              const selected = e.target.value
              if (selected === 'custom') {
                // Lass Wert bestehen, zeige Custom-Input
              } else if (selected === '') {
                onChangeVar(field, '')
              } else {
                onChangeVar(field, selected)
              }
            }} 
            className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Bitte wählen oder eigenen Text eingeben</option>
            {predefinedOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="custom">Eigener Text</option>
          </select>
          {(varsState[field + 'Select'] === 'custom' || showCustomInput) && (
            <input
              type="text"
              value={value}
              onChange={(e) => onChangeVar(field, e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Eigene Produktart eingeben..."
              onFocus={() => onChangeVar(field + 'Select', 'custom')}
            />
          )}
        </div>
      )
    }
    
    // "Wichtig ist" / "Fokus liegt auf" - werden oben zentral ausgewählt, hier nur noch editierbar
    if (field === 'customerWishesImportant' || field === 'customerNeedsFocus') {
      // Diese Felder werden nicht mehr angezeigt, da sie oben zentral ausgewählt werden
      return null
    }
    
    // Textfeld für 1.1 Kundenwünsche (wird automatisch oben generiert, aber editierbar)
    if (field === 'customerWishes') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          placeholder="Wird automatisch basierend auf den zentralen Angaben generiert. Hier anpassen..."
        />
      )
    }
    
    // Textfeld für 1.2 Kundenbedarf (wird automatisch oben generiert, aber editierbar)
    if (field === 'customerNeeds') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          placeholder="Wird automatisch basierend auf den zentralen Angaben generiert. Hier anpassen..."
        />
      )
    }
    
    // Textfeld für 2.3 Rat und Begründung (wird automatisch generiert, aber editierbar)
    if (field === 'adviceAndReasoning') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          placeholder="Wird automatisch basierend auf den zentralen Angaben generiert. Hier anpassen..."
        />
      )
    }
    
    // Textfeld für adviceAndReasoningReason (normal editierbar, kein Dropdown)
    if (field === 'adviceAndReasoningReason') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
          placeholder="Begründung eingeben..."
        />
      )
    }
    
    // Textfeld für 2.1 Risikobewertung (wird automatisch generiert, aber editierbar)
    if (field === 'riskAssessment') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          placeholder="Wird automatisch basierend auf der Produktart generiert. Hier anpassen..."
        />
      )
    }
    
    // Standard-Textarea für andere Felder im Beratungsprotokoll
    if (field === 'insuranceTypes' || field === 'customerDecisionReason' || field === 'additionalNote') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          placeholder="Text eingeben..."
        />
      )
    }
    
    // Einzeilige Textfelder für Beratungsprotokoll
    if (field === 'customerName' || field === 'customerAddress' || field === 'marketResearchInsurers' ||
        field === 'placeDate' || field === 'customerSignature' || field === 'intermediarySignature') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={field === 'customerName' ? 'z.B. Max Mustermann' : field === 'customerAddress' ? 'z.B. Musterstraße 1, 12345 Musterstadt' : field === 'placeDate' ? 'z.B. Berlin, 30.05.2025' : ''}
        />
      )
    }

    if (field === 'paymentInterval') {
      return (
        <select value={value} onChange={(e) => onChangeVar(field, e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="">Bitte wählen…</option>
          <option value="Monatlich">Monatlich</option>
          <option value="Quartalsweise">Quartalsweise</option>
          <option value="Halbjährlich">Halbjährlich</option>
          <option value="Jährlich">Jährlich</option>
          <option value="Einmalig">Einmalig</option>
        </select>
      )
    }

    if (field === 'servicePackage') {
      // Später erweiterbar mit eigenen Paketen aus der DB/Config
      return (
        <select value={value} onChange={(e) => onChangeVar(field, e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="">Bitte wählen…</option>
          <option value="Beispiel 1">Beispiel 1</option>
          <option value="Beispiel 2">Beispiel 2</option>
          {/* TODO: Hier später Pakete aus DB/Config laden */}
        </select>
      )
    }

    if (field === 'consultationType') {
      return (
        <select value={value} onChange={(e) => onChangeVar(field, e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="">Bitte wählen…</option>
          <option value="Strategieberatung">Strategieberatung</option>
          <option value="Finanzberatung">Finanzberatung</option>
          <option value="Rechtsberatung">Rechtsberatung</option>
          <option value="Steuerberatung">Steuerberatung</option>
          <option value="Unternehmensberatung">Unternehmensberatung</option>
        </select>
      )
    }

    if (field === 'customBody' || field === 'noticeDetails') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          rows={field === 'customBody' ? 5 : 4}
          placeholder={field === 'customBody' ? 'Optionalen Zusatztext einfügen…' : undefined}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )
    }

    if (field === 'fileNameCode') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value.toUpperCase())}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. BTF oder KUENDI"
          maxLength={12}
        />
      )
    }

    if (field === 'requestedDocuments') {
      const options = [
        'Ursprüngliches Versicherungsangebot mit allen wichtigen Daten',
        'Ursprünglicher Versicherungsschein',
        'Aktuelle Standmitteilungen',
        'Versicherungsantrag',
        'Anschreiben zur Übersendung des Versicherungsscheins',
        'Versicherungsbedingungen',
        'Verbraucherinformationen',
        'Sämtliche Nachträge zum Versicherungsschein',
        'Sämtliche Standmitteilungen (fondsgebundene Verträge)',
        'Letzte Standmitteilung (klassische Verträge)',
        'Abrechnungsschreiben bei Auszahlungen'
      ]
      const selected = (value || '').split('|').filter(Boolean)

      const toggleOption = (option: string) => {
        const isSelected = selected.includes(option)
        const next = isSelected ? selected.filter((o) => o !== option) : [...selected, option]
        onChangeVar(field, next.join('|'))
      }

      return (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">Welche Unterlagen sollen angefordert werden?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map((option) => {
              const id = `${field}-${option}`
              const isChecked = selected.includes(option)
              return (
                <label key={option} htmlFor={id} className="flex items-start gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-blue-400">
                  <input
                    id={id}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOption(option)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs leading-relaxed text-gray-700">{option}</span>
                </label>
              )
            })}
          </div>
          {selected.length > 0 && (
            <div className="text-xs text-gray-500">
              Ausgewählt: {selected.length}
            </div>
          )}
        </div>
      )
    }

    if (field === 'recipientAddress' && selectedTemplateCategory === SERVICE_CATEGORY) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChangeVar(field, e.target.value)}
          rows={3}
          className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Musterstraße 1, 12345 Musterstadt"
        />
      )
    }

    if (field === 'recipientCompany' && selectedTemplateCategory === SERVICE_CATEGORY) {
      return (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={serviceQuery}
              onChange={(e) => {
                const val = e.target.value
                setServiceQuery(val)
                setServiceSearchFailed(false)
                setServiceSaveStatus('idle')
                setServiceSaveMessage('')
                onChangeVar(field, val)
              }}
              className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Versicherer suchen…"
            />
            <button
              type="button"
              onClick={() => setServiceQueryNonce((n) => n + 1)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Suchen
            </button>
          </div>
          {serviceLoading && <div className="text-sm text-blue-700">Suche läuft…</div>}
          {serviceSearchFailed && <div className="text-sm text-red-600">Suche fehlgeschlagen</div>}
          {!serviceLoading && !serviceSearchFailed && serviceSuggestions.length === 0 && serviceQuery.trim().length > 0 && (
            <div className="text-sm text-gray-500">Keine Treffer gefunden.</div>
          )}
          {serviceSuggestions.length > 0 && (
            <div className="max-h-56 overflow-auto border border-gray-200 rounded-lg divide-y">
              {serviceSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={`${suggestion.id ?? suggestion.name}`}
                  onClick={() => handleSelectServiceSuggestion(suggestion)}
                  className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100 focus:outline-none focus:bg-blue-100"
                >
                  <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                  {(suggestion.address || suggestion.email) && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {suggestion.address && <div>{suggestion.address}</div>}
                      {suggestion.email && <div>{suggestion.email}</div>}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="pt-3 border-t border-dashed border-gray-200 space-y-3">
            <div className="text-sm font-medium text-gray-700">Neuen Empfänger speichern</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Unternehmen"
                value={varsState.recipientCompany || ''}
                onChange={(e) => onChangeVar('recipientCompany', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Adresse"
                value={varsState.recipientAddress || ''}
                onChange={(e) => onChangeVar('recipientAddress', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="E-Mail"
                value={varsState.recipientEmail || ''}
                onChange={(e) => onChangeVar('recipientEmail', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveServiceContact}
                disabled={serviceSaving}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                {serviceSaving ? 'Speichern…' : 'Empfänger speichern'}
              </button>
              {serviceSaveStatus === 'success' && (
                <span className="text-sm text-emerald-600">{serviceSaveMessage || 'Empfänger wurde gespeichert.'}</span>
              )}
              {serviceSaveStatus === 'error' && (
                <span className="text-sm text-red-600">{serviceSaveMessage || 'Speichern fehlgeschlagen'}</span>
              )}
              {serviceSaveStatus === 'idle' && serviceSaveMessage && (
                <span className="text-sm text-gray-500">{serviceSaveMessage}</span>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <input
        type={type}
        value={value}
        onChange={(e) => onChangeVar(field, e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={field === 'applicationDate' ? 'TT.MM.JJJJ' : (field === 'amountEUR' || field === 'person2Amount' || field === 'person3Amount') ? 'z.B. 1500.00' : field === 'numberOfInstallments' ? 'z.B. 12' : ''}
        step={field === 'amountEUR' || field === 'contributionSum' || field === 'totalAmount' || field === 'hourlyRate' || field === 'increasedStartAmount' || field === 'installmentAmount' || field === 'person2Amount' || field === 'person3Amount' ? '0.01' : undefined}
        min={field === 'proportionalPercent' ? '0' : (field === 'amountEUR' || field === 'contributionSum' || field === 'totalAmount' || field === 'consultationHours' || field === 'hourlyRate' || field === 'increasedStartAmount' || field === 'installmentAmount' || field === 'numberOfInstallments' || field === 'person2Amount' || field === 'person3Amount') ? '0' : undefined}
        max={field === 'proportionalPercent' ? '100' : undefined}
      />
    )
  }

  // Berechne Ratenhöhe automatisch
  const calculatedInstallment = useMemo(() => {
    if (varsState['paymentMethod'] === 'Lastschrift' && 
        (varsState['paymentFrequency'] === 'Ratenzahlung' || varsState['paymentFrequency'] === 'Ratenzahlung mit erhöhter Startzahlung')) {
      const totalAmount = parseFloat(varsState['amountEUR']) || 0
      const numRates = parseInt(varsState['numberOfInstallments']) || 0
      const startAmount = parseFloat(varsState['increasedStartAmount']) || 0
      const remainingAmount = totalAmount - startAmount
      const installmentAmount = numRates > 0 ? (remainingAmount / numRates) : 0
      return installmentAmount.toFixed(2)
    }
    return ''
  }, [varsState['amountEUR'], varsState['numberOfInstallments'], varsState['increasedStartAmount'], varsState['paymentMethod'], varsState['paymentFrequency']])

  async function generate() {
    if (!selected) return
    setCreating(true)
    setError(null)
    try {
      // Füge berechnete Werte hinzu
      const variablesWithCalculations = { ...varsState }
      
      // Berechne Gesamthonorar aus einzelnen Personen (wenn nicht manuell eingegeben)
      const amount1 = parseFloat(varsState['amountEUR']) || 0
      const amount2 = parseFloat(varsState['person2Amount']) || 0
      const amount3 = parseFloat(varsState['person3Amount']) || 0
      const calculatedTotal = amount1 + amount2 + amount3
      if (calculatedTotal > 0 && !varsState['totalAmount']) {
        variablesWithCalculations['totalAmount'] = calculatedTotal.toFixed(2)
      } else if (varsState['totalAmount']) {
        variablesWithCalculations['totalAmount'] = varsState['totalAmount']
      }
      
      // Berechne Ratenhöhe wenn nötig (nutze Gesamthonorar wenn vorhanden)
      if (varsState['paymentMethod'] === 'Lastschrift' && 
          (varsState['paymentFrequency'] === 'Ratenzahlung' || varsState['paymentFrequency'] === 'Ratenzahlung mit erhöhter Startzahlung')) {
        const totalAmount = parseFloat(variablesWithCalculations['totalAmount'] || varsState['amountEUR']) || 0
        const numRates = parseInt(varsState['numberOfInstallments']) || 0
        const startAmount = parseFloat(varsState['increasedStartAmount']) || 0
        const remainingAmount = totalAmount - startAmount
        const installmentAmount = numRates > 0 ? (remainingAmount / numRates) : 0
        variablesWithCalculations['installmentAmount'] = installmentAmount.toFixed(2)
      }
      
      // Füge Kunden-IBAN hinzu (falls vorhanden)
      if (varsState['paymentMethod'] === 'Lastschrift' && !variablesWithCalculations['clientIban']) {
        // Wird später aus Client-Daten geladen, hier nur Platzhalter
      }
      
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, templateSlug: selected, variables: variablesWithCalculations })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('❌ API Error Response:', errorData)
        const errorMsg = errorData.message || errorData.error || 'Erstellung fehlgeschlagen'
        const details = errorData.details ? `\n\nDetails: ${errorData.details}` : ''
        throw new Error(`${errorMsg}${details}`)
      }
      
      const data = await res.json()
      setNewContractId(data.contractId)
      // Redirect zur Contract-Detail-Seite
      window.location.href = `/contracts/${data.contractId}`
    } catch (err: any) {
      console.error('Generate error:', err)
      setError(err.message || 'Fehler beim Generieren des Vertrags')
    } finally {
      setCreating(false)
    }
  }

  // Sortiere Felder für bessere UX: Logische Reihenfolge für Beratungsprotokoll
  const sortedFields = useMemo(() => {
    // Spezielle Reihenfolge für Beratungsprotokoll
    if (selected === 'beratungsprotokoll') {
      const beratungsprotokollOrder = [
        'customerName',
        'customerAddress',
        'customerWishes',
        'customerWishesImportant',
        'customerNeeds',
        'customerNeedsFocus',
        'riskAssessment',
        'insuranceTypes',
        'adviceAndReasoning',
        'adviceAndReasoningReason',
        'suitabilitySuitable',
        'suitabilityNotSuitable',
        'suitabilityAttached',
        'customerDecisionFull',
        'customerDecisionPartial',
        'customerDecisionReason',
        'marketResearchObjective',
        'marketResearchBroker',
        'marketResearchMultiAgent',
        'marketResearchInsurers',
        'marketResearchLimited',
        'additionalNote',
        'placeDate',
        'customerSignature',
        'intermediarySignature'
      ]
      const orderedFields = beratungsprotokollOrder.filter(f => selectedTemplateFields.includes(f))
      const restFields = selectedTemplateFields.filter(f => !beratungsprotokollOrder.includes(f) && !f.includes('ProductType') && !f.includes('Provider') && !f.includes('Tariff'))
      return [...orderedFields, ...restFields]
    }
    
    if (selectedTemplateCategory === SERVICE_CATEGORY) {
      const order = [
        'recipientCompany',
        'recipientAddress',
        'recipientEmail',
        'contactPerson',
        'policyNumber',
        'subject',
        'effectiveDate',
        'terminationDate',
        'responseDeadline',
        'sepaMandateReference',
        'sepaRevocationDate',
        'reducedAmount',
        'requestedDocuments',
      'contactDate',
      'contactTime',
      'advisorName',
      'contactReasonRecommendation',
      'contactReasonAdvertising',
      'contactReasonDamageReport',
      'contactReasonEvb',
      'contactReasonAdjustment',
      'contactReasonInformation',
      'contactReasonOtherChecked',
      'contactReasonOther',
      'initiatorWishConsultation',
      'initiatorWishOffer',
      'initiatorWishAppointment',
      'initiatorWishEvb',
      'initiatorWishOtherChecked',
      'initiatorWishOther',
      'furtherContactLandline',
      'furtherContactMobile',
      'furtherContactEmail',
      'contractDocumentsProvided',
      'contractDocumentsSending',
      'contractDocumentsPickup',
      'fileNameCode',
        'payoutIban',
        'payoutBic',
        'payoutBankName',
        'customBody',
      ]
      const ordered = order.filter(field => selectedTemplateFields.includes(field))
      const rest = selectedTemplateFields.filter(field => !order.includes(field))
      return [...ordered, ...rest]
    }
    
    // Standard-Reihenfolge für andere Templates
    const priorityOrder = ['productProvider', 'productDescription', 'applicationDate', 'amountEUR', 'paymentFrequency', 'numberOfInstallments', 'increasedStartAmount', 'bookingStart']
    const rest = selectedTemplateFields.filter(f => !priorityOrder.includes(f) && f !== 'paymentMethod') // paymentMethod wird oben gewählt
    return [...priorityOrder.filter(f => selectedTemplateFields.includes(f) && f !== 'paymentMethod'), ...rest]
  }, [selectedTemplateFields, selected, selectedTemplateCategory])

  function handleSelectServiceSuggestion(suggestion: ServiceSuggestion) {
    setServiceQuery(suggestion.name)
    setServiceSuggestions([])
    setServiceError(null)
    setVarsState(prev => ({
      ...prev,
      recipientCompany: suggestion.name,
      recipientEmail: suggestion.email || prev.recipientEmail || '',
      recipientAddress: suggestion.address || prev.recipientAddress || '',
    }))
    setServiceSaveStatus('idle')
    setServiceSaveMessage('')
  }

  const serviceMailDraft = useMemo(() => {
    if (selectedTemplateCategory !== SERVICE_CATEGORY) {
      return { href: '', body: '', email: '', subject: '' }
    }
    const recipientEmail = (varsState.recipientEmail || '').trim()
    if (!recipientEmail) {
      return { href: '', body: '', email: '', subject: '' }
    }

    const subject = (varsState.subject || `Anliegen zu Vertrag ${varsState.policyNumber || ''}`).trim()
    const greeting = `Sehr geehrte Damen und Herren${varsState.contactPerson ? ',\n' + varsState.contactPerson : ''}`
    const bodyParts = [greeting]
    if (varsState.customBody) {
      bodyParts.push(varsState.customBody)
    }
    const closingName = customerName && customerName.trim().length > 0 ? customerName : `${varsState.customerName || ''}`.trim() || ' '
    bodyParts.push('Mit freundlichen Grüßen', closingName)
    const bodyPlain = bodyParts.join('\n\n')
    const href = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyPlain)}`
    return { href, body: bodyPlain, email: recipientEmail, subject }
  }, [selectedTemplateCategory, varsState, customerName])

  async function handleSaveServiceContact() {
    if (selectedCategory !== SERVICE_CATEGORY) return
    const name = (varsState.recipientCompany || '').trim()
    const email = (varsState.recipientEmail || '').trim()
    const address = (varsState.recipientAddress || '').trim()

    if (name.length < 2) {
      setServiceSaveStatus('error')
      setServiceSaveMessage('Bitte Empfänger (Unternehmen) angeben.')
                return
              }
              
    setServiceSaving(true)
    setServiceSaveStatus('idle')
    setServiceSaveMessage('')

    try {
      const res = await fetch('/api/service/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          address: address || undefined,
          category: selectedTemplateCategory || SERVICE_CATEGORY,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Speichern fehlgeschlagen')
      }

      const saved: ServiceSuggestion = await res.json()
      setServiceSaveStatus('success')
      setServiceSaveMessage('Empfänger wurde gespeichert.')
      setServiceSuggestions((prev) => [saved, ...prev])
      if (!serviceQuery.trim()) {
        setServiceQuery(saved.name)
      }
    } catch (err: any) {
      console.error('Service contact save error', err)
      setServiceSaveStatus('error')
      setServiceSaveMessage(err.message || 'Speichern fehlgeschlagen')
    } finally {
      setServiceSaving(false)
    }
  }

  useEffect(() => {
    if (selectedCategory === SERVICE_CATEGORY) {
      setVarsState(prev => ({
        ...getServiceDefaults(),
        ...prev,
      }))
    }
  }, [selectedCategory, selectedTemplate?.slug, customerName, customerAddress, customerEmail, customerIban])

  const payoutIban = varsState.payoutIban || ''
  useEffect(() => {
    if (isServiceTemplate && customerIban && !payoutIban) {
      setVarsState(prev => ({ ...prev, payoutIban: customerIban }))
    }
  }, [isServiceTemplate, customerIban, payoutIban])

  function getServiceDefaults() {
    const inFourteenDays = new Date()
    inFourteenDays.setDate(inFourteenDays.getDate() + 14)
    const defaultDeadline = inFourteenDays.toISOString().split('T')[0]
    const now = new Date()
    const defaultDate = new Date().toISOString().split('T')[0]
    const defaultTime = now.toTimeString().slice(0, 5)

    let defaultCode = ''
    switch (selectedTemplate?.slug) {
      case 'service-beitragsfreistellung':
        defaultCode = 'BTF'
        break
      case 'service-beitragsfreistellung-sepa-widerruf':
        defaultCode = 'BTFSEPA'
        break
      case 'service-kuendigung-auszahlung':
      case 'service-kuendigung-ohne-auszahlung':
        defaultCode = 'KUENDI'
        break
      case 'service-beitragsaenderung':
        defaultCode = 'BANDR'
        break
      case 'service-unterlagen-anfordern':
        defaultCode = 'SERV'
        break
      case 'service-kontaktsperre':
        defaultCode = 'KONTS'
        break
      case 'service-erstkontaktformular':
        defaultCode = 'ERST'
        break
      default:
        defaultCode = varsState.fileNameCode || ''
    }

    return {
      recipientCompany: varsState.recipientCompany || '',
      recipientAddress: varsState.recipientAddress || '',
      recipientEmail: varsState.recipientEmail || '',
      responseDeadline: varsState.responseDeadline || defaultDeadline,
      fileNameCode: varsState.fileNameCode || defaultCode,
      sepaMandateReference: varsState.sepaMandateReference || '',
      sepaRevocationDate: varsState.sepaRevocationDate || '',
      reducedAmount: varsState.reducedAmount || '',
      requestedDocuments: varsState.requestedDocuments || '',
      payoutIban: varsState.payoutIban || customerIban || '',
      contactDate: varsState.contactDate || (selectedTemplate?.slug === 'service-erstkontaktformular' ? defaultDate : ''),
      contactTime: varsState.contactTime || (selectedTemplate?.slug === 'service-erstkontaktformular' ? defaultTime : ''),
      advisorName: varsState.advisorName || advisorName || '',
    }
  }

  function handleCategorySelect(category: string) {
    if (category === selectedCategory) return
    setSelectedCategory(category)
                setSelected('')
    if (category === SERVICE_CATEGORY) {
      const firstGroupWithTemplates =
        serviceGroups.find((group) => group.templates.length > 0) || serviceGroups[0]
      if (firstGroupWithTemplates) {
        setSelectedServiceGroup(firstGroupWithTemplates.id)
      }
                setVarsState({})
    } else {
      setVarsState({
        applicationDate: new Date().toISOString().split('T')[0],
      })
    }
  }

  const sectionTitle = selectedCategory === SERVICE_CATEGORY ? 'Schreiben generieren' : 'Vertrag generieren'

  function handleTemplateSelect(templateSlug: string) {
    if (templateSlug === selected) return
                setSelected(templateSlug)
                
    setVarsState((prev) => {
      const next = { ...prev }
      if (!next.applicationDate) {
        next.applicationDate = new Date().toISOString().split('T')[0]
      }
                const autoPaymentMethod = templatePaymentMapping[templateSlug]
                if (autoPaymentMethod) {
        next.paymentMethod = autoPaymentMethod
                } else {
        const template = templates.find((tpl) => tpl.slug === templateSlug)
        if (template?.category !== HONORAR_CATEGORY && 'paymentMethod' in next) {
          delete next.paymentMethod
        }
      }
      return next
    })
  }

  const generateButtonText = useMemo(() => {
    if (selectedTemplateCategory === SERVICE_CATEGORY) {
      if (!selectedTemplate) return 'Schreiben generieren'
      return SERVICE_LABELS[selectedTemplate.slug] || `${selectedTemplate.name} erstellen`
    }
    return 'Vertrag generieren'
  }, [selectedTemplate, selectedTemplateCategory])

  return (
    <section className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
      <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>{sectionTitle}</h2>
      
      {error && (
        <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', color: 'var(--color-error)' }}>
          <strong>Fehler:</strong> {error}
          </div>
        )}
        
      <div className="space-y-4">
          <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Kategorie wählen</p>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((category) => {
              const isActive = category === selectedCategory
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`px-3 py-1.5 rounded-md border text-sm font-medium transition ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'hover:opacity-90'
                  }`}
                  style={isActive ? {
                    backgroundColor: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)'
                  } : {
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-bg-tertiary)'
                  }}
                >
                  {CATEGORY_LABELS[category] ?? category}
                </button>
              )
            })}
          </div>
        </div>

        {selectedCategory === SERVICE_CATEGORY && (
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Bereich auswählen</p>
            <div className="flex flex-wrap gap-2">
              {serviceGroups
                .filter((group) => group.templates.length > 0)
                .map((group) => {
                  const isActive = group.id === selectedServiceGroup
                  return (
                    <button
                      type="button"
                      key={group.id}
                      onClick={() => setSelectedServiceGroup(group.id)}
                      className={`px-3 py-1.5 rounded-md border text-sm transition ${
                        isActive
                          ? 'text-white shadow-sm'
                          : 'hover:opacity-90'
                      }`}
                      style={isActive ? {
                        backgroundColor: 'var(--color-primary)',
                        borderColor: 'var(--color-primary)'
                      } : {
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                        backgroundColor: 'var(--color-bg-tertiary)'
                      }}
                    >
                      {group.label}
                    </button>
                  )
                })}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedCategory === SERVICE_CATEGORY ? 'Schreiben auswählen' : 'Vorlage auswählen'}
          </p>
          {displayedTemplates.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Keine Vorlagen in dieser Kategorie vorhanden.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedTemplates.map((template) => {
                const isActive = template.slug === selected
                return (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.slug)}
                    className={`rounded-lg border px-4 py-3 text-left transition shadow-sm ${
                      isActive
                        ? 'border-blue-500'
                        : 'hover:border-blue-400'
                    }`}
                    style={isActive ? {
                      backgroundColor: 'rgba(0, 113, 227, 0.1)',
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-text-primary)'
                    } : {
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <div className="font-semibold text-base">{template.name}</div>
                    {template.description && (
                      <div className="text-xs mt-1 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{template.description}</div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Zahlungsart-Auswahl nur für Honorarberatung-Templates */}
        {selected && selectedTemplate?.category === HONORAR_CATEGORY &&
         (selectedTemplate?.slug?.includes('nettoprodukt') || false) && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Zahlungsart *</label>
            <select 
              value={varsState['paymentMethod'] || ''} 
              onChange={(e) => {
                const paymentMethod = e.target.value
                setVarsState(prev => ({ ...prev, paymentMethod }))
              }} 
              disabled={!!selected} // ✅ Deaktiviert wenn Template gewählt
              className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Bitte Zahlungsart wählen…</option>
              <option value="Lastschrift">Lastschrift (SEPA)</option>
              <option value="Überweisung">Überweisung</option>
            </select>
            {selected && (
              <p className="text-sm text-gray-600 mt-1">
                Zahlungsart wird automatisch durch Template gesetzt
              </p>
            )}
          </div>
        )}
        
        {selectedTemplate && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            Template: <strong>{selectedTemplate.name}</strong>
          </div>
        )}

        {selected && requiredTemplateFields.length > 0 && (
          <div className="border border-dashed border-gray-300 rounded-lg p-3 text-xs text-gray-600 bg-gray-50">
            <div className="font-semibold text-gray-700 mb-1">Benötigte Angaben für dieses Template</div>
            <ul className="list-disc list-inside space-y-0.5">
              {requiredTemplateFields.map((field) => (
                <li key={field}>{getFieldLabel(field)}</li>
              ))}
            </ul>
          </div>
        )}

            {/* Zentrale Auswahlfelder für Beratungsprotokoll */}
            {selected && templates.find(t => t.slug === selected)?.slug === 'beratungsprotokoll' && (
              <div className="pt-2 border-t">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">📋 Zentrale Angaben (werden automatisch überall übernommen)</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">Produktart *</label>
                    <select 
                      value={globalProductType} 
                      onChange={(e) => onChangeGlobalProductType(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Bitte Produktart auswählen...</option>
                    <option value="Basisrente">Basisrente (Rürup)</option>
                    <option value="Riester">Riester-Rente</option>
                    <option value="bAV">bAV (betriebliche Altersvorsorge)</option>
                    <option value="Flexible Rentenversicherung">Flexible Rentenversicherung</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">Anbieter</label>
                    <input
                      type="text"
                      value={globalProvider}
                      onChange={(e) => onChangeGlobalProvider(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="z.B. Alte Leipziger"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">Produkt / Tarif</label>
                    <input
                      type="text"
                      value={globalProduct}
                      onChange={(e) => onChangeGlobalProduct(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="z.B. FR10"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={globalIsNettoPolice}
                        onChange={(e) => onChangeGlobalIsNettoPolice(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-blue-900">Honorar-Nettopolice</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">Was ist dem Kunden wichtig? (Mehrfachauswahl)</label>
                    <div className="space-y-2">
                      {['Garantie', 'ETF-Strategie', 'steuerliche Förderung', 'Flexibilität'].map(option => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-blue-100 rounded">
                          <input
                            type="checkbox"
                            checked={globalImportantOptions.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                onChangeGlobalImportantOptions([...globalImportantOptions, option])
                              } else {
                                onChangeGlobalImportantOptions(globalImportantOptions.filter(o => o !== option))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-blue-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">Fokus liegt auf? (Mehrfachauswahl)</label>
                    <div className="space-y-2">
                      {['Sicherheit', 'Rendite', 'Steueroptimierung', 'Flexibilität'].map(option => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-blue-100 rounded">
                          <input
                            type="checkbox"
                            checked={globalFocusOptions.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                onChangeGlobalFocusOptions([...globalFocusOptions, option])
                              } else {
                                onChangeGlobalFocusOptions(globalFocusOptions.filter(o => o !== option))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-blue-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-blue-700 mt-3 pt-3 border-t border-blue-200">
                    💡 Diese Angaben werden automatisch in die Textfelder übernommen und generieren passende Textbausteine. Sie können die einzelnen Textfelder später noch individuell anpassen.
                  </p>
                </div>
              </div>
            )}
            
            {selected && (
              <div className={`pt-2 border-t ${templates.find(t => t.slug === selected)?.slug === 'beratungsprotokoll' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
                {sortedFields.map((f) => {
                  const paymentMethod = varsState['paymentMethod'] || ''
                  const isBeratungsprotokoll = templates.find(t => t.slug === selected)?.slug === 'beratungsprotokoll'
                  
                  // paymentMethod-Feld nicht anzeigen (wurde bereits oben gewählt)
                  if (f === 'paymentMethod') {
                    return null
                  }
                  
                  // Produktart-Felder ausblenden wenn globale Produktart gesetzt ist
                  if (isBeratungsprotokoll && globalProductType && 
                      (f === 'customerWishesProductType' || f === 'riskAssessmentProductType' || 
                       f === 'insuranceTypesProductType' || f === 'adviceAndReasoningProductType' || 
                       f === 'customerDecisionProductType')) {
                    return null
                  }
                  
                  // Anbieter-Felder ausblenden wenn globaler Anbieter gesetzt ist
                  if (isBeratungsprotokoll && globalProvider && 
                      (f === 'adviceAndReasoningProvider' || f === 'customerDecisionProvider')) {
                    return null
                  }
                  
                  // Produkt/Tarif-Felder ausblenden wenn globales Produkt gesetzt ist
                  if (isBeratungsprotokoll && globalProduct && 
                      (f === 'adviceAndReasoningTariff' || f === 'customerDecisionTariff')) {
                    return null
                  }
                  
                  // "Wichtig ist" und "Fokus liegt auf" Felder ausblenden (werden oben zentral ausgewählt)
                  if (isBeratungsprotokoll && 
                      (f === 'customerWishesImportant' || f === 'customerNeedsFocus')) {
                    return null
                  }
                  
                  // Personen-Felder werden separat in aufklappbaren Bereichen angezeigt
                  if (f === 'person2Name' || f === 'person2Provider' || f === 'person2Product' || f === 'person2Amount' ||
                      f === 'person3Name' || f === 'person3Provider' || f === 'person3Product' || f === 'person3Amount') {
                    return null
                  }
                  
                  // Bei Überweisung: Keine Zahlungsweise, keine Ratenfelder
                  if (paymentMethod === 'Überweisung') {
                    if (f === 'paymentFrequency' || f === 'numberOfInstallments' || f === 'increasedStartAmount' || f === 'installmentAmount' || f === 'clientIban') {
                      return null
                    }
                  }
                  
                  // Bei Lastschrift: Ratenzahlungsfelder nur bei entsprechender Zahlungsweise
                  if (paymentMethod === 'Lastschrift') {
                    const isInstallmentField = f === 'numberOfInstallments' || f === 'increasedStartAmount' || f === 'installmentAmount'
                    const showInstallmentFields = varsState['paymentFrequency'] === 'Ratenzahlung' || varsState['paymentFrequency'] === 'Ratenzahlung mit erhöhter Startzahlung'
                    
                    if (isInstallmentField && !showInstallmentFields) {
                      return null
                    }
                    
                    // IBAN-Feld nicht direkt anzeigen (wird automatisch aus Client-Daten geladen)
                    if (f === 'clientIban') {
                      return null
                    }
                  }
              
                  return (
                    <div key={f} className={isBeratungsprotokoll ? "space-y-1.5" : "space-y-1.5 md:col-span-1"}>
                      <label className="block text-sm font-medium">
                        {getFieldLabel(f)}
                        {!optionalFields.includes(f) && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderFieldInput(f)}
                    </div>
                  )
                })}
            
            {/* Weitere Person hinzufügen Buttons */}
            {!isServiceTemplate && !showPerson2 && !varsState['person2Name'] && (
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowPerson2(true)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  + 2. Person hinzufügen
                </button>
              </div>
            )}
            
            {/* Person 2 Felder (aufklappbar) */}
            {!isServiceTemplate && (showPerson2 || varsState['person2Name']) && (
              <div className="md:col-span-2 border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">2. Person</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPerson2(false)
                      setVarsState(prev => {
                        const newState = { ...prev }
                        delete newState['person2Name']
                        delete newState['person2Provider']
                        delete newState['person2Product']
                        delete newState['person2Amount']
                        return newState
                      })
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    ✕ Entfernen
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">2. Person (Name)</label>
                    <input
                      type="text"
                      value={varsState['person2Name'] || ''}
                      onChange={(e) => onChangeVar('person2Name', e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="z.B. Mann Beispiel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">2. Person Anbieter</label>
                    <input
                      type="text"
                      value={varsState['person2Provider'] || varsState['productProvider'] || ''}
                      onChange={(e) => onChangeVar('person2Provider', e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={varsState['productProvider'] || 'z.B. Alte Leipziger'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">2. Person Produkt</label>
                    <input
                      type="text"
                      value={varsState['person2Product'] || varsState['productDescription'] || ''}
                      onChange={(e) => onChangeVar('person2Product', e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={varsState['productDescription'] || 'z.B. FR10'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">2. Person Honorar (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={varsState['person2Amount'] || ''}
                      onChange={(e) => onChangeVar('person2Amount', e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="z.B. 3000.00"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Person 3 hinzufügen Button (nur wenn Person 2 vorhanden) */}
            {!isServiceTemplate && (showPerson2 || varsState['person2Name']) && !showPerson3 && !varsState['person3Name'] && (
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowPerson3(true)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  + 3. Person hinzufügen
                </button>
              </div>
            )}
            
            {/* Person 3 Felder (aufklappbar) */}
            {!isServiceTemplate && (showPerson3 || varsState['person3Name']) && (
              <div className="md:col-span-2 border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-green-900">3. Person</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPerson3(false)
                      setVarsState(prev => {
                        const newState = { ...prev }
                        delete newState['person3Name']
                        delete newState['person3Provider']
                        delete newState['person3Product']
                        delete newState['person3Amount']
                        return newState
                      })
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    ✕ Entfernen
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">3. Person (Name)</label>
                    <input
                      type="text"
                      value={varsState['person3Name'] || ''}
                      onChange={(e) => onChangeVar('person3Name', e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="z.B. Kind Beispiel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">3. Person Anbieter</label>
                    <input
                      type="text"
                      value={varsState['person3Provider'] || varsState['productProvider'] || ''}
                      onChange={(e) => onChangeVar('person3Provider', e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={varsState['productProvider'] || 'z.B. Alte Leipziger'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">3. Person Produkt</label>
                    <input
                      type="text"
                      value={varsState['person3Product'] || varsState['productDescription'] || ''}
                      onChange={(e) => onChangeVar('person3Product', e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={varsState['productDescription'] || 'z.B. FR10'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">3. Person Honorar (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={varsState['person3Amount'] || ''}
                      onChange={(e) => onChangeVar('person3Amount', e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="z.B. 1500.00"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Mehrpersonen-Übersicht für Honorarberatung */}
            {!isServiceTemplate && (varsState['person2Name'] || varsState['person3Name']) && (
              <div className="md:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm font-semibold text-gray-900 mb-3">📋 Honorarübersicht:</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left font-semibold">ANBIETER</th>
                        <th className="border border-gray-300 p-2 text-left font-semibold">PRODUKT</th>
                        <th className="border border-gray-300 p-2 text-left font-semibold">ANTRAGSDATUM</th>
                        <th className="border border-gray-300 p-2 text-left font-semibold">HONORAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2">{varsState['productProvider'] || '-'}</td>
                        <td className="border border-gray-300 p-2">{varsState['productDescription'] || '-'}</td>
                        <td className="border border-gray-300 p-2">{varsState['applicationDate'] || '-'}</td>
                        <td className="border border-gray-300 p-2 font-medium">{varsState['amountEUR'] ? `${parseFloat(varsState['amountEUR']).toFixed(2)} EUR` : '-'}</td>
                      </tr>
                      {varsState['person2Name'] && (
                        <tr>
                          <td className="border border-gray-300 p-2">{varsState['person2Provider'] || varsState['productProvider'] || '-'}</td>
                          <td className="border border-gray-300 p-2">{varsState['person2Product'] || varsState['productDescription'] || '-'}</td>
                          <td className="border border-gray-300 p-2">{varsState['applicationDate'] || '-'}</td>
                          <td className="border border-gray-300 p-2 font-medium">{varsState['person2Amount'] ? `${parseFloat(varsState['person2Amount']).toFixed(2)} EUR` : '-'}</td>
                        </tr>
                      )}
                      {varsState['person3Name'] && (
                        <tr>
                          <td className="border border-gray-300 p-2">{varsState['person3Provider'] || varsState['productProvider'] || '-'}</td>
                          <td className="border border-gray-300 p-2">{varsState['person3Product'] || varsState['productDescription'] || '-'}</td>
                          <td className="border border-gray-300 p-2">{varsState['applicationDate'] || '-'}</td>
                          <td className="border border-gray-300 p-2 font-medium">{varsState['person3Amount'] ? `${parseFloat(varsState['person3Amount']).toFixed(2)} EUR` : '-'}</td>
                        </tr>
                      )}
                      <tr className="bg-blue-50 font-semibold">
                        <td colSpan={3} className="border border-gray-300 p-2 text-right">Gesamthonorar:</td>
                        <td className="border border-gray-300 p-2">
                          {(() => {
                            const amount1 = parseFloat(varsState['amountEUR']) || 0
                            const amount2 = parseFloat(varsState['person2Amount']) || 0
                            const amount3 = parseFloat(varsState['person3Amount']) || 0
                            const total = amount1 + amount2 + amount3
                            return `${total.toFixed(2)} EUR`
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Berechnete Ratenhöhe anzeigen (readonly) */}
            {varsState['paymentMethod'] === 'Lastschrift' && 
             (varsState['paymentFrequency'] === 'Ratenzahlung' || varsState['paymentFrequency'] === 'Ratenzahlung mit erhöhter Startzahlung') &&
             varsState['amountEUR'] && varsState['numberOfInstallments'] && (
              <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-semibold text-blue-900 mb-1">💡 Berechnete Rateninformationen:</div>
                {(() => {
                  const totalAmount = parseFloat(varsState['totalAmount'] || varsState['amountEUR']) || 0
                  const numRates = parseInt(varsState['numberOfInstallments']) || 0
                  const startAmount = parseFloat(varsState['increasedStartAmount']) || 0
                  const remainingAmount = totalAmount - startAmount
                  const installmentAmount = numRates > 0 ? (remainingAmount / numRates) : 0
                  
                  return (
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>Gesamtbetrag: <strong>{totalAmount.toFixed(2)} EUR</strong></div>
                      {startAmount > 0 && (
                        <div>Erste Rate (Startpauschale): <strong>{startAmount.toFixed(2)} EUR</strong></div>
                      )}
                      {numRates > 0 && (
                        <div>
                          {startAmount > 0 ? `Weitere ${numRates} Raten` : `${numRates} Raten`} à: <strong>{installmentAmount.toFixed(2)} EUR</strong>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button 
            onClick={generate} 
            disabled={!selected || creating || sortedFields.some(f => !optionalFields.includes(f) && !varsState[f])}
            className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{ 
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            {creating ? 'Generiere…' : generateButtonText}
          </button>
        </div>
      </div>
    </section>
  )
}

