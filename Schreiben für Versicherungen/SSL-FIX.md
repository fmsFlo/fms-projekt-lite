# SSL-Zertifikat Problem beheben

## Problem
Die Website wird als "Nicht sicher" angezeigt, obwohl HTTPS verwendet wird.

## Mögliche Ursachen

### 1. Ungültiges oder selbstsigniertes SSL-Zertifikat
- Das Zertifikat ist abgelaufen
- Das Zertifikat ist selbstsigniert (nicht von einer vertrauenswürdigen CA)
- Das Zertifikat ist nicht für die richtige Domain ausgestellt

### 2. Fehlende Zwischenzertifikate
- Die Zertifikatskette ist unvollständig
- Zwischenzertifikate fehlen auf dem Server

### 3. Mixed Content (bereits behoben)
- Alle HTTP-Links wurden entfernt
- Alle Ressourcen werden über HTTPS geladen

## Lösungsansätze

### Sofortige Lösung (temporär)
1. **Browser-Warnung umgehen:**
   - In Chrome: Klicke auf "Erweitert" → "Trotzdem fortfahren"
   - In Firefox: Klicke auf "Erweitert" → "Akzeptieren des Risikos und fortfahren"

### Dauerhafte Lösung
1. **Gültiges SSL-Zertifikat einrichten:**
   - Kontaktiere deinen Hosting-Provider
   - Fordere ein gültiges SSL-Zertifikat an
   - Oder richte Let's Encrypt ein (kostenlos)

2. **Let's Encrypt einrichten (empfohlen):**
   ```bash
   # Falls cPanel verfügbar:
   - Gehe zu "SSL/TLS" → "Let's Encrypt"
   - Aktiviere SSL für deine Domain
   
   # Falls SSH-Zugang:
   sudo certbot --apache -d deinerente.finance-made-simple.de
   ```

3. **Zertifikat überprüfen:**
   - Besuche: https://www.ssllabs.com/ssltest/
   - Gib deine Domain ein
   - Prüfe die Bewertung

## Hosting-Provider kontaktieren

**Frage deinen Provider:**
- "Mein SSL-Zertifikat wird als unsicher angezeigt"
- "Können Sie ein gültiges SSL-Zertifikat einrichten?"
- "Ist Let's Encrypt verfügbar?"

## Test nach der Behebung

1. Leere den Browser-Cache
2. Lade die Seite neu
3. Prüfe, ob das Schloss-Symbol angezeigt wird
4. Teste in verschiedenen Browsern

## Notfall-Lösung

Falls das SSL-Problem nicht sofort behoben werden kann:
- Die Website funktioniert trotz der Warnung
- Benutzer können "Trotzdem fortfahren" klicken
- Alle Funktionen sind verfügbar

