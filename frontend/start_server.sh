#!/bin/bash

# Kill any existing process using port 8081
kill $(lsof -t -i:8081) 2>/dev/null || true

# Start the Vite dev server
nohup npm run dev > frontend.log 2>&1 &

echo "Frontend server started on port 8081. Check frontend.log for output."
echo "To stop the server, run: kill \$(lsof -t -i:8081)" 