<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { stats } from '$lib/mock-data';
  import {
    ArrowRight,
    BarChart3,
    Database,
    FileText,
    Folder,
    GitCompare,
    History,
    MapPin,
    Settings2,
    Shield,
    Target,
    TrendingUp,
    Users
  } from '@lucide/svelte';

  // Format large numbers
  function formatNumber(num: number): string {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  }

  const quickStats = [
    {
      label: 'Total Sitios',
      value: stats.total_sitios,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Municipalities',
      value: 12, // South Cotabato has 12 municipalities
      icon: MapPin,
      color: 'text-emerald-600'
    },
    {
      label: 'Communities Profiled',
      value: stats.total_sitios,
      icon: Database,
      color: 'text-primary'
    },
    {
      label: 'Projects Implemented',
      value: stats.total_projects,
      icon: Folder,
      color: 'text-primary'
    }
  ];

  const features = [
    {
      icon: Database,
      title: 'Comprehensive Sitio Profiles',
      description:
        'Access detailed demographic, infrastructure, and socioeconomic data about vulnerable communities across South Cotabato.'
    },
    {
      icon: BarChart3,
      title: 'Interactive Data Visualization',
      description:
        'Explore data through interactive charts, maps, and dashboards with filtering by municipality and barangay.'
    },
    {
      icon: GitCompare,
      title: 'Community Comparison',
      description:
        'Compare multiple sitios side-by-side across key indicators to identify patterns and prioritize interventions.'
    },
    {
      icon: Folder,
      title: 'Project Tracking',
      description:
        'Monitor development projects and their impact across communities with detailed information and photo documentation.'
    },
    {
      icon: History,
      title: 'Historical Trends',
      description:
        'Track changes over time with yearly data snapshots to measure progress and identify emerging needs.'
    },
    {
      icon: FileText,
      title: 'Comprehensive Reports',
      description:
        'Generate downloadable PDF reports with aggregated statistics and visualizations for evidence-based planning.'
    }
  ];
</script>

<svelte:head>
  <title>South Cotabato Convergence Data Bank</title>
  <meta
    name="description"
    content="South Cotabato Convergence Data Bank - Comprehensive sitio profiles and intelligent recommendations for community development initiatives."
  />
</svelte:head>

