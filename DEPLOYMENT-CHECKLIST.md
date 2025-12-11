# ✅ Deployment-Checkliste

## Vor dem Deployment

### 1. Dependencies installiert
```bash
npm install
```

### 2. Umgebungsvariablen konfiguriert

**Lokal (.env.local):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=yourpassword
```

**Netlify (Environment Variables):**
- `DATABASE_URL` - Neon PostgreSQL Connection String
- `NETLIFY_DATABASE_URL_UNPOOLED` - Neon Unpooled Connection (für Prisma Migrations)
- `ADMIN_EMAIL` - Admin Email
- `ADMIN_PASSWORD` - Admin Password
- `MAKE_WEBHOOK_URL` (optional) - Make Webhook URL für Kunden-Suche

### 3. Datenbank-Migrationen
```bash
npx prisma migrate deploy
```

### 4. Admin-User erstellen
```bash
npm run ts-node scripts/create-admin.ts
```

## Lokales Testen

### Netlify Function testen:
```bash
# Netlify CLI installieren (falls nicht vorhanden)
npm install -g netlify-cli

# Netlify Dev starten
netlify dev

# In anderem Terminal: Function testen
curl -X POST http://localhost:8888/.netlify/functions/leads \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

### Make API testen:
```bash
# Next.js Dev Server starten
npm run dev

# In Browser: http://localhost:3000/clients
# Klicke auf "In Make suchen"
# Prüfe Browser Console (F12) für Logs
```

## Deployment auf Netlify

### 1. Git Commit & Push
```bash
git add .
git commit -m "feat: Add Netlify Function for leads, fix auth issues"
git push
```

### 2. Netlify baut automatisch
- Netlify erkennt den Push
- Führt `netlify.toml` Build-Command aus
- Deployed automatisch

### 3. Nach Deployment prüfen

**Netlify Function:**
```
https://your-site.netlify.app/.netlify/functions/leads
```

**Make API:**
```
https://your-site.netlify.app/api/make/search
```

## Wichtige Endpoints

- **Login:** `/.netlify.app/login`
- **Dashboard:** `/.netlify.app/dashboard`
- **Leads Function:** `/.netlify.app/.netlify/functions/leads`
- **Make API Search:** `/.netlify.app/api/make/search`

## Troubleshooting

### Netlify Function funktioniert nicht:
1. Prüfe Netlify Function Logs im Dashboard
2. Prüfe ob `DATABASE_URL` gesetzt ist
3. Prüfe ob `@neondatabase/serverless` installiert ist

### Make API findet keine Kunden:
1. Prüfe Make Webhook URL in Settings
2. Prüfe Make Scenario in Make.com
3. Prüfe Browser Console für Fehler
4. Prüfe Server-Logs für Make API Calls

