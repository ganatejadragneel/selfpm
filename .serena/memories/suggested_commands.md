# SelfPM - Suggested Commands

## Development Commands
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## System Commands (macOS/Darwin)
- `ls` - List directory contents
- `cd` - Change directory
- `grep` - Search text patterns (prefer `rg` ripgrep if available)
- `find` - Find files and directories
- `git` - Git version control commands

## Common Development Workflow
1. `npm run dev` - Start development
2. Make changes to code
3. `npm run lint` - Check for linting issues
4. `npm run build` - Verify production build works
5. Git commands for version control

## Environment Setup
- Copy `.env.example` to `.env.local`
- Set up Supabase credentials:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Deployment
- **Netlify**: `npm run build` then deploy `dist` folder
- Build command: `npm run build`
- Publish directory: `dist`