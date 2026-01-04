<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { stats } from '$lib/mock-data';
  import { ArrowRight, Database, Folder, MapPin, Search, Target, Users } from '@lucide/svelte';

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
    // FUTURE FEATURE: Uncomment when recommendation system is ready
    // {
    // 	icon: Lightbulb,
    // 	title: 'Smart Recommendations',
    // 	description:
    // 		"Data-driven recommendations for Programs, Projects, and Activities (PPAs) tailored to each community's specific needs."
    // },
    {
      icon: Search,
      title: 'Transparent & Accessible',
      description:
        'Public access to community data enables informed decision-making and fosters accountability in local governance.'
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
            class="block bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent"
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
          Cotabato.
        </p>
      </div>

      <div class="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        {#each features as feature}
          <Card.Root class="border-2 transition-all hover:border-primary/50 hover:shadow-xl">
            <Card.Content class="p-8">
              <div
                class="mb-6 flex size-16 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5"
              >
                <feature.icon class="size-8 text-primary" />
              </div>
              <h3 class="mb-3 text-xl font-bold">{feature.title}</h3>
              <p class="leading-relaxed text-muted-foreground">{feature.description}</p>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>
  </section>

  <!-- Main Modules -->
  <section class="bg-linear-to-b from-muted/30 to-background py-20">
    <div class="container mx-auto px-4">
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <h2 class="mb-4 text-3xl font-bold md:text-4xl">Explore the System</h2>
        <p class="text-lg leading-relaxed text-muted-foreground">
          Access comprehensive community data and development projects across South Cotabato
          Province.
        </p>
      </div>

      <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <!-- Sitio Data Module -->
        <a href="/sitios" class="group">
          <Card.Root
            class="h-full border-2 transition-all hover:border-primary/50 hover:shadow-2xl"
          >
            <Card.Content class="p-8">
              <div
                class="mb-6 flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 transition-all group-hover:scale-110 group-hover:shadow-lg"
              >
                <Database class="size-10 text-primary" />
              </div>
              <h3
                class="mb-4 text-2xl font-bold transition-colors group-hover:text-primary md:text-3xl"
              >
                Community Profiles
              </h3>
              <p class="mb-6 leading-relaxed text-muted-foreground">
                Browse comprehensive profiles of vulnerable communities including demographics,
                infrastructure, facilities, livelihood, and socioeconomic data.
              </p>
              <ul class="mb-8 space-y-3">
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-primary/10 p-1">
                    <MapPin class="size-4 text-primary" />
                  </div>
                  <span class="text-sm"
                    >Interactive maps showing sitio locations and boundaries</span
                  >
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-primary/10 p-1">
                    <Users class="size-4 text-primary" />
                  </div>
                  <span class="text-sm">Detailed demographic and population statistics</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-primary/10 p-1">
                    <Target class="size-4 text-primary" />
                  </div>
                  <span class="text-sm">Infrastructure, utilities, and facility assessments</span>
                </li>
              </ul>
              <div class="flex items-center gap-2 text-lg font-semibold text-primary">
                Explore Communities
                <ArrowRight class="size-5 transition-transform group-hover:translate-x-2" />
              </div>
            </Card.Content>
          </Card.Root>
        </a>

        <!-- Projects Module -->
        <a href="/projects" class="group">
          <Card.Root
            class="h-full border-2 transition-all hover:border-emerald-500/50 hover:shadow-2xl"
          >
            <Card.Content class="p-8">
              <div
                class="mb-6 flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/20 to-emerald-500/5 transition-all group-hover:scale-110 group-hover:shadow-lg"
              >
                <Target class="size-10 text-emerald-600" />
              </div>
              <h3
                class="mb-4 text-2xl font-bold transition-colors group-hover:text-emerald-600 md:text-3xl"
              >
                Development Projects
              </h3>
              <p class="mb-6 leading-relaxed text-muted-foreground">
                Track programs, projects, and activities (PPAs) implemented across communities with
                detailed monitoring and progress tracking.
              </p>
              <ul class="mb-8 space-y-3">
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-emerald-500/10 p-1">
                    <Search class="size-4 text-emerald-600" />
                  </div>
                  <span class="text-sm">Browse active and completed development projects</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-emerald-500/10 p-1">
                    <Database class="size-4 text-emerald-600" />
                  </div>
                  <span class="text-sm">View project details, beneficiaries, and outcomes</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 rounded-full bg-emerald-500/10 p-1">
                    <MapPin class="size-4 text-emerald-600" />
                  </div>
                  <span class="text-sm">See project distribution across municipalities</span>
                </li>
              </ul>
              <div class="flex items-center gap-2 text-lg font-semibold text-emerald-600">
                View Projects
                <ArrowRight class="size-5 transition-transform group-hover:translate-x-2" />
              </div>
            </Card.Content>
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
