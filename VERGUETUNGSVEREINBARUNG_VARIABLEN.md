# Vergütungsvereinbarung - Variablen-Übersicht

Diese Übersicht listet alle verfügbaren Handlebars-Variablen für die Vergütungsvereinbarung-Templates (SEPA Lastschrift und Überweisung) mit Mehrpersonen-Unterstützung auf.

## Verwendung im HTML-Template

Verwende die Variablen in deinem Handlebars-Template mit `{{variableName}}` für einfache Werte oder `{{#if variableName}}...{{/if}}` für Bedingungen.

---

## 1. Grundlegende Vertragsdaten

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel | Beschreibung |
|---|---|---|---|---|
| `{{productProvider}}` | Anbieter | Text | Alte Leipziger | Versicherungsanbieter für die Hauptperson |
| `{{productDescription}}` | Produkt | Text | FR10 | Produktname/Produktnummer für die Hauptperson |
| `{{applicationDate}}` | Antragsdatum | Datum | 03.11.2025 | Datum der Antragstellung (Format: DD.MM.YYYY) |
| `{{amountEUR}}` | Honorarhöhe (EUR) | Zahl | 3000.00 | Honorar für die Hauptperson |
| `{{bookingStart}}` | Buchungsbeginn | Datum | 03.11.2025 | Datum des Buchungsbeginns (Format: DD.MM.YYYY) |

---

## 2. Zahlungsinformationen

### Zahlungsart und -weise

| Variable (Englisch) | Label (Deutsch) | Typ | Mögliche Werte | Beschreibung |
|---|---|---|---|---|
| `{{paymentMethod}}` | Zahlungsart | Text | "Lastschrift" oder "Überweisung" | Bestimmt welches Template verwendet wird |
| `{{paymentFrequency}}` | Zahlweise | Text | "Einmalzahlung", "Ratenzahlung", "Ratenzahlung mit erhöhter Startzahlung" | Nur bei Lastschrift verfügbar |

### Ratenzahlung (nur bei Lastschrift + Ratenzahlung)

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel | Beschreibung |
|---|---|---|---|---|
| `{{numberOfInstallments}}` | Anzahl Raten | Zahl | 12 | Anzahl der monatlichen Raten |
| `{{increasedStartAmount}}` | Erhöhte Startpauschale (EUR) | Zahl | 500.00 | Erste Rate bei erhöhter Startzahlung (optional) |
| `{{installmentAmount}}` | Ratenhöhe (EUR) | Zahl | 208.33 | **Automatisch berechnet**: Höhe einer Rate |
| `{{clientIban}}` | IBAN Kunde | Text | DE89 3704 0044 0532 0130 00 | **Automatisch aus Client-Daten geladen** |

### Überweisung

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel | Beschreibung |
|---|---|---|---|---|
| `{{advisorIban}}` | IBAN Berater | Text | DE89 3704 0044 0532 0130 00 | **Automatisch aus Company Settings geladen** |
| `{{paymentSubject}}` | Verwendungszweck | Text | Vertrag - Mustermann | **Automatisch generiert** aus Company Settings + Kundennamen |

---

## 3. Mehrpersonen-Unterstützung

### Person 2 (aufklappbar)

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel | Beschreibung |
|---|---|---|---|---|
| `{{person2Name}}` | 2. Person (Name) | Text | Mann Beispiel | Name der 2. Person |
| `{{person2Provider}}` | 2. Person Anbieter | Text | Alte Leipziger | Anbieter für Person 2 (falls abweichend vom Hauptanbieter) |
| `{{person2Product}}` | 2. Person Produkt | Text | FR10 | Produkt für Person 2 (falls abweichend vom Hauptprodukt) |
| `{{person2Amount}}` | 2. Person Honorar (EUR) | Zahl | 3000.00 | Honorar für Person 2 |

### Person 3 (aufklappbar)

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel | Beschreibung |
|---|---|---|---|---|
| `{{person3Name}}` | 3. Person (Name) | Text | Kind Beispiel | Name der 3. Person |
| `{{person3Provider}}` | 3. Person Anbieter | Text | Alte Leipziger | Anbieter für Person 3 (falls abweichend vom Hauptanbieter) |
| `{{person3Product}}` | 3. Person Produkt | Text | FR10 | Produkt für Person 3 (falls abweichend vom Hauptprodukt) |
| `{{person3Amount}}` | 3. Person Honorar (EUR) | Zahl | 1500.00 | Honorar für Person 3 |

