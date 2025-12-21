# Prompt Engineering Studio

## Overview

A bilingual (Arabic/English) prompt engineering IDE for designing, testing, and optimizing AI prompts. The application provides a structured workflow for creating prompts with four sections (System, Developer, User, Context), automated quality analysis via a tri-agent composition system, and persistent storage of templates, techniques, and run history.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, React useState for local state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Static Serving**: Vite dev server in development, static file serving in production

### Prompt Engineering Workflow
The application implements a 7-stage workflow (stages 0-6):
1. Raw idea input
2. Tri-agent composition (converter, critic, arbiter)
3. Review and approval
4. Advanced editing of four sections
5. Quality analysis/critique
6. Execution against LLM
7. Organization and template saving

### LLM Integration
- **Primary Provider**: Groq API (OpenAI-compatible endpoint)
- **Default Model**: Llama 3.3 70B Versatile
- **API Key Management**: Session-based key storage with fallback to environment variable

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Tables**: templates, techniques, runs, run_ratings, prompts, prompt_versions, agent_compose_runs, agent_compose_results

### Code Organization
```
client/           # React frontend
  src/
    components/   # UI components including stages/
    pages/        # Route pages (Studio, Templates, Techniques, Runs, Settings)
    lib/          # Utilities, API client, types
    hooks/        # Custom React hooks
server/           # Express backend
  index.ts        # Entry point
  routes.ts       # API route definitions
  storage.ts      # Database operations
  agents.ts       # Tri-agent prompt composition logic
  llm-provider.ts # LLM API wrapper
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
```

## External Dependencies

### AI/LLM Services
- **Groq API**: Primary LLM provider for prompt execution and agent composition
- **Environment Variable**: `GROQ_API_KEY` for authentication

### Database
- **PostgreSQL**: Required for data persistence
- **Environment Variable**: `DATABASE_URL` for connection string
- **Session Store**: connect-pg-simple for Express session storage

### Build & Development
- **Replit Plugins**: cartographer, dev-banner, runtime-error-modal for enhanced Replit development experience
- **Custom Vite Plugin**: meta-images plugin for OpenGraph image handling

### Key NPM Packages
- drizzle-orm/drizzle-zod: Database ORM and validation
- @tanstack/react-query: Server state management
- express-session: Session management
- zod: Runtime validation
- date-fns: Date formatting with Arabic locale support