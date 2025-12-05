"""
Calendly Database Integration
Speichert Events automatisch in SQLite (später PostgreSQL)
"""

import sqlite3
from datetime import datetime
from typing import List, Dict
import json
from calendly_data_fetcher import CalendlyFetcher


class CalendlyDatabase:
    def __init__(self, db_path: str = "calendly.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Erstellt die Datenbank-Struktur"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Events Tabelle
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                event_uri TEXT PRIMARY KEY,
                event_name TEXT,
                status TEXT,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                duration_minutes INTEGER,
                host_name TEXT,
                host_email TEXT,
                location_type TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                raw_data TEXT
            )
        """)
        
        # Invitees Tabelle
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS invitees (
                invitee_uri TEXT PRIMARY KEY,
                event_uri TEXT,
                name TEXT,
                email TEXT,
                status TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (event_uri) REFERENCES events(event_uri)
            )
        """)
        
        # Sync Log Tabelle
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_date TIMESTAMP,
                events_fetched INTEGER,
                events_new INTEGER,
                events_updated INTEGER,
                success BOOLEAN,
                error_message TEXT
            )
        """)
        
        conn.commit()
        conn.close()
        print("✓ Datenbank initialisiert")
    
    def save_event(self, event: Dict):
        """Speichert oder updated ein einzelnes Event"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Event Daten vorbereiten
        start_time = datetime.fromisoformat(event['start_time'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(event['end_time'].replace('Z', '+00:00'))
        duration = (end_time - start_time).total_seconds() / 60
        
        # Event speichern (UPSERT)
        cursor.execute("""
            INSERT OR REPLACE INTO events (
                event_uri, event_name, status, start_time, end_time,
                duration_minutes, host_name, host_email, location_type,
                created_at, updated_at, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event['uri'],
            event['name'],
            event['status'],
            start_time,
            end_time,
            duration,
            event.get('host_name', 'Unknown'),
            event.get('host_email', 'Unknown'),
            event.get('location', {}).get('type', 'Unknown'),
            datetime.fromisoformat(event['created_at'].replace('Z', '+00:00')),
            datetime.fromisoformat(event['updated_at'].replace('Z', '+00:00')),
            json.dumps(event)
        ))
        
        # Invitees speichern
        for invitee in event.get('invitees', []):
            cursor.execute("""
                INSERT OR REPLACE INTO invitees (
                    invitee_uri, event_uri, name, email, status,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                invitee['uri'],
                event['uri'],
                invitee.get('name', 'Unknown'),
                invitee.get('email', 'Unknown'),
                invitee.get('status', 'unknown'),
                datetime.fromisoformat(invitee['created_at'].replace('Z', '+00:00')),
                datetime.fromisoformat(invitee['updated_at'].replace('Z', '+00:00'))
            ))
        
        conn.commit()
        conn.close()
    
    def save_events_batch(self, events: List[Dict]) -> tuple:
        """Speichert mehrere Events auf einmal"""
        new_count = 0
        updated_count = 0
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for event in events:
            # Prüfe ob Event existiert
            cursor.execute(
                "SELECT updated_at FROM events WHERE event_uri = ?",
                (event['uri'],)
            )
            existing = cursor.fetchone()
            
            if existing:
                # Prüfe ob Update nötig ist
                event_updated = datetime.fromisoformat(event['updated_at'].replace('Z', '+00:00'))
                db_updated = datetime.fromisoformat(existing[0]) if existing[0] else None
                
                if db_updated is None or event_updated > db_updated:
                    self.save_event(event)
                    updated_count += 1
            else:
                self.save_event(event)
                new_count += 1
        
        conn.close()
        return new_count, updated_count
    
    def log_sync(self, total_fetched: int, new: int, updated: int, 
                 success: bool = True, error: str = None):
        """Loggt einen Sync-Vorgang"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO sync_log (
                sync_date, events_fetched, events_new, 
                events_updated, success, error_message
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            datetime.now(),
            total_fetched,
            new,
            updated,
            success,
            error
        ))
        
        conn.commit()
        conn.close()
    
    def get_events(self, start_date: datetime = None, end_date: datetime = None,
                   status: str = None, host_email: str = None) -> List[Dict]:
        """Holt Events aus der DB mit Filtern"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM events WHERE 1=1"
        params = []
        
        if start_date:
            query += " AND start_time >= ?"
            params.append(start_date)
        
        if end_date:
            query += " AND start_time <= ?"
            params.append(end_date)
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if host_email:
            query += " AND host_email = ?"
            params.append(host_email)
        
        query += " ORDER BY start_time DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        events = []
        for row in rows:
            event = dict(row)
            # Lade Invitees
            cursor.execute(
                "SELECT * FROM invitees WHERE event_uri = ?",
                (event['event_uri'],)
            )
            invitees = [dict(inv) for inv in cursor.fetchall()]
            event['invitees'] = invitees
            events.append(event)
        
        conn.close()
        return events
    
    def get_stats(self) -> Dict:
        """Gibt Statistiken über die DB zurück"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        stats = {}
        
        # Gesamt Events
        cursor.execute("SELECT COUNT(*) FROM events")
        stats['total_events'] = cursor.fetchone()[0]
        
        # Active Events
        cursor.execute("SELECT COUNT(*) FROM events WHERE status = 'active'")
        stats['active_events'] = cursor.fetchone()[0]
        
        # Canceled Events
        cursor.execute("SELECT COUNT(*) FROM events WHERE status = 'canceled'")
        stats['canceled_events'] = cursor.fetchone()[0]
        
        # Letzte Sync
        cursor.execute("""
            SELECT sync_date, events_fetched, events_new, events_updated 
            FROM sync_log 
            ORDER BY sync_date DESC 
            LIMIT 1
        """)
        last_sync = cursor.fetchone()
        if last_sync:
            stats['last_sync'] = {
                'date': last_sync[0],
                'fetched': last_sync[1],
                'new': last_sync[2],
                'updated': last_sync[3]
            }
        
        conn.close()
        return stats


def sync_calendly_to_db(api_token: str, days_back: int = 30):
    """
    Hauptfunktion zum Synchronisieren von Calendly Events in die DB
    Kann als Cron-Job täglich laufen
    """
    print("=" * 60)
    print("CALENDLY → DATABASE SYNC GESTARTET")
    print("=" * 60)
    
    try:
        # Fetcher initialisieren
        fetcher = CalendlyFetcher(api_token)
        db = CalendlyDatabase()
        
        # Zeitraum
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        print(f"\nZeitraum: {start_date.date()} bis {end_date.date()}")
        
        # Events von Calendly holen
        print("\n1. Hole Events von Calendly API...")
        events = fetcher.get_all_events_with_details(start_date, end_date)
        print(f"   ✓ {len(events)} Events von API geholt")
        
        # In DB speichern
        print("\n2. Speichere in Datenbank...")
        new_count, updated_count = db.save_events_batch(events)
        print(f"   ✓ {new_count} neue Events")
        print(f"   ✓ {updated_count} Events aktualisiert")
        
        # Log speichern
        db.log_sync(len(events), new_count, updated_count)
        
        # Stats anzeigen
        print("\n3. Datenbank-Status:")
        stats = db.get_stats()
        print(f"   Gesamt Events in DB: {stats['total_events']}")
        print(f"   Active: {stats['active_events']}")
        print(f"   Canceled: {stats['canceled_events']}")
        
        print("\n" + "=" * 60)
        print("SYNC ERFOLGREICH ABGESCHLOSSEN!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ FEHLER: {str(e)}")
        
        # Fehler loggen
        try:
            db = CalendlyDatabase()
            db.log_sync(0, 0, 0, success=False, error=str(e))
        except:
            pass
        
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import os
    from datetime import timedelta
    
    # Token aus Umgebungsvariable oder direkt eingeben
    API_TOKEN = os.getenv("CALENDLY_API_TOKEN", "DEIN_TOKEN_HIER")
    
    if API_TOKEN == "DEIN_TOKEN_HIER":
        print("❌ FEHLER: Bitte setze CALENDLY_API_TOKEN als Umgebungsvariable")
        print("   oder trage den Token direkt in Zeile 294 ein")
    else:
        # Sync für letzte 30 Tage
        success = sync_calendly_to_db(API_TOKEN, days_back=30)
        
        if success:
            # Zeige einige Beispiel-Daten
            db = CalendlyDatabase()
            recent_events = db.get_events()[:5]
            
            print("\n📋 Letzte 5 Events in DB:")
            for event in recent_events:
                print(f"   • {event['start_time']}: {event['event_name']} - {event['status']}")
