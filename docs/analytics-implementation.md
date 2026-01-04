# Analytics Implementation Documentation

## South Cotabato Convergence Data Bank - Analytics System

---

## Table of Contents

1. [Overview](#1-overview)
2. [Analytics Architecture](#2-analytics-architecture)
3. [Data Aggregation Layer](#3-data-aggregation-layer)
4. [Calculation Logic](#4-calculation-logic)
5. [Visualization Components](#5-visualization-components)
6. [Chart Types & Usage](#6-chart-types--usage)
7. [Theme-Aware Rendering](#7-theme-aware-rendering)
8. [Performance Optimizations](#8-performance-optimizations)
9. [National Benchmarking](#9-national-benchmarking)

---

## 1. Overview

The analytics system in the South Cotabato Convergence Data Bank is designed to transform raw sitio (community) data into meaningful insights through comprehensive data aggregation, statistical calculations, and interactive visualizations. The system supports:

- **Multi-Year Time Series Analysis** - Track changes in demographics, infrastructure, and economic indicators over time
- **Comparative Analytics** - Compare local metrics against national averages and benchmarks
- **Year-over-Year Trends** - Calculate growth rates and identify trends between consecutive years
- **Aggregate Dashboards** - Provide high-level overviews across multiple sitios
- **Interactive Visualizations** - Enable data exploration through responsive, theme-aware charts

### Key Design Principles

1. **Data Immutability** - Original data is never modified; calculations create new derived datasets
2. **Type Safety** - Full TypeScript type coverage ensures data integrity
3. **Reactive Updates** - Charts automatically update when underlying data changes (Svelte 5 runes)
4. **Accessibility** - Charts are theme-aware and work in both light and dark modes
5. **Performance** - Calculations are optimized with memoization and efficient algorithms

---

## 2. Analytics Architecture

### 2.1 Three-Layer Architecture

The analytics system follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│           Presentation Layer (Svelte Components)         │
│   - Dashboard Pages                                      │
│   - Chart Components (Bar, Line, Donut, etc.)           │
│   - Stat Cards & Metrics Display                        │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│        Aggregation & Calculation Layer (Utils)          │
│   - sitio-chart-aggregation.ts                          │
│   - chart-data.ts                                       │
│   - National averages comparison                        │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Data Layer (Types & Storage)               │
│   - SitioRecord with yearlyData structure              │
│   - Type definitions (dashboard.ts, sitio-profile.ts)  │
│   - LocalStorage persistence                            │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Raw Sitio Data → Aggregation Functions → Calculated Metrics → Chart Components → Visual Output
```

**Example Flow:**

1. User selects year filter (e.g., 2024)
2. System retrieves all `SitioRecord[]` from storage
3. `aggregateDemographics(sitios, 2024)` processes data for selected year
4. Returns aggregated metrics (population, households, labor force, etc.)
5. Dashboard components consume metrics and prepare chart data
6. Chart components render visualizations with theme-aware colors

---

## 3. Data Aggregation Layer

### 3.1 Core Aggregation Functions

The system provides specialized aggregation functions for different data domains:

#### `aggregateDemographics(sitios, year)`

Aggregates population and demographic data across all sitios for a specific year.

**Calculations:**

- Total population (sum of all sitio populations)
- Gender distribution (total male, total female)
- Age group distribution (youth 0-14, working age 15-64, elderly 65+)
- Labor force metrics (employed, unemployed, participation rate)
- Vulnerable groups (seniors, out-of-school youth, etc.)
- Cultural groups (Muslim population, indigenous peoples)

**Example Output:**

```typescript
{
  totalPopulation: 45230,
  totalMale: 22815,
  totalFemale: 22415,
  totalHouseholds: 9823,
  totalLaborWorkforce: 18450,
  totalUnemployed: 1285,
  youth: 15421,
  workingAge: 28567,
  elderly: 1242,
  // ... more metrics
}
```

#### `aggregateLivelihood(sitios, year)`

Aggregates economic and livelihood data.

**Calculations:**

- Average daily income across sitios
- Poverty classification (based on ₱668/day threshold - 2025 DEPDev standard)
- Worker class distribution (private household, private establishment, government, self-employed, employer, OFW)
- Crop production data (rice, corn, coconut, banana, etc.)
- Agricultural land usage
- Primary income sources

**Example Output:**

```typescript
{
  averageDailyIncomeOverall: 585,
  povertyCount: 42,
  sitiosWithIncome: 85,
  workerPrivateHousehold: 1240,
  workerPrivateEstablishment: 3580,
  workerGovernment: 890,
  workerSelfEmployed: 2450,
  workerEmployer: 320,
  workerOFW: 180,
  cropCounts: Map([
    ['rice', 65],
    ['corn', 48],
    ['coconut', 52]
  ])
}
```

#### `aggregateInfrastructure(sitios, year)`

Aggregates infrastructure and facility data.

**Calculations:**

- Road infrastructure (concrete, asphalt, gravel, natural)
- Utility access rates (electricity, toilet, internet)
- Facility availability (health centers, schools, community facilities)
- Facility condition assessments (1-5 scale: Bad to Excellent)
- Distance to nearest facilities for sitios without access

**Example Output:**

```typescript
{
  totalRoadLength: 125.4,
  concreteRoadLength: 45.2,
  asphaltRoadLength: 32.8,
  gravelRoadLength: 28.6,
  naturalRoadLength: 18.8,
  electricityPercent: 87.5,
  toiletPercent: 82.3,
  internetPercent: 45.2,
  facilitiesAvailability: {
    healthCenter: 23,
    elementarySchool: 45,
    highSchool: 12
  }
}
```

### 3.2 Multi-Year Analysis Functions

#### `getMultiYearMetrics(sitios)`

Generates time-series data across all available years.

**Process:**

1. Extracts all unique years from sitio records
2. Aggregates metrics for each year
3. Returns chronologically ordered array of yearly metrics
4. Used for trend analysis and line charts

**Example Output:**

```typescript
[
  { year: 2022, totalPopulation: 42150, totalHouseholds: 9234, ... },
  { year: 2023, totalPopulation: 43680, totalHouseholds: 9512, ... },
  { year: 2024, totalPopulation: 45230, totalHouseholds: 9823, ... }
]
```

#### `getYearComparison(sitios, currentYear)`

Calculates year-over-year changes and trends.

**Process:**

1. Gets metrics for current year
2. Gets metrics for previous year (if available)
3. Calculates percentage change for each metric
4. Determines trend direction (positive/negative)
5. Returns comparison object with trends

**Example Output:**

```typescript
{
  current: { year: 2024, totalPopulation: 45230, ... },
  previous: { year: 2023, totalPopulation: 43680, ... },
  trends: {
    population: { value: 3.5, label: 'vs last year', isPositive: true },
    households: { value: 3.3, label: 'vs last year', isPositive: true },
    employmentRate: { value: -0.8, label: 'vs last year', isPositive: false },
    averageIncome: { value: 2.1, label: 'vs last year', isPositive: true }
  }
}
```

### 3.3 Helper Utilities

#### `getLatestYearData(sitioRecord)`

Retrieves the most recent year's data from a sitio record.

#### `getDataForYear(sitioRecord, year)`

Retrieves data for a specific year from a sitio record.

#### `calculateYoYChange(currentValue, previousValue)`

Calculates year-over-year percentage change with trend direction.

---

## 4. Calculation Logic

### 4.1 Statistical Calculations

#### Employment Rate Calculation

```typescript
// Formula: (Employed / Labor Force) × 100
const employed = laborForce - unemployed;
const employmentRate = laborForce > 0
  ? (employed / laborForce) * 100
  : 0;
```

#### Labor Force Participation Rate

```typescript
// Formula: (Labor Force / Total Population) × 100
const participationRate = totalPopulation > 0
  ? (laborForce / totalPopulation) * 100
  : 0;
```

#### Poverty Classification

```typescript
// Based on 2025 DEPDev threshold: ₱668/day for family of 5
const povertyCount = sitios.filter(s =>
  s.averageDailyIncome < 668
).length;

const povertyRate = totalSitios > 0
  ? (povertyCount / totalSitios) * 100
  : 0;
```

#### Utility Coverage Rate

```typescript
// Formula: (Households with Utility / Total Households) × 100
const electricityPercent = totalHouseholds > 0
  ? (householdsWithElectricity / totalHouseholds) * 100
  : 0;
```

#### Age Dependency Ratio

```typescript
// Formula: (Dependents / Working-Age Population) × 100
// Dependents = Youth (0-14) + Elderly (65+)
const dependentPopulation = youth + elderly;
const dependencyRatio = workingAge > 0
  ? (dependentPopulation / workingAge) * 100
  : 0;
```

### 4.2 Facility Condition Scoring

Facility conditions are rated on a 1-5 scale:

- **5** = Excellent
- **4** = Good
- **3** = Average
- **2** = Poor
- **1** = Bad

**Conversion to Percentage Score:**

```typescript
// Convert 1-5 scale to 0-100 percentage
function facilityConditionToScore(condition?: number): number {
  if (!condition) return 0;
  return (condition / 5) * 100;
}
```

**Identifying Facilities Needing Repair:**

```typescript
// Facilities with condition ≤ 2 (Poor or Bad)
const needsRepair = Object.entries(facilities)
  .filter(([_, details]) =>
    details.exists === 'yes' &&
    details.condition <= 2
  );
```

### 4.3 Data Validation & Edge Cases

All calculations include defensive programming to handle edge cases:

```typescript
// Prevent division by zero
const rate = total > 0 ? (part / total) * 100 : 0;

// Handle missing data
const value = profile?.fieldName || 0;

// Null safety for optional fields
if (!sitio.availableYears || sitio.availableYears.length === 0) {
  return null;
}
```

---

## 5. Visualization Components

### 5.1 Chart Component Architecture

All chart components follow a consistent architecture:

```svelte
<script lang="ts">
  // 1. Import dependencies
  import { Chart } from '@flowbite-svelte-plugins/chart';
  import { getChartColors } from '$lib/utils/chart-colors';
  
  // 2. Define props interface
  interface Props {
    data: ChartData[];
    height?: number;
    // ... other configuration options
  }
  
  let { data, height = 300 }: Props = $props();
  
  // 3. Get theme-aware colors (reactive)
  const colors = $derived(getChartColors());
  
  // 4. Prepare chart data (reactive)
  const chartData = $derived(processData(data));
  
  // 5. Configure chart options (reactive)
  const options = $derived<ApexOptions>({
    chart: { type: 'bar', height, ... },
    series: chartData,
    colors: colors,
    // ... more configuration
  });
</script>

<!-- 6. Render chart -->
<Chart {options} />
```

### 5.2 ApexCharts Integration

The system uses ApexCharts via `@flowbite-svelte-plugins/chart` for rendering. ApexCharts provides:

- **Rich Chart Types** - Bar, Line, Donut, Radar, Treemap, Histogram, etc.
- **Interactive Features** - Tooltips, zooming, data point selection
- **Responsive Design** - Auto-adjusts to container size
- **Customizable Styling** - Full control over colors, fonts, spacing

---

## 6. Chart Types & Usage

### 6.1 Bar Chart

**Purpose:** Display categorical data with comparative values

**Use Cases:**

- Facility availability comparison
- Vulnerable sectors distribution
- Cultural groups population
- Infrastructure type distribution

**Data Structure:**

```typescript
interface BarChartData {
  label: string;
  value: number;
  color?: string;
}
```

**Features:**

- Horizontal or vertical orientation
- Distributed colors (each bar can have unique color)
- Click events for drill-down interactions
- Automatic label rotation for long category names

### 6.2 Line Chart

**Purpose:** Display trends over time

**Use Cases:**

- Population growth trends
- Income level changes over years
- Labor force participation trends
- Infrastructure development progress

**Data Structure:**

```typescript
interface LineChartSeries {
  name: string;
  data: number[];
  color?: string;
}

// Multiple series support
series: [
  { name: 'Male', data: [22000, 22400, 22815] },
  { name: 'Female', data: [21800, 22100, 22415] }
]
categories: ['2022', '2023', '2024']
```

**Features:**

- Multiple series support (compare different metrics)
- Smooth, straight, or stepline curves
- Optional data labels
- Custom Y-axis formatters (currency, percentages, etc.)
- Grid toggling

### 6.3 Donut Chart

**Purpose:** Display proportional distribution of a whole

**Use Cases:**

- Gender distribution
- Age group distribution
- Worker class breakdown
- Income classification (above/below poverty line)

**Data Structure:**

```typescript
interface DonutChartData {
  label: string;
  value: number;
  color?: string;
}
```

**Features:**

- Center label with dynamic value (updates on hover)
- Percentage display in tooltips
- Legend with color indicators
- Interactive hover states
- Custom value formatters

**Interactive Behavior:**

```typescript
// On hover, center displays segment data
hoveredIndex = config.dataPointIndex;
displayValue = data[hoveredIndex].value;
displayLabel = data[hoveredIndex].label;

// On mouse leave, shows total
hoveredIndex = null;
displayValue = total;
displayLabel = 'Total';
```

### 6.4 Radar Chart

**Purpose:** Display multivariate data on multiple axes

**Use Cases:**

- Facility availability scoring
- Infrastructure development assessment
- Community need scoring
- Comparative sitio analysis

**Features:**

- Multiple series overlay
- Polygon fill with transparency
- Configurable axis ranges
- Custom labels for each dimension

### 6.5 Treemap Chart

**Purpose:** Display hierarchical data with nested rectangles

**Use Cases:**

- Crop production distribution
- Livelihood source breakdown
- Facility type distribution by barangay

**Features:**

- Size represents value magnitude
- Color coding for categories
- Nested hierarchy support
- Tooltip with detailed information

### 6.6 Histogram Chart

**Purpose:** Display frequency distribution of continuous data

**Use Cases:**

- Income distribution ranges
- Population density distribution
- Road length distribution by type

**Features:**

- Automatic binning
- Custom bin ranges
- Frequency or density display

### 6.7 Stacked Bar Chart

**Purpose:** Show part-to-whole relationship across categories

**Use Cases:**

- Age group distribution by municipality
- Infrastructure type by barangay
- Worker class distribution over time

**Features:**

- Absolute or percentage stacking
- Multiple series stacking
- Color-coded segments

### 6.8 Progress Line Chart

**Purpose:** Track progress toward goals or targets

**Use Cases:**

- Electrification rate progress toward national average
- Poverty reduction progress
- Facility completion progress

**Features:**

- Goal line overlay
- Progress percentage display
- Color-coded (green for on-track, red for behind)

---

## 7. Theme-Aware Rendering

### 7.1 Color System

The analytics system adapts to light and dark themes automatically.

**Color Palette Structure:**

```typescript
export const lightChartColors = {
  // Text colors
  labelColor: '#64748b',      // slate-500
  valueColor: '#0f172a',      // slate-900
  titleColor: '#334155',      // slate-700
  dataLabelColor: '#334155',  // slate-700

  // Grid and borders
  gridColor: '#e2e8f0',       // slate-200
  borderColor: '#e2e8f0',

  // Background
  tooltipBackground: '#ffffff',
  tooltipText: '#0f172a',

  // Chart series colors (HSL for consistency)
  primary: 'hsl(217, 91%, 60%)',    // Blue
  success: 'hsl(142, 71%, 45%)',    // Green
  warning: 'hsl(48, 96%, 53%)',     // Yellow
  danger: 'hsl(0, 84%, 60%)',       // Red
  purple: 'hsl(280, 70%, 60%)',
  pink: 'hsl(340, 82%, 52%)',
  cyan: 'hsl(189, 85%, 45%)',
  orange: 'hsl(24, 95%, 53%)'
};

export const darkChartColors = {
  // Brighter colors for visibility on dark background
  labelColor: '#94a3b8',      // slate-400
  valueColor: '#f1f5f9',      // slate-100
  // ... adjusted values for dark mode

  // Brighter series colors
  primary: 'hsl(217, 91%, 65%)',    // Lighter blue
  success: 'hsl(142, 71%, 55%)',    // Lighter green
  // ... brighter variants
};
```

### 7.2 Reactive Theme Updates

Charts automatically update when the theme changes:

```typescript
// Theme store (Svelte 5 rune)
const themeStore = { resolvedTheme: $state('light') };

// Reactive color derivation
const colors = $derived(
  themeStore.resolvedTheme === 'dark'
    ? darkChartColors
    : lightChartColors
);

// Chart options automatically update when colors change
const options = $derived<ApexOptions>({
  xaxis: {
    labels: {
      style: { colors: colors.labelColor }
    }
  },
  yaxis: {
    labels: {
      style: { colors: colors.labelColor }
    }
  },
  // ... other theme-aware properties
});
```

### 7.3 Color Assignment Strategy

**Distributed Colors (Bar Charts):**

```typescript
// Each bar gets a unique color from palette
const distributedColors = data.map((_, i) =>
  palette[i % palette.length]
);
```

**Series Colors (Line Charts):**

```typescript
// Each series gets a consistent color
const series = [
  { name: 'Male', color: colors.primary },
  { name: 'Female', color: colors.pink }
];
```

**Semantic Colors:**

```typescript
// Colors based on meaning
const incomeData = [
  { label: 'Below Poverty', color: colors.danger },
  { label: 'Above Poverty', color: colors.success }
];
```

---

## 8. Performance Optimizations

### 8.1 Reactive Computations (Svelte 5)

The system uses Svelte 5 runes for optimal reactivity:

```typescript
// $derived - Automatically recomputes when dependencies change
const demographics = $derived(
  aggregateDemographics(sitios, selectedYear)
);

// Memoization - Only recalculates when sitios or selectedYear changes
const chartData = $derived(
  prepareChartData(demographics)
);
```

**Benefits:**

- No manual dependency tracking
- Automatic batching of updates
- Fine-grained reactivity (only affected components re-render)

### 8.2 Data Processing Efficiency

**Single-Pass Aggregation:**

```typescript
// Process all metrics in single loop instead of multiple iterations
for (const sitio of sitios) {
  totalPopulation += sitio.totalPopulation;
  totalMale += sitio.population.totalMale;
  totalFemale += sitio.population.totalFemale;
  // ... all calculations in one pass
}
```

**Early Filtering:**

```typescript
// Filter by year before processing
const relevantSitios = sitios.filter(s =>
  s.yearlyData[year] !== undefined
);
```

**Lazy Evaluation:**

```typescript
// Only calculate when needed
const expensiveMetric = $derived.by(() => {
  if (!showDetailedAnalysis) return null;
  return calculateComplexMetric(data);
});
```

### 8.3 Chart Rendering Optimizations

**Conditional Rendering:**

```svelte
{#if data.length > 0}
  <Chart {options} />
{:else}
  <EmptyState />
{/if}
```

**Toolbar Disabling:**

```typescript
// Disable unnecessary features
chart: {
  toolbar: { show: false },  // Removes download/zoom controls
  animations: { enabled: true, speed: 800 }  // Fast but smooth
}
```

**Data Sampling (for large datasets):**

```typescript
// Limit data points for performance
const sampledData = data.length > 100
  ? sampleData(data, 100)
  : data;
```

---

## 9. National Benchmarking

### 9.1 National Averages Reference Data

The system maintains reference data for comparison:

**Infrastructure & Utilities:**

```typescript
export const NATIONAL_AVERAGES = {
  electricity: {
    percent: 93.12,
    source: 'Department of Energy (DOE), 2024'
  },
  sanitaryToilet: {
    percent: 91.7,
    source: 'PSA 2020 Census'
  },
  internet: {
    percent: 48.8,
    source: 'PSA/DICT 2024 NICTHS Survey'
  },
  pavedRoads: {
    percent: 99.11,
    source: 'DPWH Atlas 2024'
  }
};
```

**Labor & Employment:**

```typescript
export const LABOR_EMPLOYMENT_AVERAGES = {
  unemploymentRate: {
    percent: 5.0,
    source: 'PSA, October 2025'
  },
  employmentRate: {
    percent: 95.0,
    source: 'PSA, October 2025'
  },
  laborForceParticipationRate: {
    percent: 63.6,
    source: 'PSA, October 2025'
  },
  ageDependencyRatio: {
    percent: 48.9,
    source: 'World Bank, 2025'
  }
};
```

### 9.2 Comparison Logic

**Status Determination:**

```typescript
function getLaborComparisonStatus(
  localValue: number,
  nationalValue: number,
  metric: 'unemployment' | 'employment' | 'participation' | 'dependency'
): {
  status: 'better' | 'worse' | 'similar';
  difference: number;
  label: string;
} {
  const difference = localValue - nationalValue;
  const absDiff = Math.abs(difference);
  const threshold = 2; // ±2% considered similar

  if (absDiff <= threshold) {
    return {
      status: 'similar',
      difference,
      label: 'Similar to national average'
    };
  }

  // For unemployment & dependency, lower is better
  if (metric === 'unemployment' || metric === 'dependency') {
    return {
      status: localValue < nationalValue ? 'better' : 'worse',
      difference,
      label: localValue < nationalValue
        ? 'Below national average'
        : 'Above national average'
    };
  }

  // For employment & participation, higher is better
  return {
    status: localValue > nationalValue ? 'better' : 'worse',
    difference,
    label: localValue > nationalValue
      ? 'Above national average'
      : 'Below national average'
  };
}
```

**Visual Indicators:**

```svelte
<!-- Comparison badge -->
{#if comparison.status === 'better'}
  <Badge variant="success">
    <TrendingUp class="h-3 w-3" />
    {Math.abs(comparison.difference).toFixed(1)}% better
  </Badge>
{:else if comparison.status === 'worse'}
  <Badge variant="destructive">
    <TrendingDown class="h-3 w-3" />
    {Math.abs(comparison.difference).toFixed(1)}% worse
  </Badge>
{:else}
  <Badge variant="secondary">
    <Minus class="h-3 w-3" />
    Similar to national
  </Badge>
{/if}
```

### 9.3 Contextual Help

Comparisons include contextual information:

```svelte
<HelpTooltip>
  <p class="font-semibold">National Average: {national.percent}%</p>
  <p class="text-xs text-muted-foreground">{national.source}</p>
  <p class="mt-2 text-xs">
    Your region: {local.percent}% ({comparison.label})
  </p>
</HelpTooltip>
```

---

## Summary

The analytics system in the South Cotabato Convergence Data Bank provides a robust, performant, and user-friendly way to explore and understand community data. Key strengths include:

1. **Comprehensive Aggregation** - Multi-dimensional data processing across demographics, economics, and infrastructure
2. **Temporal Analysis** - Multi-year tracking with year-over-year trend calculations
3. **National Benchmarking** - Contextualized comparisons with Philippine national averages
4. **Rich Visualizations** - Eight chart types covering various analytical needs
5. **Theme Awareness** - Automatic adaptation to light/dark modes
6. **Type Safety** - Full TypeScript coverage preventing data errors
7. **Performance** - Optimized reactive computations and efficient algorithms
8. **Accessibility** - Clear labels, tooltips, and contextual help

The modular architecture allows for easy extension with new metrics, chart types, or data sources while maintaining consistency and reliability across the system.
