# Rentenkonzept-Ergebnisseite

Eine vollständige Ergebnisseite für das Rentenkonzept in "Finance Made Simple", die eine klare Vorher-Nachher-Übersicht für Live-Beratungen bietet.

## 📁 Dateien

- `RentenkonzeptErgebnis.tsx` - Hauptkomponente
- `rentenErgebnisUtils.ts` - Helper-Funktionen für Berechnungen und Vorteile
- `rentenErgebnisBeispiel.ts` - Beispiel-Daten für Tests
- `RentenkonzeptErgebnisDemo.tsx` - Demo-Komponente zum Testen

## 🚀 Verwendung

### Basis-Verwendung

```tsx
import RentenkonzeptErgebnis from '@/app/components/retirement/RentenkonzeptErgebnis'
import { createRentenErgebnis } from '@/app/components/retirement/rentenErgebnisUtils'

// Daten aus deiner Berechnung
const vorher = {
  gesetzlicheRente: 1645.89,
  privateVorsorge: 350.0,
  gesamtrente: 1995.89,
  rentenluecke: 2156.6,
  aktuellerBeitrag: 0,
}

const nachher = {
  gesetzlicheRente: 1645.89,
  privateVorsorge: 1275.75,
  gesamtrente: 2921.64,
  rentenluecke: 1230.84,
  neuerBeitrag: 200.0,
}

const produktDetails = {
  produktTyp: 'etf',
  anbieter: 'Trade Republic',
}

const eingaben = {
  beitragMonatlich: 200,
  steuerklasse: 'single',
}

// Erstelle das Ergebnis
const ergebnis = createRentenErgebnis(vorher, nachher, produktDetails, eingaben)

// Rendere die Komponente
<RentenkonzeptErgebnis
  ergebnis={ergebnis}
  onBeratungstermin={() => console.log('Beratungstermin')}
  onPdfExport={() => console.log('PDF Export')}
  onAnpassen={() => console.log('Anpassen')}
/>
```

### Integration in bestehende Rentenkonzept-Seite

```tsx
// In deiner retirement-concept-form.tsx oder ähnlicher Datei
import RentenkonzeptErgebnis from '@/app/components/retirement/RentenkonzeptErgebnis'
import { createRentenErgebnis } from '@/app/components/retirement/rentenErgebnisUtils'

// Nach Abschluss der Berechnung
const ergebnis = createRentenErgebnis(
  {
    gesetzlicheRente: statutoryNetFuture,
    privateVorsorge: privateNetFuture,
    gesamtrente: statutoryNetFuture + privateNetFuture,
    rentenluecke: gapBefore,
    aktuellerBeitrag: currentMonthlySavings,
  },
  {
    gesetzlicheRente: statutoryNetFuture,
    privateVorsorge: privateNetFuture + newSavingsPension,
    gesamtrente: statutoryNetFuture + privateNetFuture + newSavingsPension,
    rentenluecke: gapAfter,
    neuerBeitrag: newMonthlySavings,
  },
  {
    produktTyp: 'etf', // oder 'riester', 'ruerup', 'bav', 'private'
  },
  {
    beitragMonatlich: newMonthlySavings,
    steuerklasse: formData.taxFilingStatus,
  }
)

// Zeige die Ergebnisseite an
{showResults && <RentenkonzeptErgebnis ergebnis={ergebnis} />}
```

## 🎨 Features

### 1. Vorher-Nachher-Vergleich (3 Spalten)
- **VORHER**: Zeigt die Situation ohne zusätzliche Vorsorge
- **NACHHER**: Zeigt die Situation mit neuer Vorsorge (mit grünen Highlights)
- **MONATLICHER BEITRAG**: Zeigt aktuelle und neue Beiträge mit Differenz

