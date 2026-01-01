# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

South Cotabato Convergence Data Bank - A government transparency portal for tracking vulnerable communities and CATCH-UP project implementation. This is a SvelteKit application using Svelte 5 with TypeScript, Tailwind CSS v4, and shadcn-svelte UI components.

The project is being migrated from a vanilla HTML/CSS/JavaScript prototype (located in `/sample/`) to a modern SvelteKit application.

## Development Commands

```bash
# Start development server
npm run dev
# or with auto-open browser
npm run dev -- --open

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
# or in watch mode
npm run check:watch

# Linting and formatting
npm run lint          # Check code style
npm run format        # Auto-format code
```

## Architecture Overview

### SvelteKit Structure

This is a standard SvelteKit application with file-based routing:

- **Root Layout** (`src/routes/+layout.svelte`): Global styles and favicon
- **Admin Area** (`src/routes/admin/`): Protected admin interface with dedicated layout
  - Uses `+layout.svelte` to wrap all admin routes with `AdminSidebar`
  - Routes include dashboard, sitios, projects, import, and users
- **Public Area** (`src/routes/`): Public-facing pages (to be implemented)

### Component Organization

Components are organized by domain:

- `$lib/components/ui/` - shadcn-svelte UI primitives (Button, Card, Table, Badge, Progress, etc.)
- `$lib/components/layout/` - Layout components (AdminSidebar)
- `$lib/components/admin/` - Admin-specific components
- `$lib/components/projects/` - Project-related components
- `$lib/components/sitios/` - Sitio-related components
- `$lib/components/dashboard/` - Dashboard widgets
- `$lib/components/charts/` - Chart visualizations
- `$lib/components/map/` - Map-related components

### Data Layer

Currently using mock data for development:

- **Types** (`src/lib/types/index.ts`): TypeScript interfaces for Project, Sitio, Activity, Stats, ChartDataItem
- **Mock Data** (`src/lib/mock-data/index.ts`): Sample data for sitios, projects, activities, stats, and charts

Key domain models:
- **Project**: Represents development projects with status tracking (planning, in-progress, completed, suspended), budget, beneficiaries, and completion percentage
- **Sitio**: Vulnerable communities with location coordinates, population, and household data
- **Activity**: User activity log entries
- **Stats**: Dashboard statistics aggregates

### UI Component System

Using shadcn-svelte (v4) with Tailwind CSS v4:

- Configuration in `components.json` specifies aliases and registry
- Primary color: #051250 (deep navy blue) - matches the CATCH-UP branding
- Blue is used as the primary color in both light and dark modes
- Green is used only for success states and accents (complementing the logo's leaf design)
- Global styles in `src/routes/layout.css` using oklch color space for better color perception
- Custom color tokens: `success` (green) and `warning` (yellow/gold) for status indicators
- Chart colors use variations of blue with green accents
- Components follow shadcn-svelte patterns with TypeScript

Import patterns:
```typescript
// UI components use namespace imports for composite components
import * as Card from '$lib/components/ui/card';
import * as Table from '$lib/components/ui/table';

// Single components use named imports
import { Button } from '$lib/components/ui/button';
import { Badge } from '$lib/components/ui/badge';
```

### Path Aliases

Configured in components.json and recognized by SvelteKit:
- `$lib` → `src/lib`
- `$lib/components` → `src/lib/components`
- `$lib/components/ui` → `src/lib/components/ui`
- `$lib/utils` → `src/lib/utils`
- `$lib/hooks` → `src/lib/hooks`

## UI Patterns and Conventions

### Project Status Handling

Projects have four statuses with specific badge variants:
- `planning` → `secondary` badge
- `in-progress` → `warning` badge (yellow)
- `completed` → `success` badge (green)
- `suspended` → `destructive` badge (red)

Status label formatting uses the `getStatusLabel()` helper to convert status codes to display text.

### Admin Dashboard Structure

The admin dashboard (`src/routes/admin/+page.svelte`) follows this layout:
1. **Header**: Page title with action buttons (Export Report, New Project)
2. **Stats Grid**: 4-column grid showing key metrics (Total Sitios, Active Projects, Completed Projects, Total Beneficiaries)
3. **Main Grid**: 2-column layout (Recent Projects table + Activity Feed)
4. **Quick Stats**: 2-column grid (Projects by Status + Top Categories)

All data is reactive and sourced from `$lib/mock-data`.

### Icon Usage

Using `@lucide/svelte` for icons. Import and use as components:
```typescript
import { MapPin, Activity, CheckCircle, TrendingUp } from '@lucide/svelte';

<MapPin class="size-4 text-primary" />
```

## Svelte 5 Patterns

This project uses Svelte 5 with runes:

- **Props**: Use `let { propName } = $props()` instead of `export let`
- **Children**: Use `let { children } = $props()` and `{@render children()}`
- **State**: Use `$state()` for reactive state
- **Derived**: Use `$derived()` for computed values
- **Effects**: Use `$effect()` for side effects

## Migration from Prototype

The `/sample/` directory contains the original vanilla HTML/CSS/JS prototype. Key concepts to preserve during migration:

1. **Project Monitoring Tracker**: Admin project list mirrors the official 20% LDF monitoring form with grouped headers for financials, physical status, employment, contract timeline, status remarks, and catch-up plans
2. **Government Blue Theme**: Professional, accessible color scheme
3. **Interactive Map**: Leaflet.js for 200+ sitio markers (to be implemented)
4. **Data Visualizations**: Chart.js for demographics and project analytics (to be implemented)
5. **Responsive Design**: Mobile-first approach

## Code Style Guidelines

- TypeScript for all new code
- Functional helpers for formatting (formatNumber, formatActivityTime, truncateText)
- Explicit types for component props
- Use Tailwind utility classes (follow the v4 syntax)
- ESLint and Prettier are configured - run `npm run lint` before committing

## Known Implementation Status

**Implemented:**
- Admin dashboard with stats, recent projects, activity feed
- Admin sidebar navigation
- UI component library (Button, Card, Table, Badge, Progress)
- TypeScript types for domain models
- Mock data layer

**To Be Implemented:**
- Public-facing pages
- Sitio management pages
- Project management pages (list, form, detail)
- Data import functionality
- User management
- Interactive map (Leaflet.js integration)
- Charts and analytics (Chart.js integration)
- Backend API integration (currently using mock data)
- Authentication/authorization
- ignore the backend database for now. this project is just a prototype.