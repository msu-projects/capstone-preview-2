<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import type { SitioProfile } from '$lib/types';
	import { FileText, FolderKanban, Home, Layers, ToolCase, Users } from '@lucide/svelte';

	import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
	import ProjectsSection from '$lib/components/sitios/ProjectsSection.svelte';
	import { getActiveCustomFieldDefinitions } from '$lib/utils/custom-fields-storage';
	import { onMount } from 'svelte';
	import SitioProfileHeader from './SitioProfileHeader.svelte';
	import AssessmentSection from './sections/AssessmentSection.svelte';
	import DemographicsSection from './sections/DemographicsSection.svelte';
	import EconomySection from './sections/EconomySection.svelte';
	import InfrastructureSection from './sections/InfrastructureSection.svelte';
	import OverviewSection from './sections/OverviewSection.svelte';
	import SupplementarySection from './sections/SupplementarySection.svelte';

	interface Props {
		sitio: SitioProfile;
		sitioId?: number;
		isAdminView?: boolean;
	}

	const { sitio, sitioId = 0, isAdminView = false }: Props = $props();

	let hasActiveCustomFields = $state(false);

	onMount(() => {
		hasActiveCustomFields = getActiveCustomFieldDefinitions().length > 0;
	});

	// Base tabs that are always shown
	const baseTabs = [
		{ id: 'overview', label: 'Overview', icon: FileText },
		{ id: 'demographics', label: 'Demographics', icon: Users },
		{ id: 'infrastructure', label: 'Infrastructure', icon: Home },
		{ id: 'economy', label: 'Economy', icon: ToolCase },
		{ id: 'projects', label: 'Projects', icon: FolderKanban }
	] as const;

	// Tabs including optional supplementary tab
	const tabs = $derived([
		...baseTabs,
		...(hasActiveCustomFields
			? [{ id: 'supplementary' as const, label: 'Supplementary', icon: Layers }]
			: [])
	]);

	type TabId = (typeof baseTabs)[number]['id'] | 'supplementary';

	let currentTab = $state<TabId>('overview');

	const changeTab = (t: TabId) => {
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

				<Tabs.Content value="projects" class="">
					<ProjectsSection
						{sitioId}
						showAdminActions={isAdminView}
						baseUrl={isAdminView ? '/admin/projects' : '/projects'}
					/>
				</Tabs.Content>

				{#if hasActiveCustomFields}
					<Tabs.Content value="supplementary" class="">
						<SupplementarySection {sitio} />
					</Tabs.Content>
				{/if}

				<Tabs.Content value="assessment" class="">
					<AssessmentSection {sitio} />
				</Tabs.Content>
			</div>
		</Tabs.Root>
	</div>
</div>
