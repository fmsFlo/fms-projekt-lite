# Versicherungsunterlagen anfordern - Landing Page

Eine professionelle Landing Page für die einfache Anforderung von Versicherungsunterlagen gemäß DSGVO.

## 🚀 Features

- **Moderne, responsive Benutzeroberfläche** - Funktioniert auf Desktop und Mobile
- **Intelligente Formularvalidierung** - Echtzeitvalidierung mit visuellen Hinweisen
- **Automatische Fristberechnung** - Standardmäßig +14 Tage, anpassbar
- **E-Mail-Integration** - Generiert fertige E-Mail-Vorlage mit allen Daten
- **DSGVO-konform** - Alle erforderlichen Datenschutzbestimmungen beachtet
- **Zapier/Make Integration** - Vorbereitet für Automatisierung

## 📁 Dateien

- `index.html` - Haupt-HTML-Datei
- `styles.css` - CSS-Styling für moderne Optik
- `script.js` - JavaScript für Funktionalität und Validierung
- `README.md` - Diese Dokumentation

## 🛠️ Installation & Verwendung

1. **Lokale Verwendung:**
   ```bash
   # Dateien in einen Ordner kopieren
   # index.html in einem Browser öffnen
   ```

2. **Web-Server:**
   ```bash
   # Mit Python (Python 3)
   python -m http.server 8000
   
   # Mit Node.js (http-server)
   npx http-server
   
   # Mit PHP
   php -S localhost:8000
   ```

3. **Browser öffnen:**
   ```
   http://localhost:8000
   ```

## 🔧 Zapier/Make Integration

### Vorbereitung für Automatisierung

Die Landing Page ist so konzipiert, dass sie einfach mit Zapier oder Make.com integriert werden kann:

#### 1. Webhook-Endpoint erstellen
```javascript
// In script.js, ersetzen Sie die generateDocument Funktion:
function generateDocument(formData) {
    return fetch('https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    });
}
```

#### 2. Zapier Workflow
1. **Trigger:** Webhook (Catch Hook)
2. **Action 1:** Google Docs - Create Document from Template
3. **Action 2:** PDF Generator - Convert to PDF
4. **Action 3:** Email - Send with Attachment

#### 3. Template-Variablen
Verwenden Sie diese Platzhalter in Ihrem Google Docs Template:
- `{{name}}` - Name des Antragstellers
- `{{address}}` - Adresse
- `{{insuranceCompany}}` - Versicherungsgesellschaft
- `{{policyNumber}}` - Versicherungsschein-Nummer
- `{{documents}}` - Liste der gewünschten Unterlagen
- `{{deadline}}` - Frist

### Make.com Integration

```javascript
// Webhook-URL für Make.com
const webhookUrl = 'https://hook.eu1.make.com/YOUR_WEBHOOK_ID';
```

## 📧 E-Mail-Template

Das generierte E-Mail-Template folgt diesem Format:

```
Betreff: Versicherungsunterlagen anfordern - [Versicherungsgesellschaft]

Sehr geehrte Damen und Herren,

hiermit fordere ich gemäß Art. 15 DSGVO folgende Unterlagen zu meiner Versicherung an:

Versicherungsgesellschaft: [Name]
Versicherungsschein-Nummer: [Nummer]

Gewünschte Unterlagen:
• [Liste der ausgewählten Dokumente]

Bitte senden Sie mir die angeforderten Unterlagen bis zum [Datum] zu.

Mit freundlichen Grüßen
[Name]

---
Adresse:
[Adresse]
```

## 🎨 Anpassungen

### Farben ändern
In `styles.css` die CSS-Variablen anpassen:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #4CAF50;
    --error-color: #e74c3c;
}
```

### Texte anpassen
Alle Texte sind in `index.html` definiert und können einfach geändert werden.

### Formularfelder hinzufügen
1. HTML in `index.html` erweitern
2. JavaScript-Validierung in `script.js` anpassen
3. CSS-Styling in `styles.css` hinzufügen

## 📱 Responsive Design

Die Seite ist vollständig responsive und optimiert für:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔒 Datenschutz & DSGVO

- Keine Daten werden dauerhaft gespeichert
- Alle Daten werden nur temporär im Browser verarbeitet
- E-Mail-Generierung erfolgt clientseitig
- Keine Tracking-Cookies oder Analytics

## 🚀 Deployment

### GitHub Pages
1. Repository auf GitHub erstellen
2. Dateien hochladen
3. GitHub Pages aktivieren

### Netlify
1. Ordner auf Netlify ziehen
2. Automatisches Deployment

### Vercel
1. Vercel CLI installieren
2. `vercel --prod` ausführen

## 🐛 Fehlerbehebung

### Häufige Probleme

1. **E-Mail öffnet sich nicht:**
   - Prüfen Sie, ob ein Standard-E-Mail-Client installiert ist
   - Browser-Einstellungen für mailto-Links überprüfen

2. **Formular validiert nicht:**
   - JavaScript-Konsole auf Fehler prüfen
   - Alle erforderlichen Felder ausfüllen

3. **Styling-Probleme:**
   - CSS-Datei korrekt verlinkt?
   - Browser-Cache leeren

## 📞 Support

Bei Fragen oder Problemen:
1. GitHub Issues erstellen
2. Code überprüfen
3. Browser-Konsole auf Fehler prüfen

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe LICENSE-Datei für Details.

---

**Hinweis:** Diese Landing Page ist ein Template und muss für den produktiven Einsatz entsprechend angepasst und getestet werden.
