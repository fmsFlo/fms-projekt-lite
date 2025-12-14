# DISC Personality-Based Retirement Calculator Views

## Übersicht

Dieses Modul implementiert 4 verschiedene Ansichten für den Rentenrechner basierend auf dem DISC-Persönlichkeitsmodell:

- **D (Rot)** - Dominant: Ergebnis-orientiert, schnelle Entscheidungen
- **I (Gelb)** - Inspiring: Emotional, visuell, Storytelling
- **S (Grün)** - Steady: Sicherheit & Stabilität, Schritt-für-Schritt
- **C (Blau)** - Conscientious: Detailliert & präzise (bestehende Ansicht)

## Dateistruktur

```
app/components/retirement/
├── types.ts                          # Shared TypeScript types
├── PersonalitySelector.tsx            # Toggle-Buttons für Persönlichkeitstypen
├── RetirementCalculator.tsx           # Wrapper-Komponente
├── views/
│   ├── DominantView.tsx              # D-Type (Rot) - Executive Summary
│   ├── InspiringView.tsx              # I-Type (Gelb) - Story & Vision
│   ├── SteadyView.tsx                 # S-Type (Grün) - Security & Stability
│   └── ConscientiousView.tsx          # C-Type (Blau) - Detailed Analysis
└── README.md                          # Diese Datei
```

## Integration in bestehende Form

### Option 1: Als separate Sektion einfügen

In `retirement-concept-form.tsx` nach den Berechnungen:

```tsx
import RetirementCalculator from '@/app/components/retirement/RetirementCalculator'

// ... in der Komponente, nach den Berechnungen:

const calculationResults = {
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
  retirementAge: parseInt(formData.desiredRetirementAge || '67'),
  lifeExpectancy: parseInt(formData.lifeExpectancy || '90'),
  inflationRate: parseFloat(formData.inflationRate || '2.0') / 100,
  returnRate: parseFloat(formData.returnRate || '4.0') / 100,
}

// ... im JSX:

<RetirementCalculator 
  calculationData={calculationResults}
  onActionClick={() => {
    // Optional: Scroll zu Formular oder öffne Modal
  }}
/>
```

### Option 2: Als Toggle zwischen alter und neuer Ansicht

```tsx
const [usePersonalityViews, setUsePersonalityViews] = useState(false)

// ... im JSX:

{usePersonalityViews ? (
  <RetirementCalculator calculationData={calculationResults} />
) : (
  // Bestehende Ansicht
  <div>...</div>
)}
```

## Entfernen der Ansichten

Falls du die Ansichten wieder entfernen möchtest:

1. **Komplette Entfernung:**
   ```bash
   rm -rf app/components/retirement
   ```

2. **Nur aus Form entfernen:**
   - Entferne den `import` von `RetirementCalculator`
   - Entferne die `<RetirementCalculator />` Komponente aus dem JSX
   - Die Dateien bleiben erhalten, werden aber nicht verwendet

3. **localStorage zurücksetzen:**
   ```javascript
   localStorage.removeItem('preferredPersonalityView')
   ```

## Features

- ✅ 4 verschiedene Persönlichkeitsansichten
- ✅ localStorage-Persistenz der Auswahl
- ✅ Responsive Design (Mobile & Desktop)
- ✅ Smooth Transitions zwischen Ansichten
- ✅ Dark Mode Support (via CSS Variables)
- ✅ Accessibility (ARIA labels, Keyboard Navigation)
- ✅ Gleiche Berechnungslogik für alle Ansichten

## Design-Tokens pro Typ

- **D (Rot)**: `#DC2626` - Bold, große Zahlen, direkte CTAs
- **I (Gelb)**: `#F59E0B` + `#EC4899` - Gradients, Emojis, Storytelling
- **S (Grün)**: `#10B981` - Sanfte Farben, Schritt-für-Schritt
- **C (Blau)**: `#3B82F6` - Tabellen, Monospace, präzise Zahlen

## Testing

- [ ] Alle 4 Ansichten rendern korrekt
- [ ] Berechnungen stimmen überein
- [ ] localStorage speichert Auswahl
- [ ] Mobile Layout funktioniert
- [ ] Dark Mode funktioniert
- [ ] Smooth Transitions
- [ ] Accessibility (Keyboard Navigation)

## Anpassungen

### Farben ändern

In den jeweiligen View-Komponenten (`DominantView.tsx`, etc.) die Farbwerte anpassen:

```tsx
style={{ color: '#DC2626' }} // Rot für D-Type
```

### Texte anpassen

Direkt in den View-Komponenten die Text-Inhalte ändern.

### Neue Persönlichkeitstypen hinzufügen

1. Neue View-Komponente in `views/` erstellen
2. In `types.ts` den `PersonalityType` erweitern
3. In `PersonalitySelector.tsx` die neue Option hinzufügen
4. In `RetirementCalculator.tsx` den neuen Case hinzufügen

