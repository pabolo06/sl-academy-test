FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt ./requirements.txt
RUN echo "Installing Python dependencies..." && \
    pip install --no-cache-dir -r requirements.txt && \
    echo "Dependencies installed successfully"

# Copy the entire backend directory
COPY backend/ /app/

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE ${PORT:-8000}

# Run the application — Railway injects $PORT at runtime; fall back to 8000 locally
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"]
