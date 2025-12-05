# Stripe SEPA Integration - Setup-Anleitung

Diese Anleitung erklärt, wie Sie die Stripe SEPA-Lastschrift-Integration einrichten und verwenden.

## Voraussetzungen

1. **Stripe-Konto**: Sie benötigen ein Stripe-Konto (https://stripe.com)
2. **SEPA aktiviert**: Stellen Sie sicher, dass SEPA Direct Debit in Ihrem Stripe-Dashboard aktiviert ist
3. **Gläubiger-ID**: Sie benötigen eine SEPA Gläubiger-Identifikationsnummer (beantragen bei der Deutschen Bundesbank)

## Einrichtungsschritte

### 1. Stripe API-Schlüssel konfigurieren

1. Gehen Sie zu `/settings` in der Anwendung
2. Scrollen Sie zum Abschnitt "Stripe Integration"
3. Tragen Sie ein:
   - **Stripe Secret Key**: Ihren Secret Key aus dem Stripe Dashboard (beginnt mit `sk_test_` oder `sk_live_`)
   - **Stripe Publishable Key**: Ihr Publishable Key (optional, beginnt mit `pk_test_` oder `pk_live_`)
4. Speichern Sie die Einstellungen

### 2. SEPA Gläubiger-ID konfigurieren

1. Im Abschnitt "Zahlungsinformationen" in `/settings`
2. Tragen Sie Ihre **SEPA Gläubiger-Identifikationsnummer** ein (Format: z.B. `DE98ZZZ09999999999`)
3. Speichern Sie die Einstellungen

### 3. Datenbank-Migration ausführen

Führen Sie die Prisma-Migration aus, um die neuen Felder zur Datenbank hinzuzufügen:

```bash
# Stellen Sie sicher, dass DATABASE_URL in .env.local gesetzt ist
npx prisma migrate dev --name add_stripe_integration

# Generieren Sie den Prisma Client neu
npx prisma generate
```

## Verwendung

### Automatische Mandatserstellung

Wenn Sie ein **unterschriebenes SEPA-Dokument** hochladen:

1. Gehen Sie zu einem SEPA-Vertrag (`/contracts/[id]`)
2. Laden Sie das unterschriebene PDF-Dokument hoch
3. Das System erkennt automatisch, dass es ein SEPA-Vertrag ist
4. Es wird automatisch:
   - Ein Stripe Customer erstellt (falls noch nicht vorhanden)
   - Ein SEPA-Mandat in Stripe erstellt
   - Die Mandat-ID in der Datenbank gespeichert

**Wichtig**: Die IBAN muss entweder:
- Im Vertrag als Variable `clientIban` vorhanden sein, oder
- Im Client-Profil unter `iban` gespeichert sein

### Zahlungen initiieren

Nach erfolgreicher Mandatserstellung können Sie Zahlungen initiieren:

1. Gehen Sie zu einem SEPA-Vertrag mit aktivem Mandat
2. Scrollen Sie zum Abschnitt "SEPA-Zahlung initiieren"
3. Geben Sie den Betrag ein (Standard: Vertragsbetrag wird vorausgefüllt)
4. Optional: Fügen Sie eine Beschreibung hinzu
5. Klicken Sie auf "SEPA-Lastschrift initiieren"

Die Zahlung wird über Stripe eingezogen und erscheint innerhalb von 5 Bankarbeitstagen auf dem Konto des Kunden.

## API-Endpunkte

### POST `/api/contracts/[id]/upload-signed`
Hochladen eines unterschriebenen Dokuments. Bei SEPA-Verträgen wird automatisch ein Stripe-Mandat erstellt.

**Response** enthält:
```json
{
  "message": "Unterschriebenes Dokument erfolgreich hochgeladen",
  "filePath": "/contracts/.../signed_xxx.pdf",
  "stripe": {
    "customerId": "cus_xxx",
    "paymentMethodId": "pm_xxx",
    "setupIntentId": "seti_xxx",
    "status": "active"
  }
}
```

### POST `/api/contracts/[id]/charge`
Initiiert eine SEPA-Lastschrift.

**Request Body**:
```json
{
  "amount": 1500.00,
  "currency": "eur",
  "description": "Optional: Beschreibung"
}
```

**Response**:
```json
{
  "message": "Zahlung erfolgreich initiiert",
  "paymentIntent": {
    "id": "pi_xxx",
    "amount": 1500.00,
    "currency": "eur",
    "status": "processing",
    "description": "..."
  }
}
```

### GET `/api/contracts/[id]/charge?paymentIntentId=pi_xxx`
Ruft den Status einer Zahlung ab.

## Technische Details

### Stripe-Integration

Die Integration verwendet:
- **SetupIntents**: Zum Erstellen von SEPA-Mandaten
- **Payment Methods**: Zur Speicherung der SEPA-Daten (IBAN)
- **Payment Intents**: Zum Initiieren von Lastschriften

### Datenbankfelder

**Contract-Model:**
- `stripeCustomerId`: Stripe Customer ID
- `stripeMandateId`: Payment Method ID (wird als Mandat-ID verwendet)
- `stripeMandateStatus`: Status des Mandats (`pending`, `active`, `inactive`, `invalid`)

**CompanySettings-Model:**
- `stripeSecretKey`: Secret Key für Stripe API
- `stripePublishableKey`: Publishable Key (optional)
- `creditorId`: SEPA Gläubiger-Identifikationsnummer

## Fehlerbehebung

### "Stripe Secret Key nicht konfiguriert"
- Überprüfen Sie, ob der Stripe Secret Key in `/settings` korrekt eingetragen ist

### "Kein Stripe-Mandat für diesen Vertrag gefunden"
- Laden Sie das unterschriebene Dokument hoch
- Überprüfen Sie, ob der Vertrag ein SEPA-Vertrag ist (Template-Slug enthält `-sepa`)

### "IBAN nicht gefunden"
- Stellen Sie sicher, dass die IBAN entweder als Variable `clientIban` im Vertrag oder im Client-Profil vorhanden ist

### "Ungültige IBAN"
- Überprüfen Sie das IBAN-Format (sollte dem Format `DE89 3704 0044 0532 0130 00` entsprechen)

## Testen

Für Tests verwenden Sie Stripe Test-Keys (`sk_test_...`). Verwenden Sie Test-IBANs:
- `DE89370400440532013000` (Erfolgreiche Zahlung)
- `DE89370400440532013001` (Fehlgeschlagene Zahlung)

Weitere Test-IBANs finden Sie in der Stripe-Dokumentation.

