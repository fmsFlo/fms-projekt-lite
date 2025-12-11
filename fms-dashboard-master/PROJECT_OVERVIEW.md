# 📁 Calendly Dashboard - Projektstruktur

## 🎯 Übersicht

Ein vollständiges Calendly Analytics-System für Finance Made Simple mit drei verschiedenen Betriebsmodi.

## 📦 Dateien

```
calendly-dashboard/
│
├── 📄 QUICKSTART.md                 ← Start hier! (5 Min Setup)
├── 📄 CURSOR_SETUP.md               ← Cursor-spezifische Anleitung
├── 📄 README.md                     ← Vollständige Dokumentation
│
├── 🔧 requirements.txt              ← Python Dependencies
├── 🔐 .env.example                  ← Template für API Token
│
├── 🐍 calendly_data_fetcher.py     ← Holt Daten von Calendly API
├── 📊 calendly_dashboard.py         ← Basic Dashboard (empfohlen!)
├── 🚀 calendly_dashboard_pro.py     ← PRO mit Datenbank
└── 💾 calendly_db_integration.py    ← Automatische Sync-Funktion
```

## 🎯 Die 3 Modi

### 1️⃣ JSON Mode (Einfachster Start)

**Perfekt für:** Schneller Einstieg, einmaliges Testen

```bash
# Daten holen
python calendly_data_fetcher.py

# Dashboard starten
streamlit run calendly_dashboard.py

# Im Dashboard: JSON-Datei hochladen
```

**Vorteile:**
✅ Einfachster Setup
✅ Keine Datenbank nötig
✅ Schnell für Tests

**Nachteile:**
❌ Manuelle Updates
❌ Keine Historie

---

### 2️⃣ Live API Mode (Flexibel)

**Perfekt für:** Aktuelle Daten, verschiedene Zeiträume

```bash
# Dashboard starten
streamlit run calendly_dashboard.py

# Im Dashboard:
# → "Live von API" wählen
# → Token eingeben
# → Zeitraum wählen
# → Laden
```

**Vorteile:**
✅ Immer aktuelle Daten
✅ Flexible Zeiträume
✅ Verschiedene Filter möglich

**Nachteile:**
❌ API Rate Limits
❌ Langsamer bei großen Datenmengen

---

### 3️⃣ Database Mode (Automatisch)

**Perfekt für:** Dauerhafte Lösung, Automatisierung

```bash
# Einmal Setup
python calendly_db_integration.py

# PRO Dashboard starten
streamlit run calendly_dashboard_pro.py

# Automatischer Sync via Cron-Job
```

**Vorteile:**
✅ Automatische Updates
✅ Historische Daten
✅ Schneller Zugriff
✅ Keine API-Limits

**Nachteile:**
❌ Komplexeres Setup
❌ Datenbank-Wartung

## 📊 Dashboard Features

### Alle Modi bieten:

#### 🔍 Filter
- Zeitraum frei wählbar
- Status (Active/Canceled)
- Gastgeber (Team-Mitglieder)
- Termintyp

#### 📈 Analysen

**Zeitverlauf:**
- Termine pro Tag
- Status-Trends
- Wochentag-Analyse

**Team:**
- Performance pro Berater
- Absage-Raten
- Vergleiche

**Termintypen:**
- Verteilung
- Conversion-Raten
- Status-Breakdown

**Peak-Zeiten:** *(nur PRO)*
- Heatmap Wochentag/Uhrzeit
- Beste Buchungszeiten

**Detailliste:**
- Alle Events
- Suchfunktion
- CSV Export

## 🛠️ Technologie-Stack

```
Backend:
├── Python 3.8+
├── requests (API Calls)
└── sqlite3 (Datenbank)

Frontend:
├── Streamlit (Dashboard)
├── Pandas (Datenverarbeitung)
└── Plotly (Visualisierungen)
```

## 🚀 Empfohlener Workflow

### Phase 1: Testing (Tag 1)
```
1. JSON Mode nutzen
2. Dashboard testen
3. Features kennenlernen
```

### Phase 2: Regular Use (Woche 1)
```
1. Live API Mode nutzen
2. Verschiedene Analysen machen
3. Team-Reports erstellen
```

### Phase 3: Production (Danach)
```
1. Database Mode einrichten
2. Cron-Job für Auto-Sync
3. Tägliche Dashboards nutzen
```

## 📊 Use Cases

### Für Berater-Team:
- Wer hat die meisten Termine?
- Wer hat die beste Show-up-Rate?
- Welche Termintypen werden oft abgesagt?

### Für Management:
- Wie ist die Team-Auslastung?
- Welche Wochentage sind am besten?
- Conversion-Raten pro Termintyp

### Für Planung:
- Wann sind Peak-Zeiten?
- Welche Termintypen sind beliebt?
- Wie entwickeln sich die Zahlen?

## 🔮 Erweiterungsmöglichkeiten

Das System ist vorbereitet für:

- ✅ **Close CRM Integration** - Events mit Leads matchen
- ✅ **Email Reports** - Automatische Team-Updates
- ✅ **Slack Notifications** - Bei wichtigen Events
- ✅ **Predictive Analytics** - No-Show-Vorhersagen
- ✅ **Multi-Org Support** - Mehrere Calendly-Accounts

## 💡 Pro-Tipps

### Datenqualität:
```python
# Zeiträume anpassen in calendly_data_fetcher.py
months_back = st.selectbox([1, 3, 6, 9, 12])
```

### Performance:
```python
# Für große Datenmengen: Database Mode nutzen
# → Deutlich schneller als JSON oder Live API
```

### Automatisierung:
```bash
# Cron-Job für täglichen Sync (23 Uhr)
0 23 * * * cd /pfad && python calendly_db_integration.py
```

## 🆘 Support & Debugging

### Häufige Probleme:

**"Nicht alle Events werden geladen"**
→ Script macht automatisch Pagination
→ Prüfe API Token Rechte

**"Dashboard lädt nicht"**
→ `streamlit run calendly_dashboard.py --server.port 8502`
→ Dann manuell im Browser öffnen

**"Token ungültig"**
→ Neuen Token generieren
→ Keine Leerzeichen beim Copy-Paste

### Debug-Modus:

```python
# In calendly_data_fetcher.py mehr Logging:
print(f"DEBUG: User {user_name}")
print(f"DEBUG: Events: {len(events)}")
print(f"DEBUG: Status: {response.status_code}")
```

## 📈 Roadmap

- [ ] Close CRM Integration
- [ ] WhatsApp Notifications
- [ ] PDF Reports
- [ ] Predictive Analytics
- [ ] Mobile Dashboard
- [ ] Multi-Language Support

## 🎓 Lernressourcen

**Calendly API:**
https://developer.calendly.com/api-docs

**Streamlit Docs:**
https://docs.streamlit.io

**Plotly Charts:**
https://plotly.com/python

---

**Viel Erfolg mit deinem Dashboard! 🚀**

Bei Fragen → siehe CURSOR_SETUP.md oder README.md
