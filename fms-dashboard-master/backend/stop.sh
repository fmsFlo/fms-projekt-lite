#!/bin/bash

# Backend Stop Script
echo "🛑 Stoppe Backend..."

# Beende alle laufenden Node-Prozesse auf Port 3001
PROCESSES=$(lsof -ti:3001 2>/dev/null)

if [ ! -z "$PROCESSES" ]; then
    echo "📋 Gefundene Prozesse: $PROCESSES"
    kill -9 $PROCESSES 2>/dev/null
    sleep 1
    echo "✅ Backend gestoppt"
else
    echo "✅ Kein Backend-Prozess läuft"
fi

# Beende auch node server.js Prozesse
NODE_PROCESSES=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$NODE_PROCESSES" ]; then
    echo "📋 Beende node server.js Prozesse: $NODE_PROCESSES"
    kill -9 $NODE_PROCESSES 2>/dev/null
    echo "✅ Alle Prozesse beendet"
fi

