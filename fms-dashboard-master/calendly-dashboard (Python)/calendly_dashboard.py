"""
Calendly Dashboard für Finance Made Simple
Visualisierung aller Termine mit Filteroptionen
"""

import streamlit as st
import pandas as pd
import json
from datetime import datetime, timedelta
import plotly.express as px
import plotly.graph_objects as go
from calendly_data_fetcher import CalendlyFetcher

# Page Config
st.set_page_config(
    page_title="FMS Calendly Dashboard",
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


def process_events_to_dataframe(events):
    """Konvertiert Events zu DataFrame"""
    processed = []
    
    for event in events:
        # Basis Event Info
        event_data = {
            'event_uri': event['uri'],
            'event_name': event['name'],
            'status': event['status'],
            'start_time': datetime.fromisoformat(event['start_time'].replace('Z', '+00:00')),
            'end_time': datetime.fromisoformat(event['end_time'].replace('Z', '+00:00')),
            'host_name': event.get('host_name', 'Unknown'),
            'host_email': event.get('host_email', 'Unknown'),
            'location_type': event.get('location', {}).get('type', 'Unknown'),
            'created_at': datetime.fromisoformat(event['created_at'].replace('Z', '+00:00')),
            'updated_at': datetime.fromisoformat(event['updated_at'].replace('Z', '+00:00')),
        }
        
        # Invitees Info
        invitees = event.get('invitees', [])
        if invitees:
            invitee_names = [inv.get('name', 'Unknown') for inv in invitees]
            invitee_emails = [inv.get('email', 'Unknown') for inv in invitees]
            event_data['invitee_names'] = ', '.join(invitee_names)
            event_data['invitee_emails'] = ', '.join(invitee_emails)
            event_data['num_invitees'] = len(invitees)
            
            # Status vom ersten Invitee (meistens relevant)
            if invitees:
                event_data['invitee_status'] = invitees[0].get('status', 'unknown')
        else:
            event_data['invitee_names'] = 'Keine'
            event_data['invitee_emails'] = 'Keine'
            event_data['num_invitees'] = 0
            event_data['invitee_status'] = 'unknown'
        
        processed.append(event_data)
    
    df = pd.DataFrame(processed)
    
    # Datum Spalten
    if not df.empty:
        df['date'] = df['start_time'].dt.date
        df['time'] = df['start_time'].dt.time
        df['weekday'] = df['start_time'].dt.day_name()
        df['month'] = df['start_time'].dt.strftime('%Y-%m')
        df['duration_minutes'] = (df['end_time'] - df['start_time']).dt.total_seconds() / 60
    
    return df


def main():
    st.title("📅 Calendly Dashboard - Finance Made Simple")
    
    # Sidebar für Settings
    with st.sidebar:
        st.header("⚙️ Einstellungen")
        
        data_source = st.radio(
            "Datenquelle",
            ["JSON Datei laden", "Live von API abrufen"]
        )
        
        if data_source == "Live von API abrufen":
            api_token = st.text_input("Calendly API Token", type="password")
            
            col1, col2 = st.columns(2)
            with col1:
                months_back = st.selectbox("Monate zurück", [1, 3, 6, 9, 12], index=2)
            with col2:
                st.write("")  # Spacer
            
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
                        except Exception as e:
                            st.error(f"Fehler: {str(e)}")
        else:
            uploaded_file = st.file_uploader("JSON Datei hochladen", type=['json'])
            if uploaded_file:
                events = json.load(uploaded_file)
                st.session_state['events'] = events
                st.session_state['data_loaded'] = True
                st.success(f"✓ {len(events)} Events geladen!")
        
        st.divider()
        
        # Schnellstatistiken in Sidebar
        if st.session_state.get('data_loaded'):
            events = st.session_state['events']
            st.metric("📊 Gesamt Events", len(events))
            active = len([e for e in events if e['status'] == 'active'])
            canceled = len([e for e in events if e['status'] == 'canceled'])
            st.metric("✅ Aktiv", active)
            st.metric("❌ Canceled", canceled)
    
    # Main Content
    if not st.session_state.get('data_loaded'):
        st.info("👈 Bitte wähle links eine Datenquelle und lade die Daten")
        
        # Beispiel zeigen
        st.markdown("---")
        st.subheader("🎯 Was dieses Dashboard kann:")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown("**📅 Terminübersicht**")
            st.write("- Alle Events filtern")
            st.write("- Nach Datum sortieren")
            st.write("- Status anzeigen")
        with col2:
            st.markdown("**👥 Team-Analyse**")
            st.write("- Events pro Berater")
            st.write("- Termintypen")
            st.write("- Auslastung")
        with col3:
            st.markdown("**📊 Statistiken**")
            st.write("- Zeitverlauf")
            st.write("- Conversion-Rate")
            st.write("- Peak-Zeiten")
        return
    
    # Daten verarbeiten
    events = st.session_state['events']
    df = process_events_to_dataframe(events)
    
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
            options=df['status'].unique(),
            default=df['status'].unique()
        )
    
    with col3:
        host_filter = st.multiselect(
            "Gastgeber",
            options=df['host_name'].unique(),
            default=df['host_name'].unique()
        )
    
    with col4:
        event_type_filter = st.multiselect(
            "Termintyp",
            options=df['event_name'].unique(),
            default=df['event_name'].unique()
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
    
    tab1, tab2, tab3, tab4 = st.tabs(["📅 Zeitverlauf", "👥 Team", "🎯 Termintypen", "📋 Detailliste"])
    
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
        weekday_counts = filtered_df['weekday'].value_counts().reindex([
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ]).fillna(0)
        
        fig = px.bar(
            x=weekday_counts.index,
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
                labels={'host_name': 'Berater', 'cancel_rate': 'Absage-Rate (%)'}
            )
            st.plotly_chart(fig, use_container_width=True)
    
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
    
    with tab4:
        # Detaillierte Tabelle
        st.subheader("📋 Alle Termine im Detail")
        
        # Spalten auswählen
        display_df = filtered_df[[
            'date', 'time', 'event_name', 'host_name', 
            'invitee_names', 'status', 'duration_minutes'
        ]].copy()
        
        display_df.columns = [
            'Datum', 'Uhrzeit', 'Termintyp', 'Berater',
            'Kunde', 'Status', 'Dauer (Min)'
        ]
        
        # Sortieren nach Datum
        display_df = display_df.sort_values('Datum', ascending=False)
        
        st.dataframe(
            display_df,
            use_container_width=True,
            height=600
        )
        
        # Download Button
        csv = display_df.to_csv(index=False, encoding='utf-8-sig')
        st.download_button(
            label="📥 Als CSV herunterladen",
            data=csv,
            file_name=f"calendly_termine_{datetime.now().strftime('%Y%m%d')}.csv",
            mime="text/csv"
        )


if __name__ == "__main__":
    # Session State initialisieren
    if 'data_loaded' not in st.session_state:
        st.session_state['data_loaded'] = False
    
    main()
