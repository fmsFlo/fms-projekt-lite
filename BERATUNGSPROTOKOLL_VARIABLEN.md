# Beratungsprotokoll - Variablen-Übersicht

Diese Übersicht listet alle verfügbaren Handlebars-Variablen für das Beratungsprotokoll-Template auf.

## Wichtige Hinweise

- **Alle Felder sind optional** - kein Feld ist Pflicht
- **Dropdown-Auswahl**: Für eckige Klammern `[Option1 / Option2]` gibt es Dropdown-Auswahl mit Option "Eigener Text"
- **Nachbearbeitung**: Das generierte PDF kann nachträglich bearbeitet werden, wenn formattierte Textfelder im PDF enthalten sind

## Verwendung im HTML-Template

Verwende die Variablen in deinem Handlebars-Template mit `{{variableName}}` für einfache Werte oder `{{#if variableName}}...{{/if}}` für Checkbox-Bedingungen.

### Textformatierung für vollständige Anzeige

Verwende CSS um sicherzustellen, dass Text über die volle Breite läuft:
```css
.text-field {
  width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
```

---

## 1. Kundeninformationen

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel |
|---|---|---|---|
| `{{customerName}}` | Kunde (Name) | Text | Max Mustermann |
| `{{customerAddress}}` | Anschrift | Text | Musterstraße 1, 12345 Musterstadt |

---

## 2. Section 1: Wünsche und Bedürfnisse des Kunden

### 2.1 Kundenwünsche / Anlass der Beratung

**Standard-Textbaustein:**
```
Der Kunde wünscht eine [Produktart], um eine kosteneffiziente, transparente Altersvorsorge aufzubauen. Wichtig ist [Wichtig ist].
```

| Variable (Englisch) | Label (Deutsch) | Typ | Optionen |
|---|---|---|---|
| `{{customerWishesProductType}}` | 1.1 Produktart | Dropdown + Freitext | Basisrente, Riester, bAV, Flexible Rentenversicherung, Honorar-Nettopolice, Eigener Text |
| `{{customerWishesImportant}}` | 1.1 Wichtig ist | Dropdown + Freitext | Garantie, ETF-Strategie, steuerliche Förderung, Flexibilität, Eigener Text |
| `{{customerWishes}}` | 1.1 Zusätzlicher Text | Textarea | Freitext für weitere Details/Anlass |

**Verwendung im Template:**
```handlebars
Der Kunde wünscht eine {{customerWishesProductType}}{{#if customerWishesProductType}}, um eine kosteneffiziente, transparente Altersvorsorge aufzubauen.{{/if}}
{{#if customerWishesImportant}}Wichtig ist {{customerWishesImportant}}.{{/if}}
{{#if customerWishes}}{{customerWishes}}{{/if}}
```

### 2.2 Kundenbedarf

**Standard-Textbaustein:**
```
Es besteht ein Bedarf zur Schließung der Rentenlücke und zum langfristigen Vermögensaufbau. Besonderer Fokus liegt auf [Fokus].
```

| Variable (Englisch) | Label (Deutsch) | Typ | Optionen |
|---|---|---|---|
| `{{customerNeedsFocus}}` | 1.2 Fokus liegt auf | Dropdown + Freitext | Sicherheit, Rendite, Steueroptimierung, Flexibilität, Eigener Text |
| `{{customerNeeds}}` | 1.2 Zusätzlicher Text | Textarea | Freitext für weitere Details (z.B. Höhe Versorgungslücke, steuerliche Aspekte) |

**Verwendung im Template:**
```handlebars
Es besteht ein Bedarf zur Schließung der Rentenlücke und zum langfristigen Vermögensaufbau.
{{#if customerNeedsFocus}}Besonderer Fokus liegt auf {{customerNeedsFocus}}.{{/if}}
{{#if customerNeeds}}{{customerNeeds}}{{/if}}
```

---

## 3. Section 2: Rat – Begründung – Kundenentscheidung

### 2.1 Risikobewertung / Komplexität

**Standard-Textbaustein:**
```
Das empfohlene Produkt ist eine [Produktart]. Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte wurden berücksichtigt.
```

| Variable (Englisch) | Label (Deutsch) | Typ | Optionen |
|---|---|---|---|
| `{{riskAssessmentProductType}}` | 2.1 Produktart | Dropdown + Freitext | Basisrente, Riester, bAV, Flexible Rentenversicherung, Honorar-Nettopolice, Eigener Text |
| `{{riskAssessment}}` | 2.1 Zusätzlicher Text | Textarea | Freitext für Risikoprofil, besondere Hinweise |

