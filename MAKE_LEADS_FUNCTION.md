# 📋 Make.com Integration für Leads Function

## 🎯 Zweck

Diese Netlify Function (`netlify/functions/leads.ts`) ermöglicht es Make.com, Leads direkt in die Datenbank zu schreiben.

## 🔗 Endpoint-URLs

### Lokal (Development):
```
http://localhost:8888/.netlify/functions/leads
```

### Production (nach Deployment):
```
https://your-site.netlify.app/.netlify/functions/leads
```

**WICHTIG:** Ersetze `your-site` mit deinem tatsächlichen Netlify-Site-Namen!

## 📤 Request-Konfiguration in Make.com

### HTTP-Modul in Make.com einrichten:

1. **Modul**: `HTTP` → `Make an HTTP Request`

2. **URL**: 
   - Production: `https://your-site.netlify.app/.netlify/functions/leads`
   - Lokal: `http://localhost:8888/.netlify/functions/leads` (nur für Tests)

3. **Method**: `POST` ⚠️ **WICHTIG: Muss POST sein!**

4. **Headers**:
   ```
   Content-Type: application/json
   ```

5. **Body** (JSON):
   ```json
   {
     "email": "{{lead.email}}",
     "name": "{{lead.name}}",
     "phone": "{{lead.phone}}",
     "close_lead_id": "{{lead.id}}",
     "status": "NEW",
     "source": "make",
     "address": "{{lead.address}}",
     "bank": "{{lead.bank}}"
   }
   ```

## ✅ Erforderliche Felder

- **email** (required) - E-Mail-Adresse des Leads

## 📋 Optionale Felder

- **name** - Name des Leads
- **phone** - Telefonnummer
- **close_lead_id** - ID aus Close.com (oder anderem CRM)
- **status** - Status (z.B. "NEW", "CONTACTED", "QUALIFIED")
- **source** - Quelle (z.B. "make", "website", "referral")
- **address** - Adresse
- **bank** - Bankinformationen

## 🔄 Funktionsweise

Die Function führt einen **UPSERT** durch:
- **Wenn Lead mit Email existiert**: Aktualisiert nur die übergebenen Felder
- **Wenn Lead nicht existiert**: Erstellt einen neuen Lead

## 📥 Response-Format

### Erfolg (200):
```json
{
  "success": true,
  "lead": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    ...
  }
}
```

### Fehler (400/405/500):
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## 🐛 Debugging

### Server-Logs prüfen:

Die Function loggt alle Requests:
```
📥 Leads Function called: { method: 'POST', path: '/.netlify/functions/leads', ... }
✅ Lead processed successfully: { action: 'created', email: '...' }
```

### Häufige Fehler:

1. **405 Method Not Allowed**
   - ❌ Problem: Make.com sendet GET statt POST
   - ✅ Lösung: In Make.com HTTP-Modul auf POST ändern

2. **400 Bad Request**
   - ❌ Problem: Email fehlt oder JSON ist ungültig
   - ✅ Lösung: Email-Feld prüfen, JSON-Format validieren

3. **500 Internal Server Error**
   - ❌ Problem: DATABASE_URL nicht gesetzt oder Datenbankfehler
   - ✅ Lösung: Environment-Variable prüfen, Server-Logs lesen

## 🧪 Lokales Testen

```bash
# Terminal 1: Netlify Dev Server starten
npm run netlify:dev

# Terminal 2: Function testen
npm run test:function
```

Oder mit curl:
```bash
curl -X POST http://localhost:8888/.netlify/functions/leads \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

## 📝 Beispiel-Make.com Scenario

1. **Trigger**: Neuer Lead in Close.com
2. **HTTP Request**: POST zu `/.netlify/functions/leads`
3. **Body**: Lead-Daten aus Close.com
4. **Result**: Lead wird in Datenbank gespeichert/aktualisiert

## ✅ Checkliste für Make.com Setup

- [ ] HTTP-Modul verwendet **POST** Methode
- [ ] URL ist korrekt (Production oder Local)
- [ ] Content-Type Header ist `application/json`
- [ ] Body enthält mindestens `email` Feld
- [ ] Body ist gültiges JSON
- [ ] Response wird geloggt für Debugging

