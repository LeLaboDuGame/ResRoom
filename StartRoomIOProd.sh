#!/usr/bin/env zsh
# Lance RoomIO en production sur le réseau local
# Usage : ./StartRoomIOProd.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
IP="10.233.31.200"
FRONT_PORT=4173
BACK_PORT=8000

echo "=== Build du frontend (API → http://$IP:$BACK_PORT) ==="
VITE_API_URL="http://$IP:$BACK_PORT" npm run build --prefix "$ROOT/roomio-frontend"

echo "=== Démarrage du backend sur :$BACK_PORT ==="
cd "$ROOT/backend" && uvicorn api:app --host 0.0.0.0 --port $BACK_PORT &
BACK_PID=$!

sleep 1

echo "=== Démarrage du frontend sur :$FRONT_PORT ==="
npx serve "$ROOT/roomio-frontend/dist" -s -l $FRONT_PORT &
FRONT_PID=$!

echo ""
echo "✅ Prêt !"
echo "   Frontend : http://$IP:$FRONT_PORT"
echo "   Backend  : http://$IP:$BACK_PORT"
echo ""
echo "   Appuie sur Ctrl+C pour tout arrêter."

trap "kill $BACK_PID $FRONT_PID 2>/dev/null; exit" INT TERM
wait