### Gesamthonorar

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel | Beschreibung |
|---|---|---|---|---|
| `{{totalAmount}}` | Gesamthonorar (EUR) | Zahl | 7500.00 | **Automatisch berechnet**: Summe aus allen Personen (amountEUR + person2Amount + person3Amount) |

---

## 4. Zusätzliche verfügbare Variablen

### Client-Daten (verfügbar unter `{{client.variableName}}`)

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel |
|---|---|---|---|
| `{{client.firstName}}` | Vorname | Text | Max |
| `{{client.lastName}}` | Nachname | Text | Mustermann |
| `{{client.email}}` | E-Mail | Text | max@example.com |
| `{{client.phone}}` | Telefon | Text | +49 123 456789 |
| `{{client.street}}` | Straße | Text | Musterstraße |
| `{{client.houseNumber}}` | Hausnummer | Text | 1 |
| `{{client.zip}}` | PLZ | Text | 12345 |
| `{{client.city}}` | Ort | Text | Berlin |
| `{{client.iban}}` | IBAN | Text | DE89 3704 0044 0532 0130 00 |

**Vollständige Adresse:**
```handlebars
{{client.street}} {{client.houseNumber}}, {{client.zip}} {{client.city}}
```

### Company Settings (verfügbar unter `{{companySettings.variableName}}`)

| Variable (Englisch) | Label (Deutsch) | Typ | Beispiel |
|---|---|---|---|
| `{{companySettings.companyName}}` | Firmenname | Text | Beispiel GmbH |
| `{{companySettings.contactPerson}}` | Ansprechpartner | Text | Max Berater |
| `{{companySettings.companyStreet}}` | Firmenadresse (Straße) | Text | Firmenstraße |
| `{{companySettings.companyHouseNumber}}` | Firmenadresse (Hausnummer) | Text | 10 |
| `{{companySettings.companyZip}}` | Firmenadresse (PLZ) | Text | 10115 |
| `{{companySettings.companyCity}}` | Firmenadresse (Stadt) | Text | Berlin |
| `{{companySettings.companyPhone}}` | Firmentelefon | Text | +49 30 123456 |
| `{{companySettings.companyEmail}}` | Firmen-E-Mail | Text | info@beispiel.de |
| `{{companySettings.logoUrl}}` | Logo-URL | Text | /uploads/logo.png |
| `{{companySettings.companySlogan}}` | Slogan | Text | finance made simple |

**Logo-Beispiel:**
```handlebars
{{#if companySettings.logoUrl}}
<img src="{{companySettings.logoUrl}}" alt="Logo" style="width: 63.30px; height: 38.50px;" />
{{/if}}
```

---

## 5. Honorarübersicht-Tabelle (Beispiel)

Verwende diese Variablen um eine Tabelle zu erstellen, die alle Personen mit ihren individuellen Anbietern und Produkten zeigt:

```handlebars
<table>
  <thead>
    <tr>
      <th>ANBIETER</th>
      <th>PRODUKT</th>
      <th>ANTRAGSDATUM</th>
      <th>HONORAR</th>
    </tr>
  </thead>
  <tbody>
    <!-- Hauptperson -->
    <tr>
      <td>{{productProvider}}</td>
      <td>{{productDescription}}</td>
      <td>{{applicationDate}}</td>
      <td>{{amountEUR}} EUR</td>
    </tr>
    
    <!-- Person 2 (nur wenn vorhanden) -->
    {{#if person2Name}}
    <tr>
      <td>{{#if person2Provider}}{{person2Provider}}{{else}}{{productProvider}}{{/if}}</td>
      <td>{{#if person2Product}}{{person2Product}}{{else}}{{productDescription}}{{/if}}</td>
      <td>{{applicationDate}}</td>
      <td>{{person2Amount}} EUR</td>
    </tr>
    {{/if}}
    
    <!-- Person 3 (nur wenn vorhanden) -->
    {{#if person3Name}}
    <tr>
      <td>{{#if person3Provider}}{{person3Provider}}{{else}}{{productProvider}}{{/if}}</td>
      <td>{{#if person3Product}}{{person3Product}}{{else}}{{productDescription}}{{/if}}</td>
      <td>{{applicationDate}}</td>
      <td>{{person3Amount}} EUR</td>
    </tr>
    {{/if}}
    
    <!-- Gesamthonorar -->
    <tr>
      <td colspan="3" style="text-align: right; font-weight: bold;">Gesamthonorar:</td>
      <td style="font-weight: bold;">{{totalAmount}} EUR</td>
    </tr>
  </tbody>
</table>
```