**Verwendung im Template:**
```handlebars
{{#if riskAssessmentProductType}}Das empfohlene Produkt ist eine {{riskAssessmentProductType}}.{{/if}}
Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte wurden berücksichtigt.
{{#if riskAssessment}}{{riskAssessment}}{{/if}}
```

### 2.2 In Betracht kommende Versicherungsarten

**Standard-Textbaustein:**
```
Verglichen wurden klassische Rentenversicherung, fondsgebundene Rentenversicherung und die gewählte Lösung. Der Kunde hat sich bewusst für die [Produktart] entschieden, da diese am besten zu seinen Zielen passt.
```

| Variable (Englisch) | Label (Deutsch) | Typ | Optionen |
|---|---|---|---|
| `{{insuranceTypesProductType}}` | 2.2 Produktart | Dropdown + Freitext | Basisrente, Riester, bAV, Flexible Rentenversicherung, Honorar-Nettopolice, Eigener Text |
| `{{insuranceTypes}}` | 2.2 Zusätzlicher Text | Textarea | Freitext für alternative Produkte, die geprüft aber verworfen wurden |

**Verwendung im Template:**
```handlebars
Verglichen wurden klassische Rentenversicherung, fondsgebundene Rentenversicherung und die gewählte Lösung.
{{#if insuranceTypesProductType}}Der Kunde hat sich bewusst für die {{insuranceTypesProductType}} entschieden, da diese am besten zu seinen Zielen passt.{{/if}}
{{#if insuranceTypes}}{{insuranceTypes}}{{/if}}
```

### 2.3 Rat und Begründung

**Standard-Textbaustein:**
```
Die Wahl fiel auf die [Produktart, Anbieter, Tarif], da diese [niedrigere Kosten / volle Transparenz / steuerliche Vorteile / flexible Gestaltungsmöglichkeiten / Förderungen] bietet.
```

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel |
|---|---|---|---|
| `{{adviceAndReasoningProductType}}` | 2.3 Produktart | Dropdown + Freitext | Basisrente, Riester, etc. |
| `{{adviceAndReasoningProvider}}` | 2.3 Anbieter | Text | Alte Leipziger |
| `{{adviceAndReasoningTariff}}` | 2.3 Tarif | Text | FR10 |
| `{{adviceAndReasoningReason}}` | 2.3 Begründung | Textarea | Freitext für Vorteile (niedrigere Kosten, Transparenz, etc.) |

**Verwendung im Template:**
```handlebars
Die Wahl fiel auf die{{#if adviceAndReasoningProductType}} {{adviceAndReasoningProductType}}{{/if}}{{#if adviceAndReasoningProvider}} ({{adviceAndReasoningProvider}}{{/if}}{{#if adviceAndReasoningTariff}}, {{adviceAndReasoningTariff}}{{/if}}{{#if adviceAndReasoningProvider}}){{/if}}{{#if adviceAndReasoningReason}}, da diese {{adviceAndReasoningReason}} bietet.{{/if}}
```

### 2.4: Geeignetheit und Angemessenheit (Checkboxen)

| Variable (Englisch) | Label (Deutsch) | Typ | Verwendung |
|---|---|---|---|
| `{{suitabilitySuitable}}` | 2.4 Geeignet und angemessen | Checkbox (true/false) | `{{#if suitabilitySuitable}}☑{{else}}☐{{/if}}` |
| `{{suitabilityNotSuitable}}` | 2.4 Nicht geeignet oder nicht angemessen (Kunde möchte trotzdem erwerben) | Checkbox (true/false) | `{{#if suitabilityNotSuitable}}☑{{else}}☐{{/if}}` |
| `{{suitabilityAttached}}` | 2.4 Geeignetheitsprüfung als Anhang beigefügt | Checkbox (true/false) | `{{#if suitabilityAttached}}☑{{else}}☐{{/if}}` |

**Beispiel im HTML:**
```handlebars
☐ Auf Basis einer ausführlichen Risikoanalyse ist das Produkt für den Kunden
{{#if suitabilitySuitable}}☑{{else}}☐{{/if}} geeignet und angemessen.
{{#if suitabilityNotSuitable}}☑{{else}}☐{{/if}} nicht geeignet oder nicht angemessen.
Der Kunde möchte das Produkt jedoch trotzdem erwerben.
{{#if suitabilityAttached}}☑{{else}}☐{{/if}} Eine detaillierte Geeignetheits- und Angemessenheitsprüfung ist dem Beratungsprotokoll als Anhang beigefügt.
```

### 2.5: Kundenentscheidung

**Standard-Textbaustein:**
```
Der Kunde folgt dem Rat vollständig und entscheidet sich für die [Produktart, Anbieter, Tarif].
```

