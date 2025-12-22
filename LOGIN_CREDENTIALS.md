# 🔐 Login-Daten für die Online-Version

## Standard Admin-Zugangsdaten

**Email:** `admin@finance-made-simple.de`  
**Password:** `admin123`

## Wo findest du die Login-Daten?

### 1. In der Datenbank (Neon)

Die Login-Daten sind in der `User` Tabelle gespeichert. Du kannst sie prüfen mit:

```sql
SELECT email, role, "isActive" FROM "User" WHERE role = 'admin';
```

### 2. In den Scripts

Die Standard-Credentials sind in folgenden Scripts definiert:
- `scripts/create-admin-simple.ts`
- `scripts/create-admin.ts`

Standard-Werte:
- Email: `admin@finance-made-simple.de`
- Password: `admin123`

### 3. Passwort zurücksetzen

Falls du das Passwort ändern möchtest:

```bash
npx ts-node scripts/reset-user-password.ts admin@finance-made-simple.de neues-passwort
```

**WICHTIG:** Verwende die Online-DATABASE_URL:
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/reset-user-password.ts admin@finance-made-simple.de neues-passwort
```

### 4. Neuen Admin-User erstellen

Falls der User nicht existiert:

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_6IgG8NzFOwvV@ep-misty-snow-agjbdzvp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx ts-node scripts/create-admin-simple.ts
```

## Login-URL

**Online-Version:**  
https://your-site.netlify.app/login

**Lokal:**  
http://localhost:3000/login

## Troubleshooting

### "Ungültige Zugangsdaten"
1. Prüfe ob der User in der Datenbank existiert
2. Prüfe ob `isActive = true` ist
3. Prüfe Netlify Logs für Details

### "User nicht gefunden"
- User existiert nicht in der Online-Datenbank
- Erstelle User neu (siehe oben)

### Passwort vergessen
- Verwende das Reset-Script (siehe oben)
- Oder erstelle einen neuen Admin-User

