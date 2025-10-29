# Arhti Business Management System

## Overview

Arhti Business Management System is a comprehensive business management application designed for mandi middlemen (Arhti) to manage their agricultural commodity trading operations. The system facilitates tracking of farmer relationships, purchase transactions, invoice generation, payment processing, and financial reporting. Built as a full-stack web application, it features a modern, responsive interface with dual theme support (light/dark mode) and follows a utility-focused, function-differentiated design approach.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server, providing fast HMR and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)

**UI Component Library**
- shadcn/ui components built on Radix UI primitives for accessible, composable UI elements
- TailwindCSS v4 for utility-first styling with custom design system
- CSS variables-based theming system supporting light/dark modes
- Rounded modern aesthetic with 1.25rem (rounded-2xl) border radius as primary design language

**State Management**
- TanStack Query (React Query) v5 for server state management, caching, and data synchronization
- Local component state with React hooks for UI-specific state
- Theme context provider for global theme state management

**Design System**
- Custom color palette with HSL-based CSS variables for theme flexibility
- Typography: Inter or Manrope font family with weights 400/500/700
- Responsive breakpoints: mobile-first approach with md (768px) breakpoint for tablet/desktop
- Hover/active states using elevation utilities (hover-elevate, active-elevate-2)
- Component-specific borders and shadows for depth hierarchy

**Responsive Strategy**
- Desktop: Sidebar navigation + top navbar with full-width content area
- Mobile: Bottom floating navigation bar with simplified top bar
- Conditional rendering based on viewport size using custom useIsMobile hook

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for RESTful API endpoints
- HTTP server creation via Node's built-in http module
- Custom middleware for JSON parsing, request logging, and error handling

**Development Environment**
- Custom Vite integration for development with middleware mode
- Hot module replacement (HMR) during development
- Production build outputs to dist/public for static assets

**API Design**
- RESTful endpoints prefixed with /api
- Request/response logging middleware capturing method, path, status, duration, and response body
- Storage interface abstraction (IStorage) for CRUD operations

**Storage Layer**
- In-memory storage implementation (MemStorage) as default
- Storage interface designed for easy swapping to database implementation
- Prepared for Drizzle ORM integration with PostgreSQL schema defined

### Data Storage Solutions

**Database Schema (Drizzle ORM + PostgreSQL)**

The application defines the following core entities:

1. **Users** - Authentication and user management
   - Fields: id (UUID), username, password

2. **Farmers** - Farmer/supplier management
   - Fields: id, name, phone, address, notes, status (active/inactive)

3. **Purchases** - Purchase transaction records
   - Fields: id, farmerId, crop, quantity, rate, total, date, paymentStatus, notes

4. **Invoices** - Invoice generation and tracking
   - Fields: id, farmerId, total, commission, netPayable, status, date

5. **Payments** - Payment transaction records
   - Fields: id, type, name, amount, invoiceId, status, date

6. **Charges** - Additional charges/fees tracking
   - Fields: id, title, amount, type, date, appliedTo

**Database Configuration**
- Drizzle Kit configured for PostgreSQL dialect
- Schema-first approach with migrations output to ./migrations directory
- Environment variable DATABASE_URL required for database connection
- Uses @neondatabase/serverless for PostgreSQL connection (Neon-compatible)

**Current State**
- Schema definitions complete with Zod validation schemas via drizzle-zod
- In-memory storage currently active for development
- Database push command available via `npm run db:push`
- Foreign key relationships implied but not explicitly enforced in current schema

### Authentication and Authorization

**Current Implementation**
- User schema defined with username/password fields
- No active authentication middleware currently implemented
- Session management infrastructure prepared (connect-pg-simple for PostgreSQL sessions)

**Planned Architecture**
- Session-based authentication using express-session
- Password hashing (bcrypt or similar) for secure credential storage
- Protected routes requiring authentication
- User context propagation through request lifecycle

### External Dependencies

**Core Framework Dependencies**
- React 18+ with react-dom for UI rendering
- Express.js for HTTP server and API routing
- Vite for build tooling and development server
- TypeScript for type safety across frontend and backend

**Database & ORM**
- Drizzle ORM (v0.39+) for type-safe database queries
- @neondatabase/serverless for PostgreSQL connection
- drizzle-zod for automatic Zod schema generation from database schema
- connect-pg-simple for PostgreSQL-backed session storage

**UI Component Libraries**
- @radix-ui/* components (accordion, dialog, dropdown-menu, etc.) - 20+ primitives
- @tanstack/react-query for server state management
- wouter for routing
- lucide-react for icon components
- date-fns for date manipulation

**Form & Validation**
- react-hook-form for form state management
- @hookform/resolvers for validation schema integration
- zod for runtime type validation (implied through drizzle-zod)

**Styling & Design**
- TailwindCSS with PostCSS for processing
- class-variance-authority for component variant management
- tailwind-merge + clsx for conditional class composition
- embla-carousel-react for carousel functionality

**Development Tools**
- @replit/vite-plugin-* suite for Replit-specific development features
- tsx for TypeScript execution in development
- esbuild for production backend bundling

**Third-Party Integrations**
- None currently active beyond core dependencies
- Prepared for potential integrations: SMS notifications, PDF generation, analytics

**Build & Deployment**
- Development: `npm run dev` - runs Express server with Vite middleware
- Production build: `npm run build` - creates optimized client bundle and server bundle
- Production start: `npm start` - serves built application
- Type checking: `npm run check` - runs TypeScript compiler in check mode