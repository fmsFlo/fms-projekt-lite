# Beratungsprotokoll - Template-Hinweise für HTML

## Wichtige CSS-Regeln für vollständige Textanzeige

Um sicherzustellen, dass Text über die volle Breite angezeigt wird und nicht abgeschnitten wird, verwende diese CSS-Regeln in deinem Template:

```css
.text-field, textarea, .content-box {
  width: 100%;
  max-width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  box-sizing: border-box;
}

/* Speziell für Textfelder im Beratungsprotokoll */
.section-content {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: 1px solid #ddd;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
```

## Standard-Textbausteine mit Dropdown-Integration

### 1.1 Kundenwünsche / Anlass der Beratung

**Vollständiger Textbaustein:**
```handlebars
<p class="section-content">
  Der Kunde wünscht eine {{#if customerWishesProductType}}{{customerWishesProductType}}{{else}}[Produktart]{{/if}}, um eine kosteneffiziente, transparente Altersvorsorge aufzubauen.
  {{#if customerWishesImportant}}Wichtig ist {{customerWishesImportant}}.{{else}}Wichtig ist [Garantie / ETF-Strategie / steuerliche Förderung / Flexibilität].{{/if}}
  {{#if customerWishes}}

{{customerWishes}}{{/if}}
</p>
```

### 1.2 Kundenbedarf

**Vollständiger Textbaustein:**
```handlebars
<p class="section-content">
  Es besteht ein Bedarf zur Schließung der Rentenlücke und zum langfristigen Vermögensaufbau.
  {{#if customerNeedsFocus}}Besonderer Fokus liegt auf {{customerNeedsFocus}}.{{else}}Besonderer Fokus liegt auf [Sicherheit / Rendite / Steueroptimierung / Flexibilität].{{/if}}
  {{#if customerNeeds}}

{{customerNeeds}}{{/if}}
</p>
```

### 2.1 Risikobewertung / Komplexität

**Vollständiger Textbaustein:**
```handlebars
<p class="section-content">
  {{#if riskAssessmentProductType}}Das empfohlene Produkt ist eine {{riskAssessmentProductType}}.{{else}}Das empfohlene Produkt ist eine [Produktart].{{/if}}
  Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte wurden berücksichtigt.
  {{#if riskAssessment}}

{{riskAssessment}}{{/if}}
</p>
```

### 2.2 In Betracht kommende Versicherungsarten

**Vollständiger Textbaustein:**
```handlebars
<p class="section-content">
  Verglichen wurden klassische Rentenversicherung, fondsgebundene Rentenversicherung und die gewählte Lösung.
  {{#if insuranceTypesProductType}}Der Kunde hat sich bewusst für die {{insuranceTypesProductType}} entschieden, da diese am besten zu seinen Zielen passt.{{else}}Der Kunde hat sich bewusst für die [Produktart] entschieden, da diese am besten zu seinen Zielen passt.{{/if}}
  {{#if insuranceTypes}}

{{insuranceTypes}}{{/if}}
</p>
```

### 2.3 Rat und Begründung

**Vollständiger Textbaustein:**
```handlebars
<p class="section-content">
  Die Wahl fiel auf die{{#if adviceAndReasoningProductType}} {{adviceAndReasoningProductType}}{{/if}}{{#if adviceAndReasoningProvider}} ({{adviceAndReasoningProvider}}{{/if}}{{#if adviceAndReasoningTariff}}, {{adviceAndReasoningTariff}}{{/if}}{{#if adviceAndReasoningProvider}}){{/if}}{{#unless adviceAndReasoningProductType}} [Produktart, Anbieter, Tarif]{{/unless}}{{#if adviceAndReasoningReason}}, da diese {{adviceAndReasoningReason}} bietet.{{else}}, da diese [niedrigere Kosten / volle Transparenz / steuerliche Vorteile / flexible Gestaltungsmöglichkeiten / Förderungen] bietet.{{/if}}
</p>
```

### 2.5 Kundenentscheidung

**Vollständiger Textbaustein:**
```handlebars
<p class="section-content">
  Der Kunde folgt dem Rat des Vermittlers
  {{#if customerDecisionFull}}☑{{else}}☐{{/if}} vollständig{{#if customerDecisionFull}}{{#if customerDecisionProductType}} und entscheidet sich für die {{customerDecisionProductType}}{{#if customerDecisionProvider}} ({{customerDecisionProvider}}{{/if}}{{#if customerDecisionTariff}}, {{customerDecisionTariff}}{{/if}}{{#if customerDecisionProvider}}){{/if}}.{{/if}}{{else}} und entscheidet sich für die [Produktart, Anbieter, Tarif].{{/if}}
  
  {{#if customerDecisionPartial}}☑{{else}}☐{{/if}} nicht/nicht vollständig.
  {{#if customerDecisionPartial}}Der Kunde folgt dem Rat des Vermittlers nicht/nicht vollständig{{#if customerDecisionReason}}, weil {{customerDecisionReason}}{{/if}}.{{/if}}
</p>
```

## Zusatzhinweis (immer einfügen)

