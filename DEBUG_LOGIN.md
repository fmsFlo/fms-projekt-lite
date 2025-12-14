# Login-Problem Debugging

## Wo kann ich das Problem nachschauen?

### 1. **Netlify Logs** (Wichtigste Quelle)

**Wo findest du die Logs:**
1. Gehe zu [Netlify Dashboard](https://app.netlify.com)
2. Wähle dein Projekt aus
3. Gehe zu **"Functions"** oder **"Deploys"**
4. Klicke auf den neuesten Deploy
5. Klicke auf **"Functions logs"** oder **"Deploy logs"**

**Was du suchst:**
- `🔍 verifyCredentials aufgerufen` - Zeigt, ob die Login-API aufgerufen wird
- `❌ User nicht gefunden` - User existiert nicht in der Datenbank
- `❌ Passwort ist falsch` - Passwort stimmt nicht
- `❌ Prisma Connect Error` - Datenbank-Verbindung funktioniert nicht
- `✅ Login erfolgreich` - Login hat funktioniert

### 2. **Netlify Environment Variables**

**Wo prüfen:**
1. Netlify Dashboard → Dein Projekt
2. **Site settings** → **Environment variables**
3. Prüfe folgende Variablen:

**WICHTIGE VARIABLEN:**
```
DATABASE_URL=postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**WICHTIG:**
- Keine Anführungszeichen um die URL!
- Keine Leerzeichen am Anfang/Ende
- Die URL muss mit `postgresql://` beginnen

### 3. **Neon Database** (Prüfe ob User existiert)

**Option A: Über Neon Dashboard**
1. Gehe zu [Neon Console](https://console.neon.tech)
2. Wähle dein Projekt
3. Klicke auf **"SQL Editor"**
4. Führe diese Query aus:

```sql
SELECT id, email, role, "isActive" FROM "User" WHERE email = 'admin@finance-made-simple.de';
```

**Option B: Lokal mit Script**
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/check-users.ts
```

### 4. **Admin-User in Neon erstellen**

Falls der User nicht existiert, erstelle ihn:

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/create-admin-simple.ts
```

**Oder direkt in Neon SQL Editor:**
```sql
-- Prüfe ob User existiert
SELECT * FROM "User" WHERE email = 'admin@finance-made-simple.de';

-- Falls nicht, erstelle ihn (Passwort: admin123)
-- WICHTIG: Du musst das Passwort erst hashen!
-- Verwende das Script dafür: scripts/create-admin-simple.ts
```

## Häufige Probleme und Lösungen

### Problem 1: "Ungültige Zugangsdaten"
**Ursache:** User existiert nicht oder Passwort ist falsch
**Lösung:**
1. Prüfe Netlify Logs für genaue Fehlermeldung
2. Erstelle Admin-User neu (siehe oben)
3. Verwende: `admin@finance-made-simple.de` / `admin123`

### Problem 2: "Database connection error"
**Ursache:** DATABASE_URL ist falsch in Netlify
**Lösung:**
1. Prüfe Environment Variables in Netlify
2. Stelle sicher, dass keine Anführungszeichen vorhanden sind
3. Redeploy nach Änderung der Environment Variables

### Problem 3: "User nicht gefunden"
**Ursache:** User existiert nicht in der Online-Datenbank
**Lösung:**
1. Erstelle User direkt in Neon (siehe oben)
2. Oder verwende das Script mit der Online-DATABASE_URL

## Test-Login Credentials

Nach dem Erstellen des Admin-Users:
- **Email:** `admin@finance-made-simple.de`
- **Password:** `admin123`

## Debugging-Schritte

1. ✅ Prüfe Netlify Logs (wichtigste Quelle!)
2. ✅ Prüfe Environment Variables in Netlify
3. ✅ Prüfe ob User in Neon existiert
4. ✅ Erstelle User neu falls nötig
5. ✅ Teste Login erneut

## Netlify Build Command

Stelle sicher, dass der Build Command korrekt ist:
```bash
DATABASE_URL=$NETLIFY_DATABASE_URL_UNPOOLED npx prisma generate && npm run build
```

Die Variable `NETLIFY_DATABASE_URL_UNPOOLED` muss in Netlify gesetzt sein!

