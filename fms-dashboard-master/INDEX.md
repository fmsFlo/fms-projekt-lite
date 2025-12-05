# 📦 Calendly Dashboard - Komplettpaket

## 🎉 Was du bekommen hast

Ein **produktionsreifes Calendly Analytics Dashboard** mit allem drum und dran!

---

## 📁 Dateien im Paket (11 Dateien)

### 🚀 START HIER:

1. **QUICKSTART.md** - 5 Minuten zum laufenden Dashboard
2. **setup.sh** (Mac/Linux) oder **setup.bat** (Windows) - Automatisches Setup

### 📚 Dokumentation:

3. **CURSOR_SETUP.md** - Spezielle Anleitung für Cursor.ai
4. **README.md** - Vollständige Feature-Dokumentation
5. **PROJECT_OVERVIEW.md** - Architektur & Übersicht

### 🐍 Python Scripts:

6. **calendly_data_fetcher.py** - API Data Fetcher (Core)
   - Holt ALLE Events der Organisation
   - Pagination automatisch
   - Invitees inklusive
   - JSON Export

7. **calendly_dashboard.py** - Basic Dashboard (EMPFOHLEN für Start)
   - Streamlit UI
   - Alle Filter & Analysen
   - JSON oder Live API Mode
   - CSV Export

8. **calendly_dashboard_pro.py** - PRO Dashboard mit DB
   - Alle Basic Features
   - + Datenbank-Integration
   - + Automatischer Sync
   - + Historische Daten
   - + Peak-Zeit Heatmap

9. **calendly_db_integration.py** - Database Manager
   - SQLite Setup
   - Auto-Sync Funktion
   - Für Cron-Jobs / Task Scheduler
   - Event History

### ⚙️ Config:

10. **requirements.txt** - Python Dependencies
11. **.env.example** - Template für API Token

---

## 🎯 Empfohlener Start-Workflow

### Option A: Schnellster Start (5 Min)

```bash
# 1. Setup ausführen
./setup.sh          # Mac/Linux
setup.bat           # Windows

# 2. API Token eintragen in .env

# 3. Daten holen
python calendly_data_fetcher.py

# 4. Dashboard starten
streamlit run calendly_dashboard.py
```

### Option B: Mit Cursor.ai

1. Öffne Ordner in Cursor
2. Lies **CURSOR_SETUP.md**
3. Folge den Schritten
4. Nutze Cursor AI für Anpassungen

---

## 💡 Was das Dashboard kann

### ✅ Features:

- **Daten-Quellen:** JSON Upload, Live API, oder Datenbank
- **Filter:** Datum, Status, Gastgeber, Termintyp
- **Analysen:**
  - Zeitverlauf (Trends, Wochentag)
  - Team-Performance (pro Berater)
  - Termintypen (Verteilung, Conversion)
  - Peak-Zeiten (Heatmap) *PRO only*
  - Detaillisten mit Suche & Export

### 📊 KPIs:

- Gesamt Termine
- Active / Canceled Termine
- Cancel-Rate pro Berater
- Unique Kunden
- Durchschnittliche Termin-Dauer
- Performance-Vergleiche

### 🔄 Modi:

1. **JSON Mode** - Einfachster Start
2. **Live API Mode** - Flexibel & aktuell
3. **Database Mode** - Automatisiert & historisch

---

## 🛠️ Tech Stack

- **Backend:** Python 3.8+
- **API Client:** requests
- **Database:** SQLite (upgrade zu PostgreSQL möglich)
- **Dashboard:** Streamlit
- **Visualisierung:** Plotly
- **Data Processing:** Pandas

---

## 🚀 Next Level Features (vorbereitet)

Das System ist designed für einfache Erweiterung:

- ✅ **Close CRM Integration** - Events mit Leads matchen
- ✅ **Email Reports** - Automatische Team-Updates
- ✅ **Slack Notifications** - Real-time Updates
- ✅ **WhatsApp Integration** - Reminder an Kunden
- ✅ **Predictive Analytics** - No-Show-Wahrscheinlichkeit
- ✅ **Multi-Org Support** - Mehrere Calendly-Accounts

---

## 📖 Dokumentations-Guide

**Hast du nur 5 Minuten?**
→ Lies **QUICKSTART.md**

**Arbeitest du mit Cursor?**
→ Lies **CURSOR_SETUP.md**

**Willst du alles wissen?**
→ Lies **README.md**

**Willst du die Architektur verstehen?**
→ Lies **PROJECT_OVERVIEW.md**

---

## 🆘 Hilfe & Support

### Problem: "Setup klappt nicht"

```bash
# Manuelle Installation:
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### Problem: "API Token Fehler"

1. Neuen Token holen: https://calendly.com/integrations/api_webhooks
2. Prüfe Leerzeichen beim Copy-Paste
3. Bist du Admin in der Org?

### Problem: "Dashboard startet nicht"

```bash
# Mit Port-Angabe:
streamlit run calendly_dashboard.py --server.port 8502

