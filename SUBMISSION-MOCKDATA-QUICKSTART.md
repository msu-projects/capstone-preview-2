# Quick Reference: Submission & Review Mock Data

## TL;DR

Mock data for submissions and reviews is now available. It auto-generates 25 realistic submissions with various statuses (pending, approved, rejected, etc.).

## Quick Access

- **Demo Page**: `/admin/mock-submissions-demo`
- **Full Interface**: `/admin/my-submissions`
- **Documentation**: `docs/submission-mock-data.md`
- **Implementation Details**: `docs/submission-implementation-summary.md`

## Quick Usage

```typescript
// Import mock data functions
import { loadMockSubmissions, resetSubmissionsMockData } from '$lib/mock-data';

// Load submissions
const submissions = loadMockSubmissions();

// Reset and regenerate
resetSubmissionsMockData();
```

## Statistics (Default Generation)

- **Total**: 25 submissions
- **Pending**: ~8 (30%)
- **Approved**: ~6 (25%)
- **Rejected**: ~5 (20%)
- **Needs Revision**: ~4 (15%)
- **Conflict**: ~1 (5%)
- **Superseded**: ~1 (5%)

## What's Included

- ✅ Mock data generator with seeded random
- ✅ Auto-initialization on first use
- ✅ Integration with pending changes system
- ✅ Demo page with statistics
- ✅ Full documentation
- ✅ TypeScript types
- ✅ localStorage persistence

## Quick Commands

```bash
# Type check
pnpm check

# Start dev server
pnpm dev

# Open demo
# http://localhost:5173/admin/mock-submissions-demo
```

## Reset Mock Data

**From UI**: Visit `/admin/mock-submissions-demo` and click "Reset & Regenerate"

**From Console**:

```javascript
localStorage.removeItem('sccdp_submissions_mock');
localStorage.removeItem('sccdp_submissions_initialized');
location.reload();
```

## File Locations

| File                                                  | Purpose                  |
| ----------------------------------------------------- | ------------------------ |
| `src/lib/mock-data/submission-generator.ts`           | Generator implementation |
| `src/routes/admin/mock-submissions-demo/+page.svelte` | Demo page                |
| `src/routes/admin/my-submissions/+page.svelte`        | Full interface           |
| `docs/submission-mock-data.md`                        | Complete documentation   |

## Next Steps

1. Visit `/admin/mock-submissions-demo` to see the data
2. Visit `/admin/my-submissions` to try the full interface
3. Read `docs/submission-mock-data.md` for details
4. Customize settings in `submission-generator.ts` if needed

---

**Status**: ✅ Ready to use  
**Version**: 1.0  
**Last Updated**: January 5, 2026