**Standard-Text:**
```handlebars
<p class="section-content" style="font-weight: bold;">
  {{#if additionalNote}}{{additionalNote}}{{else}}Der Kunde bestätigt, dass er die Funktionsweise des Produkts verstanden hat und ihm die Chancen sowie Risiken (inkl. Kapitalverlustrisiko bei Fondsanlagen) bewusst sind. Ihm ist bekannt, dass die steuerliche Behandlung von seinen persönlichen Verhältnissen abhängt.{{/if}}
</p>
```

## Vollständiges Beispiel-Template mit korrekter Formatierung

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Beratungsprotokoll</title>
  <style>
    @page {
      size: A4;
      margin: 30mm 25mm;
    }
    body {
      font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.8;
      color: #000;
    }
    
    /* Wichtig: Textfelder über volle Breite */
    .section-content {
      width: 100%;
      min-height: 60px;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ddd;
      word-wrap: break-word;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      box-sizing: border-box;
    }
    
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin: 20px 0;
    }
    
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 15px 0 10px 0;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin: 12px 0 8px 0;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    
    .logo {
      max-width: 150px;
      max-height: 80px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Beratungsprotokoll</h1>
    <div>
      {{#if companySettings.logoUrl}}
      <img src="{{companySettings.logoUrl}}" alt="Logo" class="logo" />
      {{/if}}
      <p style="font-size: 9pt; margin-top: 10px;">Vermittlerstempel</p>
    </div>
  </div>
  
  <div style="margin-bottom: 20px;">
    <p><strong>Kunde:</strong> {{customerName}}</p>
    <p><strong>Anschrift:</strong> {{customerAddress}}</p>
  </div>
  
  <h2>1. Wünsche und Bedürfnisse des Kunden</h2>
  
  <h3>1.1 Kundenwünsche / Anlass der Beratung</h3>
  <p class="section-content">
    Der Kunde wünscht eine {{#if customerWishesProductType}}{{customerWishesProductType}}{{else}}[Produktart]{{/if}}, um eine kosteneffiziente, transparente Altersvorsorge aufzubauen.
    {{#if customerWishesImportant}}Wichtig ist {{customerWishesImportant}}.{{else}}Wichtig ist [Garantie / ETF-Strategie / steuerliche Förderung / Flexibilität].{{/if}}
    {{#if customerWishes}}

{{customerWishes}}{{/if}}
  </p>
  
  <h3>1.2 Kundenbedarf</h3>
  <p class="section-content">
    Es besteht ein Bedarf zur Schließung der Rentenlücke und zum langfristigen Vermögensaufbau.
    {{#if customerNeedsFocus}}Besonderer Fokus liegt auf {{customerNeedsFocus}}.{{else}}Besonderer Fokus liegt auf [Sicherheit / Rendite / Steueroptimierung / Flexibilität].{{/if}}
    {{#if customerNeeds}}

{{customerNeeds}}{{/if}}
  </p>
  
  <h2>2. Rat – Begründung – Kundenentscheidung</h2>
  
  <h3>2.1 Risikobewertung / Komplexität</h3>
  <p class="section-content">
    {{#if riskAssessmentProductType}}Das empfohlene Produkt ist eine {{riskAssessmentProductType}}.{{else}}Das empfohlene Produkt ist eine [Produktart].{{/if}}
    Die Risiken ergeben sich aus der gewählten Kapitalanlage (z. B. ETFs/Fonds). Der Kunde wurde auf Chancen, Wertschwankungen und mögliche Verluste hingewiesen. Steuerliche Aspekte wurden berücksichtigt.
    {{#if riskAssessment}}

{{riskAssessment}}{{/if}}
  </p>
  
  <h3>2.2 In Betracht kommende Versicherungsarten</h3>
  <p class="section-content">
    Verglichen wurden klassische Rentenversicherung, fondsgebundene Rentenversicherung und die gewählte Lösung.
    {{#if insuranceTypesProductType}}Der Kunde hat sich bewusst für die {{insuranceTypesProductType}} entschieden, da diese am besten zu seinen Zielen passt.{{else}}Der Kunde hat sich bewusst für die [Produktart] entschieden, da diese am besten zu seinen Zielen passt.{{/if}}
    {{#if insuranceTypes}}

{{insuranceTypes}}{{/if}}
  </p>
  
  <h3>2.3 Rat und Begründung</h3>
  <p class="section-content">
    Die Wahl fiel auf die{{#if adviceAndReasoningProductType}} {{adviceAndReasoningProductType}}{{/if}}{{#if adviceAndReasoningProvider}} ({{adviceAndReasoningProvider}}{{/if}}{{#if adviceAndReasoningTariff}}, {{adviceAndReasoningTariff}}{{/if}}{{#if adviceAndReasoningProvider}}){{/if}}{{#unless adviceAndReasoningProductType}} [Produktart, Anbieter, Tarif]{{/unless}}{{#if adviceAndReasoningReason}}, da diese {{adviceAndReasoningReason}} bietet.{{else}}, da diese [niedrigere Kosten / volle Transparenz / steuerliche Vorteile / flexible Gestaltungsmöglichkeiten / Förderungen] bietet.{{/if}}
  </p>
  
  <h3>2.4 Geeignetheit und Angemessenheit (nur für Versicherungsanlageprodukte)</h3>
  <p class="section-content">
    Auf Basis einer ausführlichen Risikoanalyse ist das Produkt für den Kunden
    {{#if suitabilitySuitable}}☑{{else}}☐{{/if}} geeignet und angemessen.
    
    {{#if suitabilityNotSuitable}}☑{{else}}☐{{/if}} nicht geeignet oder nicht angemessen.
    Der Kunde möchte das Produkt jedoch trotzdem erwerben.
    
    {{#if suitabilityAttached}}☑{{else}}☐{{/if}} Eine detaillierte Geeignetheits- und Angemessenheitsprüfung ist dem Beratungsprotokoll als Anhang beigefügt.
  </p>
  
  <h3>2.5 Kundenentscheidung</h3>
  <p class="section-content">
    Der Kunde folgt dem Rat des Vermittlers
    {{#if customerDecisionFull}}☑{{else}}☐{{/if}} vollständig{{#if customerDecisionFull}}{{#if customerDecisionProductType}} und entscheidet sich für die {{customerDecisionProductType}}{{#if customerDecisionProvider}} ({{customerDecisionProvider}}{{/if}}{{#if customerDecisionTariff}}, {{customerDecisionTariff}}{{/if}}{{#if customerDecisionProvider}}){{/if}}.{{/if}}{{else}} und entscheidet sich für die [Produktart, Anbieter, Tarif].{{/if}}
    
    {{#if customerDecisionPartial}}☑{{else}}☐{{/if}} nicht/nicht vollständig.
    {{#if customerDecisionPartial}}Der Kunde folgt dem Rat des Vermittlers nicht/nicht vollständig{{#if customerDecisionReason}}, weil {{customerDecisionReason}}{{/if}}.{{/if}}
  </p>
  
  <h2>3. Marktuntersuchung</h2>
  <p class="section-content">
    {{#if marketResearchObjective}}☑{{else}}☐{{/if}} Der Versicherungsmakler stützt seinen Rat auf eine objektive, ausgewogene Marktuntersuchung.
    
    {{#if marketResearchBroker}}☑{{else}}☐{{/if}} Der Versicherungsmakler
    {{#if marketResearchMultiAgent}}☑{{else}}☐{{/if}} Der Mehrfachgeneralagent
    stützt seinen Rat auf folgende Versicherer:
    {{#if marketResearchInsurers}}{{marketResearchInsurers}}{{else}}__________________________{{/if}}
    
    {{#if marketResearchLimited}}☑{{else}}☐{{/if}} stützt seinen Rat auf eine beschränkte Anzahl von Versicherern. Der Kunde hat von seinem Recht, die Namen der dem Rat zu Grunde gelegten Versicherer zu verlangen, <strong>keinen</strong> Gebrauch gemacht.
  </p>
  
  {{#if additionalNote}}
  <p class="section-content" style="font-weight: bold;">
    {{additionalNote}}
  </p>
  {{else}}
  <p class="section-content" style="font-weight: bold;">
    Der Kunde bestätigt, dass er die Funktionsweise des Produkts verstanden hat und ihm die Chancen sowie Risiken (inkl. Kapitalverlustrisiko bei Fondsanlagen) bewusst sind. Ihm ist bekannt, dass die steuerliche Behandlung von seinen persönlichen Verhältnissen abhängt.
  </p>
  {{/if}}
  
  <div style="margin-top: 60px; display: flex; justify-content: space-between;">
    <div style="width: 200px;">
      <p style="border-top: 1px solid #000; padding-top: 5px; margin: 0;">{{placeDate}}</p>
      <p style="margin-top: 5px; font-size: 9pt;">Ort, Datum</p>
    </div>
    <div style="width: 200px; text-align: center;">
      <p style="border-top: 1px solid #000; padding-top: 5px; margin: 0; min-height: 30px;">{{customerSignature}}</p>
      <p style="margin-top: 5px; font-size: 9pt;">Kunde</p>
    </div>
    <div style="width: 200px; text-align: center;">
      <p style="border-top: 1px solid #000; padding-top: 5px; margin: 0; min-height: 30px;">{{intermediarySignature}}</p>
      <p style="margin-top: 5px; font-size: 9pt;">Vermittler</p>
    </div>
  </div>
</body>
</html>
```

## PDF-Bearbeitbarkeit

Das generierte PDF ist ein statisches PDF. Für nachträgliche Bearbeitung:

1. **In PDF-Editoren:** Adobe Acrobat, PDF Expert, etc. können Textfelder bearbeiten (wenn das PDF nicht gesperrt ist)
2. **Als Vorlage:** Das PDF kann als Vorlage gespeichert und in verschiedenen PDF-Editoren geöffnet werden
3. **Textmarkierung:** Text kann markiert und überschrieben werden (je nach PDF-Editor)

**Hinweis:** Für vollständig interaktive PDF-Formulare (AcroForms) würde man zusätzliche Bibliotheken benötigen. Das aktuelle System generiert statische PDFs mit korrekter Formatierung, die in den meisten PDF-Editoren bearbeitbar sind.




