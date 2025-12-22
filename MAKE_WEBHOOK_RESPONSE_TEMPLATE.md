# 📋 Make Webhook Response Template - Vollständige Konfiguration

## Webhook Response Body (Custom)

Kopiere diesen Code in dein **Webhook Response** Modul in Make:

```json
{
  "results": [
    {
      "firstName": "{{15.Name}}",
      "lastName": "",
      "email": "{{15.email}}",
      "phone": "{{15.phone}}",
      "street": "{{15.address}}",
      "houseNumber": "",
      "city": "{{15.city}}",
      "zip": "{{15.zip}}",
      "iban": "{{15.iban}}",
      "crmId": "{{15.ID}}"
    }
  ]
}
```

## 🔍 Close CRM Feldnamen

### Standard Close-Felder (anpassen je nach deinem Close-Setup):

- **Name**: `{{15.Name}}` oder `{{15.name}}` oder `{{15.display_name}}`
- **Email**: `{{15.email}}` oder `{{15.emails[0].email}}`
- **Phone**: `{{15.phone}}` oder `{{15.phones[0].phone}}`
- **Address (komplett)**: `{{15.address}}` oder `{{15.addresses[0].address}}` oder `{{15.addresses[0].street}}`
- **City**: `{{15.city}}` oder `{{15.addresses[0].city}}`
- **ZIP**: `{{15.zip}}` oder `{{15.addresses[0].zip}}` oder `{{15.postal_code}}`
- **ID**: `{{15.ID}}` oder `{{15.id}}`

## 📍 Straße und Hausnummer trennen

Da Close die Adresse als ein Feld liefert (z.B. "Hauptstr. 10"), musst du sie in Make trennen.

### Option 1: In Make mit Text-Funktionen (EMPFOHLEN)

**Schritt 1: Füge ein "Text parser" Modul hinzu**

1. **Tools** → **Text parser**
2. **Text**: `{{15.address}}` (dein Adressfeld aus Close)
3. **Pattern**: `^(.+?)\s+(\d+.*)$` (Regex: Text + Leerzeichen + Zahl)
4. **Output**: 
   - `street`: `{{1}}` (alles vor der Zahl)
   - `houseNumber`: `{{2}}` (die Zahl)

**Schritt 2: Verwende die geparsten Werte im Webhook Response**

```json
{
  "results": [
    {
      "firstName": "{{15.Name}}",
      "lastName": "",
      "email": "{{15.email}}",
      "phone": "{{15.phone}}",
      "street": "{{16.street}}",
      "houseNumber": "{{16.houseNumber}}",
      "city": "{{15.city}}",
      "zip": "{{15.zip}}",
      "iban": "{{15.iban}}",
      "crmId": "{{15.ID}}"
    }
  ]
}
```

Wobei `{{16}}` das Text parser Modul ist.

### Option 2: Mit "Set multiple variables" und String-Funktionen

**Im "Set multiple variables" Modul:**

```
street: {{15.address.split(" ").slice(0, -1).join(" ")}}
houseNumber: {{15.address.split(" ").slice(-1)[0]}}
```

**Erklärung:**
- `split(" ")` - Teilt die Adresse bei Leerzeichen
- `slice(0, -1)` - Nimmt alle Teile außer dem letzten (die Straße)
- `join(" ")` - Fügt sie wieder zusammen
- `slice(-1)[0]` - Nimmt den letzten Teil (die Hausnummer)

**Dann im Webhook Response:**

```json
{
  "results": [
    {
      "firstName": "{{15.Name}}",
      "lastName": "",
      "email": "{{15.email}}",
      "phone": "{{15.phone}}",
      "street": "{{16.street}}",
      "houseNumber": "{{16.houseNumber}}",
      "city": "{{15.city}}",
      "zip": "{{15.zip}}",
      "iban": "{{15.iban}}",
      "crmId": "{{15.ID}}"
    }
  ]
}
```

### Option 3: Einfache Lösung - Nur Straße (ohne Trennung)

Wenn die Trennung zu kompliziert ist, sende einfach die komplette Adresse als `street`:

