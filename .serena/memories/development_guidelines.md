# SelfPM - Development Guidelines

## Design Patterns

### DRY Implementation
The project follows a comprehensive DRY (Don't Repeat Yourself) refactoring approach with:
- **Centralized business logic** in testable hooks
- **Compound components** for reusable UI patterns
- **Specialized hooks** for specific use cases
- **Isolated testing** of individual concerns

### Component Patterns
- **Functional Components** with TypeScript
- **Custom Hooks** for business logic separation
- **Compound Components** for complex UI (ActionButtonGroup, ModalLayout, FormSection)
- **Props Destructuring** in function parameters
- **Conditional Rendering** with logical operators

### State Management Patterns
- **Zustand** for global application state
- **Local state** with useState for component-specific state
- **Custom hooks** for stateful logic reuse
- **Context** for cross-cutting concerns (theme)

## Code Quality Standards

### TypeScript Usage
- **Strict mode** enabled
- **Interface definitions** for all props and data structures
- **Type assertions** avoided where possible
- **Generic types** for reusable components
- **Enum types** for status and category constants

### Error Handling
- **Try-catch blocks** for async operations
- **Graceful degradation** for failed network requests
- **User feedback** for error states
- **Logging** for debugging (avoid console.log in production)

### Performance Considerations
- **React.memo** for expensive components
- **useCallback** for stable function references
- **useMemo** for expensive calculations
- **Lazy loading** for modals and large components
- **Bundle size optimization** with specific imports

## Security Guidelines
- **Environment variables** for sensitive data (Supabase keys)
- **Input validation** on all user inputs
- **SQL injection protection** via Supabase client
- **Authentication guards** for protected routes
- **HTTPS only** in production

## Accessibility Standards
- **Semantic HTML** elements
- **ARIA labels** for interactive elements
- **Keyboard navigation** support
- **Color contrast** compliance
- **Screen reader** compatibility
- **Focus management** in modals

## Mobile-First Design
- **Responsive breakpoints** using Tailwind
- **Touch-friendly** interface elements
- **Performance optimization** for mobile devices
- **Progressive enhancement** approach