#!/bin/bash
set -e

echo "Starting FastAPI application..."
echo "Port: ${PORT:-8000}"

python -m uvicorn main:app \
  --host 0.0.0.0 \
  --port ${PORT:-8000}
