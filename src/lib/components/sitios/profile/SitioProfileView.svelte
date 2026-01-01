<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import type { SitioProfile } from '$lib/types';
	import { FileText, Home, Shield, ToolCase, Users } from '@lucide/svelte';

	import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
	import SitioProfileHeader from './SitioProfileHeader.svelte';
	import AssessmentSection from './sections/AssessmentSection.svelte';
	import DemographicsSection from './sections/DemographicsSection.svelte';
	import EconomySection from './sections/EconomySection.svelte';
	import InfrastructureSection from './sections/InfrastructureSection.svelte';
	import OverviewSection from './sections/OverviewSection.svelte';

	interface Props {
		sitio: SitioProfile;
		isAdminView?: boolean;
	}

	const { sitio, isAdminView = false }: Props = $props();

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: FileText } as const,
		{ id: 'demographics', label: 'Demographics', icon: Users } as const,
		{ id: 'infrastructure', label: 'Infrastructure', icon: Home } as const,
		{ id: 'economy', label: 'Economy', icon: ToolCase } as const,
		{ id: 'assessment', label: 'Assessment', icon: Shield } as const
	];

	type Tabs = (typeof tabs)[0]['id'];

	let currentTab = $state<Tabs>('overview');

	const changeTab = (t: Tabs) => {
		currentTab = t;
	};

	const breadcrumbItems = $derived([
		{ label: 'Sitios', href: isAdminView ? '/admin/sitios' : '/sitios' },
		{ label: sitio.sitioName }
	]);
</script>

<div
	class="min-h-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900"
>
	<AppBreadcrumb items={breadcrumbItems} {isAdminView} />
	<SitioProfileHeader {sitio} />

	<div class="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
		<!-- Tabbed Content -->
		<Tabs.Root bind:value={currentTab} class="mt-5 w-full">
			<div
				class="sticky top-0 z-20 -mx-4 bg-linear-to-b from-slate-50 via-slate-50 to-transparent px-4 pb-2 dark:from-slate-950 dark:via-slate-950"
			>
				<nav
					aria-label="Tabs"
					class="scrollbar-hide -mb-px flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/80 p-1 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80"
				>
					{#each tabs as tab}
						<Tabs.Trigger
							value={tab.id}
							class="group inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white/60 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-primary"
						>
							<tab.icon
								class="size-4 opacity-60 transition-opacity group-data-[state=active]:opacity-100"
							/>
							<span class="whitespace-nowrap">{tab.label}</span>
						</Tabs.Trigger>
					{/each}
				</nav>
			</div>

			<div class="mt-4">
				<Tabs.Content value="overview" class="">
					<OverviewSection {sitio} {changeTab} />
				</Tabs.Content>

				<Tabs.Content value="demographics" class="">
					<DemographicsSection {sitio} />
				</Tabs.Content>

				<Tabs.Content value="infrastructure" class="">
					<InfrastructureSection {sitio} />
				</Tabs.Content>

				<Tabs.Content value="economy" class="">
					<EconomySection {sitio} />
				</Tabs.Content>

				<Tabs.Content value="assessment" class="">
					<AssessmentSection {sitio} />
				</Tabs.Content>
			</div>
		</Tabs.Root>
	</div>
</div>