```json
{
  "results": [
    {
      "firstName": "{{15.Name}}",
      "lastName": "",
      "email": "{{15.email}}",
      "phone": "{{15.phone}}",
      "street": "{{15.address}}",
      "houseNumber": "",
      "city": "{{15.city}}",
      "zip": "{{15.zip}}",
      "iban": "{{15.iban}}",
      "crmId": "{{15.ID}}"
    }
  ]
}
```

Die App kann die Adresse später anzeigen, auch wenn sie nicht getrennt ist.

## 🔧 Vollständiges Make-Szenario (mit Adress-Trennung)

```
1. Webhook (Custom webhook)
   ↓
2. Close CRM → Search Leads
   Query: {{1.query}}
   ↓
3. Iterator (wenn mehrere Ergebnisse)
   Array: {{2.results}}
   ↓
4. Text Parser (für Adress-Trennung)
   Text: {{3.item.address}}
   Pattern: ^(.+?)\s+(\d+.*)$
   Output: street, houseNumber
   ↓
5. Set multiple variables
   firstName: {{3.item.Name.split(" ")[0]}}
   lastName: {{3.item.Name.split(" ").slice(1).join(" ") || ""}}
   email: {{3.item.email}}
   phone: {{3.item.phone || ""}}
   street: {{4.street}}
   houseNumber: {{4.houseNumber}}
   city: {{3.item.city || ""}}
   zip: {{3.item.zip || ""}}
   iban: {{3.item.iban || ""}}
   crmId: {{3.item.ID}}
   ↓
6. Array Aggregator
   Source: Set multiple variables
   Target: Custom
   Fields: Alle oben genannten
   ↓
7. Webhook Response
   Status: 200
   Body: {"results": {{6.array}}}
```

## 📝 Feldnamen-Mapping für verschiedene CRMs

### Close.com
```json
{
  "firstName": "{{item.Name.split(' ')[0]}}",
  "lastName": "{{item.Name.split(' ').slice(1).join(' ') || ''}}",
  "email": "{{item.email}}",
  "phone": "{{item.phone}}",
  "street": "{{item.address}}",
  "city": "{{item.city}}",
  "zip": "{{item.zip}}",
  "crmId": "{{item.ID}}"
}
```

### HubSpot
```json
{
  "firstName": "{{item.properties.firstname.value}}",
  "lastName": "{{item.properties.lastname.value}}",
  "email": "{{item.properties.email.value}}",
  "phone": "{{item.properties.phone.value}}",
  "street": "{{item.properties.address.value}}",
  "city": "{{item.properties.city.value}}",
  "zip": "{{item.properties.zip.value}}",
  "crmId": "{{item.id}}"
}
```

### Pipedrive
```json
{
  "firstName": "{{item.first_name}}",
  "lastName": "{{item.last_name}}",
  "email": "{{item.email[0].value}}",
  "phone": "{{item.phone[0].value}}",
  "street": "{{item.address}}",
  "city": "{{item.city}}",
  "zip": "{{item.postal_code}}",
  "crmId": "{{item.id}}"
}
```

## ✅ Testen

1. **Run once** in Make
2. **Prüfe die Output-Daten** vom "Set multiple variables" Modul
3. **Schaue ob alle Felder gefüllt sind**
4. **Prüfe die Webhook Response** - sollte so aussehen:

```json
{
  "results": [
    {
      "firstName": "Max",
      "lastName": "Mustermann",
      "email": "max@example.com",
      "phone": "+49 170 1234567",
      "street": "Hauptstr.",
      "houseNumber": "10",
      "city": "Berlin",
      "zip": "12345",
      "iban": "",
      "crmId": "lead_abc123"
    }
  ]
}
```

## 🐛 Troubleshooting

### Problem: "street" ist leer
- Prüfe ob `{{15.address}}` in Close gefüllt ist
- Prüfe ob der Feldname korrekt ist (kann `addresses[0].address` sein)

### Problem: "city" oder "zip" ist leer
- Prüfe ob diese Felder in Close existieren
- Verwende Default-Werte: `{{15.city || ""}}`

### Problem: Adress-Trennung funktioniert nicht
- Verwende Option 3 (komplette Adresse als `street`)
- Oder prüfe das Regex-Pattern im Text Parser

### Problem: "firstName" enthält den ganzen Namen
- Trenne den Namen: `{{15.Name.split(" ")[0]}}` für firstName
- `{{15.Name.split(" ").slice(1).join(" ") || ""}}` für lastName

