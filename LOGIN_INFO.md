# Login Informationen

## Admin-Zugang

Das Admin-Passwort wurde erfolgreich gesetzt!

**Login-Credentials:**
- **Email:** admin@financemadesimple.de
- **Passwort:** Admin123!

## Wichtige Hinweise

1. **Authentifizierung:** Die Anwendung verwendet **NICHT** Supabase Authentication, sondern eine eigene User-Tabelle in der Datenbank

2. **User-Tabelle:** Der User ist in der Tabelle `User` in Supabase gespeichert
   - ID: usr_1a83973580288327
   - Rolle: admin
   - Status: aktiv

3. **Login-Prozess:**
   - Gehen Sie zur Login-Seite: http://localhost:3000/login
   - Geben Sie die oben genannten Credentials ein
   - Nach erfolgreichem Login werden Sie zum Dashboard weitergeleitet

## Bei Problemen

Falls das Login nicht funktioniert, prüfen Sie:

1. **Datenbank-Verbindung:**
   - Die DATABASE_URL in der `.env` Datei muss korrekt sein
   - Supabase muss erreichbar sein

2. **Logs prüfen:**
   - Schauen Sie in der Browser-Konsole nach Fehlern
   - Server-Logs zeigen detaillierte Auth-Informationen

3. **User-Status prüfen:**
   ```sql
   SELECT id, email, role, "isActive"
   FROM "User"
   WHERE email = 'admin@financemadesimple.de'
   ```

## Nächste Schritte

Nach dem Login können Sie:
- Dashboard aufrufen
- Neue Clients anlegen
- Leads verwalten
- Einstellungen anpassen
