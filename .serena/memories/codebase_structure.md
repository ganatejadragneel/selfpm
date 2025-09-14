# SelfPM - Codebase Structure

## Directory Structure

### Root Level
- `src/` - Main source code
- `public/` - Static assets
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (references app and node configs)
- `tailwind.config.js` - Tailwind CSS configuration
- `vite.config.ts` - Vite build configuration
- `eslint.config.js` - ESLint configuration
- `.env.example` - Environment variables template

### Source Code Structure (`src/`)

#### Core Application
- `App.tsx` - Main application component with drag & drop, modals
- `main.tsx` - React entry point
- `index.css` - Global styles

#### Components (`src/components/`)
- `ModernTaskCard.tsx` - Individual task card component
- `ModernCategoryColumn.tsx` - Column layout for task categories
- `TaskModal.tsx` - Detailed task editing modal
- `AddTaskModal.tsx` - New task creation modal
- `BulkUploadModal.tsx` - Bulk task import functionality

#### Specialized Component Folders
- `ui/` - Reusable UI components (Button, Input, LoadingSpinner)
- `auth/` - Authentication components (LoginForm, RegisterForm, AuthGuard)
- `forms/` - Form-specific components (ButtonGroup, NumberField, SelectField)
- `settings/` - Settings and configuration components
- `subtasks/` - Subtask management components
- `progress/` - Progress tracking components
- `analytics/` - Analytics and reporting components

#### Business Logic (`src/hooks/`)
- `useTaskOperations.ts` - Task CRUD operations
- `useTaskActions.ts` - Task status and progress actions
- `useDragAndDrop.ts` - Drag and drop functionality
- `useModalOperations.ts` - Modal state management
- `useDataFetching.ts` - Data fetching patterns

#### Type Definitions (`src/types/`)
- `index.ts` - Core types (Task, TaskCategory, TaskStatus, etc.)
- `auth.ts` - Authentication types

#### State Management (`src/store/`)
- `migratedTaskStore.ts` - Main Zustand store for tasks
- `supabaseAuthStore.ts` - Authentication state store

#### Utilities (`src/utils/`)
- `dateUtils.ts` - Date manipulation functions
- `taskFilters.ts` - Task filtering logic
- `taskStatistics.ts` - Analytics calculations
- `validation.ts` - Form validation helpers

#### External Services (`src/lib/`)
- `supabase.ts` - Supabase client configuration

## Key Patterns

### State Management
- **Zustand** for global state (tasks, auth)
- **React State** for local component state
- **Context** for theme management

### Data Flow
1. Supabase (database) ↔ Store (Zustand) ↔ Components
2. Custom hooks abstract business logic from UI components
3. Stores handle data persistence and synchronization

### Component Architecture
- Compound components pattern for complex UI
- Custom hooks for reusable business logic
- Props interfaces for type safety
- Modular component structure with clear separation of concerns