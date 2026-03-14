# SL Academy Platform - Frontend

B2B Hospital Education and Management Platform - Next.js Frontend

## Project Structure

```
frontend/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/          # React components
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
├── public/              # Static assets
├── next.config.mjs      # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json         # Dependencies
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The application will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SESSION_SECRET_KEY`: 32-character secret for session encryption

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **React Hook Form**: Form validation
- **Zod**: Schema validation
- **SWR**: Data fetching and caching
- **Iron Session**: Secure session management

## Features

- 🎨 Dark mode by default (hospital-focused UI)
- 📱 Progressive Web App (PWA) support
- 🔒 Secure session management with httpOnly cookies
- 🎯 Role-based UI (Manager vs Doctor views)
- 📊 Dashboard with charts and analytics
- 🎥 Video player with progress tracking
- 📝 Test and assessment system
- 💬 Doubt management with Kanban board
- 📈 Indicator tracking and import

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Keep components small and focused
- Use server components by default, client components when needed

### Component Structure
```tsx
// components/example-component.tsx
'use client' // Only if needed

import { ComponentProps } from '@/types'

export function ExampleComponent({ prop }: ComponentProps) {
  return (
    <div className="...">
      {/* Component content */}
    </div>
  )
}
```

### API Calls
```tsx
// Use SWR for data fetching
import useSWR from 'swr'

const { data, error, isLoading } = useSWR('/api/tracks', fetcher)
```

## Next Steps

1. Implement authentication pages (Task 12.3)
2. Create layout components (Task 13)
3. Build track and lesson browsing (Task 14)
4. Add video player (Task 15)
5. Implement test UI (Task 16)
6. Create doubt management (Task 17)
7. Build dashboard (Task 18)

## PWA Configuration

The app is configured as a Progressive Web App:
- Installable on mobile devices
- Offline support via service worker
- App manifest for native-like experience

## Security

- Session cookies are httpOnly, secure, and sameSite=lax
- CSRF protection enabled
- Security headers configured in next.config.mjs
- Input validation via Zod schemas
- XSS protection via React's built-in escaping

## Performance

- Code splitting via Next.js dynamic imports
- Image optimization via next/image
- Font optimization via next/font
- Lazy loading for heavy components
- SWR caching for API responses
