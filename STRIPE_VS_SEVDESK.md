# Stripe vs. Sevdesk für Rechnungen

## Empfehlung: **Stripe für Zahlungen, Sevdesk für Rechnungen**

### Warum diese Kombination?

**Stripe:**
- ✅ Perfekt für SEPA-Lastschriften und automatische Zahlungseinzüge
- ✅ Automatische Mandatsverwaltung
- ✅ Hohe Zuverlässigkeit bei Zahlungsabwicklung
- ✅ Gute Integration in den Workflow (automatisch beim Upload des unterschriebenen Dokuments)
- ❌ **Nicht** für Rechnungsstellung optimiert (keine automatischen Rechnungen mit allen notwendigen Feldern)
- ❌ Keine deutsche Rechnungsvorlagen (MwSt., USt-ID, etc.)
- ❌ Keine Archivierung von Rechnungen nach GoBD

**Sevdesk:**
- ✅ Professionelle Rechnungsstellung nach deutschen Standards
- ✅ Automatische MwSt-Berechnung
- ✅ GoBD-konforme Archivierung
- ✅ USt-ID, Steuernummer, etc. automatisch eingebunden
- ✅ Rechnungsvorlagen und Branding
- ✅ Automatische Mahnungen
- ✅ Buchhaltungsexport (DATEV, etc.)
- ❌ **Nicht** direkt für SEPA-Lastschrift-Einzug geeignet

### Empfohlener Workflow:

1. **Vertrag erstellen** → in Docreate
2. **Unterschriebenes Dokument hochladen** → Stripe-Mandat wird automatisch erstellt
3. **Zahlung einziehen** → über Stripe SEPA-Lastschrift (kann manuell oder automatisch bei Vertragsschluss)
4. **Rechnung erstellen** → in Sevdesk (manuell oder über API-Integration)
5. **Zahlungszuordnung** → in Sevdesk markieren als "bereits eingezogen via Stripe"

### Alternative: Beide Systeme parallel

**Aktuell implementiert:**
- Stripe für SEPA-Mandat und Zahlungseinzug ✅
- Manuelle Rechnungsstellung über Sevdesk (separat)

**Zukünftige Erweiterung möglich:**
- Automatische Rechnungs-API von Sevdesk einbinden
- Nach erfolgreichem Stripe-Einzug automatisch Rechnung in Sevdesk erstellen
- Doppelte Buchung vermeiden durch Status-Tracking

### Für Ihren Fall:

**Bis Sie die Gläubiger-ID haben:**
- ✅ Stripe-Mandate können trotzdem erstellt werden (nur die Gläubiger-ID wird in den Templates angezeigt, aber nicht zwingend für Stripe benötigt)
- ⚠️ Die Gläubiger-ID sollte später in den Einstellungen eingetragen werden
- ✅ Zahlungen können initiiert werden, auch ohne Gläubiger-ID in der DB

**Empfehlung:**
1. Nutzen Sie **Stripe für SEPA-Einzüge** (bereits implementiert)
2. Erstellen Sie **Rechnungen in Sevdesk** (separat, manuell oder zukünftig über API)
3. Tragen Sie die Gläubiger-ID ein, sobald Sie sie erhalten haben (in `/settings`)

### Integration Sevdesk (Optional, zukünftig):

Falls Sie Sevdesk integrieren möchten, könnte folgendes implementiert werden:

```typescript
// Nach erfolgreichem Stripe-Einzug
if (paymentIntent.status === 'succeeded') {
  // Rechnung in Sevdesk erstellen
  await createSevdeskInvoice({
    contractId,
    client,
    amount,
    paymentStatus: 'paid', // Bereits bezahlt via Stripe
  })
}
```

**Fazit:** Die aktuelle Stripe-Integration ist perfekt für SEPA-Einzüge. Für professionelle Rechnungen sollten Sie Sevdesk nutzen - entweder manuell oder zukünftig über eine API-Integration.

