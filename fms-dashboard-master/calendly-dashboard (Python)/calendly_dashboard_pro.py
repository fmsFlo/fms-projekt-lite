"""
Calendly Dashboard PRO - mit Datenbank-Support
Für Finance Made Simple
"""

import streamlit as st
import pandas as pd
import json
from datetime import datetime, timedelta
import plotly.express as px
import plotly.graph_objects as go
from calendly_data_fetcher import CalendlyFetcher
from calendly_db_integration import CalendlyDatabase
import os

# Page Config
st.set_page_config(
    page_title="FMS Calendly Dashboard PRO",
    page_icon="📅",
    layout="wide"
)

# Custom CSS
st.markdown("""
    <style>
    .main {
        padding: 0rem 1rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 20px;
        border-radius: 10px;
        margin: 10px 0;
    }
    .stAlert {
        margin-top: 1rem;
    }
    </style>
""", unsafe_allow_html=True)


@st.cache_data(ttl=3600)
def load_data_from_api(api_token, start_date, end_date):
    """Lädt Daten direkt von Calendly API"""
    fetcher = CalendlyFetcher(api_token)
    events = fetcher.get_all_events_with_details(start_date, end_date)
    return events


@st.cache_data
def load_data_from_file(filepath):
    """Lädt Daten aus JSON Datei"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_data_from_database(start_date=None, end_date=None, status=None, host_email=None):
    """Lädt Daten aus SQLite Datenbank"""
    db = CalendlyDatabase()
    events = db.get_events(start_date, end_date, status, host_email)
    
    # Konvertiere DB-Format zu API-Format für Kompatibilität
    for event in events:
        if 'raw_data' in event and event['raw_data']:
            raw = json.loads(event['raw_data'])
            event.update(raw)
    
    return events


def process_events_to_dataframe(events):
    """Konvertiert Events zu DataFrame"""
    processed = []
    
    for event in events:
        # Basis Event Info
        if isinstance(event.get('start_time'), str):
            start_time = datetime.fromisoformat(event['start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(event['end_time'].replace('Z', '+00:00'))
        else:
            # Bereits als datetime (aus DB)
            start_time = event['start_time']
            end_time = event['end_time']
        
        event_data = {
            'event_uri': event.get('event_uri') or event.get('uri'),
            'event_name': event['name'] if 'name' in event else event.get('event_name'),
            'status': event['status'],
            'start_time': start_time,
            'end_time': end_time,
            'host_name': event.get('host_name', 'Unknown'),
            'host_email': event.get('host_email', 'Unknown'),
            'location_type': event.get('location_type', 'Unknown'),
        }
        
        # Invitees Info
        invitees = event.get('invitees', [])
        if invitees:
            invitee_names = [inv.get('name', 'Unknown') for inv in invitees]
            invitee_emails = [inv.get('email', 'Unknown') for inv in invitees]
            event_data['invitee_names'] = ', '.join(invitee_names)
            event_data['invitee_emails'] = ', '.join(invitee_emails)
            event_data['num_invitees'] = len(invitees)
            event_data['invitee_status'] = invitees[0].get('status', 'unknown') if invitees else 'unknown'
        else:
            event_data['invitee_names'] = 'Keine'
            event_data['invitee_emails'] = 'Keine'
            event_data['num_invitees'] = 0
            event_data['invitee_status'] = 'unknown'
        
        processed.append(event_data)
    
    df = pd.DataFrame(processed)
    
    # Datum Spalten
    if not df.empty:
        df['date'] = pd.to_datetime(df['start_time']).dt.date
        df['time'] = pd.to_datetime(df['start_time']).dt.time
        df['weekday'] = pd.to_datetime(df['start_time']).dt.day_name()
        df['month'] = pd.to_datetime(df['start_time']).dt.strftime('%Y-%m')
        df['duration_minutes'] = (pd.to_datetime(df['end_time']) - pd.to_datetime(df['start_time'])).dt.total_seconds() / 60
        df['hour'] = pd.to_datetime(df['start_time']).dt.hour
    
    return df


def main():
    st.title("📅 Calendly Dashboard PRO - Finance Made Simple")
    st.caption("Version 2.0 mit Datenbank-Integration")
    
    # Sidebar für Settings
    with st.sidebar:
        st.header("⚙️ Einstellungen")
        
        data_source = st.radio(
            "Datenquelle",
            ["📁 JSON Datei", "🔴 Live API", "💾 Datenbank"]
        )
        
        # === JSON FILE ===
        if data_source == "📁 JSON Datei":
            uploaded_file = st.file_uploader("JSON Datei hochladen", type=['json'])
            if uploaded_file:
                events = json.load(uploaded_file)
                st.session_state['events'] = events
                st.session_state['data_loaded'] = True
                st.success(f"✓ {len(events)} Events geladen!")
        
        # === LIVE API ===
        elif data_source == "🔴 Live API":
            api_token = st.text_input("Calendly API Token", type="password")
            
            months_back = st.selectbox("Monate zurück", [1, 3, 6, 9, 12], index=2)
            
            if st.button("🔄 Daten laden", type="primary"):
                if not api_token:
                    st.error("Bitte API Token eingeben!")
                else:
                    with st.spinner("Lade Daten von Calendly..."):
                        end_date = datetime.now()
                        start_date = end_date - timedelta(days=months_back * 30)
                        
                        try:
                            events = load_data_from_api(api_token, start_date, end_date)
                            st.session_state['events'] = events
                            st.session_state['data_loaded'] = True
                            st.success(f"✓ {len(events)} Events geladen!")
                            
                            # Option: In DB speichern
                            if st.checkbox("In Datenbank speichern?"):
                                from calendly_db_integration import CalendlyDatabase
                                db = CalendlyDatabase()
                                new, updated = db.save_events_batch(events)
                                st.info(f"💾 {new} neu, {updated} aktualisiert")
                        except Exception as e:
                            st.error(f"Fehler: {str(e)}")
        
        # === DATABASE ===
        else:
            st.info("📊 Lädt Daten aus lokaler Datenbank")
            
            # DB Stats
            if os.path.exists("calendly.db"):
                db = CalendlyDatabase()
                stats = db.get_stats()
                
                st.metric("📊 Events in DB", stats['total_events'])
                
                if stats.get('last_sync'):
                    last_sync = stats['last_sync']
                    st.caption(f"Letzter Sync: {last_sync['date']}")
                
                # Auto-Load
                if st.button("🔄 Aus DB laden"):
                    with st.spinner("Lade aus Datenbank..."):
                        events = load_data_from_database()
                        st.session_state['events'] = events
                        st.session_state['data_loaded'] = True
                        st.success(f"✓ {len(events)} Events aus DB")
                
                st.divider()
                
                # Sync-Button
                st.subheader("🔄 Daten synchronisieren")
                api_token = st.text_input("API Token für Sync", type="password", key="sync_token")
                days_back = st.number_input("Tage zurück", min_value=1, max_value=365, value=30)
                
                if st.button("Jetzt synchronisieren"):
                    if not api_token:
                        st.error("API Token benötigt!")
                    else:
                        with st.spinner("Synchronisiere..."):
                            from calendly_db_integration import sync_calendly_to_db
                            success = sync_calendly_to_db(api_token, days_back)
                            if success:
                                st.success("✓ Sync erfolgreich!")
                                st.rerun()
                            else:
                                st.error("Sync fehlgeschlagen")
            else:
                st.warning("⚠️ Datenbank noch nicht vorhanden")
                st.info("Führe einmal `python calendly_db_integration.py` aus")
        
        st.divider()
        
        # Schnellstatistiken in Sidebar
        if st.session_state.get('data_loaded'):
            events = st.session_state['events']
            st.metric("📊 Gesamt Events", len(events))
            active = len([e for e in events if e['status'] == 'active'])
            canceled = len([e for e in events if e['status'] == 'canceled'])
            st.metric("✅ Aktiv", active)
            st.metric("❌ Canceled", canceled)
            
            if canceled > 0:
                cancel_rate = (canceled / len(events)) * 100
                st.metric("🎯 Cancel-Rate", f"{cancel_rate:.1f}%")
    
    # Main Content
    if not st.session_state.get('data_loaded'):
        st.info("👈 Bitte wähle links eine Datenquelle und lade die Daten")
        
        # Beispiel zeigen
        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown("### 📅 Terminübersicht")
            st.write("• Alle Events filtern")
            st.write("• Nach Datum sortieren")
            st.write("• Status tracking")
        with col2:
            st.markdown("### 👥 Team-Analyse")
            st.write("• Events pro Berater")
            st.write("• Termintypen")
            st.write("• Auslastung & Performance")
        with col3:
            st.markdown("### 📊 Statistiken")
            st.write("• Zeitverlauf-Analysen")
            st.write("• Conversion-Raten")
            st.write("• Peak-Zeiten")
        
        st.markdown("---")
        
        # Quick Start Guide
        with st.expander("🚀 Quick Start Guide"):
            st.markdown("""
            **Option 1: JSON Upload (Einfach)**
            1. Lade Daten mit `python calendly_data_fetcher.py`
            2. Upload `calendly_events.json` hier
            
            **Option 2: Live API (Flexibel)**
            1. Hole deinen API Token von calendly.com
            2. Wähle "Live API" und gib Token ein
            3. Zeitraum wählen und laden
            
            **Option 3: Datenbank (Automatisch)**
            1. Einmalig: `python calendly_db_integration.py`
            2. Automatische Syncs via Cron-Job
            3. Dashboard lädt immer aktuelle Daten
            """)
        
        return
    
    # Daten verarbeiten
    events = st.session_state['events']
    df = process_events_to_dataframe(events)
    
    if df.empty:
        st.warning("Keine Events im gewählten Zeitraum gefunden")
        return
    
    # Filter Section
    st.header("🔍 Filter")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        date_range = st.date_input(
            "Zeitraum",
            value=(df['date'].min(), df['date'].max()),
            min_value=df['date'].min(),
            max_value=df['date'].max()
        )
    
    with col2:
        status_filter = st.multiselect(
            "Status",
            options=df['status'].unique().tolist(),
            default=df['status'].unique().tolist()
        )
    
    with col3:
        host_filter = st.multiselect(
            "Gastgeber",
            options=sorted(df['host_name'].unique().tolist()),
            default=df['host_name'].unique().tolist()
        )
    
    with col4:
        event_type_filter = st.multiselect(
            "Termintyp",
            options=sorted(df['event_name'].unique().tolist()),
            default=df['event_name'].unique().tolist()
        )
    
    # Filter anwenden
    mask = (
        (df['date'] >= date_range[0]) &
        (df['date'] <= date_range[1]) &
        (df['status'].isin(status_filter)) &
        (df['host_name'].isin(host_filter)) &
        (df['event_name'].isin(event_type_filter))
    )
    filtered_df = df[mask]
    
    if filtered_df.empty:
        st.warning("Keine Events mit den gewählten Filtern gefunden")
        return
    
    # KPIs
    st.header("📊 Key Metrics")
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric("Gesamt Termine", len(filtered_df))
    
    with col2:
        active_count = len(filtered_df[filtered_df['status'] == 'active'])
        st.metric("Aktive", active_count)
    
    with col3:
        canceled_count = len(filtered_df[filtered_df['status'] == 'canceled'])
        cancel_rate = (canceled_count / len(filtered_df) * 100) if len(filtered_df) > 0 else 0
        st.metric("Canceled", canceled_count, f"{cancel_rate:.1f}%")
    
    with col4:
        unique_clients = filtered_df['invitee_emails'].nunique()
        st.metric("Einzigartige Kunden", unique_clients)
    
    with col5:
        avg_duration = filtered_df['duration_minutes'].mean()
        st.metric("Ø Dauer (Min)", f"{avg_duration:.0f}")
    
    # Visualisierungen
    st.header("📈 Analysen")
    
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📅 Zeitverlauf", 
        "👥 Team", 
        "🎯 Termintypen", 
        "⏰ Peak-Zeiten",
        "📋 Detailliste"
    ])
    
    with tab1:
        col1, col2 = st.columns(2)
        
        with col1:
            # Events über Zeit
            events_by_date = filtered_df.groupby('date').size().reset_index(name='count')
            fig = px.line(
                events_by_date, 
                x='date', 
                y='count',
                title='Termine pro Tag',
                labels={'date': 'Datum', 'count': 'Anzahl Termine'}
            )
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Status Verteilung über Zeit
            status_by_date = filtered_df.groupby(['date', 'status']).size().reset_index(name='count')
            fig = px.area(
                status_by_date,
                x='date',
                y='count',
                color='status',
                title='Status-Verteilung über Zeit',
                labels={'date': 'Datum', 'count': 'Anzahl', 'status': 'Status'}
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Wochentag-Analyse
        weekday_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        weekday_counts = filtered_df['weekday'].value_counts().reindex(weekday_order).fillna(0)
        
        fig = px.bar(
            x=['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
            y=weekday_counts.values,
            title='Termine pro Wochentag',
            labels={'x': 'Wochentag', 'y': 'Anzahl Termine'}
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with tab2:
        col1, col2 = st.columns(2)
        
        with col1:
            # Events pro Host
            host_counts = filtered_df['host_name'].value_counts()
            fig = px.bar(
                x=host_counts.values,
                y=host_counts.index,
                orientation='h',
                title='Termine pro Berater',
                labels={'x': 'Anzahl Termine', 'y': 'Berater'}
            )
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Cancel Rate pro Host
            host_stats = filtered_df.groupby('host_name').agg({
                'status': lambda x: (x == 'canceled').sum() / len(x) * 100
            }).reset_index()
            host_stats.columns = ['host_name', 'cancel_rate']
            
            fig = px.bar(
                host_stats,
                x='host_name',
                y='cancel_rate',
                title='Absage-Rate pro Berater (%)',
                labels={'host_name': 'Berater', 'cancel_rate': 'Absage-Rate (%)'},
                color='cancel_rate',
                color_continuous_scale='RdYlGn_r'
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Team Performance Tabelle
        st.subheader("Team Performance Detail")
        team_performance = filtered_df.groupby('host_name').agg({
            'event_uri': 'count',
            'status': lambda x: f"{(x == 'canceled').sum()} ({(x == 'canceled').sum() / len(x) * 100:.1f}%)",
            'duration_minutes': 'mean',
            'invitee_emails': 'nunique'
        }).reset_index()
        team_performance.columns = ['Berater', 'Gesamt Termine', 'Absagen (Rate)', 'Ø Dauer', 'Unique Kunden']
        team_performance['Ø Dauer'] = team_performance['Ø Dauer'].round(0).astype(int)
        
        st.dataframe(team_performance, use_container_width=True, hide_index=True)
    
    with tab3:
        col1, col2 = st.columns(2)
        
        with col1:
            # Termintypen
            event_type_counts = filtered_df['event_name'].value_counts()
            fig = px.pie(
                values=event_type_counts.values,
                names=event_type_counts.index,
                title='Verteilung Termintypen'
            )
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Termintypen nach Status
            type_status = filtered_df.groupby(['event_name', 'status']).size().reset_index(name='count')
            fig = px.bar(
                type_status,
                x='event_name',
                y='count',
                color='status',
                title='Termintypen nach Status',
                labels={'event_name': 'Termintyp', 'count': 'Anzahl', 'status': 'Status'}
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Conversion-Tabelle pro Termintyp
        st.subheader("Conversion pro Termintyp")
        type_conversion = filtered_df.groupby('event_name').agg({
            'event_uri': 'count',
            'status': lambda x: (x == 'active').sum(),
        }).reset_index()
        type_conversion.columns = ['Termintyp', 'Gesamt', 'Durchgeführt']
        type_conversion['Conversion %'] = (type_conversion['Durchgeführt'] / type_conversion['Gesamt'] * 100).round(1)
        
        st.dataframe(type_conversion, use_container_width=True, hide_index=True)
    
    with tab4:
        st.subheader("⏰ Wann werden die meisten Termine gebucht?")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Heatmap: Wochentag x Stunde
            if 'hour' in filtered_df.columns:
                heatmap_data = filtered_df.groupby(['weekday', 'hour']).size().reset_index(name='count')
                heatmap_pivot = heatmap_data.pivot(index='weekday', columns='hour', values='count').fillna(0)
                
                # Richtige Reihenfolge
                weekday_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                heatmap_pivot = heatmap_pivot.reindex(weekday_order)
                
                fig = px.imshow(
                    heatmap_pivot,
                    labels=dict(x="Stunde", y="Wochentag", color="Anzahl"),
                    title="Termin-Heatmap",
                    color_continuous_scale='Blues'
                )
                st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Top Uhrzeiten
            if 'hour' in filtered_df.columns:
                hour_counts = filtered_df['hour'].value_counts().sort_index()
                fig = px.bar(
                    x=hour_counts.index,
                    y=hour_counts.values,
                    title='Termine pro Tageszeit',
                    labels={'x': 'Uhrzeit', 'y': 'Anzahl Termine'}
                )
                st.plotly_chart(fig, use_container_width=True)
    
    with tab5:
        # Detaillierte Tabelle
        st.subheader("📋 Alle Termine im Detail")
        
        # Spalten auswählen
        display_df = filtered_df[[
            'date', 'time', 'event_name', 'host_name', 
            'invitee_names', 'status', 'duration_minutes', 'location_type'
        ]].copy()
        
        display_df.columns = [
            'Datum', 'Uhrzeit', 'Termintyp', 'Berater',
            'Kunde', 'Status', 'Dauer (Min)', 'Location'
        ]
        
        # Sortieren nach Datum
        display_df = display_df.sort_values('Datum', ascending=False)
        
        # Such-Filter
        search = st.text_input("🔍 Suche (Kunde, Berater, Termintyp)")
        if search:
            mask = display_df.apply(lambda row: row.astype(str).str.contains(search, case=False).any(), axis=1)
            display_df = display_df[mask]
        
        st.dataframe(
            display_df,
            use_container_width=True,
            height=600
        )
        
        # Download Buttons
        col1, col2 = st.columns(2)
        with col1:
            csv = display_df.to_csv(index=False, encoding='utf-8-sig')
            st.download_button(
                label="📥 Als CSV herunterladen",
                data=csv,
                file_name=f"calendly_termine_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv"
            )
        
        with col2:
            # JSON Export für Backup
            json_str = json.dumps(events, indent=2, ensure_ascii=False)
            st.download_button(
                label="💾 Als JSON backup",
                data=json_str,
                file_name=f"calendly_backup_{datetime.now().strftime('%Y%m%d')}.json",
                mime="application/json"
            )


if __name__ == "__main__":
    # Session State initialisieren
    if 'data_loaded' not in st.session_state:
        st.session_state['data_loaded'] = False
    
    main()
