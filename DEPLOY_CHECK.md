# Deploy-Checkliste

## Prüfe ob alle Änderungen online sind

### 1. **Netlify Deploy Status prüfen**

1. Gehe zu: https://app.netlify.com
2. Wähle dein Projekt
3. Gehe zu **"Deploys"** Tab
4. Prüfe den neuesten Deploy:
   - ✅ **Status:** "Published" (grün)
   - ✅ **Commit:** Sollte `30cca50` oder `d6e1b21` sein
   - ✅ **Zeit:** Sollte nach deinem letzten Push sein

### 2. **Falls kein neuer Deploy vorhanden:**

**Option A: Manueller Deploy triggern**
1. Netlify Dashboard → Dein Projekt
2. **"Deploys"** Tab
3. Klicke auf **"Trigger deploy"** → **"Deploy site"**
4. Warte bis der Deploy fertig ist

**Option B: Prüfe Branch-Einstellungen**
1. Netlify Dashboard → **Site settings**
2. **Build & deploy** → **Continuous Deployment**
3. Prüfe ob **Branch to deploy:** `main` ist

### 3. **Falls Deploy fehlgeschlagen ist:**

1. Klicke auf den fehlgeschlagenen Deploy
2. Prüfe die **Build logs** auf Fehler
3. Häufige Probleme:
   - `DATABASE_URL` fehlt → Setze in Environment Variables
   - Build-Fehler → Prüfe Logs

### 4. **Browser-Cache leeren:**

**Chrome/Edge:**
- `Ctrl+Shift+R` (Windows) oder `Cmd+Shift+R` (Mac)
- Oder: DevTools (F12) → Rechtsklick auf Reload → "Empty Cache and Hard Reload"

**Firefox:**
- `Ctrl+F5` (Windows) oder `Cmd+Shift+R` (Mac)

**Safari:**
- `Cmd+Option+E` (Cache leeren)
- Dann `Cmd+R` (Neu laden)

### 5. **Prüfe ob neue Features sichtbar sind:**

**Versicherungs-Check:**
- Gehe zu: `/clients/[id]/analyse-tools/versicherungs-check`
- Sollte die neue Versicherungs-Check Seite zeigen

**Einnahmen-Ausgaben:**
- Gehe zu: `/clients/[id]/analyse-tools/einnahmen-ausgaben`
- Sollte die neue Einnahmen-Ausgaben Seite zeigen

**Make API:**
- Suche nach einem Kunden
- Sollte keine "Accepted is not valid JSON" Fehler mehr geben

### 6. **Falls immer noch alt angezeigt wird:**

1. **Prüfe Netlify Logs:**
   - Netlify Dashboard → **Functions** → **Functions logs**
   - Suche nach Fehlern

2. **Prüfe Environment Variables:**
   - Netlify Dashboard → **Site settings** → **Environment variables**
   - Stelle sicher, dass `DATABASE_URL` gesetzt ist

3. **Redeploy:**
   - Netlify Dashboard → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

## Commits die gepusht wurden:

- `30cca50` - fix: Make API 202 Accepted handling
- `d6e1b21` - feat: Versicherungs-Check mit Anbieter-Feld

## Dateien die enthalten sein sollten:

- `app/components/versicherungen/` (alle Dateien)
- `app/clients/[id]/analyse-tools/versicherungs-check/`
- `app/clients/[id]/analyse-tools/einnahmen-ausgaben/`
- `app/api/make/search/route.ts` (mit Fix)