### 2. Visuelle Darstellung
- **Fortschrittsbalken**: Zeigt, wie viel Prozent der Rentenlücke geschlossen wurde
- **Bar Chart**: Vergleich von Vorher vs. Nachher für alle Rentenbestandteile
- **Pie Chart**: Zusammensetzung der Gesamtrente nachher

### 3. Vorteile-Sektion
Dynamische Liste von Vorteilen basierend auf:
- Produkttyp (Riester, Rürup, bAV, Private, ETF)
- Eingaben (Kinder, Selbstständigkeit, Arbeitgeberzuschuss, etc.)

### 4. Call-to-Action
- Beratungstermin vereinbaren
- Konzept als PDF speichern
- Berechnung anpassen

## 📊 Unterstützte Produkttypen

### Riester-Rente
- Grundzulage + Kinderzulage
- Steuerliche Absetzbarkeit
- Pfändungsschutz
- Hartz-IV-sicher

### Rürup-Rente
- Hohe Steuerersparnis
- Selbstständigen-geeignet
- Lebenslange Rente garantiert
- Pfändungsschutz

### Betriebliche Altersvorsorge (bAV)
- Arbeitgeberzuschuss
- Steuer- und Sozialabgabenersparnis
- Geringes Insolvenzrisiko
- Einfache Gehaltsumwandlung

### Private Rentenversicherung
- Maximale Flexibilität
- Steuervorteile im Alter
- Vererbbar
- Kapitaloption möglich

### ETF-Sparplan
- Höchstes Renditepotenzial
- Volle Kontrolle
- Niedrige Kosten
- Flexibel anpassbar

## 🎯 Anpassungen

### Eigene Vorteile hinzufügen

Bearbeite `rentenErgebnisUtils.ts` in der Funktion `generateVorteile()`:

```typescript
case 'etf':
  vorteile.push({
    icon: 'TrendingUp',
    titel: 'Dein eigener Vorteil',
    beschreibung: 'Beschreibung des Vorteils',
    wert: 123.45, // optional
  })
  break
```

### Farben anpassen

Die Komponente verwendet Tailwind CSS. Passe die Farben direkt in der Komponente an:

```tsx
// Beispiel: Andere Primärfarbe
<div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
```

### Charts anpassen

Die Charts verwenden Recharts. Passe sie in der Komponente an:

```tsx
<BarChart data={chartData}>
  {/* Eigene Anpassungen */}
</BarChart>
```

## 📱 Responsive Design

Die Komponente ist vollständig responsive:
- **Mobile**: Alle Spalten gestackt
- **Tablet**: 2 Spalten Layout
- **Desktop**: 3 Spalten Layout

## ♿ Accessibility

- ARIA-Labels für alle interaktiven Elemente
- Keyboard-Navigation unterstützt
- Screen-Reader-freundlich

## 🧪 Testing

Verwende die Demo-Komponente zum Testen:

```tsx
import RentenkonzeptErgebnisDemo from '@/app/components/retirement/RentenkonzeptErgebnisDemo'

// In deiner Test-Seite
<RentenkonzeptErgebnisDemo />
```

Oder verwende die Beispiel-Daten:

```tsx
import { beispielRentenErgebnis, beispielRiesterErgebnis } from '@/app/components/retirement/rentenErgebnisBeispiel'

<RentenkonzeptErgebnis ergebnis={beispielRentenErgebnis} />
```

## 📝 Notizen

- Alle Geldbeträge werden automatisch im deutschen Format formatiert (1.234,56 €)
- Prozentangaben werden mit einem Dezimalpunkt formatiert (87,5%)
- Die Count-up Animation läuft über 2 Sekunden
- Die Komponente ist print-optimiert für PDF-Export

## 🔗 Abhängigkeiten

- `recharts` - Für Charts (bereits installiert)
- `lucide-react` - Für Icons (bereits installiert)
- `tailwindcss` - Für Styling (bereits installiert)

## 📄 Lizenz

Teil von "Finance Made Simple" - Interne Verwendung

