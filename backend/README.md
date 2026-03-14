# SL Academy Platform - Backend API

B2B Hospital Education and Management Platform - FastAPI Backend

## Project Structure

```
backend/
├── api/
│   └── routes/          # API route handlers
├── core/
│   ├── config.py        # Configuration management
│   └── database.py      # Database connection
├── models/              # Pydantic models
├── services/            # Business logic
├── utils/               # Utility functions
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
└── .env.example         # Environment variables template
```

## Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Run database migrations:**
   ```bash
   # Apply migrations in Supabase dashboard or using Supabase CLI
   supabase db push
   ```

5. **Start development server:**
   ```bash
   python main.py
   ```

   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key (backend only)
- `SESSION_SECRET_KEY`: 32-character secret for session encryption
- `OPENAI_API_KEY`: OpenAI API key for AI features

## Development

### Code Style
```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html
```

## Security

- All endpoints use Row Level Security (RLS) at database level
- Multi-tenant isolation enforced by hospital_id
- Session cookies are httpOnly, secure, and sameSite=lax
- Rate limiting enabled on sensitive endpoints
- Input validation via Pydantic models
- Security headers added to all responses

## Architecture

- **FastAPI**: Modern Python web framework
- **Supabase**: PostgreSQL database with built-in auth and RLS
- **Pydantic**: Data validation and settings management
- **OpenAI**: AI-powered recommendations and summaries

## Next Steps

1. Implement authentication endpoints (Task 2.2)
2. Add session management middleware (Task 2.4)
3. Implement track and lesson endpoints (Task 3)
4. Add test and assessment system (Task 4)
5. Implement doubt management (Task 5)
6. Add indicator tracking (Task 6)
7. Integrate AI features (Task 7)
