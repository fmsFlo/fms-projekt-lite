# Supabase Auth Migration - Setup Guide

Die Anwendung wurde erfolgreich auf Supabase Auth umgestellt!

## Was wurde geändert?

- Login/Logout verwendet jetzt Supabase Auth
- User-Management erfolgt über Supabase Auth Admin API
- Passwort-Reset kann später über Supabase Email-Config eingerichtet werden
- Alte bcrypt-Dependencies wurden entfernt
- Session-Management läuft über Supabase Auth Tokens

## Wichtige Schritte zur Fertigstellung

### 1. Supabase Service Role Key hinzufügen

Die `.env` Datei benötigt noch die `SUPABASE_SERVICE_ROLE_KEY`:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**So finden Sie den Key:**
1. Öffnen Sie das [Supabase Dashboard](https://supabase.com/dashboard)
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu: **Settings** → **API**
4. Kopieren Sie den **service_role** Key (nicht den anon key!)
5. Fügen Sie ihn in die `.env` Datei ein

⚠️ **Wichtig:** Der Service Role Key ist sehr mächtig und sollte NIEMALS im Frontend verwendet oder committed werden!

### 2. Admin-User erstellen

Führen Sie das folgende Script aus, um Ihren ersten Admin-User zu erstellen:

```bash
npx tsx scripts/create-admin-supabase-auth.ts admin@financemadesimple.de IhrPasswort123
```

Dies erstellt:
- Einen Supabase Auth User mit der angegebenen Email/Passwort
- Verknüpft ihn mit dem bestehenden User-Record in der Datenbank

### 3. Login testen

1. Starten Sie die Anwendung: `npm run dev`
2. Öffnen Sie: http://localhost:3000/login
3. Loggen Sie sich mit den erstellten Credentials ein

## User-Management

### Neue User erstellen

Als Admin können Sie neue User über das Settings-Panel erstellen:

1. Login als Admin
2. Gehe zu **Settings** → **Benutzerverwaltung**
3. Klicken Sie auf **Neuer Benutzer**
4. Email, Passwort, Rolle eingeben
5. User wird automatisch in Supabase Auth erstellt

### User-Passwort ändern

Admins können User-Passwörter im Settings-Panel ändern.

## Email-Setup für Password Reset (Optional)

Später können Sie Email-Benachrichtigungen in Supabase einrichten:

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. SMTP-Server konfigurieren unter **Settings** → **Auth** → **SMTP Settings**
3. Email-Templates anpassen (Reset Password, Confirm Email, etc.)

**Hinweis:** Solange kein SMTP konfiguriert ist, können User Passwörter nur über Admin-Panel zurückgesetzt werden.

## Technische Details

### Auth Flow

1. **Login:** User gibt Email/Passwort ein → Supabase Auth prüft → Access/Refresh Tokens werden als httpOnly Cookies gesetzt
2. **Session:** Middleware prüft `sb-access-token` Cookie → API Routes validieren Token mit Supabase
3. **Logout:** Cookies werden gelöscht, Supabase Session beendet

### Datenbank-Schema

Die `User` Tabelle hat jetzt:
- `auth_user_id` (UUID, nullable) - Foreign Key zu `auth.users`
- `email`, `role`, `name`, `isActive` - App-spezifische Daten
- ❌ Entfernt: `passwordHash`, `resetToken`, `resetTokenExpires`

### API-Änderungen

- `/api/login` - Verwendet `supabase.auth.signInWithPassword()`
- `/api/logout` - Verwendet `supabase.auth.signOut()`
- `/api/users` - Erstellt User über `supabase.auth.admin.createUser()`
- `/api/reset-password` - Verwendet `supabase.auth.admin.updateUserById()`

## Troubleshooting

### "Invalid credentials" beim Login

- Stellen Sie sicher, dass der User in Supabase Auth existiert
- Prüfen Sie, ob `auth_user_id` in der `User` Tabelle gesetzt ist
- Logs checken: Server-Terminal zeigt detaillierte Fehler

### "SUPABASE_SERVICE_ROLE_KEY nicht konfiguriert"

- Fügen Sie den Key in die `.env` Datei ein (siehe Schritt 1)
- Starten Sie den Dev-Server neu

### User kann nicht erstellt werden

- Prüfen Sie die Supabase Auth Logs im Dashboard
- Email-Adresse muss gültig sein
- Passwort muss mindestens 6 Zeichen haben

## Migration bestehender User

Falls Sie bereits User in der Datenbank haben (ohne `auth_user_id`):

```bash
# Für jeden existierenden User
npx tsx scripts/create-admin-supabase-auth.ts user@example.com NeuesPasswort123
```

Dies verknüpft den bestehenden User-Record mit einem neuen Supabase Auth User.

## Vorteile von Supabase Auth

✅ **Password Reset** - Später einfach per Email konfigurierbar
✅ **Security** - Professionelles Password Hashing und Session Management
✅ **Skalierbarkeit** - Keine eigenen Auth-Tables nötig
✅ **Features** - OAuth-Provider (Google, GitHub, etc.) später hinzufügbar
✅ **MFA** - Multi-Faktor-Authentifizierung möglich
