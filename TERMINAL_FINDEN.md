# 🔍 WO SIND DIE TERMINAL-LOGS?

## Die Logs erscheinen im Terminal, wo `npm run dev` läuft!

### 🎯 IN CURSOR / VS CODE:

1. **Unten im Editor** finden Sie einen Tab **"Terminal"** 
   - Oder drücken Sie: `Ctrl + '` (Windows/Linux) oder `Cmd + '` (Mac)
   - Oder: Menü → View → Terminal

2. **Im Terminal** sehen Sie:
   ```
   ▲ Next.js 14.2.33
   - Local:        http://localhost:3000
   ✓ Ready in 1061ms
   ```

3. **Wenn Sie eine Rechnung erstellen**, erscheinen dort sofort die Logs:
   - `📅 Invoice Date: ...`
   - `🔍 DEBUG - contact.id Type: ...`
   - `📤 Sevdesk Invoice Payload: ...`
   - `❌ Fehler beim Erstellen der Rechnung: ...`

### 📋 WAS ZU TUN IST:

1. **Öffnen Sie das Terminal** (siehe oben)
2. **Scrollen Sie nach oben** im Terminal, um alle Logs zu sehen
3. **Kopieren Sie die komplette Fehlermeldung** (alles zwischen `📤` und `❌`)
4. **Schicken Sie mir die Fehlermeldung hier**

### 🔧 ALTERNATIVE: Terminal-Fenster direkt öffnen

Falls Sie das Terminal nicht finden:

1. **Öffnen Sie ein Terminal-Fenster** (Terminal.app auf Mac, CMD auf Windows)
2. **Navigieren Sie zum Projekt:**
   ```bash
   cd "/Users/flohoerning/MVP Docreate"
   ```
3. **Starten Sie den Server:**
   ```bash
   npm run dev
   ```
4. **Die Logs erscheinen dort direkt**

### ⚠️ WICHTIG:

- Der Server muss **laufen**, damit Sie die Logs sehen
- Wenn Sie die Rechnung erstellen, **sofort** erscheinen die Logs im Terminal
- **Scrollen Sie nach oben**, um alle Logs zu sehen!



