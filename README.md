# South Cotabato Convergence Data Bank

A comprehensive project tracking and monitoring system for the South Cotabato CATCH-UP Program, built with Svelte 5 and SvelteKit. This system implements an **Enhanced Multi-Sitio Project Tracking System** designed for government transparency and convergence project management.

## 🚀 Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn-svelte](https://www.shadcn-svelte.com/)
- **Icons:** [Lucide Svelte](https://lucide.dev/icons/)
- **Charts:** [LayerChart](https://www.layerchart.com/)
- **Package Manager:** [pnpm](https://pnpm.io/)

## ✨ Key Features

### Enhanced Project Tracking System (v2)

Based on the Improved Project Tracking & Monitoring System documentation, this system implements:

#### Core Design Principles
- **Monthly Tracking Cycles:** All monitoring activities aligned to monthly reporting periods
- **Multi-Sitio Projects:** Single projects can benefit multiple communities simultaneously
- **Category-Driven Design:** Project types dynamically determined by selected category
- **Performance-Based Monitoring:** Focus on deliverables and measurable outputs

#### 5-Phase Project Creation Workflow

1. **Category & Project Selection**
   - 6 main categories: Infrastructure, Agriculture, Education, Health, Livelihood, Environment
   - 37 predefined project types with specific indicators
   - Dynamic project type selection based on category
   - Auto-populated performance indicators

2. **Location & Beneficiaries**
   - Multi-sitio selection interface
   - Per-sitio beneficiary targets and priorities
   - Coverage summary with geographic distribution
   - Local focal person assignment

3. **Performance Targets**
   - Category-specific deliverables (auto-populated from project type)
   - Universal performance indicators (timeline, budget, beneficiaries, employment)
   - Target start/end dates
   - Direct and indirect beneficiary tracking

4. **Accountability & Partners**
   - Project management team structure
   - Implementation partners (NGOs, CSOs, Private Sector)
   - LGU counterpart personnel
   - Provincial oversight structure
   - Sitio-level coordinators for each selected sitio

5. **Budget & Resources**
   - Total project budget with multi-source funding breakdown
   - Funding sources: Provincial, National, Partner, LGU Counterpart
   - Budget component allocation by category
   - Funding gap/surplus validation

### Traditional Features
- **Admin Dashboard:** Comprehensive management interface
- **Sitio Management:** Track 200+ vulnerable communities
- **Project Monitoring:** Delays, recovery actions, and accountability tracking
- **Public Portal:** Transparency and community engagement

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd capstone-preview-2
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## 📂 Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── admin/projects/     # Enhanced project form components
│   │   │   ├── CategoryProjectSelectionTab.svelte
│   │   │   ├── LocationBeneficiariesTab.svelte
│   │   │   ├── PerformanceTargetsTab.svelte
│   │   │   ├── AccountabilityPartnersTab.svelte
│   │   │   └── BudgetResourcesTab.svelte
│   │   ├── ui/                 # shadcn-svelte UI components
│   │   └── ...
│   ├── config/
│   │   └── project-categories.ts  # Category & project type definitions
│   ├── hooks/                  # Svelte hooks
│   ├── mock-data/
│   │   ├── index.ts            # Original mock data
│   │   └── enhanced-projects.ts # Enhanced multi-sitio project data
│   └── types/
│       └── index.ts            # Enhanced type definitions
├── routes/
│   ├── admin/
│   │   ├── projects/
│   │   │   ├── new/+page.svelte       # New 5-tab project creation
│   │   │   └── [id]/edit/+page.svelte # Project edit page
│   │   └── ...
│   └── ...
└── ...
```

## 📊 Data Architecture

### New Entity Types

- **Category:** 6 main project categories with associated project types
- **ProjectType:** 37 predefined project types with default indicators
- **ProjectSitio:** Multi-sitio project assignments with per-sitio targets
- **PerformanceTarget:** Category-specific performance indicators and targets
- **MonthlyProgress:** Monthly tracking of outputs and beneficiaries (planned feature)
- **MonthlyBudgetUtilization:** Monthly budget tracking (planned feature)
- **ProjectIssue:** Issue management and adaptive planning (planned feature)
- **FundingSource:** Multi-source funding breakdown
- **BudgetComponent:** Budget allocation by component

### Enhanced Project Model

The `Project` interface now supports:
- Category-driven classification (`category_key`, `project_type_id`)
- Multi-sitio assignments (`project_sitios[]`)
- Performance targets (`performance_targets[]`)
- Monthly progress tracking (`monthly_progress[]`, `monthly_budget[]`)
- Issue management (`issues[]`)
- Partner management (`partners[]`, `funding_sources[]`)
- Enhanced team structure (`project_manager_team`, `sitio_coordinators`, `oversight_structure`)

## 🎯 Implementation Status

### ✅ Completed Features

1. **Enhanced Type System**
   - Category, ProjectType, and PerformanceIndicator types
   - Multi-sitio support with ProjectSitio type
   - Monthly progress and budget tracking types
   - Issue management and partner types

2. **Category Configuration**
   - 6 main categories defined
   - 37 project types with predefined indicators
   - Helper functions for category/project type retrieval

3. **5-Tab Project Creation Interface**
   - Tab 1: Category & Project Selection with dynamic project types
   - Tab 2: Location & Beneficiaries with multi-sitio selection
   - Tab 3: Performance Targets with category-specific deliverables
   - Tab 4: Accountability & Partners with team structure
   - Tab 5: Budget & Resources with funding source breakdown

4. **Enhanced Mock Data**
   - Sample multi-sitio projects
   - Performance targets and monthly progress data
   - Funding sources and budget components

### 🚧 Planned Features (Future Enhancements)

1. **Monthly Monitoring Interface**
   - Quick monthly update form
   - Per-sitio progress tracking
   - Photo documentation upload
   - Automated performance scoring

2. **Issue Management System**
   - Issue tracking with categories
   - Impact assessment
   - Mitigation action planning
   - Priority adjustment

3. **Enhanced Dashboard**
   - Category-based project views
   - Multi-sitio progress matrix
   - Performance analytics
   - Monthly KPI tracking

4. **Public Transparency Interface**
   - Interactive project map with sitio markers
   - Category-based public views
   - Monthly progress reports
   - Beneficiary testimonials

5. **Automated Reporting**
   - Provincial-level monthly reports
   - Category performance analysis
   - Geographic equity analysis
   - Project-level variance reports

## 📜 Scripts

- `pnpm dev`: Start the development server
- `pnpm build`: Build the application for production
- `pnpm preview`: Preview the production build locally
- `pnpm check`: Run Svelte check for type safety
- `pnpm lint`: Run ESLint and Prettier
- `pnpm format`: Format code with Prettier

## 📖 Documentation

- See `/docs/improved-project-tracking-system-v2.md` for detailed system requirements
- See `/docs/project-tracking-overview.md` for system overview
- See `CLAUDE.md` for development guidelines and project context
