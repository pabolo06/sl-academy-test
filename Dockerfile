FROM python:3.10-slim

# Instalar dependências de sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements primeiro para aproveitar o cache do Docker
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o restante do código do backend
COPY backend/ ./backend/

# Variáveis de ambiente padrão
ENV PYTHONPATH=/app/backend
ENV PORT=8000

# Comando para rodar a aplicação
# O Render/Koyeb/Railway injetam a variável PORT automaticamente
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
