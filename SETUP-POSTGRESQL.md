# PostgreSQL Setup - Anleitung

## Status
✅ `.env.local` wurde aktualisiert mit: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docreate_dev`
✅ Prisma Client wurde generiert

## Nächste Schritte

### Option 1: Docker (Empfohlen, wenn Docker installiert ist)

1. **Docker Desktop installieren** (falls nicht vorhanden):
   - Download: https://www.docker.com/products/docker-desktop
   - Oder via Homebrew: `brew install --cask docker`

2. **Docker Container starten:**
   ```bash
   docker compose up -d
   ```
   Oder (ältere Docker Version):
   ```bash
   docker-compose up -d
   ```

3. **Prüfen ob Container läuft:**
   ```bash
   docker ps | grep postgres
   ```

4. **Migrationen ausführen:**
   ```bash
   npx prisma migrate deploy
   ```
   Oder für Entwicklung:
   ```bash
   npx prisma migrate dev
   ```

### Option 2: Lokale PostgreSQL-Installation

1. **PostgreSQL installieren:**
   ```bash
   brew install postgresql@14
   ```

2. **PostgreSQL starten:**
   ```bash
   brew services start postgresql@14
   ```

3. **Datenbank erstellen:**
   ```bash
   createdb docreate_dev
   ```

4. **DATABASE_URL in `.env.local` anpassen:**
   ```
   DATABASE_URL=postgresql://$(whoami)@localhost:5432/docreate_dev
   ```

5. **Migrationen ausführen:**
   ```bash
   npx prisma migrate dev
   ```

### Option 3: Supabase (Cloud PostgreSQL - kostenlos)

1. **Supabase Account erstellen:** https://supabase.com
2. **Neues Projekt erstellen**
3. **Connection String kopieren** (Settings → Database → Connection string)
4. **In `.env.local` eintragen:**
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```
5. **Migrationen ausführen:**
   ```bash
   npx prisma migrate deploy
   ```

## Nach dem Setup

1. **Admin-User erstellen:**
   ```bash
   npx ts-node scripts/create-admin.ts
   ```

2. **Server starten:**
   ```bash
   npm run dev
   ```

## Prüfen ob alles funktioniert

```bash
# Prisma Studio öffnen (GUI für Datenbank)
npx prisma studio
```

## Hilfe

- Docker Container stoppen: `docker compose down`
- Docker Container mit Daten löschen: `docker compose down -v`
- PostgreSQL Logs anzeigen: `docker compose logs postgres`

