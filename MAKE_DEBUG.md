# 🐛 Make Debugging - "Keine User gefunden"

## Problem
Make gibt einen **500-Fehler** zurück: `"Scenario failed to complete"`

## Lösungsschritte

### 1. Prüfe Make History
1. Gehe zu https://make.com
2. Öffne dein Scenario
3. Klicke auf **"History"** (oben rechts)
4. Finde die letzte Ausführung
5. Klicke darauf → Schaue dir **jeden Schritt** an

### 2. Finde den Fehler
- **Roter Punkt** = Fehler in diesem Modul
- Klicke auf das rote Modul
- Schaue dir die **Fehlermeldung** an

### 3. Häufige Fehler

#### ❌ **Fehler: "Module not found" oder "Invalid field"**
**Lösung**: 
- Prüfe die Feldnamen in deinem CRM-Modul
- Stelle sicher, dass die Felder existieren
- Teste das CRM-Modul einzeln in Make

#### ❌ **Fehler: "Array aggregator failed"**
**Lösung**:
- Prüfe, ob der Iterator korrekt konfiguriert ist
- Stelle sicher, dass das Array-Feld korrekt ist
- Prüfe, ob die Variablen-Namen im Aggregator stimmen

#### ❌ **Fehler: "Webhook response failed"**
**Lösung**:
- Prüfe das Response-Format
- Stelle sicher, dass es JSON ist
- Prüfe, ob `{{array}}` korrekt referenziert ist

### 4. Minimales Test-Szenario erstellen

Erstelle ein **einfaches Test-Szenario**:

1. **Webhook** (Custom webhook)
2. **Tools** → **Set multiple variables**:
   ```
   firstName: Max
   lastName: Mustermann
   email: test@example.com
   ```
3. **Array Aggregator**:
   - Source: Set multiple variables
   - Target structure: Custom
   - Aggregated fields:
     ```json
     {
       "firstName": "{{2.firstName}}",
       "lastName": "{{2.lastName}}",
       "email": "{{2.email}}"
     }
     ```
4. **Webhook Response**:
   - Status: 200
   - Body type: Custom
   - Body:
     ```json
     {
       "results": {{3.array}}
     }
     ```

### 5. Teste das minimale Szenario

1. **Run once** in Make
2. Führe das Test-Script aus:
   ```bash
   npx tsx scripts/test-make-search.ts
   ```
3. Prüfe die Response

### 6. Prüfe das Response-Format

Das Response **MUSS** so aussehen:

```json
{
  "results": [
    {
      "firstName": "Max",
      "lastName": "Mustermann",
      "email": "test@example.com"
    }
  ]
}
```

**WICHTIG**: 
- `results` muss ein **Array** sein
- Auch wenn nur 1 Ergebnis: `[{...}]` nicht `{...}`
- Alle Feldnamen müssen **exakt** so sein (camelCase)

### 7. Häufige Probleme im Make-Szenario

#### Problem: Iterator fehlt
Wenn dein CRM mehrere Ergebnisse zurückgibt, brauchst du einen **Iterator**:
1. **Flow Control** → **Iterator**
2. Array: `{{2.results}}` (oder wie dein CRM es zurückgibt)
3. Dann mappe die Felder aus `{{3.item.field}}`

#### Problem: Array Aggregator falsch konfiguriert
- **Source Module**: Muss das Modul sein, das die Variablen setzt
- **Target structure**: **Custom** (nicht "First item")
- **Aggregated fields**: Jedes Feld einzeln hinzufügen

#### Problem: Webhook Response Format falsch
- **Body type**: **Custom** (nicht "JSON")
- **Body**: `{"results": {{array}}}` (ohne Anführungszeichen um `{{array}}`)

### 8. Test-Script ausführen

```bash
npx tsx scripts/test-make-search.ts
```

Das Script zeigt dir:
- ✅ Was Make zurückgibt
- ✅ Welches Format es hat
- ✅ Ob es ein Array ist
- ✅ Welche Felder vorhanden sind

### 9. Wenn Make 202 Accepted zurückgibt

Wenn Make **202** zurückgibt, ist es ein **asynchroner Prozess**:
- Das Szenario läuft im Hintergrund
- Du musst in Make History warten, bis es fertig ist
- Dann die Response manuell prüfen

**Lösung**: Stelle sicher, dass dein Szenario **synchron** läuft (keine "Wait" oder "Schedule" Module)

### 10. Checkliste

- [ ] Make Scenario ist **"On"** (nicht nur "Run once")
- [ ] Webhook-URL ist korrekt in den Einstellungen
- [ ] Alle Module im Szenario sind grün (keine Fehler)
- [ ] Response-Format ist `{"results": [...]}`
- [ ] `results` ist ein **Array**
- [ ] Feldnamen sind camelCase (firstName, lastName, email)
- [ ] Test-Script zeigt die korrekte Response

### 11. Noch immer Probleme?

1. **Mache ein Screenshot** von deinem Make-Szenario
2. **Kopiere die Fehlermeldung** aus Make History
3. **Führe das Test-Script aus** und kopiere die komplette Ausgabe
4. Dann können wir gezielt helfen!

---

## Quick Fix: Minimales funktionierendes Szenario

```
1. Webhook (Custom webhook)
   ↓
2. Set multiple variables
   firstName: Max
   lastName: Mustermann  
   email: test@example.com
   ↓
3. Array Aggregator
   Source: Set multiple variables
   Target: Custom
   Fields: firstName, lastName, email
   ↓
4. Webhook Response
   Status: 200
   Body: {"results": {{3.array}}}
```

**Teste dieses minimale Szenario zuerst!** Wenn das funktioniert, füge Schritt für Schritt dein CRM hinzu.