---

## 6. Bedingte Anzeige (SEPA Lastschrift vs. Überweisung)

### SEPA Lastschrift - spezifische Felder

Diese Felder sind nur verfügbar wenn `paymentMethod === 'Lastschrift'`:

```handlebars
{{#if (eq paymentMethod 'Lastschrift')}}
  <!-- SEPA Lastschrift Mandat -->
  <p>SEPA-Lastschriftmandat</p>
  <p>IBAN: {{clientIban}}</p>
  
  {{#if (or (eq paymentFrequency 'Ratenzahlung') (eq paymentFrequency 'Ratenzahlung mit erhöhter Startzahlung'))}}
    <p>Anzahl Raten: {{numberOfInstallments}}</p>
    <p>Ratenhöhe: {{installmentAmount}} EUR</p>
    {{#if increasedStartAmount}}
      <p>Erste Rate (Startpauschale): {{increasedStartAmount}} EUR</p>
    {{/if}}
  {{/if}}
{{/if}}
```

### Überweisung - spezifische Felder

Diese Felder sind nur verfügbar wenn `paymentMethod === 'Überweisung'`:

```handlebars
{{#if (eq paymentMethod 'Überweisung')}}
  <p>Bitte überweisen Sie den Betrag auf folgendes Konto:</p>
  <p>IBAN: {{advisorIban}}</p>
  <p>Verwendungszweck: {{paymentSubject}}</p>
{{/if}}
```

---

## 7. Datumsformatierung

Alle Datumsfelder werden automatisch im Format **DD.MM.YYYY** formatiert:
- `{{applicationDate}}` → z.B. "03.11.2025"
- `{{bookingStart}}` → z.B. "03.11.2025"

---

## 8. Vollständige Checkliste für HTML-Template

1. ✅ **Header:** Logo (falls vorhanden) + Firmenname/Slogan
2. ✅ **Kundenanschrift:** `{{client.firstName}} {{client.lastName}}`, `{{client.street}} {{client.houseNumber}}`, `{{client.zip}} {{client.city}}`
3. ✅ **Vertragsdaten:** Anbieter, Produkt, Antragsdatum, Buchungsbeginn
4. ✅ **Honorarübersicht-Tabelle:** Alle Personen mit individuellen Anbietern/Produkten + Gesamthonorar
5. ✅ **Zahlungsart-abhängige Inhalte:**
   - SEPA: Lastschriftmandat, IBAN, Rateninformationen
   - Überweisung: Berater-IBAN, Verwendungszweck
6. ✅ **Vertragstext:** Produktbeschreibung, Leistungen, etc.
7. ✅ **Unterschriftsfelder:** Kunde + Berater

---

