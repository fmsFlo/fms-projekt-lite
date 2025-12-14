/**
 * BEISPIEL-INTEGRATION für retirement-concept-form.tsx
 * 
 * Diese Datei zeigt, wie du die RetirementCalculator-Komponente
 * in die bestehende retirement-concept-form.tsx einbindest.
 * 
 * SCHRITT 1: Import hinzufügen (oben in der Datei)
 */

// import RetirementCalculator from '@/app/components/retirement/RetirementCalculator'

/**
 * SCHRITT 2: Berechnungsdaten vorbereiten
 * 
 * Füge dies nach den Berechnungen ein (z.B. nach calculateSavingsCoverage):
 */

/*
const calculationResultsForPersonalityViews = useMemo(() => {
  const retirementAge = parseInt(formData.desiredRetirementAge || '67')
  const lifeExpectancy = parseInt(formData.lifeExpectancy || '90')
  
  return {
    gaps: {
      before: savingsCoverage.gapBefore,
      after: savingsCoverage.gapAfter,
      coveragePercent: savingsCoverage.coversPercent,
    },
    statutory: {
      netFuture: statutoryNetFuture,
    },
    privateExisting: {
      netFuture: privateNetFuture,
    },
    requiredSavings: {
      monthlySavings: requiredSavings.monthlySavings,
      netFuture: requiredSavings.netFuture,
      netCurrent: requiredSavings.netCurrent,
    },
    targetPensionFuture: targetPensionFuture,
    yearsToRetirement: yearsToRetirement,
    yearsInRetirement: lifeExpectancy - retirementAge,
    capitalNeeded: capitalRequirement,
    retirementAge: retirementAge,
    lifeExpectancy: lifeExpectancy,
    inflationRate: parseFloat(formData.inflationRate || '2.0') / 100,
    returnRate: parseFloat(formData.returnRate || '4.0') / 100,
  }
}, [
  savingsCoverage,
  statutoryNetFuture,
  privateNetFuture,
  requiredSavings,
  targetPensionFuture,
  yearsToRetirement,
  formData.desiredRetirementAge,
  formData.lifeExpectancy,
  formData.inflationRate,
  formData.returnRate,
  capitalRequirement,
])
*/

/**
 * SCHRITT 3: Optional - Toggle State für alte/neue Ansicht
 */

/*
const [showPersonalityViews, setShowPersonalityViews] = useState(false)
*/

/**
 * SCHRITT 4: Im JSX einfügen
 * 
 * Option A: Als separate Sektion (z.B. nach "Rentenlücke im Überblick")
 */

/*
{/* Rentenlücke im Überblick - Bestehende Ansicht *\/}
<div className="border rounded-xl p-6 bg-white shadow-sm space-y-6">
  {/* ... bestehender Code ... *\/}
</div>

{/* Neue DISC-Persönlichkeitsansichten *\/}
<div className="border rounded-xl p-6 bg-white shadow-sm">
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-lg font-semibold text-gray-800">
      Persönliche Rentenansicht
    </h3>
    <button
      type="button"
      onClick={() => setShowPersonalityViews(!showPersonalityViews)}
      className="text-sm text-blue-600 hover:underline"
    >
      {showPersonalityViews ? 'Ausblenden' : 'Anzeigen'}
    </button>
  </div>
  
  {showPersonalityViews && (
    <RetirementCalculator 
      calculationData={calculationResultsForPersonalityViews}
      onActionClick={() => {
        // Optional: Scroll zu Empfehlungs-Sektion
        document.getElementById('recommendation-section')?.scrollIntoView({ behavior: 'smooth' })
      }}
    />
  )}
</div>
*/

/**
 * Option B: Als Ersatz für bestehende Ansicht (mit Toggle)
 */

/*
{showPersonalityViews ? (
  <div className="border rounded-xl p-6 bg-white shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-800">
        Persönliche Rentenansicht
      </h3>
      <button
        type="button"
        onClick={() => setShowPersonalityViews(false)}
        className="text-sm text-gray-600 hover:underline"
      >
        Zur Standard-Ansicht
      </button>
    </div>
    <RetirementCalculator 
      calculationData={calculationResultsForPersonalityViews}
    />
  </div>
) : (
  <div className="border rounded-xl p-6 bg-white shadow-sm space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">📉</span>
        <h3 className="text-lg font-semibold text-gray-800">
          Rentenlücke im Überblick
        </h3>
      </div>
      <button
        type="button"
        onClick={() => setShowPersonalityViews(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Persönliche Ansicht
      </button>
    </div>
    {/* ... bestehender Code ... *\/}
  </div>
)}
*/

/**
 * WICHTIG: 
 * - Die Berechnungsdaten müssen korrekt aus der Form extrahiert werden
 * - Alle Werte müssen vorhanden sein (null/undefined prüfen)
 * - Die Komponente funktioniert nur, wenn Berechnungen durchgeführt wurden
 */

export {}

