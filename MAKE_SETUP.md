# 🔧 Make Scenario Setup - Komplette Anleitung

## 📋 Scenario: "Docreate - Kunden aus CRM laden"

### **Schritt 1: Neues Scenario erstellen**
1. Gehe zu https://make.com
2. Klicke auf **"Create a new scenario"**
3. Name: `Docreate - Kunden laden`

---

### **Schritt 2: Webhook hinzufügen**

1. **Klicke auf das ⊕** im Scenario
2. Suche nach **"Webhooks"**
3. Wähle **"Custom webhook"**
4. Klicke auf **"Create a webhook"**
5. **Name**: `Kunden Suche`
6. **Add** klicken
7. ✅ **Webhook-URL kopieren**: `https://hook.eu2.make.com/xyz123...`

---

### **Schritt 3: CRM-Modul hinzufügen**

Wähle dein CRM und füge das passende Modul hinzu:

#### **Option A: HubSpot**
- **Modul**: `HubSpot` → `Search for CRM Objects`
- **Object Type**: `Contacts`
- **Search Criteria**:
  - Field: `email`
  - Operator: `contains`
  - Value: `{{1.query}}`
- **Limit**: `10`

#### **Option B: Pipedrive**
- **Modul**: `Pipedrive` → `Search Persons`
- **Term**: `{{1.query}}`
- **Search by**: `Email`
- **Limit**: `10`

#### **Option C: Salesforce**
- **Modul**: `Salesforce` → `Search`
- **Object Type**: `Contact`
- **Search Query**: `Email LIKE '%{{1.query}}%'`

#### **Option D: Anderes CRM**
Suche nach deinem CRM in Make und verwende das Such-Modul mit `{{1.query}}` als Suchbegriff.

---

### **Schritt 4: Iterator hinzufügen (für mehrere Ergebnisse)**

1. **Modul**: `Flow Control` → `Iterator`
2. **Array**: Das Array aus deinem CRM (z.B. `{{2.results}}` oder `{{2.items}}`)

---

### **Schritt 5: Daten mappen**

1. **Modul**: `Tools` → `Set multiple variables`
2. **Variable names and values**:

```
firstName: {{3.item.firstname}}
lastName: {{3.item.lastname}}
email: {{3.item.email}}
phone: {{3.item.phone}}
street: {{3.item.address}}
houseNumber: {{3.item.house_number}}
zip: {{3.item.zip}}
city: {{3.item.city}}
iban: {{3.item.iban}}
crmId: {{3.item.id}}
```

**Wichtig**: Passe die Feldnamen an dein CRM an!
- HubSpot: `firstname`, `lastname`, `email`, `phone`, `address`, `zip`, `city`
- Pipedrive: `first_name`, `last_name`, `email[0].value`, `phone[0].value`
- Salesforce: `FirstName`, `LastName`, `Email`, `Phone`, `MailingStreet`, `MailingCity`, `MailingPostalCode`

---

### **Schritt 6: Array Aggregator**

1. **Modul**: `Tools` → `Array aggregator`
2. **Source Module**: Das "Set multiple variables" Modul
3. **Target structure type**: `Custom`
4. **Aggregated fields**: Klicke auf "Add item" für jedes Feld:

```json
{
  "firstName": "{{4.firstName}}",
  "lastName": "{{4.lastName}}",
  "email": "{{4.email}}",
  "phone": "{{4.phone}}",
  "street": "{{4.street}}",
  "houseNumber": "{{4.houseNumber}}",
  "zip": "{{4.zip}}",
  "city": "{{4.city}}",
  "iban": "{{4.iban}}",
  "crmId": "{{4.crmId}}"
}
```

---

### **Schritt 7: Response zurückgeben**

1. **Modul**: `Webhooks` → `Webhook response`
2. **Status**: `200`
3. **Body type**: `Custom`
4. **Body**:

```json
{
  "results": {{5.array}}
}
```

Wobei `{{5.array}}` das Ergebnis vom Aggregator ist (die Nummer kann variieren).

---

### **Schritt 8: Testen!**

1. Klicke in Make auf **"Run once"**
2. Gehe zu deiner App: http://localhost:3001/clients
3. Gib eine **E-Mail-Adresse** ein (z.B. `max@example.com`)
4. Klicke **"Suche via Make"**
5. Make sollte die Anfrage empfangen und Daten zurückgeben!

---

## 🔗 Webhook in der App eintragen

1. **Öffne**: http://localhost:3001/settings
2. **Scrolle zu**: "Make Integration"
3. **Trage ein**:
   - **Make Webhook URL**: `https://hook.eu2.make.com/xyz123...` (deine kopierte URL)
   - **API Key**: (leer lassen, außer dein CRM benötigt Auth)
4. **Speichern**

---

## ✅ Erwartetes Response-Format von Make

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
      "zip": "12345",
      "city": "Berlin",
      "iban": "DE12 3456 7890 1234 5678 90",
      "crmId": "CRM-123"
    }
  ]
}
```

**Alle Felder sind optional** (außer `firstName`, `lastName`, `email`)!

Wenn ein Feld nicht vorhanden ist, einfach weglassen oder `null` zurückgeben.

---

## 🐛 Fehlersuche

### **Keine Daten werden zurückgegeben?**
- Prüfe in Make unter "History", ob die Anfrage angekommen ist
- Prüfe die Response: Steht dort `{"results": [...]}`?
- Prüfe die CRM-Felder: Sind die Feldnamen korrekt gemappt?

### **Fehlermeldung in der App?**
- Browser: F12 → Console → Fehler kopieren
- In Make: History → Details → Response anschauen

### **Webhook funktioniert nicht?**
- URL nochmal in den Einstellungen kopieren
- Make Scenario muss "On" sein (nicht nur "Run once")

---

## 📞 CRM-spezifische Feld-Mappings

### **HubSpot:**
```
{{item.properties.firstname.value}}
{{item.properties.lastname.value}}
{{item.properties.email.value}}
{{item.properties.phone.value}}
{{item.properties.address.value}}
{{item.properties.zip.value}}
{{item.properties.city.value}}
```

### **Pipedrive:**
```
{{item.first_name}}
{{item.last_name}}
{{item.email[0].value}}
{{item.phone[0].value}}
```

### **Salesforce:**
```
{{item.FirstName}}
{{item.LastName}}
{{item.Email}}
{{item.Phone}}
{{item.MailingStreet}}
{{item.MailingPostalCode}}
{{item.MailingCity}}
```

---

## 🎉 Fertig!

Jetzt kannst du:
1. E-Mail-Adresse eingeben
2. "Suche via Make" klicken
3. Kunden sehen mit allen Daten
4. "Kunde anlegen" → Fertig!

Alle Daten sind sofort verfügbar für die Vertragserstellung! 🚀

