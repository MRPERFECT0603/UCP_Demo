#!/bin/bash
# UCP Shopping Agent - Start All Services

set -e

# Get the absolute path of the project root (directory containing this script)
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Installing dependencies..."
echo ""

echo "→ Installing Flipkart mock server deps..."
(
  cd "$ROOT/mock-servers/flipkart"
  npm install --silent
)

echo "→ Installing Myntra mock server deps..."
(
  cd "$ROOT/mock-servers/myntra"
  npm install --silent
)

echo "→ Installing backend deps..."
(
  cd "$ROOT/backend"
  npm install --silent
)

echo "→ Installing frontend deps..."
(
  cd "$ROOT/frontend"
  npm install --silent
)

echo ""
echo "Starting services..."
echo ""

echo "Starting Flipkart mock server on port 3001..."
(
  cd "$ROOT/mock-servers/flipkart"
  npm run start
) &
FLIPKART_PID=$!

echo "Starting Myntra mock server on port 3002..."
(
  cd "$ROOT/mock-servers/myntra"
  npm run start
) &
MYNTRA_PID=$!

sleep 2

echo "Starting backend API on port 4000..."
(
  cd "$ROOT/backend"
  npm run dev
) &
BACKEND_PID=$!

sleep 2

echo "Starting frontend on port 5173..."
(
  cd "$ROOT/frontend"
  npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════════════"
echo "  UCP Shopping Agent is running!"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Frontend:        http://localhost:5173"
echo "  Backend API:     http://localhost:4000"
echo "  Flipkart Server: http://localhost:3001"
echo "  Myntra Server:   http://localhost:3002"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "═══════════════════════════════════════════════"
echo ""

cleanup() {
  echo ""
  echo "Stopping all services..."

  kill $FLIPKART_PID 2>/dev/null || true
  kill $MYNTRA_PID 2>/dev/null || true
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true

  exit 0
}

trap cleanup INT TERM

wait