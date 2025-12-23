# 🔧 Fehlgeschlagene Migration beheben

## Problem

Die Migration `20251210183809_init` ist als fehlgeschlagen markiert und blockiert alle weiteren Migrationen:

```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20251210183809_init` migration started at 2025-12-22 08:31:21.443876 UTC failed
```

## Lösung

### Schritt 1: Status prüfen

Prüfe ob die Migration tatsächlich fehlgeschlagen ist oder nur als "failed" markiert wurde:

```bash
npm run prisma:migrate:resolve
```

Das Script zeigt:
- ✅ Ob die Tabellen existieren (dann war die Migration erfolgreich)
- ❌ Ob die Tabellen fehlen (dann ist sie wirklich fehlgeschlagen)

### Schritt 2A: Migration war erfolgreich (Tabellen existieren)

Wenn die Tabellen existieren, war die Migration erfolgreich, wurde aber als "failed" markiert (z.B. durch Timeout).

**Lösung:** Markiere die Migration als erfolgreich:

```bash
npx prisma migrate resolve --applied 20251210183809_init
```

Dann führe die restlichen Migrationen aus:

```bash
npx prisma migrate deploy
```

### Schritt 2B: Migration ist wirklich fehlgeschlagen (Tabellen fehlen)

Wenn die Tabellen nicht existieren, ist die Migration wirklich fehlgeschlagen.

**Option 1: Als "rolled back" markieren und neu versuchen**

```bash
# Markiere als rolled back
npx prisma migrate resolve --rolled-back 20251210183809_init

# Versuche Migrationen erneut
npx prisma migrate deploy
```

**Option 2: Migration manuell ausführen**

Falls `migrate deploy` weiterhin fehlschlägt:

```bash
# 1. Prüfe die Migration-Datei
cat prisma/migrations/20251210183809_init/migration.sql

# 2. Führe SQL manuell aus (mit psql oder Neon SQL Editor)
# Kopiere den Inhalt der migration.sql und führe ihn in der Datenbank aus

# 3. Markiere als erfolgreich
npx prisma migrate resolve --applied 20251210183809_init

# 4. Führe restliche Migrationen aus
npx prisma migrate deploy
```

## Vollständiger Workflow

```bash
# 1. Status prüfen
npm run prisma:migrate:resolve

# 2a. Wenn Tabellen existieren:
npx prisma migrate resolve --applied 20251210183809_init
npx prisma migrate deploy

# 2b. Wenn Tabellen fehlen:
npx prisma migrate resolve --rolled-back 20251210183809_init
npx prisma migrate deploy

# 3. Verifizieren
npx prisma migrate status
```

## Häufige Ursachen

### 1. Timeout während Migration
- **Symptom:** Migration läuft zu lange, wird abgebrochen
- **Lösung:** Markiere als `--applied` wenn Tabellen existieren

### 2. Netzwerk-Fehler
- **Symptom:** Verbindung bricht während Migration ab
- **Lösung:** Prüfe ob Tabellen existieren, dann `--applied`

### 3. Berechtigungs-Fehler
- **Symptom:** User hat keine Rechte für bestimmte Operationen
- **Lösung:** Prüfe Datenbank-Berechtigungen, führe manuell aus

### 4. Schema-Konflikt
- **Symptom:** Tabellen existieren bereits mit anderem Schema
- **Lösung:** Prüfe Schema-Unterschiede, bereinige Konflikte

## Verhindern in Zukunft

### 1. Migrationen in kleineren Schritten
- Große Migrationen in mehrere kleine aufteilen
- Reduziert Timeout-Risiko

### 2. Backup vor Migration
```bash
# Backup erstellen (mit pg_dump oder Neon Backup)
pg_dump $DATABASE_URL > backup.sql
```

### 3. Testen in Development
- Immer zuerst in Development testen
- Dann in Staging, dann in Production

### 4. Monitoring
- Migrationen in CI/CD überwachen
- Alerts bei fehlgeschlagenen Migrationen

## Wichtige Befehle

```bash
# Migration Status prüfen
npx prisma migrate status

# Migration als erfolgreich markieren
npx prisma migrate resolve --applied <migration_name>

# Migration als rolled back markieren
npx prisma migrate resolve --rolled-back <migration_name>

# Migrationen ausführen
npx prisma migrate deploy

# Migrationen in Development
npx prisma migrate dev
```

## Sicherheitshinweise

⚠️ **WICHTIG:**
- Prüfe IMMER zuerst ob Tabellen existieren, bevor du `--applied` verwendest
- Erstelle ein Backup vor dem Beheben von Migrationen
- Teste in Development/Staging zuerst
- Dokumentiere alle manuellen Schritte

## Hilfe

Falls nichts funktioniert:

1. **Prüfe Prisma Docs:** https://pris.ly/d/migrate-resolve
2. **Prüfe Logs:** `npm run prisma:migrate:resolve` zeigt Details
3. **Kontaktiere Support:** Mit vollständigen Logs und Migration-Status

