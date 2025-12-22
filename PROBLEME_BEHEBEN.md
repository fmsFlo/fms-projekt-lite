# 🔧 Probleme beheben: Speichern & Login

## Problem 1: Speichern funktioniert nicht (500 Fehler)

### Schritt 1: Prüfe die Server-Logs

**Lokal:**
- Schaue in das Terminal, wo `npm run dev` läuft
- Suche nach `❌ PATCH Error:` oder `Validation Errors:`

**Online (Netlify):**
1. Gehe zu [Netlify Dashboard](https://app.netlify.com)
2. Wähle dein Projekt
3. Gehe zu **"Functions"** → **"Functions logs"**
4. Suche nach Fehlermeldungen

### Schritt 2: Prüfe die Browser-Console

1. Öffne die Browser-Console (F12)
2. Gehe zum **"Console"** Tab
3. Versuche zu speichern
4. Schaue nach Fehlermeldungen wie:
   - `API Error:`
   - `Save Error:`
   - `Validation Errors:`

### Schritt 3: Häufige Fehler und Lösungen

#### Fehler: "Vorname erforderlich"
**Lösung**: Stelle sicher, dass `firstName` nicht leer ist

#### Fehler: "Ungültige E-Mail"
**Lösung**: Prüfe ob die E-Mail-Adresse gültig ist oder lasse sie leer

#### Fehler: "Client nicht gefunden"
**Lösung**: Der Client wurde gelöscht oder die ID ist falsch

#### Fehler: Prisma Error (P2025, etc.)
**Lösung**: Datenbank-Verbindungsproblem - prüfe DATABASE_URL

### Schritt 4: Debug-Informationen sammeln

Falls das Problem weiterhin besteht, sammle diese Informationen:

1. **Browser Console Fehler** (komplett kopieren)
2. **Server Logs** (aus Terminal oder Netlify)
3. **Welche Felder** du speichern möchtest
4. **Welcher Client** (ID oder Name)

---

## Problem 2: Login funktioniert online nicht

### Schritt 1: Prüfe welche User existieren

**Lokal (mit lokaler Datenbank):**
```bash
npx ts-node scripts/check-online-users.ts
```

**Online (mit Online-Datenbank):**
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/check-online-users.ts
```

Das Script zeigt dir:
- ✅ Welche User existieren
- ✅ Welche User aktiv sind
- ✅ Ob der Standard-Admin existiert

### Schritt 2: Teste Login-Credentials

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/test-online-login.ts admin@finance-made-simple.de admin123
```

Das Script testet:
- ✅ Ob der User existiert
- ✅ Ob der User aktiv ist
- ✅ Ob das Passwort korrekt ist

### Schritt 3: Häufige Probleme

#### Problem: "User nicht gefunden"
**Lösung 1**: Erstelle den User neu
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/create-admin-simple.ts
```

**Lösung 2**: Prüfe ob User inaktiv ist
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/check-online-users.ts
```

#### Problem: "Passwort falsch"
**Lösung**: Setze Passwort zurück
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/reset-user-password.ts admin@finance-made-simple.de neues-passwort
```

#### Problem: "Database connection error"
**Lösung**: 
1. Prüfe DATABASE_URL in Netlify Environment Variables
2. Stelle sicher, dass keine Anführungszeichen vorhanden sind
3. Redeploy nach Änderung

### Schritt 4: User direkt in Neon prüfen

1. Gehe zu [Neon Console](https://console.neon.tech)
2. Wähle dein Projekt
3. Klicke auf **"SQL Editor"**
4. Führe diese Query aus:

```sql
-- Alle User anzeigen
SELECT id, email, name, role, "isActive", "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;

-- Spezifischen User prüfen
SELECT id, email, name, role, "isActive" 
FROM "User" 
WHERE email = 'admin@finance-made-simple.de';

-- User aktivieren (falls inaktiv)
UPDATE "User" 
SET "isActive" = true 
WHERE email = 'admin@finance-made-simple.de';
```

### Schritt 5: Neuen Admin-User erstellen (falls nötig)

**Option A: Mit Script (empfohlen)**
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/create-admin-simple.ts
```

**Option B: Direkt in Neon SQL Editor**
```sql
-- WICHTIG: Passwort muss gehasht werden!
-- Verwende das Script dafür, oder:

-- 1. Erstelle User (ohne Passwort-Hash - funktioniert nicht direkt!)
-- 2. Verwende stattdessen das Script
```

---

## 📋 Checkliste

### Für Speichern-Problem:
- [ ] Browser Console geöffnet (F12)
- [ ] Server Logs geprüft (Terminal oder Netlify)
- [ ] Fehlermeldung kopiert
- [ ] Welche Felder werden gespeichert?
- [ ] firstName ist nicht leer?

### Für Login-Problem:
- [ ] Script `check-online-users.ts` ausgeführt
- [ ] Script `test-online-login.ts` ausgeführt
- [ ] User existiert in der Datenbank?
- [ ] User ist aktiv (`isActive = true`)?
- [ ] Passwort ist korrekt?
- [ ] DATABASE_URL ist in Netlify gesetzt?

---

## 🆘 Wenn nichts funktioniert

1. **Sammle alle Informationen:**
   - Browser Console Fehler (komplett)
   - Server Logs (komplett)
   - Output von `check-online-users.ts`
   - Output von `test-online-login.ts`

2. **Prüfe Environment Variables:**
   - DATABASE_URL in Netlify
   - Keine Anführungszeichen
   - Korrekte URL

3. **Redeploy:**
   - Nach Änderung der Environment Variables
   - Nach Änderung der User-Daten

---

## 📞 Standard-Login-Daten

**Email:** `admin@finance-made-simple.de`  
**Password:** `admin123`

**WICHTIG**: Diese müssen in der **Online-Datenbank** existieren, nicht nur lokal!

