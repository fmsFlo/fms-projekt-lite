# 📅 Calendly Dashboard - Migriert

Dieses Calendly Dashboard wurde aus dem separaten Projekt migriert.

## 🚀 Schnellstart

### 1. Python Dependencies installieren

```bash
cd calendly-dashboard
pip install -r requirements.txt
```

### 2. API Token einrichten

Die Calendly Credentials sind in `backend/CALENDLY_CREDENTIALS_SAVED.txt` gespeichert.

### 3. Dashboard starten

```bash
streamlit run calendly_dashboard.py
```

## 📁 Dateien

- `calendly_data_fetcher.py` - Holt Daten von Calendly API
- `calendly_dashboard.py` - Basic Dashboard (Streamlit)
- `calendly_dashboard_pro.py` - PRO Dashboard mit Datenbank
- `calendly_db_integration.py` - Automatische Sync-Funktion

## 📖 Dokumentation

Siehe `README.md`, `QUICKSTART.md` und `PROJECT_OVERVIEW.md` für Details.