<div>
  <!-- Hero Section -->
  <section
    class="relative overflow-hidden bg-linear-to-b from-primary/5 via-background to-background py-20 md:py-32"
  >
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-4xl text-center">
        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-sm"
        >
          <span class="size-2 animate-pulse rounded-full bg-primary"></span>
          Community Data & Development Portal
        </div>
        <h1 class="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-7xl">
          South Cotabato
          <span
            class="block bg-linear-to-r from-primary to-primary/60 bg-clip-text pb-1 text-transparent"
          >
            Convergence Data Bank
          </span>
        </h1>
        <p class="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Empowering communities through accessible data. Explore comprehensive profiles of
          vulnerable communities to support data-driven development programs, projects, and
          activities.
        </p>
        <div class="flex flex-col justify-center gap-4 sm:flex-row">
          <Button href="/sitios" size="lg" class="gap-2 shadow-lg">
            <Database class="size-5" />
            Explore Community Data
            <ArrowRight class="size-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Enhanced decorative elements -->
    <div
      class="pointer-events-none absolute -top-32 left-1/2 size-150 -translate-x-1/2 rounded-full bg-linear-to-r from-primary/20 via-primary/10 to-transparent opacity-50 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute bottom-0 left-0 size-64 rounded-full bg-linear-to-tr from-primary/10 to-transparent blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute right-0 bottom-0 size-64 rounded-full bg-linear-to-tl from-primary/10 to-transparent blur-3xl"
    ></div>
  </section>

  <!-- Quick Stats -->
  <section class="border-y bg-muted/30 py-12">
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-5xl">
        <div class="mb-8 text-center">
          <h2 class="mb-2 text-2xl font-bold md:text-3xl">By The Numbers</h2>
          <p class="text-muted-foreground">Real-time data across South Cotabato</p>
        </div>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {#each quickStats as stat}
            <Card.Root class="border-2 transition-all hover:shadow-lg">
              <Card.Content class="p-6">
                <div class="mb-3 flex justify-center">
                  <div class="rounded-full bg-primary/10 p-3">
                    <stat.icon class="size-6 {stat.color}" />
                  </div>
                </div>
                <p class="mb-1 text-center text-3xl font-bold md:text-4xl">
                  {formatNumber(stat.value ?? 0)}
                </p>
                <p class="text-center text-xs font-medium text-muted-foreground md:text-sm">
                  {stat.label}
                </p>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- About Section with Features -->
  <section class="py-20">
    <div class="container mx-auto px-4">
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <h2 class="mb-4 text-3xl font-bold md:text-4xl">Empowering Communities Through Data</h2>
        <p class="text-lg leading-relaxed text-muted-foreground">
          The Convergence Data Bank provides comprehensive, transparent, and accessible information
          about vulnerable communities to guide evidence-based development initiatives across South
          Cotabato. Our system combines detailed community profiling, project tracking, and powerful
          analytics to support data-driven decision-making.
        </p>
      </div>

      <div class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each features as feature}
          <Card.Root class="border-2 transition-all hover:border-primary/50 hover:shadow-xl">
            <Card.Content class="p-6">
              <div
                class="mb-4 flex size-14 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5"
              >
                <feature.icon class="size-7 text-primary" />
              </div>
              <h3 class="mb-2 text-lg font-bold">{feature.title}</h3>
              <p class="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>
  </section>

  <!-- Key Capabilities -->
  <section class="border-y bg-muted/10 py-16">
    <div class="container mx-auto px-4">
      <div class="mx-auto mb-12 max-w-3xl text-center">
        <h2 class="mb-4 text-3xl font-bold md:text-4xl">
          Powerful Tools for Data-Driven Development
        </h2>
        <p class="text-lg leading-relaxed text-muted-foreground">
          Built with transparency and accountability at its core, the system provides comprehensive
          tools for community development planning and monitoring.
        </p>
      </div>

      <div class="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card.Root class="border transition-all hover:shadow-lg">
          <Card.Content class="p-6 text-center">
            <div
              class="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-blue-500/10"
            >
              <MapPin class="size-6 text-blue-600" />
            </div>
            <h3 class="mb-2 font-semibold">Interactive Maps</h3>
            <p class="text-sm text-muted-foreground">
              Visualize sitio locations, boundaries, and project sites on interactive maps
            </p>
          </Card.Content>
        </Card.Root>

        <Card.Root class="border transition-all hover:shadow-lg">
          <Card.Content class="p-6 text-center">
            <div
              class="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-emerald-500/10"
            >
              <TrendingUp class="size-6 text-emerald-600" />
            </div>
            <h3 class="mb-2 font-semibold">Progress Tracking</h3>
            <p class="text-sm text-muted-foreground">
              Monitor changes across multiple years with historical data snapshots
            </p>
          </Card.Content>
        </Card.Root>

        <Card.Root class="border transition-all hover:shadow-lg">
          <Card.Content class="p-6 text-center">
            <div
              class="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-purple-500/10"
            >
              <Settings2 class="size-6 text-purple-600" />
            </div>
            <h3 class="mb-2 font-semibold">Custom Fields</h3>
            <p class="text-sm text-muted-foreground">
              Flexible data collection with administrator-defined custom fields
            </p>
          </Card.Content>
        </Card.Root>

        <Card.Root class="border transition-all hover:shadow-lg">
          <Card.Content class="p-6 text-center">
            <div
              class="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-amber-500/10"
            >
              <Shield class="size-6 text-amber-600" />
            </div>
            <h3 class="mb-2 font-semibold">Audit Trail</h3>
            <p class="text-sm text-muted-foreground">
              Complete accountability with comprehensive tracking of all system actions
            </p>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  </section>

  <!-- Main Modules -->
  <section class="bg-linear-to-b from-muted/30 to-background py-20">
    <div class="container mx-auto px-4">
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <h2 class="mb-4 text-3xl font-bold md:text-4xl">Start Exploring</h2>
        <p class="text-lg leading-relaxed text-muted-foreground">
          Dive into comprehensive community profiles, compare sitios, track development projects,
          and generate insightful reports to support evidence-based planning.
        </p>
      </div>

      <div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        <!-- Sitio Data Module -->
        <a href="/sitios" class="group">
          <Card.Root
            class="h-full border-2 py-0 transition-all hover:border-primary/50 hover:shadow-2xl"
          >
            <Card.Content class="p-8">
              <div
                class="mb-6 flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 transition-all group-hover:scale-110 group-hover:shadow-lg"
              >
                <Database class="size-10 text-primary" />
              </div>
              <h3 class="mb-4 text-2xl font-bold transition-colors group-hover:text-primary">
                Community Profiles
              </h3>
              <p class="mb-6 text-sm leading-relaxed text-muted-foreground">
                Browse comprehensive profiles of vulnerable communities including demographics,
                infrastructure, facilities, livelihood, and socioeconomic data with multi-year
                historical tracking.
              </p>
              <ul class="mb-8 space-y-3">
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-primary/10 p-1">
                    <MapPin class="size-4 text-primary" />
                  </div>
                  <span class="text-sm">Interactive maps with sitio locations</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-primary/10 p-1">
                    <Users class="size-4 text-primary" />
                  </div>
                  <span class="text-sm">Demographics and population data</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-primary/10 p-1">
                    <BarChart3 class="size-4 text-primary" />
                  </div>
                  <span class="text-sm">Visual charts and dashboards</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-primary/10 p-1">
                    <History class="size-4 text-primary" />
                  </div>
                  <span class="text-sm">Historical trends across years</span>
                </li>
              </ul>
            </Card.Content>
            <Card.Footer class="pb-10">
              <div class="flex items-center gap-2 text-lg font-semibold text-primary">
                Explore Communities
                <ArrowRight class="size-5 transition-transform group-hover:translate-x-2" />
              </div>
            </Card.Footer>
          </Card.Root>
        </a>

        <!-- Comparison Module -->
        <a href="/compare" class="group">
          <Card.Root
            class="h-full border-2 py-0 transition-all hover:border-primary/50 hover:shadow-2xl"
          >
            <Card.Content class="p-8">
              <div
                class="mb-6 flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500/20 to-blue-500/5 transition-all group-hover:scale-110 group-hover:shadow-lg"
              >
                <GitCompare class="size-10 text-blue-600" />
              </div>
              <h3 class="mb-4 text-2xl font-bold transition-colors group-hover:text-blue-600">
                Compare Communities
              </h3>
              <p class="mb-6 text-sm leading-relaxed text-muted-foreground">
                Compare multiple sitios side-by-side to identify disparities, patterns, and
                priorities across key development indicators.
              </p>
              <ul class="mb-8 space-y-3">
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-blue-500/10 p-1">
                    <GitCompare class="size-4 text-blue-600" />
                  </div>
                  <span class="text-sm">Side-by-side community comparison</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-blue-500/10 p-1">
                    <Target class="size-4 text-blue-600" />
                  </div>
                  <span class="text-sm">Key indicator analysis</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-blue-500/10 p-1">
                    <BarChart3 class="size-4 text-blue-600" />
                  </div>
                  <span class="text-sm">Visual comparison charts</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-blue-500/10 p-1">
                    <FileText class="size-4 text-blue-600" />
                  </div>
                  <span class="text-sm">Exportable comparison reports</span>
                </li>
              </ul>
            </Card.Content>
            <Card.Footer class="">
              <div class="flex items-center gap-2 text-lg font-semibold text-blue-600">
                Compare Sitios
                <ArrowRight class="size-5 transition-transform group-hover:translate-x-2" />
              </div>
            </Card.Footer>
          </Card.Root>
        </a>

        <!-- FUTURE FEATURE: Uncomment when recommendation system is ready -->
        <!-- <a href="/recommendations" class="group">
					<Card.Root class="h-full transition-shadow hover:shadow-lg">
						<Card.Content class="p-8">
							<div
								class="mb-6 flex size-16 items-center justify-center rounded-xl bg-amber-500/10 transition-colors group-hover:bg-amber-500/20"
							>
								<Lightbulb class="size-8 text-amber-600" />
							</div>
							<h3 class="mb-3 text-2xl font-bold transition-colors group-hover:text-primary">
								Recommendation System
							</h3>
							<p class="mb-4 text-muted-foreground">
								Discover data-driven recommendations for Programs, Projects, and Activities (PPAs)
								tailored to each community's specific needs.
							</p>
							<ul class="mb-6 space-y-2 text-sm text-muted-foreground">
								<li class="flex items-start gap-2">
									<Lightbulb class="mt-0.5 size-4 shrink-0 text-amber-600" />
									<span>Smart matching of PPAs to community needs</span>
								</li>
								<li class="flex items-start gap-2">
									<Target class="mt-0.5 size-4 shrink-0 text-amber-600" />
									<span>Priority-based recommendations (Critical to Low)</span>
								</li>
								<li class="flex items-start gap-2">
									<Search class="mt-0.5 size-4 shrink-0 text-amber-600" />
									<span>Find suitable sitios for specific project types</span>
								</li>
							</ul>
							<div class="flex items-center gap-2 font-medium text-primary">
								View Recommendations
								<ArrowRight class="size-5 transition-transform group-hover:translate-x-1" />
							</div>
						</Card.Content>
					</Card.Root>
				</a> -->
      </div>
    </div>
  </section>
</div>
