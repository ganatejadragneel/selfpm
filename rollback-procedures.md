# Rollback Procedures - Phase 1 Safety Infrastructure

## Emergency Rollback Strategy
**Created**: 2025-01-14 - For DRY Enhancement Phases 1-10

## Git-Based Rollback (Primary Method)

### Immediate Rollback Commands
```bash
# View recent commits
git log --oneline -10

# Rollback to previous commit (soft - keeps changes)
git reset --soft HEAD~1

# Rollback to previous commit (hard - discards changes)
git reset --hard HEAD~1

# Rollback to specific commit
git reset --hard <commit-hash>

# Create rollback commit (preferred for shared repos)
git revert <commit-hash>
```

### Phase-Specific Rollback Points
```bash
# Before Phase 1 (Current baseline)
git tag phase-0-baseline

# Before Phase 2 (Style system enhancement)
git tag phase-1-complete

# Before Phase 3 (Utility enhancement)
git tag phase-2-complete

# Continue pattern for each phase...
```

## File-Level Rollback (Granular Control)

### Critical Files Backup Strategy
```bash
# Create backup directory
mkdir -p .rollback-backups/phase-{phase-number}

# Backup critical files before each phase
cp src/styles/theme.ts .rollback-backups/phase-2/
cp src/styles/styleCompositions.ts .rollback-backups/phase-2/
cp src/hooks/useModalOperations.ts .rollback-backups/phase-4/
# etc.
```

### Individual File Rollback
```bash
# Rollback specific file
git checkout HEAD~1 -- src/styles/theme.ts

# Or from backup
cp .rollback-backups/phase-2/theme.ts src/styles/theme.ts
```

## Feature Flag Rollback (Advanced Phases)

### Feature Flag Implementation (Phases 7+)
```typescript
// In environment or config
const FEATURE_FLAGS = {
  useNewFormSystem: false,        // Phase 7
  useOptimizedInterfaces: false,  // Phase 8
  useAdvancedAnimations: false,   // Phase 9
  usePerformanceOptims: false,    // Phase 10
};

// In components
const formSystem = FEATURE_FLAGS.useNewFormSystem
  ? newFormSystem
  : legacyFormSystem;
```

### Feature Flag Rollback
```typescript
// Immediate rollback via environment variable
REACT_APP_USE_NEW_FORM_SYSTEM=false
REACT_APP_USE_OPTIMIZED_INTERFACES=false
```

## Component-Level Rollback (Surgical)

### Component Backup Strategy
```bash
# Before modifying critical components
cp src/components/TaskModal.tsx .rollback-backups/phase-7/
cp src/components/AddTaskModal.tsx .rollback-backups/phase-7/
```

### Component Replacement Rollback
```bash
# Quick component rollback
cp .rollback-backups/phase-7/TaskModal.tsx src/components/
npm run build  # Verify functionality
```

## Build System Rollback

### Dependency Rollback
```bash
# Backup package.json before changes
cp package.json .rollback-backups/package.json.backup

# Rollback dependencies
cp .rollback-backups/package.json.backup package.json
npm install
```

### Build Configuration Rollback
```bash
# Backup build configs
cp vite.config.ts .rollback-backups/
cp tsconfig.json .rollback-backups/

# Rollback if build issues
cp .rollback-backups/vite.config.ts ./
```

## Validation After Rollback

### Rollback Success Checklist
```bash
# 1. Build succeeds
npm run build

# 2. Development server starts
npm run dev

# 3. Key functionality works
# - Task creation/editing
# - Modal operations
# - User authentication
# - Drag & drop
# - Settings functionality

# 4. No console errors in browser
# 5. Visual layout unchanged from baseline

# 6. Performance maintained
npm run build
# Compare bundle sizes to baseline
```

## Phase-Specific Rollback Plans

### Phase 2-3 (Low Risk)
- **Method**: Git commit rollback
- **Validation**: Build + visual check
- **Time**: 2-5 minutes

### Phase 4-6 (Medium Risk)
- **Method**: Feature flags or git rollback
- **Validation**: Full functionality test
- **Time**: 5-10 minutes

### Phase 7-9 (Higher Risk)
- **Method**: Feature flags + component backup
- **Validation**: Comprehensive user flow testing
- **Time**: 10-20 minutes

### Phase 10 (Highest Risk)
- **Method**: Multiple rollback points + feature flags
- **Validation**: Full regression testing
- **Time**: 20-30 minutes

## Emergency Procedures

### If Build Completely Breaks
```bash
# 1. Immediate revert to last working commit
git reset --hard HEAD~1

# 2. If git is broken, use backup files
cp -r .rollback-backups/complete-working-state/* src/

# 3. Clear node_modules if dependency issues
rm -rf node_modules
npm install
```

### If App Renders Broken
```bash
# 1. Rollback critical files first
git checkout HEAD~1 -- src/App.tsx
git checkout HEAD~1 -- src/components/

# 2. Test incrementally
npm run dev

# 3. If still broken, full rollback
git reset --hard HEAD~1
```

### If Performance Severely Degraded
```bash
# 1. Disable performance optimizations via flags
REACT_APP_DISABLE_PERF_OPTIMIZATIONS=true

# 2. Rollback performance-related changes
git checkout HEAD~1 -- src/hooks/
git checkout HEAD~1 -- src/utils/

# 3. Verify performance restored
npm run build
```

## Communication Plan

### Team Notification (If Applicable)
```markdown
# Rollback Notification Template

**ROLLBACK EXECUTED**
- Phase: {phase-number}
- Reason: {description}
- Rollback Method: {git/feature-flag/file-level}
- Status: {successful/partial/failed}
- Next Steps: {investigation/retry/abandon}
```

### Rollback Log
```markdown
# Keep log in rollback-log.md
Date: 2025-01-14
Phase: 7
Reason: Form validation breaking user registration
Method: Feature flag disable
Result: Successful - functionality restored
Time: 8 minutes
```

## Prevention Strategies

### Pre-Phase Safety Checks
1. **Create git tag** before phase start
2. **Backup critical files** to .rollback-backups/
3. **Document current functionality** state
4. **Test rollback procedure** on non-critical files first
5. **Ensure development environment** has quick rebuild capability

### During Phase Execution
1. **Frequent commits** with descriptive messages
2. **Incremental changes** rather than big-bang updates
3. **Test after each major change** within phase
4. **Keep rollback documentation** updated
5. **Monitor build/performance** continuously

This rollback strategy ensures **maximum safety** while allowing **aggressive optimization**.