| Variable (Englisch) | Label (Deutsch) | Typ | Optionen/Beispiel |
|---|---|---|---|
| `{{customerDecisionFull}}` | 2.5 Kunde folgt Rat vollständig | Checkbox (true/false) | `{{#if customerDecisionFull}}☑{{else}}☐{{/if}}` |
| `{{customerDecisionPartial}}` | 2.5 Kunde folgt Rat nicht/nicht vollständig | Checkbox (true/false) | `{{#if customerDecisionPartial}}☑{{else}}☐{{/if}}` |
| `{{customerDecisionProductType}}` | 2.5 Produktart | Dropdown + Freitext | Basisrente, Riester, etc. |
| `{{customerDecisionProvider}}` | 2.5 Anbieter | Text | Alte Leipziger |
| `{{customerDecisionTariff}}` | 2.5 Tarif | Text | FR10 |
| `{{customerDecisionReason}}` | 2.5 Begründung (wenn nicht vollständig) | Textarea (mehrzeilig) | `{{customerDecisionReason}}` |

**Beispiel im HTML:**
```handlebars
Der Kunde folgt dem Rat des Vermittlers
{{#if customerDecisionFull}}☑{{else}}☐{{/if}} vollständig{{#if customerDecisionProductType}} und entscheidet sich für die {{customerDecisionProductType}}{{#if customerDecisionProvider}} ({{customerDecisionProvider}}{{/if}}{{#if customerDecisionTariff}}, {{customerDecisionTariff}}{{/if}}{{#if customerDecisionProvider}}){{/if}}.{{/if}}
{{#if customerDecisionPartial}}☑{{else}}☐{{/if}} nicht/nicht vollständig.
{{#if customerDecisionPartial}}Der Kunde folgt dem Rat des Vermittlers nicht/nicht vollständig{{#if customerDecisionReason}}, weil {{customerDecisionReason}}{{/if}}.{{/if}}
```

### Zusatzhinweis (immer einfügen)

| Variable (Englisch) | Label (Deutsch) | Typ | Beschreibung |
|---|---|---|---|
| `{{additionalNote}}` | Zusatzhinweis | Textarea | **Standard-Text (optional bearbeitbar):** "Der Kunde bestätigt, dass er die Funktionsweise des Produkts verstanden hat und ihm die Chancen sowie Risiken (inkl. Kapitalverlustrisiko bei Fondsanlagen) bewusst sind. Ihm ist bekannt, dass die steuerliche Behandlung von seinen persönlichen Verhältnissen abhängt." |

**Verwendung im Template:**
```handlebars
{{#if additionalNote}}{{additionalNote}}{{else}}Der Kunde bestätigt, dass er die Funktionsweise des Produkts verstanden hat und ihm die Chancen sowie Risiken (inkl. Kapitalverlustrisiko bei Fondsanlagen) bewusst sind. Ihm ist bekannt, dass die steuerliche Behandlung von seinen persönlichen Verhältnissen abhängt.{{/if}}
```

---

## 4. Section 3: Marktuntersuchung

| Variable (Englisch) | Label (Deutsch) | Typ | Verwendung |
|---|---|---|---|
| `{{marketResearchObjective}}` | 3. Objektive, ausgewogene Marktuntersuchung | Checkbox (true/false) | `{{#if marketResearchObjective}}☑{{else}}☐{{/if}}` |
| `{{marketResearchBroker}}` | 3. Versicherungsmakler | Checkbox (true/false) | `{{#if marketResearchBroker}}☑{{else}}☐{{/if}}` |
| `{{marketResearchMultiAgent}}` | 3. Mehrfachgeneralagent | Checkbox (true/false) | `{{#if marketResearchMultiAgent}}☑{{else}}☐{{/if}}` |
| `{{marketResearchInsurers}}` | 3. Versicherer (Liste) | Text | `{{marketResearchInsurers}}` |
| `{{marketResearchLimited}}` | 3. Beschränkte Anzahl Versicherer (Kunde hat Namen nicht verlangt) | Checkbox (true/false) | `{{#if marketResearchLimited}}☑{{else}}☐{{/if}}` |

**Beispiel im HTML:**
```handlebars
{{#if marketResearchObjective}}☑{{else}}☐{{/if}} Der Versicherungsmakler stützt seinen Rat auf eine objektive, ausgewogene Marktuntersuchung.
{{#if marketResearchBroker}}☑{{else}}☐{{/if}} Der Versicherungsmakler
{{#if marketResearchMultiAgent}}☑{{else}}☐{{/if}} Der Mehrfachgeneralagent
stützt seinen Rat auf folgende Versicherer:
{{marketResearchInsurers}}

{{#if marketResearchLimited}}☑{{else}}☐{{/if}} stützt seinen Rat auf eine beschränkte Anzahl von Versicherern. Der Kunde hat von seinem Recht, die Namen der dem Rat zu Grunde gelegten Versicherer zu verlangen, <strong>keinen</strong> Gebrauch gemacht.
```

