# Timeout-Fix für Calendly Sync

## Problem

Der Calendly-Sync wirft Timeout-Fehler:
- `Inactivity Timeout` - zu viel Zeit ohne Datenübertragung
- `the edge function timed out` - Edge Function Timeout

## Lösung

### 1. Next.js API Routes (Vercel)

Für Vercel wurden `maxDuration` Exports zu allen Sync-Routes hinzugefügt:

- ✅ `app/api/dashboard/sync/route.ts` - `maxDuration = 300` (5 Minuten)
- ✅ `app/api/dashboard/calendly/sync/route.ts` - `maxDuration = 300` (5 Minuten)
- ✅ `app/api/dashboard/custom-activities/sync/route.ts` - `maxDuration = 300` (5 Minuten)

**Hinweis:** 
- Hobby-Plan: Max 5 Minuten (300 Sekunden)
- Pro-Plan: Max 15 Minuten (900 Sekunden) - kann erhöht werden

### 2. Netlify Functions

Für Netlify wurden Timeout-Einstellungen in `netlify.toml` hinzugefügt:

```toml
[[functions]]
  path = "/api/dashboard/sync"
  timeout = 300

[[functions]]
  path = "/api/dashboard/calendly/sync"
  timeout = 300

[[functions]]
  path = "/api/dashboard/custom-activities/sync"
  timeout = 300
```

**Hinweis:**
- Netlify Free: Max 10 Sekunden
- Netlify Pro: Max 26 Sekunden
- Netlify Business: Max 60 Sekunden
- Netlify Enterprise: Max 300 Sekunden (5 Minuten)

### 3. Für längere Syncs (> 5 Minuten)

Falls der Sync länger als 5 Minuten dauert, gibt es mehrere Optionen:

#### Option A: Sync in kleineren Chunks

Ändere die Frontend-Logik, um mehrere kleinere Syncs zu machen:

```typescript
// Statt 365 Tage auf einmal, mache 4x 90 Tage
for (let i = 0; i < 4; i++) {
  const startDays = i * 90
  const endDays = (i + 1) * 90
  await syncCalendly(startDays, endDays)
}
```

#### Option B: Background Job (empfohlen)

Verschiebe den Sync in einen Background-Job:

1. **Queue-System** (z.B. BullMQ, Inngest)
2. **Cron-Job** (z.B. Vercel Cron, Netlify Scheduled Functions)
3. **Webhook** (z.B. Make.com, Zapier)

#### Option C: Streaming Response

Verwende Server-Sent Events (SSE) für Progress-Updates:

```typescript
// Route sendet Progress-Updates
export async function POST(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      // Sync mit Progress-Callbacks
      await syncService.syncCalendlyEvents(daysBack, daysForward, (progress) => {
        controller.enqueue(`data: ${JSON.stringify(progress)}\n\n`)
      })
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

## Deployment

### Vercel

Die `maxDuration` Exports werden automatisch erkannt. Keine zusätzliche Konfiguration nötig.

### Netlify

Die `netlify.toml` wird beim Build automatisch verwendet. Stelle sicher, dass:

1. `netlify.toml` im Root-Verzeichnis ist
2. Netlify-Pro Plan oder höher für längere Timeouts

### Prüfen nach Deployment

```bash
# Prüfe ob Timeout-Einstellungen aktiv sind
curl -X POST https://app.qapix.de/api/dashboard/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "calendly", "daysBack": 30, "daysForward": 30}'
```

## Troubleshooting

### Timeout tritt weiterhin auf

1. **Prüfe Hosting-Plan:**
   - Vercel Hobby: Max 5 Minuten
   - Netlify Free: Max 10 Sekunden
   - Netlify Pro: Max 26 Sekunden

2. **Reduziere Sync-Zeitraum:**
   ```typescript
   // Statt 365 Tage, verwende 90 Tage
   daysBack: 90
   ```

3. **Prüfe Logs:**
   - Vercel: Dashboard → Functions → Logs
   - Netlify: Dashboard → Functions → Logs
   - Prüfe ob `maxDuration` erkannt wird

4. **Optimiere Sync-Logik:**
   - Batch-Processing
   - Parallele Requests
   - Caching

## Weitere Optimierungen

### 1. Incremental Sync

Synchronisiere nur neue/geänderte Events:

```typescript
// Nur Events seit letztem Sync
const lastSync = await getLastSyncTime()
const daysBack = Math.ceil((Date.now() - lastSync) / (1000 * 60 * 60 * 24))
```

### 2. Rate Limiting

Respektiere API-Rate-Limits:

```typescript
// Delay zwischen Requests
await new Promise(resolve => setTimeout(resolve, 100))
```

### 3. Error Handling

Bessere Fehlerbehandlung bei Timeouts:

```typescript
try {
  await syncService.syncCalendlyEvents(daysBack, daysForward)
} catch (error) {
  if (error.message.includes('timeout')) {
    // Retry mit kleinerem Zeitraum
    return await syncService.syncCalendlyEvents(daysBack / 2, daysForward)
  }
  throw error
}
```

## Zusammenfassung

✅ **maxDuration hinzugefügt** - 5 Minuten für alle Sync-Routes  
✅ **Netlify Timeout konfiguriert** - 300 Sekunden in netlify.toml  
✅ **Alle Sync-Routes aktualisiert** - sync, calendly/sync, custom-activities/sync  

**Nächste Schritte:**
1. Code deployen
2. Sync testen
3. Falls weiterhin Timeouts: Sync in kleinere Chunks aufteilen oder Background-Job verwenden

