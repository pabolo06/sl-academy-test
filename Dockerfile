FROM python:3.11-slim

# Instalar dependências de sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements primeiro para aproveitar o cache do Docker
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o restante do código do backend
COPY backend/ /app/

# Variáveis de ambiente padrão
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose port
EXPOSE 8000

# Comando para rodar a aplicação
CMD exec python -m uvicorn main:app --host 0.0.0.0 --port 8000
