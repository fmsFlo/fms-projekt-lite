# 🎯 Cursor Setup-Anleitung für Calendly Dashboard

## Was du bekommen hast

Ein komplettes Calendly Dashboard-System mit:

1. **calendly_data_fetcher.py** - Holt alle Daten von Calendly API
2. **calendly_dashboard.py** - Basic Dashboard (empfohlen für Start)
3. **calendly_dashboard_pro.py** - PRO Version mit Datenbank-Support
4. **calendly_db_integration.py** - Automatische Datenbank-Synchronisation
5. **requirements.txt** - Alle benötigten Pakete
6. **README.md** - Ausführliche Dokumentation

## 🚀 Schnellstart in Cursor

### Schritt 1: Projekt in Cursor öffnen

```bash
# Erstelle einen neuen Ordner
mkdir calendly-dashboard
cd calendly-dashboard

# Kopiere alle Dateien rein
# (Die Dateien die du von mir bekommen hast)

# Öffne in Cursor
cursor .
```

### Schritt 2: Virtuelle Umgebung erstellen

Im Cursor Terminal:

```bash
# Virtual Environment erstellen
python -m venv venv

# Aktivieren
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt
```

### Schritt 3: API Token besorgen

1. Gehe zu: https://calendly.com/integrations/api_webhooks
2. Klicke auf "Get a token"
3. Kopiere deinen Personal Access Token

### Schritt 4: Token eintragen

**Option A: In der .env Datei**
```bash
# Kopiere .env.example zu .env
cp .env.example .env

# Öffne .env in Cursor und trage Token ein
CALENDLY_API_TOKEN=dein_token_hier
```

**Option B: Direkt im Code**
Öffne `calendly_data_fetcher.py` und trage in Zeile 201 ein:
```python
API_TOKEN = "dein_echter_token_hier"
```

### Schritt 5: Test-Run

```bash
# Teste den Data Fetcher
python calendly_data_fetcher.py
```

Das sollte jetzt:
- Alle Org-Members holen
- Events für jeden User laden
- Invitees für alle Events laden
- Eine `calendly_events.json` erstellen

### Schritt 6: Dashboard starten

```bash
# Starte das Basic Dashboard
streamlit run calendly_dashboard.py
```

Das Dashboard öffnet sich automatisch im Browser!

## 🎨 Im Dashboard

1. **Datenquelle wählen**: 
   - "JSON Datei laden" → Upload der `calendly_events.json`
   - "Live von API" → Direkt von Calendly laden

2. **Filter nutzen**:
   - Zeitraum anpassen
   - Status filtern (active/canceled)
   - Nach Berater filtern
   - Nach Termintyp filtern

3. **Tabs erkunden**:
   - 📅 Zeitverlauf - Trends über Zeit
   - 👥 Team - Performance pro Berater
   - 🎯 Termintypen - Welche Termine am häufigsten
   - 📋 Detailliste - Alle Termine mit Export

## 🔧 Troubleshooting für Cursor

### Problem: "ModuleNotFoundError"

```bash
# Stelle sicher, dass venv aktiviert ist
# Installiere nochmal:
pip install -r requirements.txt
```

### Problem: "API Token invalid"

Prüfe:
- Token korrekt kopiert? (keine Leerzeichen)
- Bist du Admin in der Calendly Organisation?
- Token ist nicht abgelaufen?

### Problem: "Nicht alle Events werden geladen"

Das Script macht automatisch:
- Pagination (100er Blöcke)
- Alle User durchgehen
- Alle Invitees laden

Wenn trotzdem Fehler:
```python
# In calendly_data_fetcher.py, Zeile 90 ff.
# Füge mehr Logging hinzu:
print(f"DEBUG: Fetching events for {user_name}")
print(f"DEBUG: Got {len(events)} events")
```

### Problem: "Streamlit öffnet nicht"

```bash
# Manuell öffnen
streamlit run calendly_dashboard.py --server.port 8501

# Dann im Browser: http://localhost:8501
```

## 💡 Cursor-spezifische Tipps

### Mit Cursor AI arbeiten

Du kannst Cursor AI fragen:

```
"Füge im Dashboard einen Filter für Location-Type hinzu"
"Erstelle eine neue Visualisierung für Conversion-Rate"
"Ändere die Farben im Dashboard zu [deine Farben]"
```

Cursor versteht den Code und kann ihn erweitern!

### Debugging in Cursor

1. Setze Breakpoints mit Cmd+Click (Mac) / Ctrl+Click (Windows)
2. Drücke F5 für Debug-Modus
3. Oder nutze Cursor Chat: "Warum funktioniert Zeile 150 nicht?"

### Code-Anpassungen

**Dashboard-Titel ändern:**
```python
# In calendly_dashboard.py, Zeile ~35
st.title("📅 Dein eigener Titel hier")
```

**Farben anpassen:**
```python
# In calendly_dashboard.py, Zeile ~30
st.markdown("""
    <style>
    .main {
        background-color: #deine_farbe;
    }
    </style>
""", unsafe_allow_html=True)
```

**Neue Metrik hinzufügen:**
```python
# Bei den KPIs (ca. Zeile 250)
with col6:
    deine_metrik = filtered_df['irgendwas'].mean()
    st.metric("Deine Metrik", f"{deine_metrik:.1f}")
```

## 🚀 Nächste Schritte

### 1. Datenbank-Integration (PRO)

```bash
# Setup Datenbank
python calendly_db_integration.py

# Starte PRO Dashboard
streamlit run calendly_dashboard_pro.py
```

### 2. Automatisierung

**Täglicher Sync via Cron (Mac/Linux):**
```bash
# Crontab bearbeiten
crontab -e

# Füge hinzu (täglich um 23 Uhr):
0 23 * * * cd /pfad/zu/calendly-dashboard && /pfad/zu/venv/bin/python calendly_db_integration.py
```

**Windows Task Scheduler:**
1. Öffne Task Scheduler
2. Neue Aufgabe erstellen
3. Aktion: `python.exe calendly_db_integration.py`
4. Trigger: Täglich um 23:00

### 3. Close CRM Integration

Das wäre der nächste Schritt - Events mit deinen Close Leads matchen!

Sag Bescheid wenn du das willst, dann baue ich das auch noch ein.

## 📞 Wenn was nicht klappt

1. Prüfe Cursor Terminal für Fehler
2. Schaue in `README.md` für Details
3. Prüfe ob alle Dateien vorhanden sind:
   ```bash
   ls -la
   # Sollte zeigen:
   # calendly_data_fetcher.py
   # calendly_dashboard.py
   # calendly_dashboard_pro.py
   # calendly_db_integration.py
   # requirements.txt
   # README.md
   ```

## ✅ Checkliste

- [ ] Dateien in Cursor-Projekt kopiert
- [ ] Virtual Environment erstellt & aktiviert
- [ ] Requirements installiert
- [ ] Calendly API Token geholt
- [ ] Token eingetragen (.env oder im Code)
- [ ] Test-Run von data_fetcher gemacht
- [ ] JSON-Datei erfolgreich erstellt
- [ ] Dashboard gestartet
- [ ] Daten im Dashboard sichtbar
- [ ] Filter funktionieren
- [ ] Visualisierungen laden

Wenn alles ✅ ist - Glückwunsch! Du hast ein funktionierendes Calendly Dashboard! 🎉

---

**Viel Erfolg! Bei Fragen einfach melden.** 🚀
