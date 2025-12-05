# 🚀 Deployment-Anleitung - Versicherungsunterlagen anfordern

## 📋 Übersicht

Diese Anleitung zeigt Ihnen, wie Sie die Landing Page auf verschiedene Hosting-Plattformen deployen und mit Passwortschutz versehen können.

## 🔐 Passwortschutz

**Standard-Passwort:** `versicherung2025`

**Passwort ändern:**
1. Öffnen Sie `login.html`
2. Ändern Sie die Zeile: `const CORRECT_PASSWORD = 'versicherung2025';`
3. Speichern Sie die Datei

## 🌐 Deployment-Optionen

### **Option 1: Netlify (Empfohlen - Kostenlos)**

1. **Netlify Account erstellen**
   - Gehen Sie zu [netlify.com](https://netlify.com)
   - Erstellen Sie einen kostenlosen Account

2. **Projekt hochladen**
   - Ziehen Sie den gesamten `insurance-landing-page` Ordner auf die Netlify-Seite
   - Oder verbinden Sie mit GitHub

3. **Domain konfigurieren**
   - Netlify gibt Ihnen eine kostenlose Domain: `https://ihr-projekt-name.netlify.app`
   - Sie können eine eigene Domain hinzufügen

4. **Passwortschutz aktivieren**
   - Gehen Sie zu Site Settings > Access Control
   - Aktivieren Sie "Password Protection"
   - Setzen Sie das gewünschte Passwort

### **Option 2: Vercel (Kostenlos)**

1. **Vercel Account erstellen**
   - Gehen Sie zu [vercel.com](https://vercel.com)
   - Erstellen Sie einen kostenlosen Account

2. **Projekt deployen**
   ```bash
   # Vercel CLI installieren
   npm i -g vercel
   
   # Im Projektordner
   vercel --prod
   ```

3. **Passwortschutz**
   - Verwenden Sie die `login.html` als Einstiegsseite
   - Oder konfigurieren Sie Vercel's Password Protection

### **Option 3: GitHub Pages (Kostenlos)**

1. **GitHub Repository erstellen**
   - Erstellen Sie ein neues Repository
   - Laden Sie alle Dateien hoch

2. **GitHub Pages aktivieren**
   - Gehen Sie zu Settings > Pages
   - Wählen Sie "Deploy from a branch"
   - Wählen Sie "main" branch

3. **Passwortschutz**
   - GitHub Pages unterstützt keinen nativen Passwortschutz
   - Verwenden Sie die `login.html` als Einstiegsseite

### **Option 4: Eigener Server**

1. **Server vorbereiten**
   ```bash
   # Alle Dateien auf den Server kopieren
   scp -r insurance-landing-page/ user@server:/var/www/html/
   ```

2. **Webserver konfigurieren**
   ```apache
   # Apache .htaccess
   AuthType Basic
   AuthName "Restricted Access"
   AuthUserFile /path/to/.htpasswd
   Require valid-user
   ```

## 🔧 Konfiguration

### **Passwort ändern**

**In login.html:**
```javascript
const CORRECT_PASSWORD = 'ihr-neues-passwort';
```

### **Impressum und Datenschutz anpassen**

**In index.html (Footer):**
```html
<a href="https://ihre-domain.de/impressum" target="_blank">Impressum</a>
<a href="https://ihre-domain.de/datenschutz" target="_blank">Datenschutz</a>
```

### **E-Mail-Adressen anpassen**

**In script.js (Versicherungsdatenbank):**
```javascript
const insuranceDatabase = [
    { name: "Ihre Versicherung", email: "datenschutz@ihre-versicherung.de", category: "Lebensversicherung" },
    // ... weitere Einträge
];
```

## 📱 Domain-Konfiguration

### **Eigene Domain verwenden**

1. **Domain kaufen** (z.B. bei Namecheap, GoDaddy)
2. **DNS-Einstellungen** auf Ihren Hosting-Provider zeigen
3. **SSL-Zertifikat** aktivieren (meist automatisch)

### **Subdomain verwenden**

- `versicherung.ihre-domain.de`
- `tools.ihre-domain.de`
- `anfrage.ihre-domain.de`

## 🔒 Sicherheit

### **Passwortschutz verstärken**

1. **Starkes Passwort verwenden**
   ```javascript
   const CORRECT_PASSWORD = 'IhrSicheresPasswort123!';
   ```

2. **Session-Management**
   ```javascript
   // In login.html hinzufügen
   sessionStorage.setItem('authenticated', 'true');
   ```

3. **HTTPS verwenden**
   - Alle modernen Hosting-Provider bieten HTTPS
   - Wichtig für Datenschutz und Sicherheit

## 📊 Analytics und Tracking

### **Google Analytics hinzufügen**

**In index.html (vor </head>):**
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🚀 Schnellstart mit Netlify

1. **Dateien vorbereiten**
   - Alle Dateien in einen Ordner packen
   - `login.html` als `index.html` umbenennen
   - Original `index.html` zu `app.html` umbenennen

2. **Netlify deployen**
   - Ordner auf netlify.com ziehen
   - Domain konfigurieren
   - Passwortschutz aktivieren

3. **Fertig!**
   - Ihre Seite ist live unter `https://ihr-projekt.netlify.app`

## 🔧 Wartung

### **Regelmäßige Updates**

1. **Versicherungsdatenbank aktualisieren**
2. **Passwort regelmäßig ändern**
3. **Backup erstellen**
4. **Performance überwachen**

### **Backup-Strategie**

```bash
# Lokales Backup
tar -czf backup-$(date +%Y%m%d).tar.gz insurance-landing-page/

# Automatisches Backup (cron job)
0 2 * * * /path/to/backup-script.sh
```

## 📞 Support

Bei Problemen:
1. **Logs überprüfen** (Browser-Konsole, Server-Logs)
2. **HTTPS-Status prüfen**
3. **DNS-Einstellungen kontrollieren**
4. **Hosting-Provider kontaktieren**

---

**Hinweis:** Diese Anleitung ist für den produktiven Einsatz gedacht. Testen Sie alle Funktionen vor dem Go-Live!
