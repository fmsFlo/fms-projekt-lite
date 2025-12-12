# ⚡ Quick Start: Lokale Entwicklung

## 🎯 Schnellste Lösung (5 Minuten)

### Option A: Docker (Empfohlen - wenn Docker installiert ist)

```bash
# 1. Docker Container starten
docker-compose up -d

# 2. .env.local erstellen/bearbeiten
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docreate_dev?schema=public"' > .env.local
echo 'ADMIN_EMAIL="admin@local.dev"' >> .env.local
echo 'ADMIN_PASSWORD="dev123"' >> .env.local

# 3. Prisma Schema anwenden
npx prisma db push

# 4. Admin-User erstellen
npm run ts-node scripts/create-admin-user.ts

# 5. Dev-Server starten
npm run dev
```

**Fertig!** Öffne http://localhost:3000

---

### Option B: Separate Neon-Datenbank (Einfach - keine Installation)

```bash
# 1. Neue Datenbank in Neon erstellen
#    → Gehe zu https://neon.tech
#    → Erstelle neues Projekt "finance-dev"
#    → Kopiere Connection String

# 2. .env.local erstellen
echo 'DATABASE_URL="postgresql://user:pass@ep-xxx-dev.region.aws.neon.tech/dbname?sslmode=require"' > .env.local
echo 'ADMIN_EMAIL="admin@local.dev"' >> .env.local
echo 'ADMIN_PASSWORD="dev123"' >> .env.local

# 3. Prisma Schema anwenden
npx prisma db push

# 4. Admin-User erstellen
npm run ts-node scripts/create-admin-user.ts

# 5. Dev-Server starten
npm run dev
```

**Fertig!** Öffne http://localhost:3000

---

## 🔍 Prüfen ob es funktioniert

```bash
# Prisma Studio öffnen (GUI für Datenbank)
npx prisma studio
```

Öffnet Browser mit Datenbank-GUI auf http://localhost:5555

---

## 🛑 Docker stoppen (wenn fertig)

```bash
docker-compose down
```

---

## ❓ Welche Option?

- **Docker**: Wenn du Docker hast → Schnell, lokal, kostenlos
- **Neon**: Wenn keine Installation → Einfach, Cloud, kostenlos (bis 0.5GB)

**Beide sind sicher** - keine Verbindung zur Production-DB!

