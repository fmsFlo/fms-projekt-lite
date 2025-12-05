# Wo finde ich die Server-Logs?

## Die Logs erscheinen im Terminal, wo der Server läuft

### Option 1: Terminal im VS Code
1. Öffnen Sie VS Code
2. Unten im Editor finden Sie einen Tab "Terminal" (oder drücken Sie `Ctrl + '` / `Cmd + '`)
3. Dort sehen Sie die Ausgabe von `npm run dev`
4. Wenn Sie die Rechnung erstellen, erscheinen dort die Logs mit:
   - 🔄 Versuch 1, 2, 3, 4...
   - 📤 Payload: ...
   - ✅ oder ❌ Fehler...

### Option 2: Separate Terminal
1. Öffnen Sie ein Terminal-Fenster
2. Navigieren Sie zum Projekt-Ordner: `cd "/Users/flohoerning/MVP Docreate"`
3. Starten Sie den Server: `npm run dev`
4. Die Logs erscheinen dort

### Option 3: Logs in Datei umleiten (optional)
Wenn Sie die Logs in eine Datei speichern möchten:
```bash
npm run dev > server.log 2>&1
```
Dann finden Sie die Logs in `server.log` im Projekt-Ordner.

## Was Sie in den Logs sehen sollten:
- `🔄 Versuch 1: ...` - Welche Payload-Struktur gerade getestet wird
- `📤 Payload: ...` - Die komplette JSON-Struktur, die gesendet wird
- `✅ invoiceType gefunden: ...` - Bestätigung, dass invoiceType gesendet wird
- `❌ Versuch X fehlgeschlagen: ...` - Fehlermeldungen

## Tipp:
Wenn Sie die Rechnung erstellen, sollten sofort Logs im Terminal erscheinen. Scrollen Sie im Terminal nach oben, um alle Logs zu sehen.

