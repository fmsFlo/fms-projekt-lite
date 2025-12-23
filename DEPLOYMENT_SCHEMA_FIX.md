# Deployment Schema Fix - calendly_event_id Problem

## Problem

Dashboard API-Endpunkte werfen 500 Errors in Produktion mit Fehler:
```
column ca.calendly_event_id does not exist
```

**Ursache:** SQL-Queries verwenden `snake_case` Spaltennamen (`calendly_event_id`), aber Prisma erstellt Spalten im `PascalCase` Format (`calendlyEventId`).

## Lösung

### 1. SQL-Queries korrigiert ✅

Alle betroffenen API-Routes wurden korrigiert:

- ✅ `app/api/dashboard/custom-activities/matched/route.ts`
- ✅ `app/api/dashboard/custom-activities/stats/route.ts`
- ✅ `app/api/dashboard/custom-activities/advisor-completion/route.ts`
- ✅ `app/api/dashboard/forecast-backcast/route.ts`

**Änderungen:**
- `ca.calendly_event_id` → `ca."calendlyEventId"`
- `calendly_event_id` → `"calendlyEventId"`
- Alle anderen Spalten auf PascalCase mit Anführungszeichen korrigiert
- SQLite-Syntax durch PostgreSQL-Syntax ersetzt

### 2. Migration Status

Die Migration `20251211191811_add_calendly_and_custom_activities` enthält bereits das Feld `calendlyEventId` (Zeile 44).

**Prüfung:**
```bash
# Lokal prüfen
cat prisma/migrations/20251211191811_add_calendly_and_custom_activities/migration.sql | grep calendlyEventId
```

### 3. Pre-Deploy Schema Check

Neues Script erstellt: `scripts/check-schema-consistency.ts`

**Verwendung:**
```bash
# Stelle sicher dass DATABASE_URL gesetzt ist
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Führe Schema-Check aus
npm run prisma:schema:check
```

Das Script prüft ob alle kritischen Spalten in der Datenbank vorhanden sind.

**Wichtig:** Das Script verwendet `tsx` statt `ts-node` um Module-Warnungen zu vermeiden.

## Deployment-Plan

### Schritt 1: Lokale Prüfung

```bash
# 1. DATABASE_URL setzen (falls nicht in .env.local)
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# 2. Prisma Client generieren
npm run prisma:generate

# 3. Schema-Check ausführen
npm run prisma:schema:check

# 4. Migrationen prüfen
ls -la prisma/migrations/
```

### Schritt 2: Produktions-Deployment

#### Für Vercel:

1. **Environment Variables prüfen:**
   - `DATABASE_URL` muss auf Produktions-Datenbank zeigen
   - Prüfe in Vercel Dashboard → Settings → Environment Variables

2. **Build Command anpassen (falls nötig):**
   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

3. **Oder als separate Build Step:**
   - In Vercel Dashboard → Settings → Build & Development Settings
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Füge Post-Build Hook hinzu (falls möglich)

#### Für Railway/Render/Andere:

1. **In Build-Phase:**
   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:migrate:deploy
   npm run build
   ```

2. **Oder als separate Deploy-Script:**
   ```bash
   # deploy.sh
   #!/bin/bash
   set -e
   
   echo "🔧 Generiere Prisma Client..."
   npm run prisma:generate
   
   echo "📦 Führe Migrationen aus..."
   npm run prisma:migrate:deploy
   
   echo "✅ Deployment vorbereitet"
   ```

### Schritt 3: Migrationen in Produktion ausführen

**WICHTIG:** Führe Migrationen VOR dem Code-Deployment aus!

```bash
# Setze DATABASE_URL auf Produktion
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Führe Migrationen aus
npx prisma migrate deploy

