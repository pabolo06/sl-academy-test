FROM python:3.11-slim

WORKDIR /app

# Install only minimal dependencies
RUN apt-get update && apt-get install -y libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn[standard] psycopg2-binary

# Copy backend code
COPY backend/ .

ENV PYTHONPATH=/app
EXPOSE 8000

# Test if imports work before starting
RUN python -c "import sys; sys.path.insert(0, '.'); from main import app; print('Import successful')" || exit 1

# Run with unbuffered output for better logging
CMD ["python", "-u", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
