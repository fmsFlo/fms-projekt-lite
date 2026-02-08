# FMS Projekt - Lite Version für Bolt.new

Eine vereinfachte Version des Financial Management Systems mit Performance-Optimierungen.

## 🚀 Quick Start mit Bolt.new

1. Kopiere diesen GitHub-Link in Bolt.new
2. Die wichtigsten Features sind bereits optimiert

## ✅ Enthaltene Optimierungen

- **React Performance**: Reduzierte Re-Renders
- **API Caching**: Templates und PDFs mit Cache
- **Datenbank Indizes**: Performance-Queries optimiert
- **Login System**: Admin-Zugang mit bcrypt

## 🔐 Admin Login

- **Email**: `admin@finance-made-simple.de`
- **Passwort**: `admin123`

## 📁 Struktur

```
/app
  /api - API Routes mit Caching
  /dashboard - Haupt-Dashboard
/lib
  /auth.ts - Login-System
  /prisma.ts - Datenbank-Verbindung
/prisma
  schema.prisma - Datenbank-Schema
```

## 🌐 Deployment

- Lokal: `npm run dev`
- Production: `npm run build && npm start`

## 📊 Performance

- React Re-Renders reduziert
- API Responses gecached
- Datenbank Indizes aktiviert