# Dann Browser: http://localhost:8502
```

### Problem: "Nicht alle Events"

Das Script holt automatisch ALLE Events:
- Pagination korrekt implementiert
- Alle User werden durchsucht
- Alle Invitees werden geladen

Falls trotzdem Probleme:
→ Prüfe API Token Rechte (brauchst Admin-Rechte)

---

## 🎓 Lern-Ressourcen

- **Calendly API Docs:** https://developer.calendly.com/api-docs
- **Streamlit Docs:** https://docs.streamlit.io
- **Plotly Charts:** https://plotly.com/python
- **Pandas Guide:** https://pandas.pydata.org

---

## ✅ Checkliste

Nach dem Setup solltest du:

- [ ] Virtual Environment aktiviert
- [ ] Dependencies installiert
- [ ] API Token in .env eingetragen
- [ ] `calendly_data_fetcher.py` erfolgreich gelaufen
- [ ] `calendly_events.json` erstellt
- [ ] Dashboard läuft im Browser
- [ ] Filter funktionieren
- [ ] Alle Tabs sichtbar
- [ ] Export funktioniert

---

## 📊 Typische Use Cases

### Für dich als Geschäftsführer:

1. **Team-Performance**
   - Wer macht die meisten Termine?
   - Wer hat die beste Show-up-Rate?
   - Wo gibt es Optimierungspotenzial?

2. **Kapazitäts-Planung**
   - Wann sind die Peak-Zeiten?
   - Welche Wochentage sind am stärksten?
   - Wo braucht es mehr/weniger Slots?

3. **Conversion-Tracking**
   - Welche Termintypen werden oft abgesagt?
   - Wo ist die Conversion am besten?
   - Welche Berater konvertieren besser?

4. **Kunden-Insights**
   - Wie viele unique Kunden?
   - Repeat-Rate (wenn mit Close CRM integriert)
   - Customer Journey Tracking

---

## 🎯 Produktivitäts-Tipps

### Tägliche Nutzung:

```bash
# Morgens: Daten aktualisieren
python calendly_data_fetcher.py

# Dashboard checken
streamlit run calendly_dashboard.py

# Reports exportieren
# → Im Dashboard: Tab "Detailliste" → CSV Download
```

### Automatisierung (Database Mode):

```bash
# Einmal einrichten:
python calendly_db_integration.py

# Dann Cron-Job (Linux/Mac):
0 23 * * * cd /pfad && python calendly_db_integration.py

# Oder Task Scheduler (Windows):
# → Täglich um 23:00 Uhr
```

### Mit Close CRM Integration:

```python
# In Zukunft: Automatisches Matching
# Event → Lead in Close → Status Update
# Komplett automatisiert!
```

---

## 🔮 Roadmap & Erweiterungen

Wenn du später erweitern willst (ich kann helfen!):

**Phase 1:** Basic Dashboard ✅ (FERTIG)
**Phase 2:** Database Integration ✅ (FERTIG)
**Phase 3:** Close CRM Integration 🔄 (nächster Schritt)
**Phase 4:** Automatisierung & Reports 📋
**Phase 5:** Predictive Analytics 🤖
**Phase 6:** Multi-Channel (WhatsApp/Email) 💬

---

## 💬 Feedback & Fragen

Das System ist komplett modular aufgebaut und kann beliebig erweitert werden.

**Brauchst du:**
- Close CRM Integration?
- WhatsApp Notifications?
- PDF Reports?
- Andere Features?

**→ Sag einfach Bescheid!**

---

## 🎉 Letzte Worte

Du hast jetzt ein **professionelles Calendly Analytics System**, das:

✅ Alle Probleme löst, die Cursor nicht hinbekommen hat
✅ Sauber strukturiert & dokumentiert ist
✅ Produktionsreif läuft
✅ Leicht erweiterbar ist
✅ Für dein Team optimiert ist

**→ Starte mit QUICKSTART.md und viel Erfolg! 🚀**

---

## 📞 Quick Reference

```bash
# Setup
./setup.sh                              # oder setup.bat

# Daten holen
python calendly_data_fetcher.py         # JSON Mode

# Dashboard
streamlit run calendly_dashboard.py     # Basic
streamlit run calendly_dashboard_pro.py # PRO mit DB

# Database Sync
python calendly_db_integration.py       # Einmalig oder Cron
```

**Dokumentation:**
- QUICKSTART.md → 5 Min Start
- CURSOR_SETUP.md → Cursor Integration
- README.md → Alles über Features
- PROJECT_OVERVIEW.md → Architektur

---

**Viel Erfolg mit deinem Calendly Dashboard! 🎉📊📅**
