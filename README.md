# Overview

This is a Computer-Based Testing (CBT) Portal application built for secondary schools. The system is designed as a full-stack web application with a React frontend and Node.js/Express backend, using PostgreSQL for data persistence. The application supports multiple user roles (student, teacher, admin) with role-based access control and provides a complete testing platform for educational institutions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router for client-side navigation
- **Authentication**: Context-based auth with protected routes

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: In-memory storage (upgradeable to database-backed)
- **Development**: Hot reload with Vite integration
- **Build**: ESBuild for production bundling

## Database Design
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Schema Location**: `/shared/schema.ts` for shared types
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon serverless with connection pooling

# Key Components

## Authentication System
- **Strategy**: Role-based authentication with three user types (student, teacher, admin)
- **Implementation**: React Context for auth state management
- **Storage**: PostgreSQL database with custom API endpoints
- **Protected Routes**: Route-level protection based on user roles

## User Interface
- **Component Library**: Shadcn/ui with 40+ pre-built components
- **Theme System**: CSS custom properties with light/dark mode support
- **Layout**: Responsive sidebar layout with mobile-first design
- **Icons**: Lucide React for consistent iconography

## Role-Based Dashboards
- **Student Dashboard**: Test taking, result viewing
- **Teacher Dashboard**: Question upload, question management
- **Admin Dashboard**: Test code generation, system-wide question management

## Testing System
- **Test Management**: Admin-generated test codes for secure access
- **Question Bank**: Centralized question management with subject categorization
- **Results Tracking**: Comprehensive test result storage and analysis

# Data Flow

## Authentication Flow
1. User accesses login page with role selection
2. Credentials validated against user database
3. User profile and permissions loaded into context
4. Role-based redirect to appropriate dashboard

## Test Creation Flow
1. Admin generates test code with specific parameters
2. Test code linked to question bank and class/subject
3. Students use test code to access specific tests
4. Results stored with detailed analytics

## Question Management Flow
1. Teachers upload questions via bulk import or manual entry
2. Questions categorized by subject, class, and difficulty
3. Admin can manage all questions across the system
4. Questions selected for tests based on criteria

# External Dependencies

## Core Dependencies
- **React Ecosystem**: React 18, React Router, React Query
- **UI Components**: Radix UI primitives, Shadcn/ui
- **Styling**: Tailwind CSS, class-variance-authority
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Authentication**: Custom session-based authentication with PostgreSQL
- **Development**: Vite, TypeScript, ESBuild

## Development Tools
- **Hot Reload**: Vite middleware for Express
- **Type Safety**: Full TypeScript implementation
- **Code Quality**: ESM modules, strict TypeScript config

# Deployment Strategy

## Development Environment
- **Local Development**: Vite dev server with Express backend
- **Database**: Neon serverless PostgreSQL
- **Environment Variables**: `DATABASE_URL` required for database connection
- **Hot Reload**: Integrated Vite middleware for seamless development

## Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundling to `dist/index.js`
- **Static Assets**: Served from Express for production
- **Database**: Neon serverless handles scaling automatically

## Database Management
- **Migrations**: Drizzle Kit for schema management
- **Development**: `npm run db:push` for schema updates
- **Production**: Automated migrations through Drizzle Kit

# Key Architectural Decisions

## Database Choice
- **Problem**: Need for reliable, scalable database with TypeScript integration
- **Solution**: Neon serverless PostgreSQL with Drizzle ORM
- **Rationale**: Provides serverless scaling, excellent TypeScript support, and simplified deployment

## UI Component Strategy
- **Problem**: Need for consistent, accessible UI components
- **Solution**: Shadcn/ui built on Radix UI primitives
- **Rationale**: Provides accessibility out of the box, customizable styling, and comprehensive component set

## Authentication Architecture
- **Problem**: Role-based access control for educational institution
- **Solution**: Context-based auth with protected routes
- **Rationale**: Centralized auth state, easy role checking, and secure route protection

## Build System
- **Problem**: Fast development with optimized production builds
- **Solution**: Vite for frontend, ESBuild for backend
- **Rationale**: Extremely fast HMR, optimized bundling, and TypeScript support