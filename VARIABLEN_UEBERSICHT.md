# Variablen-Übersicht für Verträge

Diese Datei listet alle Variablen auf, die bei der Vertragserstellung gesammelt und gespeichert werden.

## Basis-Felder (immer vorhanden)

| Variable (Englisch) | Deutsches Label | Typ | Beschreibung |
|---------------------|-----------------|-----|--------------|
| `productProvider` | Anbieter | Text | Name des Produktanbieters |
| `productDescription` | Produkt | Text | Beschreibung des Produkts/der Dienstleistung |
| `applicationDate` | Antragsdatum | Datum | Datum des Antrags (Format: TAG; MONAT; JAHR) |
| `amountEUR` | Honorarhöhe (EUR) | Zahl | Gesamthöhe der Vergütung in Euro |
| `paymentMethod` | Zahlungsart | Auswahl | "Lastschrift" oder "Überweisung" |
| `bookingStart` | Buchungsbeginn | Datum | Startdatum der Buchung (Format: TAG; MONAT; JAHR) |

## Felder für SEPA Lastschrift

Diese Felder werden nur angezeigt, wenn `paymentMethod = "Lastschrift"` gewählt wurde:

| Variable (Englisch) | Deutsches Label | Typ | Beschreibung |
|---------------------|-----------------|-----|--------------|
| `paymentFrequency` | Zahlweise | Auswahl | "Einmalzahlung", "Monatliche Ratenzahlung", "Erhöhte Anfangspauschale + monatliche Raten" |
| `numberOfInstallments` | Anzahl Raten | Zahl | Anzahl der monatlichen Raten (nur bei Ratenzahlung) |
| `increasedStartAmount` | Erhöhte Startpauschale (EUR) | Zahl | Betrag der ersten Rate bei erhöhter Startpauschale (optional) |
| `installmentAmount` | Ratenhöhe (EUR) | Zahl | **Automatisch berechnet**: Höhe einer Rate |
| `clientIban` | IBAN Kunde | Text | **Automatisch aus Client-Daten geladen** |

## Felder für Überweisung

Diese Felder werden nur angezeigt, wenn `paymentMethod = "Überweisung"` gewählt wurde:

| Variable (Englisch) | Deutsches Label | Typ | Beschreibung |
|---------------------|-----------------|-----|--------------|
| `advisorIban` | IBAN Berater | Text | **Automatisch aus Company Settings geladen** |
| `paymentSubject` | Verwendungszweck | Text | **Automatisch aus Company Settings geladen** (wird mit Kundennamen ergänzt) |

## Weitere verfügbare Felder (optional)

| Variable (Englisch) | Deutsches Label | Typ | Beschreibung |
|---------------------|-----------------|-----|--------------|
| `contributionSum` | Beitragssumme | Zahl | Optional: Beitragssumme |
| `proportionalPercent` | Anteilige Prozent | Zahl | Optional: Prozentsatz (0-100) |
| `notes` | Notizen | Text | Optional: Zusätzliche Notizen |
| `servicePackage` | Servicepauschale | Auswahl | Optional: Ausgewähltes Service-Paket |
| `totalAmount` | Gesamtbetrag | Zahl | Optional: Gesamtbetrag |
| `consultationType` | Beratungsart | Auswahl | Optional: Art der Beratung |
| `consultationHours` | Beratungsstunden | Zahl | Optional: Anzahl der Beratungsstunden |
| `hourlyRate` | Stundensatz | Zahl | Optional: Stundenlohn |
| `terminationDate` | Kündigungsdatum | Datum | Optional: Datum der Kündigung |
| `noticePeriod` | Kündigungsfrist | Text | Optional: Kündigungsfrist |
| `reason` | Kündigungsgrund | Text | Optional: Grund für die Kündigung |
| `handoverDate` | Übergabedatum | Datum | Optional: Datum der Übergabe |
| `lastWorkingDay` | Letzter Arbeitstag | Datum | Optional: Letzter Arbeitstag |
| `noticeDetails` | Details | Text | Optional: Zusätzliche Details |
| `iban` | IBAN | Text | Optional: IBAN |
| `interval` | Intervall | Text | Optional: Intervall |
| `paymentInterval` | Zahlungsintervall | Auswahl | Optional: Intervall für wiederkehrende Zahlungen |

## Datum-Format

Alle Datumsfelder werden im Format **"TAG.MONAT.JAHR"** gespeichert und angezeigt.

Beispiele:
- `02.11.2024` (2. November 2024)
- `15.01.2025` (15. Januar 2025)

## Automatische Berechnungen

- **`installmentAmount`**: Wird automatisch berechnet als `(amountEUR - increasedStartAmount) / numberOfInstallments`

## Automatisch geladene Werte

- **`clientIban`**: Wird automatisch aus den Client-Daten geladen (nur bei Lastschrift)
- **`advisorIban`**: Wird automatisch aus den Company Settings geladen (nur bei Überweisung)
- **`paymentSubject`**: Wird automatisch aus den Company Settings geladen und mit Kundennamen ergänzt (nur bei Überweisung)

## Verwendung in Templates

Alle Variablen können in Handlebars-Templates mit `{{variableName}}` verwendet werden.

Beispiele:
- `{{productProvider}}` - Name des Anbieters
- `{{amountEUR}}` - Honorarhöhe
- `{{applicationDate}}` - Antragsdatum (Format: TAG; MONAT; JAHR)
- `{{client.firstName}}` - Vorname des Kunden
- `{{client.lastName}}` - Nachname des Kunden
- `{{companySettings.companyName}}` - Firmenname aus Einstellungen

