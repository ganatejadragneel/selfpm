# SelfPM - Task Completion Checklist

## Before Completing Any Task

### 1. Code Quality Checks
- [ ] Run `npm run lint` to check for ESLint errors
- [ ] Ensure no TypeScript compilation errors
- [ ] Verify all imports are correct and used

### 2. Build Verification
- [ ] Run `npm run build` to ensure production build works
- [ ] Check that `dist` folder is generated correctly
- [ ] No build warnings or errors

### 3. Code Review Checklist
- [ ] Follow existing code patterns and conventions
- [ ] Use TypeScript types and interfaces properly
- [ ] Follow component naming conventions
- [ ] Ensure responsive design (mobile-first)
- [ ] Check for accessibility considerations
- [ ] Verify dark mode compatibility if UI changes made

### 4. Testing Considerations
- [ ] Test functionality in development mode (`npm run dev`)
- [ ] Test on different screen sizes (mobile/desktop)
- [ ] Verify Supabase integration works if database changes made
- [ ] Check error handling and edge cases

### 5. Documentation
- [ ] Update comments if complex logic is added
- [ ] Consider updating README if new features added
- [ ] Ensure environment variables are documented if added

## Git Workflow
- Only commit when above checklist is complete
- Use descriptive commit messages
- Test locally before pushing
- Never commit secrets or environment variables