**Hinweis:** Das Wort "keinen" sollte fett formatiert werden: `<strong>keinen</strong>`

---

## 5. Unterschriften und Datum

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel |
|---|---|---|---|
| `{{placeDate}}` | Ort, Datum | Text | Berlin, 30.05.2025 |
| `{{customerSignature}}` | Kunde (Unterschrift) | Text | (für Unterschriftsfeld) |
| `{{intermediarySignature}}` | Vermittler (Unterschrift) | Text | (für Unterschriftsfeld) |

---

## 6. Zusätzliche verfügbare Variablen

Diese Variablen sind ebenfalls verfügbar und werden aus den Client- und Company-Daten automatisch befüllt:

### Client-Daten (verfügbar unter `{{client.variableName}}`)
- `{{client.firstName}}` - Vorname
- `{{client.lastName}}` - Nachname
- `{{client.email}}` - E-Mail
- `{{client.phone}}` - Telefon
- `{{client.street}}` - Straße
- `{{client.houseNumber}}` - Hausnummer
- `{{client.zip}}` - PLZ
- `{{client.city}}` - Ort
- `{{client.iban}}` - IBAN

### Company Settings (verfügbar unter `{{companySettings.variableName}}`)
- `{{companySettings.companyName}}` - Firmenname
- `{{companySettings.contactPerson}}` - Ansprechpartner
- `{{companySettings.companyStreet}}` - Firmenadresse (Straße)
- `{{companySettings.companyCity}}` - Firmenadresse (Stadt)
- `{{companySettings.companyZip}}` - Firmenadresse (PLZ)
- `{{companySettings.logoUrl}}` - Logo-URL (für `<img>` Tag)

**Logo-Beispiel:**
```handlebars
{{#if companySettings.logoUrl}}
<img src="{{companySettings.logoUrl}}" alt="Logo" style="width: 63.30px; height: 38.50px;" />
{{/if}}
```

---

## Vollständige Checkliste für HTML-Template

1. ✅ **Header:** "Beratungsprotokoll" + "Vermittlerstempel" (mit Logo falls vorhanden)
2. ✅ **Kundeninfo:** `{{customerName}}`, `{{customerAddress}}`
3. ✅ **Section 1.1:** `{{customerWishes}}`
4. ✅ **Section 1.2:** `{{customerNeeds}}`
5. ✅ **Section 2.1:** `{{riskAssessment}}`
6. ✅ **Section 2.2:** `{{insuranceTypes}}`
7. ✅ **Section 2.3:** `{{adviceAndReasoning}}`
8. ✅ **Section 2.4:** Checkboxen für `suitabilitySuitable`, `suitabilityNotSuitable`, `suitabilityAttached`
9. ✅ **Section 2.5:** Checkboxen für `customerDecisionFull`, `customerDecisionPartial` + Textfeld `{{customerDecisionReason}}`
10. ✅ **Section 3:** Checkboxen für `marketResearchObjective`, `marketResearchBroker`, `marketResearchMultiAgent`, `marketResearchLimited` + Textfeld `{{marketResearchInsurers}}`
11. ✅ **Unterschriften:** `{{placeDate}}`, `{{customerSignature}}`, `{{intermediarySignature}}`

---

## Beispiel-Template-Struktur

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Beratungsprotokoll</title>
  <style>
    /* Dein CSS hier */
  </style>
</head>
<body>
  <div class="header">
    <h1>Beratungsprotokoll</h1>
    {{#if companySettings.logoUrl}}
    <img src="{{companySettings.logoUrl}}" alt="Logo" />
    {{/if}}
  </div>
  
  <div class="customer-info">
    <p><strong>Kunde:</strong> {{customerName}}</p>
    <p><strong>Anschrift:</strong> {{customerAddress}}</p>
  </div>
  
  <div class="section">
    <h2>1. Wünsche und Bedürfnisse des Kunden</h2>
    <h3>1.1 Kundenwünsche / Anlass der Beratung</h3>
    <div class="textarea">{{customerWishes}}</div>
    
    <h3>1.2 Kundenbedarf</h3>
    <div class="textarea">{{customerNeeds}}</div>
  </div>
  
  <!-- Weiter mit Section 2 und 3... -->
  
</body>
</html>
```

