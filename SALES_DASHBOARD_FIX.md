# 🔧 Sales Dashboard Fix - Lokal testen

## Problem
Die Tabellen `calendly_events` und `custom_activities` existieren nicht in der Datenbank, aber die API-Routes versuchen darauf zuzugreifen.

## Lösung

### 1. ✅ Tabellen erstellt
- Script `scripts/add-sales-dashboard-tables.js` erstellt die Tabellen
- Tabellen verwenden snake_case Namen (dank `@@map` in Prisma Schema)

### 2. ⏳ SQL-Queries müssen angepasst werden
Die API-Routes verwenden noch snake_case Spaltennamen, aber Prisma verwendet PascalCase.

**Wichtig:** PostgreSQL verwendet PascalCase für Spaltennamen, aber die Tabellennamen sind snake_case.

### 3. Lokal testen

```bash
# 1. Tabellen erstellen
node scripts/add-sales-dashboard-tables.js

# 2. Prisma Client regenerieren
npx prisma generate

# 3. Dev-Server starten
npm run dev
```

### 4. Weitere Anpassungen nötig

Die folgenden Dateien müssen noch angepasst werden (Spaltennamen von snake_case zu PascalCase):

- `app/api/dashboard/calendly/host-stats/route.ts`
- `app/api/dashboard/custom-activities/advisor-completion/route.ts` (teilweise angepasst)
- `app/api/dashboard/forecast-backcast/route.ts`
- `app/api/dashboard/custom-activities/stats/route.ts`
- `app/api/dashboard/custom-activities/by-type/route.ts`

**Spalten-Mapping:**
- `start_time` → `"startTime"`
- `user_id` → `"userId"`
- `host_name` → `"hostName"`
- `event_type_name` → `"eventTypeName"`
- `date_created` → `"dateCreated"`
- `activity_type` → `"activityType"`
- etc.

### 5. Build-Integration
Das Script wurde bereits in `netlify.toml` hinzugefügt, damit die Tabellen beim Deploy automatisch erstellt werden.

