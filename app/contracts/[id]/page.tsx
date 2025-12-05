import { prisma } from '@/lib/prisma'
import UploadSignedForm from './upload-signed-form'
import ChargeButton from './charge-button'
import CreateInvoiceButton from './create-invoice-button'
import DeleteInvoiceButton from './delete-invoice-button'

const SERVICE_CATEGORY = 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)'

interface Params { params: { id: string } }

export default async function ContractDetailPage({ params }: Params) {
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { client: true }
  })
  if (!contract) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div style={{ color: 'var(--color-error)' }}>Vertrag nicht gefunden</div>
    </div>
  )

  const template = await prisma.contractTemplate.findUnique({ where: { slug: contract.templateSlug } })
  const templateName = template?.name || contract.templateSlug
  const isServiceTemplate = template?.category === SERVICE_CATEGORY

  // Prüfe Sevdesk Token
  const companySettings = await prisma.companySettings.findFirst()
  const hasSevdeskToken = !!companySettings?.sevdeskApiToken

  let vars: any = {}
  try { vars = JSON.parse(contract.variables || '{}') } catch { vars = {} }

  // Mapping für deutsche Labels
  const variableLabels: Record<string, string> = {
    productProvider: 'Anbieter',
    productDescription: 'Produkt',
    applicationDate: 'Antragsdatum',
    amountEUR: 'Honorarhöhe (EUR)',
    paymentMethod: 'Zahlungsart',
    paymentFrequency: 'Zahlweise',
    numberOfInstallments: 'Anzahl Raten',
    increasedStartAmount: 'Erhöhte Startpauschale (EUR)',
    installmentAmount: 'Ratenhöhe (EUR)',
    clientIban: 'IBAN Kunde',
    advisorIban: 'IBAN Berater',
    paymentSubject: 'Verwendungszweck',
    bookingStart: 'Buchungsbeginn',
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
    customerNeeds: '1.2 Kundenbedarf',
    customerNeedsFocus: '1.2 Fokus liegt auf',
    riskAssessment: '2.1 Risikobewertung / Komplexität',
    riskAssessmentProductType: '2.1 Produktart',
    insuranceTypes: '2.2 In Betracht kommende Versicherungsarten',
    insuranceTypesProductType: '2.2 Produktart',
    adviceAndReasoning: '2.3 Rat und Begründung',
    adviceAndReasoningProductType: '2.3 Produktart',
    adviceAndReasoningProvider: '2.3 Anbieter',
    adviceAndReasoningTariff: '2.3 Tarif',
    adviceAndReasoningReason: '2.3 Begründung',
    suitabilitySuitable: '2.4 Geeignet und angemessen',
    suitabilityNotSuitable: '2.4 Nicht geeignet oder nicht angemessen (Kunde möchte trotzdem erwerben)',
    suitabilityAttached: '2.4 Geeignetheitsprüfung als Anhang beigefügt',
    customerDecisionFull: '2.5 Kunde folgt Rat vollständig',
    customerDecisionPartial: '2.5 Kunde folgt Rat nicht/nicht vollständig',
    customerDecisionProductType: '2.5 Produktart',
    customerDecisionProvider: '2.5 Anbieter',
    customerDecisionTariff: '2.5 Tarif',
    customerDecisionReason: '2.5 Begründung (wenn nicht vollständig)',
    additionalNote: 'Zusatzhinweis (immer einfügen)',
    marketResearchObjective: '3. Objektive, ausgewogene Marktuntersuchung',
    marketResearchBroker: '3. Versicherungsmakler',
    marketResearchMultiAgent: '3. Mehrfachgeneralagent',
    marketResearchInsurers: '3. Versicherer (Liste)',
    marketResearchLimited: '3. Beschränkte Anzahl Versicherer (Kunde hat Namen nicht verlangt)',
    placeDate: 'Ort, Datum',
    customerSignature: 'Kunde (Unterschrift)',
    intermediarySignature: 'Vermittler (Unterschrift)',
    servicePackage: 'Servicepauschale',
    consultationType: 'Beratungsart',
    consultationHours: 'Beratungsstunden',
    hourlyRate: 'Stundensatz',
    terminationDate: 'Kündigungsdatum',
    noticePeriod: 'Kündigungsfrist',
    reason: 'Kündigungsgrund',
    handoverDate: 'Übergabedatum',
    lastWorkingDay: 'Letzter Arbeitstag',
    noticeDetails: 'Details',
    contributionSum: 'Beitragssumme',
    proportionalPercent: 'Anteilige Prozent',
    notes: 'Notizen',
    iban: 'IBAN',
    interval: 'Intervall',
    paymentInterval: 'Zahlungsintervall'
  }

  // Formatierung für Datumsfelder
  const formatDisplayDate = (value: any): string => {
    if (!value) return ''
    const str = String(value)
    // Prüfe ob es im Format YYYY-MM-DD ist
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      try {
        const date = new Date(str)
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          return `${day}.${month}.${year}`
        }
      } catch {}
    }
    // Wenn bereits formatiert oder anderes Format, einfach zurückgeben
    return str
  }

  const dateFields = ['applicationDate', 'bookingStart', 'terminationDate', 'handoverDate', 'lastWorkingDay']

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)' }}>{templateName}</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Kunde: {contract.client.firstName} {contract.client.lastName}</p>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Erstellt am {new Date(contract.createdAt).toLocaleString('de-DE')}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/clients/${contract.clientId}`}
            className="inline-flex items-center justify-center hover:opacity-90 transition-opacity gap-2"
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-medium)',
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)'
            }}
          >
            ← Zurück zur Kundenansicht
          </a>
          <a
            href={`/api/contracts/${contract.id}/pdf`}
            className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity gap-2"
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-medium)',
              backgroundColor: 'var(--color-primary)'
            }}
          >
            📥 PDF Herunterladen
          </a>
        </div>
      </div>

      <section className="rounded-lg p-6 space-y-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Vertragsdetails</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(vars)
            .filter(([key, value]) => value !== null && value !== undefined && value !== '')
            .map(([key, value]) => {
              const label = variableLabels[key] || key
              const displayValue = dateFields.includes(key) ? formatDisplayDate(value) : String(value)
              return (
                <div key={key}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}:</span>
                  <span className="ml-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>{displayValue}</span>
                </div>
              )
            })}
        </div>
      </section>

      <UploadSignedForm contractId={contract.id} signedPdfFileName={contract.signedPdfFileName} />

      {/* SEPA-Zahlung nur bei SEPA-Verträgen anzeigen */}
      {(contract.templateSlug.includes('-sepa') || contract.templateSlug.includes('sepa')) && (
        <ChargeButton
          contractId={contract.id}
          hasMandate={!!contract.stripeMandateId}
          mandateStatus={contract.stripeMandateStatus}
          defaultAmount={vars.totalAmount ? parseFloat(vars.totalAmount) : vars.amountEUR ? parseFloat(vars.amountEUR) : undefined}
        />
      )}

      {/* Sevdesk Rechnung erstellen */}
      {!isServiceTemplate && !contract.sevdeskInvoiceId && (
        <CreateInvoiceButton
          contractId={contract.id}
          hasSevdeskToken={hasSevdeskToken}
          defaultAmount={vars.totalAmount ? parseFloat(vars.totalAmount) : vars.amountEUR ? parseFloat(vars.amountEUR) : undefined}
          clientName={`${contract.client.firstName} ${contract.client.lastName}`}
          contractVariables={vars}
        />
      )}

      {!isServiceTemplate && contract.sevdeskInvoiceId && (
        <section className="rounded-lg p-6 space-y-4" style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.3)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rechnung in Sevdesk</h2>
          <div className="p-3 rounded" style={{ backgroundColor: 'rgba(52, 199, 89, 0.15)', border: '1px solid rgba(52, 199, 89, 0.4)', color: 'var(--color-success)' }}>
            <p className="text-sm">
              ✅ Rechnung wurde bereits erstellt
            </p>
            <p className="text-xs mt-1">
              Rechnungsnummer: <strong>{contract.sevdeskInvoiceNumber || contract.sevdeskInvoiceId}</strong>
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={`https://my.sevdesk.de/#/Invoice/${contract.sevdeskInvoiceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1 text-white rounded hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                In Sevdesk öffnen
              </a>
              <DeleteInvoiceButton contractId={contract.id} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

