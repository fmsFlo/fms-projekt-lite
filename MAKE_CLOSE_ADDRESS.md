# 📍 Make + Close: Adressfelder richtig mappen

## Problem
Die Adresse wird nicht aus Close ausgelesen, obwohl Make die Daten findet.

## Lösung: Adressfelder in Make richtig mappen

### Schritt 1: Close-Modul prüfen

In deinem Make-Szenario, nach dem Close-Modul:

1. **Klicke auf das Close-Modul**
2. **Schaue dir die verfügbaren Felder an**
3. **Suche nach Adressfeldern:**

Close hat verschiedene Adressfelder:
- `addresses` - Array von Adressen
- `addresses[0].street` - Straße
- `addresses[0].city` - Stadt
- `addresses[0].state` - Bundesland
- `addresses[0].zip` - PLZ
- `addresses[0].country` - Land

### Schritt 2: Adressfelder im "Set multiple variables" mappen

In deinem Make-Szenario, im **"Set multiple variables"** Modul:

**Aktuell (falsch):**
```
street: (leer oder falsch)
houseNumber: (leer)
city: (leer)
zip: (leer)
```

**Richtig:**
```
street: {{2.addresses[0].street}}
houseNumber: {{2.addresses[0].street2}}  // Oder leer lassen
city: {{2.addresses[0].city}}
zip: {{2.addresses[0].zip}}
```

### Schritt 3: Prüfe ob Adresse existiert

Manchmal hat ein Lead keine Adresse. Verwende **Conditional Logic**:

**Option A: Mit Conditional Logic**
1. **Flow Control** → **If**
2. **Condition**: `{{2.addresses}}` exists AND `{{2.addresses[0]}}` exists
3. **Then**: Setze Adressfelder
4. **Else**: Setze Adressfelder auf `null` oder leer

**Option B: Mit Default-Werten**
Im "Set multiple variables":
```
street: {{2.addresses[0].street || ""}}
city: {{2.addresses[0].city || ""}}
zip: {{2.addresses[0].zip || ""}}
```

### Schritt 4: Straße und Hausnummer trennen

Wenn Close die Adresse als `"Hauptstr. 10"` zurückgibt, musst du sie trennen:

**Option A: In Make mit Text-Funktionen**
```
street: {{2.addresses[0].street.split(" ")[0]}}  // "Hauptstr."
houseNumber: {{2.addresses[0].street.split(" ")[1]}}  // "10"
```

**Option B: Lass es als "street" und splitte in der App**
- Sende die komplette Adresse als `street`
- Die App kann sie später trennen

### Schritt 5: Testen

1. **Run once** in Make
2. **Prüfe die Output-Daten** vom "Set multiple variables" Modul
3. **Schaue ob die Adressfelder gefüllt sind**

### Beispiel: Vollständige Mapping-Konfiguration

**Im "Set multiple variables" Modul:**

```
firstName: {{2.name.split(" ")[0]}}
lastName: {{2.name.split(" ").slice(1).join(" ") || ""}}
email: {{2.emails[0].email}}
phone: {{2.phones[0].phone || ""}}
street: {{2.addresses[0].street || ""}}
houseNumber: {{2.addresses[0].street2 || ""}}
city: {{2.addresses[0].city || ""}}
zip: {{2.addresses[0].zip || ""}}
crmId: {{2.id}}
```

### Häufige Probleme

#### Problem 1: "addresses[0] is undefined"
**Lösung**: Prüfe ob Adresse existiert:
```
{{2.addresses && 2.addresses[0] ? 2.addresses[0].street : ""}}
```

#### Problem 2: Adresse ist leer in Close
**Lösung**: Das ist normal - nicht jeder Lead hat eine Adresse. Verwende Default-Werte.

#### Problem 3: Straße und Hausnummer sind kombiniert
**Lösung**: Trenne sie in Make oder sende als `street` und lass die App trennen.

### Debugging

1. **In Make History**: Schaue dir die Output-Daten vom Close-Modul an
2. **Prüfe**: Welche Felder sind verfügbar?
3. **Teste**: Setze die Felder manuell und prüfe die Output-Daten

### Beispiel-Output aus Close

```json
{
  "id": "lead_abc123",
  "name": "Max Mustermann",
  "emails": [{"email": "max@example.com"}],
  "phones": [{"phone": "+49 170 1234567"}],
  "addresses": [
    {
      "street": "Hauptstr.",
      "street2": "10",
      "city": "Berlin",
      "zip": "12345",
      "state": "Berlin",
      "country": "DE"
    }
  ]
}
```

### Mapping für dieses Beispiel:

```
street: {{2.addresses[0].street}}
houseNumber: {{2.addresses[0].street2}}
city: {{2.addresses[0].city}}
zip: {{2.addresses[0].zip}}
```

---

## Quick Fix Checkliste

- [ ] Close-Modul gibt Adressfelder zurück
- [ ] "Set multiple variables" mappt die Adressfelder korrekt
- [ ] Default-Werte sind gesetzt (für leere Adressen)
- [ ] Test in Make History zeigt gefüllte Adressfelder
- [ ] Array Aggregator enthält die Adressfelder
- [ ] Webhook Response enthält die Adressfelder

