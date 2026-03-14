# SL Academy Platform

B2B Hospital Education and Management Platform combining microlearning with indicator tracking to improve protocol adherence and patient safety.

## Overview

SL Academy is a multi-tenant platform that serves two primary user groups:
- **Doctors**: Consume short educational content (5-15 minute lessons) and take assessments
- **Managers/Directors**: Monitor training effectiveness through dashboards and manage hospital indicators

## Architecture

```
sl-academy-platform/
├── backend/              # FastAPI backend
│   ├── api/              # API routes
│   ├── core/             # Configuration and database
│   ├── models/           # Pydantic models
│   ├── services/         # Business logic
│   └── utils/            # Utilities
├── frontend/             # Next.js frontend
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
└── docs/                 # Documentation
```

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Supabase**: PostgreSQL with Row Level Security (RLS)
- **Pydantic**: Data validation
- **OpenAI**: AI-powered features

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS
- **Radix UI**: Accessible components
- **Iron Session**: Secure session management

### Database
- **PostgreSQL**: via Supabase
- **Row Level Security**: Multi-tenant isolation
- **Triggers**: Automated workflows

## Key Features

### For Doctors
- 📚 Short video lessons (5-15 minutes)
- ✅ Pre and post-test assessments
- 💬 Doubt submission with image support
- 📊 Progress tracking
- 🎯 AI-powered recommendations
- 📱 PWA support for mobile access

### For Managers
- 📈 Training effectiveness dashboards
- 📊 Hospital indicator tracking
- 💬 Doubt management (Kanban board)
- 👥 User management
- 📥 CSV/Excel indicator import
- 📉 Correlation analysis (training vs outcomes)

### Security Features
- 🔒 Multi-tenant data isolation (RLS)
- 🔐 Encrypted session management
- 🛡️ Role-based access control (RBAC)
- 🚫 Rate limiting
- ✅ Input validation and sanitization
- 🔍 Audit logging

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.11+
- Supabase account
- OpenAI API key (for AI features)

### 1. Database Setup

```bash
# Apply migrations to Supabase
cd supabase
supabase db push

# Or manually run migrations in Supabase dashboard:
# - 001_init_schema.sql
# - 002_rls_policies.sql
# - 003_triggers.sql
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start server
python main.py
```

Backend will be available at http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

Frontend will be available at http://localhost:3000

## Environment Variables

### Backend (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SESSION_SECRET_KEY=your-32-char-secret
OPENAI_API_KEY=sk-your-key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SESSION_SECRET_KEY=your-32-char-secret
```

## Development

### Backend Development
```bash
cd backend

# Run tests
pytest

# Format code
black .

# Lint
flake8 .

# Type check
mypy .
```

### Frontend Development
```bash
cd frontend

# Run type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Project Status

✅ Database schema and RLS policies created
✅ Backend project structure initialized
✅ Frontend project structure initialized
🚧 Authentication endpoints (in progress)
⏳ Track and lesson management (pending)
⏳ Test and assessment system (pending)
⏳ Doubt management (pending)
⏳ Indicator tracking (pending)
⏳ AI integration (pending)

## Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Requirements Document](./.kiro/specs/sl-academy-platform/requirements.md)
- [Design Document](./.kiro/specs/sl-academy-platform/design.md)
- [Implementation Tasks](./.kiro/specs/sl-academy-platform/tasks.md)

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contributing

This is a private project. For development guidelines, see the spec documents in `.kiro/specs/sl-academy-platform/`.

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact the development team.
