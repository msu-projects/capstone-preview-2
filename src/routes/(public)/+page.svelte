<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { stats } from '$lib/mock-data';
	import { ArrowRight, Database, Lightbulb, MapPin, Search, Target, Users } from '@lucide/svelte';

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
			label: 'Data Points',
			value: stats.total_sitios ? stats.total_sitios * 100 : 0, // Approximate data points per sitio
			icon: Target,
			color: 'text-amber-600'
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
			icon: Lightbulb,
			title: 'Smart Recommendations',
			description:
				"Data-driven recommendations for Programs, Projects, and Activities (PPAs) tailored to each community's specific needs."
		},
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
		class="relative overflow-hidden bg-linear-to-b from-primary/5 via-background to-background py-16 md:py-24"
	>
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-3xl text-center">
				<div
					class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
				>
					<span class="size-1.5 rounded-full bg-primary"></span>
					Community Data & Development Portal
				</div>
				<h1 class="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
					South Cotabato
					<span class="block text-primary">Convergence Data Bank</span>
				</h1>
				<p class="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
					Comprehensive profiles of vulnerable communities with data-driven recommendations for
					development programs, projects, and activities.
				</p>
				<div class="flex flex-col justify-center gap-3 sm:flex-row">
					<Button href="/sitios" size="lg" class="gap-2">
						<Users class="size-5" />
						Explore Sitios
						<ArrowRight class="size-4" />
					</Button>
					<Button href="/recommendations" variant="outline" size="lg" class="gap-2">
						<Lightbulb class="size-5" />
						View Recommendations
					</Button>
				</div>
			</div>
		</div>

		<!-- Decorative gradient orbs -->
		<div
			class="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-linear-to-r from-primary/20 to-transparent blur-3xl"
		></div>
	</section>

	<Separator />

	<!-- Quick Stats -->
	<section class="hidden border-y py-8">
		<div class="container mx-auto px-4">
			<div class="grid grid-cols-2 gap-10 md:grid-cols-4">
				{#each quickStats as stat}
					<Card.Root class="text-center">
						<Card.Content class="py-5">
							<div class="mb-2 flex justify-center">
								<stat.icon class="size-8 {stat.color}" />
							</div>
							<p class="text-3xl font-bold">{formatNumber(stat.value ?? 0)}</p>
							<p class="text-sm text-muted-foreground">{stat.label}</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<!-- About Section with Features -->
	<section class="py-16">
		<div class="container mx-auto px-4">
			<div class="mx-auto mb-12 max-w-2xl text-center">
				<h2 class="mb-4 text-3xl font-bold">Empowering Communities Through Data</h2>
				<p class="text-lg text-muted-foreground">
					The Convergence Data Bank provides comprehensive information about vulnerable communities
					and intelligent recommendations to guide development initiatives.
				</p>
			</div>

			<div class="grid gap-6 md:grid-cols-3">
				{#each features as feature}
					<Card.Root class="text-center">
						<Card.Content class="pt-6">
							<div
								class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10"
							>
								<feature.icon class="size-7 text-primary" />
							</div>
							<h3 class="mb-2 text-lg font-semibold">{feature.title}</h3>
							<p class="text-sm text-muted-foreground">{feature.description}</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<!-- Main Modules -->
	<section class="bg-muted/30 py-16">
		<div class="container mx-auto px-4">
			<div class="mx-auto mb-12 max-w-2xl text-center">
				<h2 class="mb-4 text-3xl font-bold">Explore the System</h2>
				<p class="text-lg text-muted-foreground">
					Two powerful modules working together to support community development in South Cotabato.
				</p>
			</div>

			<div class="grid gap-6 md:grid-cols-2">
				<a href="/sitios" class="group">
					<Card.Root class="h-full transition-shadow hover:shadow-lg">
						<Card.Content class="p-8">
							<div
								class="mb-6 flex size-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
							>
								<Database class="size-8 text-primary" />
							</div>
							<h3 class="mb-3 text-2xl font-bold transition-colors group-hover:text-primary">
								Sitio Data Module
							</h3>
							<p class="mb-4 text-muted-foreground">
								Browse comprehensive profiles of vulnerable communities including demographics,
								infrastructure, facilities, livelihood, and more.
							</p>
							<ul class="mb-6 space-y-2 text-sm text-muted-foreground">
								<li class="flex items-start gap-2">
									<MapPin class="mt-0.5 size-4 shrink-0 text-primary" />
									<span>View sitio locations on interactive maps</span>
								</li>
								<li class="flex items-start gap-2">
									<Users class="mt-0.5 size-4 shrink-0 text-primary" />
									<span>Access demographic and population data</span>
								</li>
								<li class="flex items-start gap-2">
									<Target class="mt-0.5 size-4 shrink-0 text-primary" />
									<span>Review infrastructure and facility status</span>
								</li>
							</ul>
							<div class="flex items-center gap-2 font-medium text-primary">
								Explore Sitios
								<ArrowRight class="size-5 transition-transform group-hover:translate-x-1" />
							</div>
						</Card.Content>
					</Card.Root>
				</a>

				<a href="/recommendations" class="group">
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
				</a>
			</div>
		</div>
	</section>
</div>
