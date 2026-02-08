#!/usr/bin/env bash
# Start the SolJack application (frontend + backend)
# Usage: ./start-app.sh

set -e

# Navigate to the repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🃏 Starting SolJack App"
echo "===================="
echo ""

# Function to cleanup background processes on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down SolJack..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Check and install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  (cd frontend && npm install)
  echo "✅ Frontend dependencies installed"
else
  echo "✅ Frontend dependencies already installed"
fi

# Check and install backend dependencies
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  (cd backend && npm install)
  echo "✅ Backend dependencies installed"
else
  echo "✅ Backend dependencies already installed"
fi

# Kill any existing SolJack processes
echo ""
echo "🧹 Cleaning up existing SolJack processes..."
pkill -f "soljack.*npm run dev" 2>/dev/null || true
pkill -f "tsx watch src/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Check if ports are already in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo ""
  echo "⚠️  Port 8000 is already in use. Killing existing process..."
  lsof -ti:8000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "⚠️  Port 8080 is already in use. Killing existing process..."
  lsof -ti:8080 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo ""
echo "🚀 Launching services..."
echo ""

# Start backend in background (using subshell)
echo "🔧 Starting backend..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# Start frontend in background (using subshell)
echo "🎨 Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "✨ SolJack is running!"
echo ""
echo "📍 Services:"
echo "   • Backend:  http://localhost:8000 (PID: $BACKEND_PID)"
echo "   • Frontend: http://localhost:8080 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background jobs
wait
