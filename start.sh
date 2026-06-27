#!/bin/bash
# UCP Shopping Agent - Start All Services

echo "Installing dependencies..."

echo "→ Installing Flipkart mock server deps..."
cd mock-servers/flipkart && npm install --silent && cd ../..

echo "→ Installing Myntra mock server deps..."
cd mock-servers/myntra && npm install --silent && cd ../..

echo "→ Installing backend deps..."
cd backend && npm install --silent && cd ..

echo "→ Installing frontend deps..."
cd frontend && npm install --silent && cd ..

echo ""
echo "Starting services..."
echo ""

# Start mock servers
echo "Starting Flipkart mock server on port 3001..."
cd mock-servers/flipkart && npm run start &
FLIPKART_PID=$!

echo "Starting Myntra mock server on port 3002..."
cd ../myntra && npm run start &
MYNTRA_PID=$!
cd ../..

sleep 2

echo "Starting backend API on port 4000..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

sleep 2

echo "Starting frontend on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

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

# Trap to kill all on Ctrl+C
trap "echo 'Stopping all services...'; kill $FLIPKART_PID $MYNTRA_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
