# 🔧 Migration-Fix für Deploy

## Problem
Die Datenbank hat nicht alle Felder, die im Prisma Schema definiert sind. Beim Deploy muss sichergestellt werden, dass die Migrationen ausgeführt werden.

## Lösung

### 1. Migration wurde erstellt
- `prisma/migrations/20251222000000_add_client_retirement_fields/migration.sql`
- Fügt die fehlenden Felder hinzu: `targetPensionNetto`, `desiredRetirementAge`, `monthlySavings`

### 2. Build-Command wurde aktualisiert
In `netlify.toml`:
```toml
[build]
  command = "DATABASE_URL=$NETLIFY_DATABASE_URL_UNPOOLED npx prisma generate && (DATABASE_URL=$NETLIFY_DATABASE_URL_UNPOOLED npx prisma migrate deploy || DATABASE_URL=$NETLIFY_DATABASE_URL_UNPOOLED npx ts-node scripts/add-missing-client-fields.ts) && npm run build"
```

**Was passiert:**
1. Prisma Client wird generiert
2. Migrationen werden ausgeführt (`prisma migrate deploy`)
3. Falls Migration fehlschlägt, wird das Fallback-Script ausgeführt (`add-missing-client-fields.ts`)
4. Build wird ausgeführt

### 3. Fallback-Script
`scripts/add-missing-client-fields.ts`:
- Prüft welche Felder fehlen
- Fügt sie direkt per SQL hinzu
- Funktioniert auch wenn Migrationen fehlschlagen

### 4. Robuste Query
Die Clients-Page versucht jetzt automatisch, fehlende Felder hinzuzufügen, falls die Query fehlschlägt.

## Beim nächsten Deploy

1. **Netlify führt automatisch aus:**
   - `prisma generate`
   - `prisma migrate deploy` (oder Fallback-Script)
   - `npm run build`

2. **Falls Migration fehlschlägt:**
   - Das Fallback-Script fügt die Felder direkt hinzu
   - Build läuft weiter

3. **Falls alles fehlschlägt:**
   - Die Clients-Page versucht selbst, die Felder hinzuzufügen
   - Zeigt eine Fehlermeldung, wenn es nicht funktioniert

## Manuelle Ausführung (falls nötig)

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/add-missing-client-fields.ts
```

## Prüfen ob Felder existieren

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/ensure-migrations.ts
```

