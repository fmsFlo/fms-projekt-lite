#!/bin/bash

# Backend Restart Script
echo "🔄 Starte Backend-Neustart..."

# 1. Beende alle laufenden Node-Prozesse auf Port 3001
echo "📋 Prüfe laufende Prozesse..."
PROCESSES=$(lsof -ti:3001 2>/dev/null)

if [ ! -z "$PROCESSES" ]; then
    echo "🛑 Beende Prozesse auf Port 3001: $PROCESSES"
    kill -9 $PROCESSES 2>/dev/null
    sleep 2
else
    echo "✅ Keine Prozesse auf Port 3001 gefunden"
fi

# 2. Beende alle node server.js Prozesse
NODE_PROCESSES=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$NODE_PROCESSES" ]; then
    echo "🛑 Beende node server.js Prozesse: $NODE_PROCESSES"
    kill -9 $NODE_PROCESSES 2>/dev/null
    sleep 2
fi

# 3. Warte kurz
sleep 1

# 4. Prüfe ob Port frei ist
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "❌ Port 3001 ist immer noch belegt!"
    exit 1
fi

# 5. Starte Backend neu
echo "🚀 Starte Backend neu..."
cd "$(dirname "$0")"
npm start