# Prüfe Schema
npm run prisma:schema:check
```

### Schritt 4: Verifizierung

Nach dem Deployment prüfe:

1. **API-Endpunkte testen:**
   ```bash
   # Test matched endpoint
   curl https://your-domain.com/api/dashboard/custom-activities/matched?startDate=2025-01-01&endDate=2025-01-31
   
   # Test stats endpoint
   curl https://your-domain.com/api/dashboard/custom-activities/stats?startDate=2025-01-01&endDate=2025-01-31
   ```

2. **Logs prüfen:**
   - Vercel: Dashboard → Functions → Logs
   - Railway: Deployments → Logs
   - Prüfe auf Fehler wie "column does not exist"

## Häufige Probleme & Lösungen

### Problem 1: DATABASE_URL nicht gesetzt

**Symptom:** `The provided database string is invalid. The scheme is not recognized`

**Lösung:**
```bash
# Prüfe ob DATABASE_URL gesetzt ist
echo $DATABASE_URL

# Setze DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Oder in .env.local
echo 'DATABASE_URL="postgresql://user:password@host:5432/dbname"' >> .env.local
```

### Problem 2: Migration wurde nicht ausgeführt

**Symptom:** `column calendly_event_id does not exist`

**Lösung:**
```bash
# Prüfe Migration Status
npx prisma migrate status

# Führe ausstehende Migrationen aus
npx prisma migrate deploy
```

### Problem 3: Falsche DATABASE_URL

**Symptom:** Connection-Fehler oder falsche Datenbank

**Lösung:**
- Prüfe `.env.production` oder Environment Variables
- Stelle sicher dass `DATABASE_URL` auf Produktions-DB zeigt
- Teste Verbindung: `npx prisma db pull`

### Problem 4: Prisma Client nicht generiert

**Symptom:** `Cannot find module '@prisma/client'`

**Lösung:**
```bash
npm run prisma:generate
```

### Problem 5: Schema-Mismatch zwischen Dev und Prod

**Symptom:** Lokal funktioniert, Produktion nicht

**Lösung:**
1. Führe `npm run prisma:schema:check` lokal aus
2. Führe `npm run prisma:schema:check` in Produktion aus (mit prod DATABASE_URL)
3. Vergleiche Ergebnisse
4. Stelle sicher dass alle Migrationen in `prisma/migrations/` vorhanden sind

## Checkliste vor jedem Deployment

- [ ] `DATABASE_URL` ist gesetzt (lokal und Produktion)
- [ ] Alle SQL-Queries verwenden PascalCase mit Anführungszeichen
- [ ] `npm run prisma:schema:check` lokal erfolgreich
- [ ] Alle Migrationen in `prisma/migrations/` vorhanden
- [ ] `DATABASE_URL` in Produktion korrekt gesetzt
- [ ] `prisma migrate deploy` in Produktion ausgeführt
- [ ] `prisma:schema:check` in Produktion erfolgreich
- [ ] API-Endpunkte getestet

## Zusätzliche Sicherheit

### Pre-Deploy Hook (empfohlen)

Füge in `package.json` hinzu:

```json
{
  "scripts": {
    "predeploy": "npm run prisma:schema:check",
    "deploy": "npm run prisma:migrate:deploy && npm run build"
  }
}
```

### CI/CD Integration

Für GitHub Actions / GitLab CI:

```yaml
# .github/workflows/deploy.yml
- name: Check Schema
  run: npm run prisma:schema:check
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Deploy Migrations
  run: npm run prisma:migrate:deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Zusammenfassung

✅ **SQL-Queries korrigiert** - Alle `calendly_event_id` → `"calendlyEventId"`  
✅ **Pre-Deploy-Check erstellt** - `scripts/check-schema-consistency.ts`  
✅ **DATABASE_URL-Validierung hinzugefügt** - Bessere Fehlermeldungen  
✅ **tsx statt ts-node** - Keine Module-Warnungen mehr  
✅ **Migration vorhanden** - `20251211191811_add_calendly_and_custom_activities`  
✅ **Deployment-Plan dokumentiert** - Siehe oben  

**Nächste Schritte:**
1. `DATABASE_URL` setzen: `export DATABASE_URL="postgresql://..."`
2. Schema-Check ausführen: `npm run prisma:schema:check`
3. Migrationen in Produktion ausführen: `npx prisma migrate deploy`
4. Code deployen
5. API-Endpunkte testen
