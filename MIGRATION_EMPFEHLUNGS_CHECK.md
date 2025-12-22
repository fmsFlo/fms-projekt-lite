# Migration: EmpfehlungsCheck hinzufügen

## Status: ✅ Vorbereitet, noch nicht ausgeführt

Diese Migration fügt die Tabelle `EmpfehlungsCheck` zur Datenbank hinzu, um Empfehlungen für Kunden zu speichern.

## Was wird erstellt:

- **Tabelle**: `EmpfehlungsCheck`
  - `id`: Eindeutige ID
  - `clientId`: Verknüpfung zum Client
  - `empfehlungen`: JSON-String mit allen Empfehlungen
  - `gesamtEinsparungMonatlich`: Berechnete monatliche Einsparung
  - `gesamtEinsparungJaehrlich`: Berechnete jährliche Einsparung
  - `anzahlOptimierungen`: Anzahl der Empfehlungen
  - `createdAt`, `updatedAt`: Zeitstempel

## Migration ausführen:

### Option 1: Prisma Migrate (empfohlen)
```bash
npx prisma migrate dev --name add_empfehlungs_check
```

### Option 2: Prisma DB Push (für schnelle Entwicklung)
```bash
npx prisma db push
```

### Option 3: SQL direkt ausführen
Die SQL-Datei befindet sich in:
```
prisma/migrations/20241215000000_add_empfehlungs_check/migration.sql
```

## Nach der Migration:

1. Prisma Client neu generieren (falls nötig):
   ```bash
   npx prisma generate
   ```

2. Testen:
   - Empfehlung hinzufügen
   - "Speichern" klicken
   - Seite neu laden → Daten sollten noch da sein

## Wichtig:

- ⚠️ **Nicht ausführen, bevor alle Änderungen fertig sind!**
- ✅ Migration ist vorbereitet und kann später ausgeführt werden
- ✅ Funktioniert aktuell mit localStorage (lokal)
- ✅ Nach Migration: Funktioniert mit Datenbank (online)

## Rollback (falls nötig):

```sql
DROP TABLE IF EXISTS "public"."EmpfehlungsCheck";
```

