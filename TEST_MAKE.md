# 🧪 Make Testing & Debugging

## Schritt 1: Browser Console öffnen

1. Öffne http://localhost:3001/clients
2. Drücke **F12** (oder Rechtsklick → "Untersuchen")
3. Gehe zum **"Console"** Tab

## Schritt 2: Suche ausführen

1. Gib eine E-Mail ein: `test@example.com`
2. Klicke "Suche via Make"
3. **Schaue in die Console!**

## Was du sehen solltest:

### ✅ **Erfolgreiche Response:**
```
🔍 Make Response: {results: Array(2)}
📊 Results: [{firstName: "Max", ...}, {firstName: "Erika", ...}]
```

### ❌ **Problem-Szenarien:**

#### **Szenario A: Leeres Array**
```
🔍 Make Response: {results: []}
📊 Results: []
```
→ **Lösung**: Make findet keine Daten. Prüfe in Close, ob die E-Mail existiert.

#### **Szenario B: Falsches Format**
```
⚠️ Make hat keine "results" zurückgegeben
Erwartetes Format: {"results": [...]}
Erhalten: [{...}, {...}]
```
→ **Lösung**: Make gibt Array direkt zurück. 
   **In Make**: Wickle den Array Aggregator in ein Objekt:
   ```json
   {
     "results": {{aggregator.array}}
   }
   ```

#### **Szenario C: Webhook nicht erreicht**
```
❌ Fehler bei Make-Suche: Failed to fetch
```
→ **Lösung**: 
   - Webhook-URL in Einstellungen falsch?
   - Make Scenario nicht "On"?
   - Firewall blockt?

## Schritt 3: Make History prüfen

1. Gehe zu Make → History
2. Finde deine Ausführung
3. Klicke darauf → Schaue dir jeden Schritt an
4. **Wichtig**: Schaue dir den letzten Schritt an (Webhook Response)

### Was sollte dort stehen:

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
      "iban": "DE12...",
      "crmId": "lead_abc123"
    }
  ]
}
```

## Häufige Probleme:

### 1. **Array Aggregator falsch konfiguriert**
❌ **Falsch**:
```
Target structure: (empty)
```

✅ **Richtig**:
```
Target structure: Custom
Aggregated fields: 
  - firstName: {{item.firstName}}
  - lastName: {{item.lastName}}
  - ...
```

### 2. **Webhook Response fehlt "results"**
❌ **Falsch**:
```json
[{...}, {...}]
```

✅ **Richtig**:
```json
{
  "results": [{...}, {...}]
}
```

### 3. **Close gibt leeres Array zurück**
→ Prüfe in Close API direkt:
```bash
curl -u YOUR_API_KEY: https://api.close.com/api/v1/lead/?query=email:test@example.com*
```

### 4. **Felder sind null**
→ Prüfe in Make, ob die Felder gemappt sind:
- Klicke auf "Set Variables" Modul
- Schaue, ob alle Felder gefüllt sind
- Falls leer: Feld-Mapping in Close prüfen

## Quick-Fix: Mock-Daten testen

Falls Make noch nicht funktioniert, teste mit Mock-Daten:

1. Gehe zu http://localhost:3001/clients
2. Gib "Max" oder "Erika" ein
3. Klicke "Suche via Make"
4. Du solltest Mock-Daten sehen!

Falls auch das nicht geht → Problem im Frontend!

## Debug-Checklist:

- [ ] Browser Console zeigt Daten an?
- [ ] Make History zeigt Ausführung?
- [ ] Webhook Response hat "results" Key?
- [ ] Array Aggregator gibt valides JSON zurück?
- [ ] Close API gibt Daten zurück?
- [ ] Webhook URL in App-Einstellungen korrekt?
- [ ] Make Scenario ist "On" (nicht nur "Run once")?

---

**Nächster Schritt**: Sende mir einen Screenshot von:
1. Browser Console (nach Suche)
2. Make History (letzte Ausführung)

Dann kann ich genau sehen, wo das Problem ist! 🔍




