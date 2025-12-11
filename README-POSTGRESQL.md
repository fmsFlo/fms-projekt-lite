# Lokale PostgreSQL-Einrichtung

## Option 1: Docker (Empfohlen)

1. **Docker Container starten:**
   ```bash
   docker-compose up -d
   ```

2. **Prüfen ob Container läuft:**
   ```bash
   docker ps | grep postgres
   ```

3. **DATABASE_URL in `.env.local` setzen:**
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docreate_dev
   ```

4. **Prisma Migrationen ausführen:**
   ```bash
   npx prisma migrate dev
   ```

5. **Prisma Client generieren:**
   ```bash
   npx prisma generate
   ```

## Option 2: Lokale PostgreSQL-Installation

1. **PostgreSQL installieren:**
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. **Datenbank erstellen:**
   ```bash
   createdb docreate_dev
   ```

3. **DATABASE_URL in `.env.local` setzen:**
   ```bash
   DATABASE_URL=postgresql://$(whoami)@localhost:5432/docreate_dev
   ```

4. **Prisma Migrationen ausführen:**
   ```bash
   npx prisma migrate dev
   ```

## Docker Container stoppen

```bash
docker-compose down
```

## Docker Container mit Daten löschen

```bash
docker-compose down -v
```

## Nützliche Befehle

- **Datenbank öffnen:**
  ```bash
  docker exec -it docreate-postgres psql -U postgres -d docreate_dev
  ```

- **Prisma Studio (GUI für Datenbank):**
  ```bash
  npx prisma studio
  ```