## 9. Beispiel-Template-Struktur

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vergütungsvereinbarung</title>
  <style>
    /* Dein CSS hier */
    @page {
      size: A4;
      margin: 30mm 25mm;
    }
    body {
      font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <!-- Logo und Header -->
  {{#if companySettings.logoUrl}}
  <div style="text-align: right;">
    <img src="{{companySettings.logoUrl}}" alt="Logo" style="max-width: 150px; max-height: 80px;" />
    {{#if companySettings.companySlogan}}
    <p style="font-size: 12pt; color: #666;">{{companySettings.companySlogan}}</p>
    {{/if}}
  </div>
  {{/if}}
  
  <!-- Kundenanschrift -->
  <div>
    <p><strong>{{client.firstName}} {{client.lastName}}</strong></p>
    <p>{{client.street}} {{client.houseNumber}}</p>
    <p>{{client.zip}} {{client.city}}</p>
  </div>
  
  <!-- Vertragsdaten -->
  <h1>Vergütungsvereinbarung Nettoprodukt</h1>
  
  <p><strong>Anbieter:</strong> {{productProvider}}</p>
  <p><strong>Produkt:</strong> {{productDescription}}</p>
  <p><strong>Antragsdatum:</strong> {{applicationDate}}</p>
  <p><strong>Buchungsbeginn:</strong> {{bookingStart}}</p>
  
  <!-- Honorarübersicht -->
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <thead>
      <tr style="background-color: #f0f0f0;">
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ANBIETER</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">PRODUKT</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ANTRAGSDATUM</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">HONORAR</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">{{productProvider}}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">{{productDescription}}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">{{applicationDate}}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">{{amountEUR}} EUR</td>
      </tr>
      {{#if person2Name}}
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">{{#if person2Provider}}{{person2Provider}}{{else}}{{productProvider}}{{/if}}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">{{#if person2Product}}{{person2Product}}{{else}}{{productDescription}}{{/if}}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">{{applicationDate}}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">{{person2Amount}} EUR</td>
      </tr>
      {{/if}}
      {{#if person3Name}}
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">{{#if person3Provider}}{{person3Provider}}{{else}}{{productProvider}}{{/if}}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">{{#if person3Product}}{{person3Product}}{{else}}{{productDescription}}{{/if}}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">{{applicationDate}}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">{{person3Amount}} EUR</td>
      </tr>
      {{/if}}
      <tr style="background-color: #e3f2fd; font-weight: bold;">
        <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Gesamthonorar:</td>
        <td style="border: 1px solid #ddd; padding: 8px;">{{totalAmount}} EUR</td>
      </tr>
    </tbody>
  </table>
  
  <!-- Zahlungsart-abhängige Inhalte -->
  {{#if (eq paymentMethod 'Lastschrift')}}
  <h2>SEPA-Lastschriftmandat</h2>
  <p>IBAN: {{clientIban}}</p>
  {{#if (or (eq paymentFrequency 'Ratenzahlung') (eq paymentFrequency 'Ratenzahlung mit erhöhter Startzahlung'))}}
  <p>Zahlweise: {{paymentFrequency}}</p>
  <p>Anzahl Raten: {{numberOfInstallments}}</p>
  <p>Ratenhöhe: {{installmentAmount}} EUR</p>
  {{#if increasedStartAmount}}
  <p>Erste Rate (Startpauschale): {{increasedStartAmount}} EUR</p>
  {{/if}}
  {{/if}}
  {{/if}}
  
  {{#if (eq paymentMethod 'Überweisung')}}
  <h2>Zahlungsinformationen</h2>
  <p>Bitte überweisen Sie den Betrag auf folgendes Konto:</p>
  <p>IBAN: {{advisorIban}}</p>
  <p>Verwendungszweck: {{paymentSubject}}</p>
  {{/if}}
  
  <!-- Unterschriftsfelder -->
  <div style="margin-top: 60px; display: flex; justify-content: space-between;">
    <div>
      <p style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">Kunde</p>
    </div>
    <div>
      <p style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">Berater</p>
    </div>
  </div>
</body>
</html>
```

---

## 10. Hinweise zur Verwendung

- **Fallback-Werte:** Wenn `person2Provider` oder `person2Product` leer sind, werden automatisch `productProvider` und `productDescription` verwendet
- **Berechnungen:** `totalAmount` wird automatisch berechnet, `installmentAmount` nur bei Ratenzahlung
- **Bedingungen:** Verwende `{{#if variableName}}...{{/if}}` um Inhalte nur anzuzeigen, wenn eine Variable vorhanden ist
- **Vergleiche:** Handlebars unterstützt keine direkten Vergleiche wie `===`. Verwende stattdessen die Bedingungen in den API-Routen oder prüfe ob Werte vorhanden sind

---

## Schnellreferenz - Alle Variablen auf einen Blick

```
Grunddaten:
- productProvider, productDescription, applicationDate, amountEUR, bookingStart

Zahlung (SEPA):
- paymentMethod, paymentFrequency, numberOfInstallments, increasedStartAmount, installmentAmount, clientIban

Zahlung (Überweisung):
- paymentMethod, advisorIban, paymentSubject

Person 2:
- person2Name, person2Provider, person2Product, person2Amount

Person 3:
- person3Name, person3Provider, person3Product, person3Amount

Berechnet:
- totalAmount (automatisch)

Client-Daten:
- client.firstName, client.lastName, client.street, client.houseNumber, client.zip, client.city, client.email, client.phone, client.iban

Company Settings:
- companySettings.companyName, companySettings.contactPerson, companySettings.logoUrl, companySettings.companySlogan, etc.
```

