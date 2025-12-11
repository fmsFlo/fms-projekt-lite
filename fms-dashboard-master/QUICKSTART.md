# ⚡ QUICK START - Calendly Dashboard

## In 5 Minuten zum Dashboard

### 1️⃣ Dependencies installieren (2 Min)

```bash
pip install -r requirements.txt
```

### 2️⃣ API Token holen (1 Min)

1. Gehe zu: https://calendly.com/integrations/api_webhooks
2. Klicke "Get a token"
3. Kopiere den Token

### 3️⃣ Token eintragen (30 Sek)

Öffne `calendly_data_fetcher.py` und setze in Zeile 201:

```python
API_TOKEN = "HIER_DEIN_TOKEN"
```

### 4️⃣ Daten holen (1 Min)

```bash
python calendly_data_fetcher.py
```

Erstellt `calendly_events.json` mit allen deinen Events!

### 5️⃣ Dashboard starten (30 Sek)

```bash
streamlit run calendly_dashboard.py
```

Dashboard öffnet automatisch im Browser!

Im Dashboard:
1. "JSON Datei laden" wählen
2. `calendly_events.json` hochladen
3. Fertig! 🎉

## Was du jetzt hast:

✅ Alle Events der letzten 3 Monate (anpassbar)
✅ Filter nach Datum, Status, Berater, Termintyp
✅ Visualisierungen & Statistiken
✅ Export als CSV
✅ Team-Performance-Analyse

## Nächste Schritte:

📖 Lies `README.md` für alle Features
🚀 Lies `CURSOR_SETUP.md` für Cursor-Integration
💾 Nutze `calendly_dashboard_pro.py` für Datenbank-Features

---

**Das war's! Bei Problemen → siehe CURSOR_SETUP.md** 🚀
