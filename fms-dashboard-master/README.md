# 📅 Calendly Dashboard - Finance Made Simple

Ein komplettes Dashboard zur Analyse deiner Calendly-Termine mit allen relevanten Metriken.

## 🎯 Features

- ✅ **Alle Events der gesamten Organisation** abrufen
- 📊 **Flexible Zeitfilter** (bis zu 12 Monate zurück)
- 👥 **Team-Übersicht** (welcher Berater, wie viele Termine)
- 🎯 **Termintypen-Analyse** (Erstgespräch, Konzeptvorstellung, etc.)
- ⏱️ **Status-Tracking** (Aktiv vs. Canceled)
- 📈 **Zeitverlauf-Analysen** (Trends, Peak-Zeiten)
- 📋 **Detaillierte Listen** mit Export-Funktion

## 🚀 Schnellstart

### 1. Installation

```bash
# Dependencies installieren
pip install -r requirements.txt
```

### 2. Calendly API Token holen

1. Gehe zu: https://calendly.com/integrations/api_webhooks
2. Klicke auf "Get a token"
3. Kopiere deinen Personal Access Token

### 3. Option A: Daten einmalig abrufen und speichern

```bash
# In calendly_data_fetcher.py deinen Token eintragen (Zeile 201)
# Dann ausführen:
python calendly_data_fetcher.py
```

Das erstellt eine `calendly_events.json` Datei mit allen Daten.

### 3. Option B: Dashboard mit Live-Abruf starten

```bash
streamlit run calendly_dashboard.py
```

Dann im Dashboard:
1. "Live von API abrufen" wählen
2. API Token eingeben
3. Zeitraum wählen
4. "Daten laden" klicken

## 📊 Dashboard Funktionen

### Filter-Optionen
- **Zeitraum**: Beliebiger Datumsbereich
- **Status**: Active / Canceled
- **Gastgeber**: Filtern nach Team-Mitglied
- **Termintyp**: Nach Event-Type filtern

### Analysen

#### 📅 Zeitverlauf
- Termine pro Tag
- Status-Verteilung über Zeit
- Wochentag-Analyse

#### 👥 Team
- Termine pro Berater
- Absage-Rate pro Berater
- Performance-Vergleich

#### 🎯 Termintypen
- Verteilung der Termintypen
- Status nach Termintyp
- Conversion-Analyse

#### 📋 Detailliste
- Alle Termine mit allen Details
- Sortier- und Filterbar
- CSV-Export

## 🔧 Häufige Probleme & Lösungen

### Problem: "Nicht alle Events werden abgerufen"

**Lösung**: Der Fetcher holt automatisch ALLE Events der Organisation. Das Script:
- Lädt alle Team-Mitglieder
- Ruft Events für jeden User einzeln ab
- Handelt Pagination korrekt (100er Blöcke)

### Problem: "Zu viele API Calls"

**Lösung**: Nutze die JSON-Export-Funktion:
1. Einmal Daten mit `calendly_data_fetcher.py` abrufen
2. JSON-Datei im Dashboard hochladen
3. Spart API-Calls und ist schneller

### Problem: "Fehlende Invitee-Daten"

**Lösung**: Der Fetcher holt automatisch alle Invitees für jedes Event. Falls das fehlschlägt, prüfe:
- API Token hat die richtigen Rechte
- Du bist Admin der Organisation

## 📁 Dateistruktur

```
.
├── calendly_data_fetcher.py    # API Abruf-Script
├── calendly_dashboard.py       # Streamlit Dashboard
├── requirements.txt            # Dependencies
├── README.md                   # Diese Datei
└── calendly_events.json        # Gespeicherte Daten (wird erstellt)
```

## 🔐 Sicherheit

- **API Token nie in Code committen!**
- Token nur lokal in `.env` Datei speichern oder direkt im Dashboard eingeben
- JSON-Dateien mit Kundendaten nicht teilen

## 🚀 Nächste Schritte: Automatisierung

Für die automatische Speicherung neuer Events in einer Datenbank:

### Option 1: Webhooks (empfohlen)
```python
# Calendly sendet automatisch neue Events an deinen Server
# Du speicherst sie direkt in PostgreSQL/MySQL
```

### Option 2: Cron-Job
```bash
# Täglich um 23:00 Uhr neue Events abrufen
0 23 * * * cd /pfad/zum/projekt && python calendly_data_fetcher.py
```

### Option 3: Make.com Integration
- Calendly Webhook Trigger einrichten
- Events direkt in Datenbank speichern
- Mit Close CRM verknüpfen

## 💡 Erweiterungsideen

- [ ] Integration mit Close CRM (Termine mit Leads matchen)
- [ ] Email-Benachrichtigungen bei hoher Absage-Rate
- [ ] Predictive Analytics (wann kommen die meisten Absagen?)
- [ ] Automatische Team-Reports per Email
- [ ] Slack-Integration für Team-Updates

## 📞 Support

Bei Problemen:
1. Prüfe die Fehlermeldung in der Konsole
2. Stelle sicher, dass der API Token korrekt ist
3. Prüfe die Calendly API Docs: https://developer.calendly.com/api-docs

## ⚡ Performance-Tipps

- **Große Datenmengen**: Nutze JSON-Export statt Live-Abruf
- **Häufige Updates**: Implementiere Webhook-Integration
- **Viele Team-Mitglieder**: Der erste Abruf kann 2-5 Min dauern (normal!)

---

**Viel Erfolg mit deinem Dashboard! 🚀**
