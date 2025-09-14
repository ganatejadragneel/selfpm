# SelfPM - Code Style & Conventions

## TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Strict mode**: Enabled
- **No unused locals/parameters**: Enforced
- **JSX**: react-jsx

## ESLint Configuration
- Uses TypeScript ESLint recommended config
- React Hooks rules enforced
- React Refresh plugin for Vite
- ECMAScript 2020 features

## Code Patterns & Conventions

### Component Structure
- **Functional Components**: Uses React.FC with TypeScript interfaces
- **Props Destructuring**: Function parameters destructured inline
- **Custom Hooks**: Extensive use of custom hooks for business logic
- **State Management**: Zustand for global state

### Naming Conventions
- **Components**: PascalCase (e.g., `ModernTaskCard`, `TaskModal`)
- **Hooks**: camelCase starting with `use` (e.g., `useTaskActions`)
- **Types/Interfaces**: PascalCase (e.g., `Task`, `TaskCategory`)
- **Constants**: camelCase for local, SCREAMING_SNAKE_CASE for module-level
- **Files**: PascalCase for components, camelCase for utilities

### File Organization
```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── store/         # Zustand stores
├── lib/           # External library configurations
├── contexts/      # React contexts
├── constants/     # Application constants
└── styles/        # CSS and theme files
```

### Import Patterns
- External libraries first
- Internal utilities and types
- Components last
- Uses ES modules with explicit imports

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Theme System**: Centralized theme configuration
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Supported via theme context