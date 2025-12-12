# 🗄️ Datenbank-Setup für lokale Entwicklung

## Problem
Du hast lokal keinen Zugriff auf die Produktions-Datenbank (Neon PostgreSQL). Das ist **gut so** - du solltest nie direkt auf die Produktions-DB zugreifen!

## ✅ Lösung: Separate Datenbank für Development

Profis nutzen **immer** separate Datenbanken:
- **Development**: Lokale oder separate Cloud-DB
- **Production**: Produktions-DB (Neon)

## 🎯 Option 1: Lokale PostgreSQL (Empfohlen für Profis)

### Vorteile
- ✅ Schnell (keine Netzwerk-Latenz)
- ✅ Kostenlos
- ✅ Keine Internet-Verbindung nötig
- ✅ Sicher (keine Verbindung zu Production)

### Installation (macOS)

```bash
# Mit Homebrew installieren
brew install postgresql@15

# PostgreSQL starten
brew services start postgresql@15

# Datenbank erstellen
createdb finance_dev

# Prüfen ob es funktioniert
psql finance_dev
```

### .env.local konfigurieren

```bash
# Lokale Datenbank
DATABASE_URL="postgresql://$(whoami)@localhost:5432/finance_dev?schema=public"
DIRECT_URL="postgresql://$(whoami)@localhost:5432/finance_dev?schema=public"
```

### Migrationen anwenden

```bash
# Prisma Schema synchronisieren
npx prisma db push

# Oder Migrationen erstellen/anwenden
npx prisma migrate dev
```

---

## 🎯 Option 2: Separate Neon-Datenbank (Einfacher)

### Vorteile
- ✅ Einfach (keine lokale Installation)
- ✅ Immer verfügbar (auch ohne lokale DB)
- ✅ Gleiche Umgebung wie Production

### Setup

1. **Neue Datenbank in Neon erstellen**
   - Gehe zu https://neon.tech
   - Erstelle ein **neues Projekt** (z.B. "finance-dev")
   - Kopiere die Connection String

2. **.env.local konfigurieren**

```bash
# Development-Datenbank (separate Neon-DB)
DATABASE_URL="postgresql://user:password@ep-xxx-dev.region.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx-dev.region.aws.neon.tech/dbname?sslmode=require"

# Production-Datenbank (NUR für Production!)
# NETLIFY_DATABASE_URL="postgresql://user:password@ep-xxx-prod.region.aws.neon.tech/dbname?sslmode=require"
```

3. **Migrationen anwenden**

```bash
npx prisma db push
```

---

## 🎯 Option 3: Docker PostgreSQL (Profis)

### Vorteile
- ✅ Konsistent (gleiche Version überall)
- ✅ Einfach zu starten/stoppen
- ✅ Keine System-Installation nötig

### Setup

1. **Docker Compose erstellen** (falls noch nicht vorhanden)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: finance
      POSTGRES_PASSWORD: finance_dev_password
      POSTGRES_DB: finance_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. **Docker starten**

```bash
docker-compose up -d
```

3. **.env.local konfigurieren**

```bash
DATABASE_URL="postgresql://finance:finance_dev_password@localhost:5432/finance_dev?schema=public"
DIRECT_URL="postgresql://finance:finance_dev_password@localhost:5432/finance_dev?schema=public"
```

4. **Migrationen anwenden**

```bash
npx prisma db push
```

---

## 🔐 Best Practices

### 1. Separate .env Dateien

```
.env.local          # Lokale Entwicklung (gitignored)
.env.production     # Production (nur auf Server)
.env.example        # Template (im Git)
```

### 2. Admin-User erstellen

```bash
# Lokalen Admin-User erstellen
npm run ts-node scripts/create-admin-user.ts
```

### 3. Test-Daten einfügen (optional)

```bash
# Seed-Script ausführen (falls vorhanden)
npm run prisma:seed
```

---

## 🚀 Quick Start (Empfehlung)

### Für Einsteiger: Option 2 (Separate Neon-DB)

1. Neue Neon-Datenbank erstellen
2. Connection String in `.env.local` eintragen
3. `npx prisma db push` ausführen
4. `npm run dev` starten

### Für Profis: Option 1 (Lokale PostgreSQL)

1. PostgreSQL lokal installieren
2. Lokale DB erstellen
3. Connection String in `.env.local` eintragen
4. `npx prisma db push` ausführen
5. `npm run dev` starten

---

## 🔍 Troubleshooting

### "Connection refused"

```bash
# Prüfe ob PostgreSQL läuft
brew services list          # macOS
sudo systemctl status postgresql  # Linux

# Starte PostgreSQL
brew services start postgresql@15
```

### "Database does not exist"

```bash
# Erstelle Datenbank
createdb finance_dev

# Oder mit psql
psql postgres
CREATE DATABASE finance_dev;
\q
```

### "Authentication failed"

- Prüfe Username/Password in `.env.local`
- Prüfe PostgreSQL User-Rechte

### Prisma Fehler

```bash
# Prisma Client neu generieren
npm run prisma:generate

# Schema zurücksetzen (VORSICHT: löscht Daten!)
npx prisma migrate reset
```

---

## 📝 .env.local Beispiel

```bash
# ============================================
# LOKALE ENTWICKLUNG
# ============================================

# Option A: Lokale PostgreSQL
DATABASE_URL="postgresql://florian@localhost:5432/finance_dev?schema=public"
DIRECT_URL="postgresql://florian@localhost:5432/finance_dev?schema=public"

# Option B: Separate Neon Development-DB
# DATABASE_URL="postgresql://user:pass@ep-dev-xxx.region.aws.neon.tech/dbname?sslmode=require"
# DIRECT_URL="postgresql://user:pass@ep-dev-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Admin-Zugangsdaten
ADMIN_EMAIL="admin@local.dev"
ADMIN_PASSWORD="dev-password-123"

# API Keys (optional für lokale Entwicklung)
CLOSE_API_KEY=""
CALENDLY_API_TOKEN=""
MAKE_WEBHOOK_URL=""
```

---

## 🎯 Zusammenfassung

**Profis machen es so:**
1. ✅ Separate Datenbank für Development
2. ✅ Lokale PostgreSQL ODER separate Cloud-DB
3. ✅ `.env.local` für lokale Konfiguration
4. ✅ Nie direkt auf Production-DB zugreifen
5. ✅ Migrationen für Schema-Änderungen

**Dein Workflow:**
```
1. Lokale/Dev-DB einrichten
2. .env.local konfigurieren
3. npx prisma db push
4. npm run dev
5. Entwickeln & Testen
6. Wenn fertig: git push (Production nutzt eigene DB)
```

---

**Viel Erfolg! 🚀**

