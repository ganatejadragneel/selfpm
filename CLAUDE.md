# Claude AI Development Guide for SelfPM

## Project Overview
SelfPM is a personal task management application built with React, TypeScript, and Supabase. The application follows SOLID principles and DRY methodology with a clean, maintainable architecture.

## Recent Architectural Refactoring (Completed)
The codebase has undergone a comprehensive SOLID/DRY refactoring across 4 phases:

### Phase 1: Foundation & Low-Risk Improvements ✅
- Consolidated styling system
- Created base modal components
- Implemented repository pattern for data access
- Set up initial abstraction layers

### Phase 2: Service Layer & Business Logic ✅
- **Services Created:**
  - `TaskService` - Core task operations with business rules
  - `RecurringTaskService` - Recurring task management
  - `DependencyService` - Task dependency and critical path management
  - `ProgressCalculationService` - Progress tracking and analytics
  - `CacheService` - Performance optimization with TTL caching

- **Domain Models:**
  - `BaseTask` - Abstract base with common task logic
  - `RegularTask` - Standard task implementation
  - `RecurringTask` - Special handling for recurring tasks

- **Validation Layer:**
  - `TaskValidator` - Comprehensive task validation
  - `FormValidator` - Generic form field validation

### Phase 3: Store Refactoring & Integration ✅
- **New Stores:**
  - `taskStore` - Integrated with service layer, manages task state
  - `uiStore` - Separated UI state (modals, toasts, drag & drop)
  - `userPreferencesStore` - User settings and preferences

- **Error Handling:**
  - `ErrorBoundary` - React error boundaries with fallback UI
  - `LoadingStates` - Consistent loading components

### Phase 4: Component Migration & Performance ✅
- **Refactored Components:**
  - `TaskCard.refactored.tsx` - Uses new stores and services
  - `WeekView.refactored.tsx` - Complete service integration
  - `LazyModals.tsx` - Code-split modal components

- **Custom Hooks:**
  - `useTaskOperations` - Task operations with error handling
  - `useModalOperations` - Modal management with validation
  - `useWeekView` - Week view state and operations

- **Higher-Order Components:**
  - `withAuth` - Authentication wrapper
  - `withErrorBoundary` - Error handling
  - `withPerformance` - Performance monitoring

## Architecture Overview

### Directory Structure
```
src/
├── components/
│   ├── hoc/              # Higher-order components
│   ├── *.refactored.tsx  # Refactored components using new architecture
│   └── LazyModals.tsx    # Code-split modals
├── hooks/                # Custom React hooks
├── models/               # Domain models with business logic
├── repositories/         # Data access layer (Supabase)
├── services/            # Business logic layer
├── store/               # Zustand stores (state management)
├── validators/          # Validation logic
└── types/               # TypeScript type definitions
```

### Key Design Patterns
1. **Repository Pattern** - Abstracts data access from business logic
2. **Service Layer** - Encapsulates business rules and operations
3. **Domain Models** - Business logic embedded in models
4. **Dependency Injection** - Services composed in stores
5. **Higher-Order Components** - Cross-cutting concerns
6. **Custom Hooks** - Reusable component logic

## Development Guidelines

### When Adding New Features
1. **Start with the Service Layer** - Create or extend services for business logic
2. **Update Domain Models** - Add business rules to models, not components
3. **Use Existing Hooks** - Leverage `useTaskOperations`, `useModalOperations`, etc.
4. **Follow Type Safety** - All TypeScript, no `any` types unless absolutely necessary
5. **Add Validation** - Use validators for data integrity

### Code Style Principles
- **SOLID Principles:**
  - Single Responsibility: Each class/function has one job
  - Open/Closed: Extend through composition, not modification
  - Liskov Substitution: Subtypes must be substitutable
  - Interface Segregation: Small, focused interfaces
  - Dependency Inversion: Depend on abstractions

- **DRY (Don't Repeat Yourself):**
  - Extract common logic to services or hooks
  - Use composition over duplication
  - Create reusable components and utilities

### Testing Approach
- Services can be unit tested independently
- Use mocks for repository layer
- Test business logic in isolation
- Component testing focuses on user interactions

## Database Schema
The application uses Supabase with the following main tables:
- `tasks` - Core task data
- `subtasks` - Task subtasks
- `task_dependencies` - Task relationships
- `recurring_task_templates` - Recurring task definitions
- `weekly_task_completions` - Weekly progress tracking
- `task_activities` - Activity logging

### Important: Case Conversion
- Database uses `snake_case`
- Application uses `camelCase`
- Repository layer handles conversion automatically

## Key Features

### Task Management
- Create, update, delete tasks
- Categories: life_admin, work, weekly_recurring
- Priority levels: low, medium, high, urgent
- Status: todo, in_progress, done, blocked
- Subtask support with weighted progress
- Time tracking and estimation

### Recurring Tasks
- Weekly recurring patterns
- Custom recurrence periods (1-15 weeks)
- Alternative task support for flexibility
- Progress tracking across weeks

### Dependencies
- Task dependencies with validation
- Critical path calculation
- Circular dependency detection
- Dependency visualization

### Progress Tracking
- Manual and automatic progress calculation
- Weighted subtask progress
- Time tracking with estimates
- Velocity and burn rate metrics

### UI Features
- Drag and drop task management
- Dark mode support
- Multiple view modes (board, list, timeline)
- Bulk operations
- Command palette (keyboard shortcuts)

## Performance Optimizations
- Lazy loading for modals
- Code splitting by route
- Memoization of expensive computations
- Cache service with TTL
- Optimistic UI updates

## Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

## Environment Variables
Required in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Important Notes for AI Assistants

### Do's
✅ Use existing services and hooks for new features
✅ Follow the established patterns (Repository → Service → Store → Component)
✅ Add proper TypeScript types for all new code
✅ Use the validation layer for data integrity
✅ Leverage existing HOCs for cross-cutting concerns
✅ Keep business logic in services, not components

### Don'ts
❌ Don't add business logic to components
❌ Don't access Supabase directly from components
❌ Don't duplicate code - use existing utilities
❌ Don't use `any` type without good reason
❌ Don't bypass the service layer
❌ Don't create new stores without clear separation of concerns

## Recent Changes (Last Updated: Current Session)
- Complete SOLID/DRY refactoring across all layers
- Service layer implementation with business logic
- Store refactoring with service integration
- Component migration to new architecture
- Performance optimizations with lazy loading
- Zero TypeScript errors, production-ready build

## Next Steps & Future Enhancements
- Complete migration of remaining components
- Add comprehensive test coverage
- Implement offline support with service workers
- Add real-time collaboration features
- Enhance mobile responsiveness
- Add data export/import functionality

## Contact & Repository
- Repository: https://github.com/ganatejadragneel/selfpm
- Issues: Report via GitHub Issues

---
*This document serves as the primary reference for AI assistants working on the SelfPM codebase. Always refer to this guide for architectural decisions and coding standards.*