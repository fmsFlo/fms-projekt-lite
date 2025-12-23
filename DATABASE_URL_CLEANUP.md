# ✅ DATABASE_URL Cleanup - Alle Überschreibungen entfernt

## Problem

Die `netlify.toml` und der Code überschrieben die in Netlify UI gesetzte `DATABASE_URL` Environment Variable.

## Lösung

Alle `DATABASE_URL` Überschreibungen wurden entfernt. Der Code nutzt jetzt direkt `process.env.DATABASE_URL`, das automatisch von Netlify UI Environment Variables kommt.

---

## Geänderte Dateien

### 1. ✅ netlify.toml
**Entfernt:**
- `[build.environment]` Sektion
- `DATABASE_URL = "${NETLIFY_DATABASE_URL_UNPOOLED}"`

**Jetzt:**
```toml
[build]
  command = "npx prisma generate && npx prisma migrate deploy && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 2. ✅ lib/prisma.ts
**Entfernt:**
- `process.env.NETLIFY_DATABASE_URL_UNPOOLED` Fallback
- `process.env.NETLIFY_DATABASE_URL` Fallback
- `datasources: { db: { url: ... } }` Override

**Jetzt:**
```typescript
// Prisma Client nutzt automatisch process.env.DATABASE_URL
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})
```

### 3. ✅ netlify/functions/leads.mjs
**Entfernt:**
- `process.env.NETLIFY_DATABASE_URL_UNPOOLED` Fallback
- `process.env.NETLIFY_DATABASE_URL` Fallback

**Jetzt:**
```javascript
if (!process.env.DATABASE_URL) {
  // Error handling
}
const sql = neon(process.env.DATABASE_URL)
```

### 4. ✅ netlify/functions/reset-admin-password.mjs
**Entfernt:**
- `process.env.NETLIFY_DATABASE_URL` Fallback

**Jetzt:**
```javascript
if (!process.env.DATABASE_URL) {
  return { statusCode: 500, ... }
}
const sql = neon(process.env.DATABASE_URL)
```

### 5. ✅ app/api/leads/webhook/route.ts
**Entfernt:**
- `process.env.NETLIFY_DATABASE_URL_UNPOOLED` Fallback
- `process.env.NETLIFY_DATABASE_URL` Fallback

**Jetzt:**
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set...')
}
const sql = neon(process.env.DATABASE_URL)
```

---

## Was wurde NICHT geändert

### ✅ next.config.js
- Keine `env: { DATABASE_URL: ... }` Sektion vorhanden
- Korrekt

### ✅ package.json
- Build-Script verwendet keine `DATABASE_URL` Variable
- Korrekt

### ✅ app/api/webhook/leads/route.ts
- Verwendet bereits nur `process.env.DATABASE_URL`
- Korrekt

---

## Validierung

### Prüfe ob noch NETLIFY_DATABASE_URL Referenzen existieren:

```bash
# Suche nach NETLIFY_DATABASE_URL (ignoriere node_modules, .next, .netlify, .git, .md)
grep -r "NETLIFY_DATABASE_URL" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.netlify \
  --exclude-dir=.git \
  --exclude="*.md" \
  --exclude="*.log" \
  .
```

**Ergebnis:** ✅ Keine Referenzen mehr in Source-Dateien

---

## Deployment

### Vor dem Deployment:

1. **Stelle sicher dass `DATABASE_URL` in Netlify UI gesetzt ist:**
   - Gehe zu Netlify Dashboard
   - Site settings → Environment variables
   - Prüfe: `DATABASE_URL` ist vorhanden

2. **Commit und Push:**
   ```bash
   git add .
   git commit -m "fix: remove all DATABASE_URL overrides, use Netlify UI vars"
   git push
   ```

### Nach dem Deployment:

1. **Prüfe Build-Logs:**
   - Netlify Dashboard → Deploys → Build Logs
   - Prüfe ob `prisma migrate deploy` erfolgreich war

2. **Prüfe Function Logs:**
   - Netlify Dashboard → Functions → Logs
   - Prüfe ob keine `DATABASE_URL is not set` Fehler auftreten

---

## Wichtige Hinweise

### ✅ Richtig:
- `process.env.DATABASE_URL` direkt verwenden
- Keine Fallbacks zu `NETLIFY_DATABASE_URL_*`
- Keine `datasources` Override in Prisma Client
- Keine `env: {}` Sektion in `next.config.js`

### ❌ Falsch:
- `DATABASE_URL = "${NETLIFY_DATABASE_URL_UNPOOLED}"` in `netlify.toml`
- `process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED`
- `datasources: { db: { url: ... } }` in Prisma Client
- `env: { DATABASE_URL: ... }` in `next.config.js`

---

## Zusammenfassung

✅ **netlify.toml** - Keine DATABASE_URL Definition mehr  
✅ **lib/prisma.ts** - Nutzt automatisch process.env.DATABASE_URL  
✅ **netlify/functions/** - Alle verwenden nur process.env.DATABASE_URL  
✅ **app/api/** - Alle verwenden nur process.env.DATABASE_URL  
✅ **next.config.js** - Keine env Sektion  
✅ **package.json** - Build-Script sauber  

**Status:** Alle DATABASE_URL Überschreibungen entfernt. Code nutzt jetzt direkt Netlify UI Environment Variables.

