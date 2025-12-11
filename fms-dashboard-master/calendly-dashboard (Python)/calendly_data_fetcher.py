"""
Calendly Data Fetcher für Finance Made Simple
Holt alle Events der gesamten Organisation mit allen relevanten Details
"""

import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json

class CalendlyFetcher:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://api.calendly.com"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        self.organization_uri = None
        
    def get_current_user(self) -> Dict:
        """Holt Info über den aktuellen User"""
        response = requests.get(
            f"{self.base_url}/users/me",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()["resource"]
    
    def get_organization_uri(self) -> str:
        """Holt die Organization URI"""
        if self.organization_uri:
            return self.organization_uri
            
        user = self.get_current_user()
        self.organization_uri = user["current_organization"]
        return self.organization_uri
    
    def get_organization_members(self) -> List[Dict]:
        """Holt alle Mitglieder der Organisation"""
        org_uri = self.get_organization_uri()
        members = []
        url = f"{self.base_url}/organization_memberships"
        params = {
            "organization": org_uri,
            "count": 100
        }
        
        while url:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            members.extend(data["collection"])
            
            # Pagination
            url = data["pagination"].get("next_page")
            params = None  # Nach der ersten Page sind params im next_page URL
            
        return members
    
    def get_user_uri_from_member(self, member: Dict) -> str:
        """Extrahiert User URI aus Membership"""
        return member["user"]["uri"]
    
    def get_scheduled_events(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_uri: Optional[str] = None
    ) -> List[Dict]:
        """
        Holt alle scheduled events für einen User oder die ganze Org
        
        Args:
            start_date: Startdatum (default: 12 Monate zurück)
            end_date: Enddatum (default: heute)
            user_uri: Spezifischer User (optional)
        """
        if not start_date:
            start_date = datetime.now() - timedelta(days=365)
        if not end_date:
            end_date = datetime.now()
            
        events = []
        url = f"{self.base_url}/scheduled_events"
        
        params = {
            "organization": self.get_organization_uri(),
            "min_start_time": start_date.isoformat() + "Z",
            "max_start_time": end_date.isoformat() + "Z",
            "count": 100,
            "status": "active"  # active und canceled
        }
        
        if user_uri:
            params["user"] = user_uri
        
        while url:
            print(f"Fetching events from: {url[:50]}...")
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            events.extend(data["collection"])
            print(f"  → {len(data['collection'])} events gefunden")
            
            # Pagination
            url = data["pagination"].get("next_page")
            params = None
            
        return events
    
    def get_event_invitees(self, event_uri: str) -> List[Dict]:
        """Holt alle Invitees für ein Event"""
        invitees = []
        url = f"{self.base_url}/scheduled_events/{event_uri.split('/')[-1]}/invitees"
        params = {"count": 100}
        
        while url:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            invitees.extend(data["collection"])
            
            url = data["pagination"].get("next_page")
            params = None
            
        return invitees
    
    def get_all_events_with_details(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        """
        Holt alle Events der gesamten Org mit allen Details
        """
        print("=" * 60)
        print("CALENDLY DATA FETCH GESTARTET")
        print("=" * 60)
        
        # 1. Hole alle Org Members
        print("\n1. Hole Organisation Members...")
        members = self.get_organization_members()
        print(f"   ✓ {len(members)} Members gefunden")
        
        # 2. Hole Events pro User
        print("\n2. Hole Events für alle User...")
        all_events = []
        
        for idx, member in enumerate(members, 1):
            user_uri = self.get_user_uri_from_member(member)
            user_name = member["user"]["name"]
            user_email = member["user"]["email"]
            
            print(f"\n   [{idx}/{len(members)}] User: {user_name} ({user_email})")
            
            try:
                events = self.get_scheduled_events(
                    start_date=start_date,
                    end_date=end_date,
                    user_uri=user_uri
                )
                
                # Füge User-Info zu jedem Event hinzu
                for event in events:
                    event["host_name"] = user_name
                    event["host_email"] = user_email
                    
                all_events.extend(events)
                print(f"      → {len(events)} Events für {user_name}")
                
            except Exception as e:
                print(f"      ✗ Fehler bei {user_name}: {str(e)}")
                continue
        
        print(f"\n   ✓ GESAMT: {len(all_events)} Events gefunden")
        
        # 3. Hole Invitees für alle Events
        print("\n3. Hole Invitees für alle Events...")
        for idx, event in enumerate(all_events, 1):
            if idx % 10 == 0:
                print(f"   Progress: {idx}/{len(all_events)} Events...")
            
            try:
                invitees = self.get_event_invitees(event["uri"])
                event["invitees"] = invitees
            except Exception as e:
                print(f"   ✗ Fehler bei Event {event['uri']}: {str(e)}")
                event["invitees"] = []
        
        print(f"   ✓ Invitees für alle Events geladen")
        
        print("\n" + "=" * 60)
        print("FETCH ABGESCHLOSSEN!")
        print("=" * 60)
        
        return all_events
    
    def save_to_json(self, data: List[Dict], filename: str = "calendly_data.json"):
        """Speichert Daten als JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Daten gespeichert in: {filename}")


def main():
    """Hauptfunktion zum Testen"""
    
    # HIER DEINEN API TOKEN EINTRAGEN
    API_TOKEN = "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzY0Mzk5NjM4LCJqdGkiOiJkY2QxMDgzNS1kOWQxLTQzMGUtODU1My1lMGM4ZDQ4MDk1ZTIiLCJ1c2VyX3V1aWQiOiI1N2NmMTc4Mi0xZTQxLTQ4YWEtYmJiMC04ZTUwZTlmN2NiNjEifQ.CldZ0poEHI5Uypd5F5Fdr3N8RLqWSk0pcFLtYUXuP9o-K6bGZ6zRp1XNBuuvNpzvwD-jWf8D24XPj_Llde5V5g"
    
    if API_TOKEN == "DEIN_CALENDLY_API_TOKEN_HIER":
        print("❌ FEHLER: Bitte trage deinen Calendly API Token ein!")
        print("   → Zeile 201 in dieser Datei")
        return
    
    # Fetcher initialisieren
    fetcher = CalendlyFetcher(API_TOKEN)
    
    # Zeitraum definieren (z.B. letzte 3 Monate)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)
    
    print(f"\nZeitraum: {start_date.date()} bis {end_date.date()}")
    
    # Daten holen
    try:
        events = fetcher.get_all_events_with_details(
            start_date=start_date,
            end_date=end_date
        )
        
        # Speichern
        fetcher.save_to_json(events, "calendly_events.json")
        
        # Statistik
        print(f"\n📊 STATISTIK:")
        print(f"   Gesamt Events: {len(events)}")
        print(f"   Active Events: {len([e for e in events if e['status'] == 'active'])}")
        print(f"   Canceled Events: {len([e for e in events if e['status'] == 'canceled'])}")
        
    except Exception as e:
        print(f"\n❌ FEHLER: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
