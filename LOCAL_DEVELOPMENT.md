# 🚀 Lokale Entwicklung

Diese Anleitung zeigt dir, wie du das Projekt lokal startest und entwickelst, **bevor** du Änderungen committed und gepusht hast.

## 📋 Voraussetzungen

- **Node.js** 18+ installiert
- **PostgreSQL** Datenbank (lokal oder Neon)
- **Git** installiert

## 🔧 Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen einrichten

Erstelle eine `.env.local` Datei im Projekt-Root (falls noch nicht vorhanden):

```bash
# Datenbank
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
# Oder für Neon:
# DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Admin-Zugangsdaten
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="dein-passwort"

# Optional: API Keys für Integrationen
CLOSE_API_KEY="dein-close-api-key"
CALENDLY_API_TOKEN="dein-calendly-token"
MAKE_WEBHOOK_URL="https://hook.eu2.make.com/..."
MAKE_API_KEY="dein-make-api-key"
```

### 3. Prisma Setup

```bash
# Prisma Client generieren
npm run prisma:generate

# Migrationen anwenden (falls nötig)
npx prisma migrate dev
```

### 4. Admin-User erstellen (falls noch nicht vorhanden)

```bash
npm run ts-node scripts/create-admin-user.ts
```

## 🏃 Lokal starten

### Development Server starten

```bash
npm run dev
```

Die App läuft dann auf: **http://localhost:3000**

### Mit Hot Reload

Next.js lädt automatisch neu, wenn du Dateien änderst. Du musst **nichts** pushen oder committen!

## 💻 Entwicklungsworkflow

### 1. Lokal entwickeln

1. Starte den Dev-Server: `npm run dev`
2. Öffne http://localhost:3000
3. Mache deine Änderungen in den Dateien
4. **Next.js lädt automatisch neu** - du siehst Änderungen sofort!

### 2. Testen ohne zu pushen

- Alle Änderungen sind nur lokal
- Du kannst testen, experimentieren, Fehler beheben
- **Nichts wird zu Git gepusht**, bis du es explizit machst

### 3. Änderungen committen (wenn fertig)

Erst wenn alles funktioniert:

```bash
# Änderungen anzeigen
git status

# Dateien hinzufügen
git add .

# Commit erstellen
git commit -m "feat: Meine neue Funktion"

# Zu GitHub pushen (optional)
git push
```

## 🔍 Wichtige Befehle

### Development
```bash
npm run dev              # Startet lokalen Dev-Server
npm run build            # Baut die App für Production
npm run start            # Startet Production-Server (nach build)
```

### Prisma
```bash
npm run prisma:generate  # Generiert Prisma Client
npx prisma migrate dev    # Erstellt neue Migration
npx prisma studio        # Öffnet Prisma Studio (DB GUI)
```

### Testing
```bash
npm run lint             # Prüft Code-Qualität
```

## 🐛 Troubleshooting

### Port bereits belegt?

```bash
# Anderen Port verwenden
PORT=3001 npm run dev
```

### Datenbank-Verbindungsfehler?

- Prüfe `DATABASE_URL` in `.env.local`
- Stelle sicher, dass die Datenbank läuft
- Prüfe Firewall/Netzwerk-Einstellungen

### Prisma Fehler?

```bash
# Prisma Client neu generieren
npm run prisma:generate

# Migrationen zurücksetzen (VORSICHT: löscht Daten!)
npx prisma migrate reset
```

## 📝 Best Practices

1. **Immer lokal testen** bevor du pushed
2. **Kleine, logische Commits** machen
3. **Beschreibende Commit-Messages** schreiben
4. **Regelmäßig pushen** (aber nicht bei jedem kleinen Test)

## 🎯 Workflow-Zusammenfassung

```
1. npm run dev                    # Server starten
2. Dateien bearbeiten             # Entwicklung
3. Im Browser testen              # http://localhost:3000
4. Fehler beheben                 # Iterieren
5. git add . && git commit        # Wenn fertig
6. git push                       # Optional: zu GitHub
```

## 💡 Tipps

- **Hot Reload**: Änderungen werden automatisch geladen
- **Browser DevTools**: F12 für Console/Network-Debugging
- **Prisma Studio**: `npx prisma studio` für Datenbank-Browser
- **Git Branches**: Nutze Branches für Features (`git checkout -b feature/mein-feature`)

---

**Viel Erfolg beim Entwickeln! 🚀**

