# Docreate MVP

Produktionsnahes MVP mit Next.js (App Router), TypeScript, Tailwind, Prisma (SQLite), Handlebars und Puppeteer.

## Setup
- Node 18+
- Installieren:  (oder npm/yarn)
-  anlegen (siehe Beispiel unten) und Werte anpassen
- Prisma Migration + Seed: Prisma schema loaded from prisma/schema.prisma
- Starten: 

### .env.local Beispiel


## Routen/Seiten
- /login (E-Mail/Passwort, aus ENV)
- /dashboard (Links, Status)
- /clients (Liste, Suche, „Suche via Make“, Import)
- /clients/new (Client anlegen)
- /clients/[id] (Details, Vertrag generieren, Downloads)
- /templates (Templates aus DB)

## APIs
- POST /api/login, POST /api/logout, GET /api/health
- POST /api/clients; GET/PATCH/DELETE /api/clients/[id]
- POST /api/make/search (Webhook oder Mock)
- POST /api/contracts; GET /api/contracts/[id]/pdf

## Templates & PDF
- Templates: 
- Rendering: Handlebars -> HTML -> PDF (Puppeteer)

## Auth & Schutz
- Cookie  (httpOnly, SameSite=Lax, 7 Tage)
-  schützt alle Routen außer /login, /api/login, /api/logout, /api/health
