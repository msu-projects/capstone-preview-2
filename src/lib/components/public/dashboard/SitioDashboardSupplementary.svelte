<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import StackedBarChart from '$lib/components/charts/StackedBarChart.svelte';
	import TreemapChart from '$lib/components/charts/TreemapChart.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Card from '$lib/components/ui/card';
	import HelpTooltip from '$lib/components/ui/help-tooltip/help-tooltip.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { CustomFieldDefinition, SitioRecord } from '$lib/types';
	import { AGGREGATION_TYPE_LABELS } from '$lib/types';
	import { getActiveCustomFieldDefinitions } from '$lib/utils/custom-fields-storage';
	import {
		ArrowDownUp,
		BarChart3,
		Calendar,
		ChartColumn,
		ChartPie,
		CircleCheck,
		Grid3x3,
		Hash,
		HelpCircle,
		Layers,
		List,
		ListChecks,
		Percent,
		ToggleLeft,
		TrendingUp,
		Type,
		Users
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import DashboardStatCard from './DashboardStatCard.svelte';

	interface Props {
		sitios: SitioRecord[];
		selectedYear?: number;
	}

	let { sitios, selectedYear }: Props = $props();

	let definitions = $state<CustomFieldDefinition[]>([]);
	let viewMode = $state<'summary' | 'comparison'>('summary');

	onMount(() => {
		definitions = getActiveCustomFieldDefinitions();
	});

	// Get current year data
	const currentYear = $derived(selectedYear || new Date().getFullYear());

	// Helper to get year data from a sitio
	function getYearData(sitio: SitioRecord, year: number) {
		const yearStr = year.toString();
		if (sitio.yearlyData[yearStr]) return sitio.yearlyData[yearStr];
		// Fallback to latest year
		const latestYear = Math.max(...sitio.availableYears);
		return sitio.yearlyData[latestYear.toString()];
	}

	// Helper to get custom field value
	function getFieldValue(sitio: SitioRecord, fieldId: string): unknown {
		const yearData = getYearData(sitio, currentYear);
		return yearData?.customFields?.[fieldId];
	}

	// Aggregate data for a number field
	function aggregateNumberField(def: CustomFieldDefinition): {
		total: number;
		count: number;
		min: number;
		max: number;
		avg: number;
	} {
		const values: number[] = [];

		for (const sitio of sitios) {
			const value = getFieldValue(sitio, def.id);
			if (typeof value === 'number' && !isNaN(value)) {
				values.push(value);
			}
		}

		if (values.length === 0) {
			return { total: 0, count: 0, min: 0, max: 0, avg: 0 };
		}

		const total = values.reduce((sum, v) => sum + v, 0);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const avg = total / values.length;

		return { total, count: values.length, min, max, avg };
	}

	// Aggregate data for a boolean field
	function aggregateBooleanField(def: CustomFieldDefinition): {
		yes: number;
		no: number;
		notRecorded: number;
	} {
		let yes = 0;
		let no = 0;
		let notRecorded = 0;

		for (const sitio of sitios) {
			const value = getFieldValue(sitio, def.id);
			if (value === true) {
				yes++;
			} else if (value === false) {
				no++;
			} else {
				notRecorded++;
			}
		}

		return { yes, no, notRecorded };
	}

	// Aggregate data for a text field (frequency count)
	function aggregateTextField(def: CustomFieldDefinition): Map<string, number> {
		const counts = new Map<string, number>();

		for (const sitio of sitios) {
			const value = getFieldValue(sitio, def.id);
			if (typeof value === 'string' && value.trim()) {
				const normalized = value.trim();
				counts.set(normalized, (counts.get(normalized) || 0) + 1);
			}
		}

		return counts;
	}

	// Aggregate data for a checkbox field (count per option)
	function aggregateCheckboxField(def: CustomFieldDefinition): Map<string, number> {
		const counts = new Map<string, number>();

		for (const sitio of sitios) {
			const value = getFieldValue(sitio, def.id);
			if (Array.isArray(value)) {
				for (const item of value) {
					if (typeof item === 'string' && item.trim()) {
						const normalized = item.trim();
						counts.set(normalized, (counts.get(normalized) || 0) + 1);
					}
				}
			}
		}

		return counts;
	}

	// Aggregate data for a radio field (count per option)
	function aggregateRadioField(def: CustomFieldDefinition): Map<string, number> {
		const counts = new Map<string, number>();

		for (const sitio of sitios) {
			const value = getFieldValue(sitio, def.id);
			if (typeof value === 'string' && value.trim()) {
				const normalized = value.trim();
				counts.set(normalized, (counts.get(normalized) || 0) + 1);
			}
		}

		return counts;
	}

	// Aggregate data for an array field (count per item)
	function aggregateArrayField(def: CustomFieldDefinition): Map<string, number> {
		const counts = new Map<string, number>();

		for (const sitio of sitios) {
			const value = getFieldValue(sitio, def.id);
			if (Array.isArray(value)) {
				for (const item of value) {
					if (typeof item === 'string' && item.trim()) {
						const normalized = item.trim();
						counts.set(normalized, (counts.get(normalized) || 0) + 1);
					}
				}
			}
		}

		return counts;
	}

	// Get display value for aggregation
	function getAggregationValue(def: CustomFieldDefinition): string {
		if (def.dataType !== 'number') return '-';

		const agg = aggregateNumberField(def);
		switch (def.aggregationType) {
			case 'sum':
				return agg.total.toLocaleString();
			case 'average':
				return agg.avg.toFixed(1);
			case 'count':
				return agg.count.toLocaleString();
			case 'min':
				return agg.min.toLocaleString();
			case 'max':
				return agg.max.toLocaleString();
			default:
				return agg.total.toLocaleString();
		}
	}

	// Separate fields by type
	const numberFields = $derived(definitions.filter((d) => d.dataType === 'number'));
	const booleanFields = $derived(definitions.filter((d) => d.dataType === 'boolean'));
	const textFields = $derived(definitions.filter((d) => d.dataType === 'text'));
	const dateFields = $derived(definitions.filter((d) => d.dataType === 'date'));
	const arrayFields = $derived(definitions.filter((d) => d.dataType === 'array'));
	const checkboxFields = $derived(definitions.filter((d) => d.dataType === 'checkbox'));
	const radioFields = $derived(definitions.filter((d) => d.dataType === 'radio'));

	// Prepare bar chart data for number fields comparison
	const numberComparisonData = $derived(
		numberFields.map((def) => {
			const agg = aggregateNumberField(def);
			let value: number;
			switch (def.aggregationType) {
				case 'sum':
					value = agg.total;
					break;
				case 'average':
					value = agg.avg;
					break;
				case 'count':
					value = agg.count;
					break;
				case 'min':
					value = agg.min;
					break;
				case 'max':
					value = agg.max;
					break;
				default:
					value = agg.total;
			}
			return { label: def.displayLabel, value };
		})
	);

	// Prepare treemap data for number fields (showing relative proportions)
	const treemapData = $derived(
		numberFields
			.map((def) => {
				const agg = aggregateNumberField(def);
				return {
					label: def.displayLabel,
					value: def.aggregationType === 'average' ? agg.avg : agg.total
				};
			})
			.filter((d) => d.value > 0)
	);

	// Prepare stacked bar data for boolean fields across categories
	const booleanStackedData = $derived(() => {
		const categories = booleanFields.map((def) =>
			def.displayLabel.length > 12 ? def.displayLabel.slice(0, 12) + '...' : def.displayLabel
		);

		const yesData: number[] = [];
		const noData: number[] = [];
		const naData: number[] = [];

		booleanFields.forEach((def) => {
			const agg = aggregateBooleanField(def);
			yesData.push(agg.yes);
			noData.push(agg.no);
			naData.push(agg.notRecorded);
		});

		return {
			categories,
			series: [
				{ name: 'Yes', data: yesData, color: 'hsl(142, 71%, 45%)' },
				{ name: 'No', data: noData, color: 'hsl(0, 84%, 60%)' },
				...(naData.some((v) => v > 0)
					? [{ name: 'N/A', data: naData, color: 'hsl(220, 9%, 46%)' }]
					: [])
			]
		};
	});

	// Overall boolean summary for all fields
	const overallBooleanSummary = $derived(() => {
		let totalYes = 0;
		let totalNo = 0;
		let totalNA = 0;

		booleanFields.forEach((def) => {
			const agg = aggregateBooleanField(def);
			totalYes += agg.yes;
			totalNo += agg.no;
			totalNA += agg.notRecorded;
		});

		return { totalYes, totalNo, totalNA, total: totalYes + totalNo + totalNA };
	});

	// Get icon for data type
	function getIcon(dataType: CustomFieldDefinition['dataType']) {
		switch (dataType) {
			case 'text':
				return Type;
			case 'number':
				return Hash;
			case 'boolean':
				return ToggleLeft;
			case 'date':
				return Calendar;
			case 'array':
				return List;
			case 'checkbox':
				return ListChecks;
			case 'radio':
				return CircleCheck;
			default:
				return Type;
		}
	}

	// Prepare per-sitio comparison data for a specific field
	function getPerSitioData(def: CustomFieldDefinition) {
		return sitios
			.map((sitio) => {
				const value = getFieldValue(sitio, def.id);
				return {
					label:
						sitio.sitioName.length > 15 ? sitio.sitioName.slice(0, 15) + '...' : sitio.sitioName,
					value: def.dataType === 'number' && typeof value === 'number' ? value : 0
				};
			})
			.filter((d) => d.value > 0)
			.sort((a, b) => b.value - a.value)
			.slice(0, 10); // Top 10
	}

	// Get color based on aggregation type
	function getAggregationColor(type: CustomFieldDefinition['aggregationType']): string {
		switch (type) {
			case 'sum':
				return 'hsl(217, 91%, 60%)';
			case 'average':
				return 'hsl(280, 70%, 60%)';
			case 'count':
				return 'hsl(142, 71%, 45%)';
			case 'min':
				return 'hsl(189, 85%, 45%)';
			case 'max':
				return 'hsl(24, 95%, 53%)';
			default:
				return 'hsl(217, 91%, 60%)';
		}
	}

	// Statistics overview
	const statsOverview = $derived(() => {
		const totalFields = definitions.length;
		const sitiosWithData = sitios.filter((sitio) => {
			const yearData = getYearData(sitio, currentYear);
			return yearData?.customFields && Object.keys(yearData.customFields).length > 0;
		}).length;

		return {
			totalFields,
			sitiosWithData,
			coveragePercent: sitios.length > 0 ? Math.round((sitiosWithData / sitios.length) * 100) : 0
		};
	});
</script>

{#if definitions.length === 0}
	<!-- Empty state when no custom fields are defined -->
	<div
		class="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-12 text-center"
	>
		<div
			class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
		>
			<Layers class="size-8" />
		</div>
		<h3 class="mt-4 text-lg font-medium">No Supplementary Data</h3>
		<p class="mt-2 max-w-sm text-sm text-muted-foreground">
			No custom data fields have been configured. Administrators can define supplementary fields in
			Configuration → Custom Fields.
		</p>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Header with View Toggle -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400"
				>
					<Layers class="size-5" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h2 class="text-lg font-semibold">Supplementary Data</h2>
						<Badge variant="secondary" class="text-xs">
							{statsOverview().coveragePercent}% coverage
						</Badge>
					</div>
					<p class="text-sm text-muted-foreground">
						Aggregated custom field data across {sitios.length} sitios
					</p>
				</div>
			</div>

			<div class="hidden items-center gap-2">
				<Tabs.Root value={viewMode} onValueChange={(v) => (viewMode = v as typeof viewMode)}>
					<Tabs.List class="h-9">
						<Tabs.Trigger value="summary" class="gap-1.5 px-3 text-xs">
							<ChartColumn class="size-3.5" />
							Summary
						</Tabs.Trigger>
						<Tabs.Trigger value="comparison" class="gap-1.5 px-3 text-xs">
							<ArrowDownUp class="size-3.5" />
							Comparison
						</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
			</div>
		</div>

		{#if viewMode === 'summary'}
			<!-- Summary View -->
			<div class="space-y-6">
				<!-- Overview Stats Row -->
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<DashboardStatCard
						title="Total Fields"
						value={definitions.length.toString()}
						subtitle="Custom fields configured"
						icon={Layers}
						variant="primary"
					/>
					<DashboardStatCard
						title="Sitios with Data"
						value={statsOverview().sitiosWithData.toString()}
						subtitle="of {sitios.length} sitios"
						icon={Users}
						variant="success"
					/>
					<DashboardStatCard
						title="Numeric Fields"
						value={numberFields.length.toString()}
						subtitle="Quantitative metrics"
						icon={Hash}
						variant="warning"
					/>
					<DashboardStatCard
						title="Yes/No Fields"
						value={booleanFields.length.toString()}
						subtitle="Categorical indicators"
						icon={ToggleLeft}
						variant="primary"
					/>
				</div>

				<!-- Stat Cards for Number Fields -->
				{#if numberFields.length > 0}
					<section>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
								<Hash class="size-4" />
								Numeric Fields Overview
							</h3>
							<Badge variant="outline" class="text-xs">{numberFields.length} fields</Badge>
						</div>
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{#each numberFields as def (def.id)}
								{@const agg = aggregateNumberField(def)}
								<Card.Root
									class="group relative overflow-hidden py-0 transition-shadow hover:shadow-md"
								>
									<div
										class="absolute top-0 left-0 h-1 w-full opacity-80"
										style="background-color: {getAggregationColor(def.aggregationType)}"
									></div>
									<Card.Content class="p-4">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0 flex-1">
												<p class="truncate text-xs font-medium text-muted-foreground">
													{def.displayLabel}
												</p>
												<p class="mt-1 text-2xl font-bold">{getAggregationValue(def)}</p>
												<p class="mt-0.5 text-xs text-muted-foreground">
													{AGGREGATION_TYPE_LABELS[def.aggregationType]} • {agg.count} sitios
												</p>
											</div>
											{#if def.description}
												<Tooltip.Root>
													<Tooltip.Trigger>
														<HelpCircle
															class="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
														/>
													</Tooltip.Trigger>
													<Tooltip.Content>
														<p class="max-w-xs text-xs">{def.description}</p>
													</Tooltip.Content>
												</Tooltip.Root>
											{/if}
										</div>
										<!-- Mini stats -->
										{#if agg.count > 0}
											<div
												class="mt-3 flex items-center gap-3 border-t pt-2 text-xs text-muted-foreground"
											>
												<span
													>Min: <span class="font-medium text-foreground"
														>{agg.min.toLocaleString()}</span
													></span
												>
												<span
													>Max: <span class="font-medium text-foreground"
														>{agg.max.toLocaleString()}</span
													></span
												>
												<span
													>Avg: <span class="font-medium text-foreground">{agg.avg.toFixed(1)}</span
													></span
												>
											</div>
										{/if}
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</section>

					<!-- Number Fields Charts -->
					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Bar Chart -->
						{#if numberComparisonData.some((d) => d.value > 0)}
							<Card.Root class="shadow-sm">
								<Card.Header class="pb-2">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<div
												class="flex size-8 items-center justify-center rounded-lg bg-blue-500/10"
											>
												<BarChart3 class="size-4 text-blue-600 dark:text-blue-400" />
											</div>
											<div>
												<Card.Title class="text-base">Aggregated Values</Card.Title>
												<Card.Description class="text-xs">By field comparison</Card.Description>
											</div>
										</div>
									</div>
								</Card.Header>
								<Card.Content class="pt-4">
									<BarChart data={numberComparisonData} height={220} />
								</Card.Content>
							</Card.Root>
						{/if}

						<!-- Treemap for proportional view -->
						{#if treemapData.length >= 2}
							<Card.Root class="shadow-sm">
								<Card.Header class="pb-2">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<div
												class="flex size-8 items-center justify-center rounded-lg bg-violet-500/10"
											>
												<Grid3x3 class="size-4 text-violet-600 dark:text-violet-400" />
											</div>
											<div>
												<Card.Title class="text-base">Proportional View</Card.Title>
												<Card.Description class="text-xs">Relative field sizes</Card.Description>
											</div>
										</div>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<HelpCircle class="size-4 text-muted-foreground" />
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p class="max-w-xs text-xs">
													Shows the relative proportions of aggregated values
												</p>
											</Tooltip.Content>
										</Tooltip.Root>
									</div>
								</Card.Header>
								<Card.Content class="pt-4">
									<TreemapChart data={treemapData} height={220} />
								</Card.Content>
							</Card.Root>
						{/if}
					</div>
				{/if}

				<!-- Boolean Fields Summary -->
				{#if booleanFields.length > 0}
					<section>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
								<ToggleLeft class="size-4" />
								Yes/No Field Analysis
							</h3>
							<Badge variant="outline" class="text-xs">{booleanFields.length} fields</Badge>
						</div>

						<!-- Overall Boolean Summary Card -->
						{#if overallBooleanSummary().total > 0}
							{@const summary = overallBooleanSummary()}
							<Card.Root class="mb-4 shadow-sm">
								<Card.Header class="pb-2">
									<div class="flex items-center gap-2">
										<div
											class="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10"
										>
											<Percent class="size-4 text-emerald-600 dark:text-emerald-400" />
										</div>
										<div>
											<Card.Title class="text-base">Overall Response Distribution</Card.Title>
											<Card.Description class="text-xs">
												Across all {booleanFields.length} boolean fields and {sitios.length} sitios
											</Card.Description>
										</div>
									</div>
								</Card.Header>
								<Card.Content class="pt-2">
									<div class="grid gap-6 md:grid-cols-2">
										<div class="flex justify-center">
											<DonutChart
												data={[
													{ label: 'Yes', value: summary.totalYes, color: 'hsl(142, 71%, 45%)' },
													{ label: 'No', value: summary.totalNo, color: 'hsl(0, 84%, 60%)' },
													...(summary.totalNA > 0
														? [{ label: 'N/A', value: summary.totalNA, color: 'hsl(220, 9%, 46%)' }]
														: [])
												]}
												height={180}
												centerLabel="Responses"
											/>
										</div>
										<div class="flex flex-col justify-center gap-4">
											<div
												class="flex items-center justify-between rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30"
											>
												<span class="text-sm font-medium text-emerald-700 dark:text-emerald-300"
													>Yes Responses</span
												>
												<div class="text-right">
													<span class="text-lg font-bold text-emerald-600 dark:text-emerald-400"
														>{summary.totalYes}</span
													>
													<span class="ml-2 text-xs text-emerald-600/70 dark:text-emerald-400/70">
														({summary.total > 0
															? ((summary.totalYes / summary.total) * 100).toFixed(0)
															: 0}%)
													</span>
												</div>
											</div>
											<div
												class="flex items-center justify-between rounded-lg bg-rose-50 p-3 dark:bg-rose-950/30"
											>
												<span class="text-sm font-medium text-rose-700 dark:text-rose-300"
													>No Responses</span
												>
												<div class="text-right">
													<span class="text-lg font-bold text-rose-600 dark:text-rose-400"
														>{summary.totalNo}</span
													>
													<span class="ml-2 text-xs text-rose-600/70 dark:text-rose-400/70">
														({summary.total > 0
															? ((summary.totalNo / summary.total) * 100).toFixed(0)
															: 0}%)
													</span>
												</div>
											</div>
											{#if summary.totalNA > 0}
												<div
													class="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
												>
													<span class="text-sm font-medium text-slate-600 dark:text-slate-300"
														>Not Recorded</span
													>
													<div class="text-right">
														<span class="text-lg font-bold text-slate-500">{summary.totalNA}</span>
														<span class="ml-2 text-xs text-slate-500/70">
															({((summary.totalNA / summary.total) * 100).toFixed(0)}%)
														</span>
													</div>
												</div>
											{/if}
										</div>
									</div>
								</Card.Content>
							</Card.Root>
						{/if}

						<!-- Stacked Bar Chart for Boolean Fields Comparison -->
						{#if booleanStackedData().categories.length > 1}
							{@const stackedData = booleanStackedData()}
							<Card.Root class="mb-4 shadow-sm">
								<Card.Header class="pb-2">
									<div class="flex items-center gap-2">
										<div class="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
											<ChartPie class="size-4 text-amber-600 dark:text-amber-400" />
										</div>
										<div>
											<Card.Title class="text-base">Field-by-Field Breakdown</Card.Title>
											<Card.Description class="text-xs"
												>Response distribution per field</Card.Description
											>
										</div>
									</div>
								</Card.Header>
								<Card.Content class="pt-4">
									<StackedBarChart
										series={stackedData.series}
										categories={stackedData.categories}
										height={Math.max(200, stackedData.categories.length * 40)}
										stacked100={true}
										orientation="horizontal"
										showDataLabels={false}
									/>
								</Card.Content>
							</Card.Root>
						{/if}

						<!-- Individual Field Cards -->
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{#each booleanFields as def (def.id)}
								{@const agg = aggregateBooleanField(def)}
								{@const total = agg.yes + agg.no}
								{@const yesPercent = total > 0 ? ((agg.yes / total) * 100).toFixed(0) : '0'}
								<Card.Root class="group transition-shadow hover:shadow-md">
									<Card.Header class="pb-2">
										<div class="flex items-center justify-between">
											<Card.Title class="truncate text-sm font-medium"
												>{def.displayLabel}</Card.Title
											>
											{#if def.description}
												<HelpTooltip content={def.description} />
											{/if}
										</div>
									</Card.Header>
									<Card.Content>
										<div class="flex items-center gap-4">
											<div class="flex-1">
												<DonutChart
													data={[
														{ label: 'Yes', value: agg.yes, color: 'hsl(142, 76%, 36%)' },
														{ label: 'No', value: agg.no, color: 'hsl(0, 84%, 60%)' },
														...(agg.notRecorded > 0
															? [
																	{
																		label: 'N/A',
																		value: agg.notRecorded,
																		color: 'hsl(220, 9%, 46%)'
																	}
																]
															: [])
													]}
													height={100}
													showLegend={false}
												/>
											</div>
											<div class="space-y-1 text-right">
												<p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
													{yesPercent}%
												</p>
												<p class="text-xs text-muted-foreground">
													{agg.yes} of {sitios.length}
												</p>
												<Badge variant="outline" class="text-xs">
													{agg.yes} yes • {agg.no} no
												</Badge>
											</div>
										</div>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Text Fields Summary -->
				{#if textFields.length > 0}
					<section>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
								<Type class="size-4" />
								Text Fields Analysis
							</h3>
							<Badge variant="outline" class="text-xs">{textFields.length} fields</Badge>
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							{#each textFields as def (def.id)}
								{@const counts = aggregateTextField(def)}
								{@const sortedEntries = [...counts.entries()]
									.sort((a, b) => b[1] - a[1])
									.slice(0, 5)}
								<Card.Root class="shadow-sm">
									<Card.Header class="pb-2">
										<div class="flex items-center justify-between">
											<div>
												<Card.Title class="text-sm font-medium">{def.displayLabel}</Card.Title>
												<Card.Description class="text-xs">
													{counts.size} unique values from {sitios.length} sitios
												</Card.Description>
											</div>
											{#if def.description}
												<HelpTooltip content={def.description} />
											{/if}
										</div>
									</Card.Header>
									<Card.Content class="pt-2">
										{#if sortedEntries.length > 0}
											<BarChart
												data={sortedEntries.map(([label, value]) => ({
													label: label.length > 20 ? label.slice(0, 20) + '...' : label,
													value
												}))}
												height={160}
												orientation="horizontal"
											/>
										{:else}
											<div
												class="flex flex-col items-center justify-center py-8 text-muted-foreground"
											>
												<Type class="mb-2 size-8 opacity-50" />
												<p class="text-sm">No data recorded</p>
											</div>
										{/if}
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Date Fields Info -->
				{#if dateFields.length > 0}
					<section>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
								<Calendar class="size-4" />
								Date Fields
							</h3>
							<Badge variant="outline" class="text-xs">{dateFields.length} fields</Badge>
						</div>
						<Card.Root class="bg-muted/30">
							<Card.Content class="p-4">
								<div class="flex items-start gap-3">
									<div
										class="flex size-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30"
									>
										<Calendar class="size-5 text-cyan-600 dark:text-cyan-400" />
									</div>
									<div>
										<p class="font-medium">
											{dateFields.length} date field{dateFields.length > 1 ? 's' : ''} configured
										</p>
										<p class="mt-1 text-sm text-muted-foreground">
											{dateFields.map((d) => d.displayLabel).join(', ')}
										</p>
										<p class="mt-2 text-xs text-muted-foreground">
											Date fields track specific dates per sitio. View individual sitio profiles for
											detailed information.
										</p>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					</section>
				{/if}

				<!-- Checkbox Fields Analysis -->
				{#if checkboxFields.length > 0}
					<section>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
								<ListChecks class="size-4" />
								Checkbox Fields Analysis
							</h3>
							<Badge variant="outline" class="text-xs">{checkboxFields.length} fields</Badge>
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							{#each checkboxFields as def (def.id)}
								{@const counts = aggregateCheckboxField(def)}
								{@const sortedEntries = [...counts.entries()]
									.sort((a, b) => b[1] - a[1])
									.slice(0, 6)}
								{@const totalSelections = [...counts.values()].reduce((a, b) => a + b, 0)}
								<Card.Root class="shadow-sm">
									<Card.Header class="pb-2">
										<div class="flex items-center justify-between">
											<div>
												<Card.Title class="text-sm font-medium">{def.displayLabel}</Card.Title>
												<Card.Description class="text-xs">
													{totalSelections} total selections across {sitios.length} sitios
												</Card.Description>
											</div>
											{#if def.description}
												<HelpTooltip content={def.description} />
											{/if}
										</div>
									</Card.Header>
									<Card.Content class="pt-2">
										{#if sortedEntries.length > 0}
											<div class="space-y-3">
												<DonutChart
													data={sortedEntries.map(([label, value], idx) => ({
														label: label.length > 20 ? label.slice(0, 20) + '...' : label,
														value,
														color: `hsl(${240 + idx * 25}, 65%, 55%)`
													}))}
													height={140}
													showLegend={false}
												/>
												<div class="mt-3 flex flex-wrap gap-1.5">
													{#each sortedEntries.slice(0, 4) as [label, count]}
														<Badge variant="secondary" class="text-xs">
															{label.length > 15 ? label.slice(0, 15) + '...' : label}: {count}
														</Badge>
													{/each}
													{#if sortedEntries.length > 4}
														<Badge variant="outline" class="text-xs">
															+{sortedEntries.length - 4} more
														</Badge>
													{/if}
												</div>
											</div>
										{:else}
											<div
												class="flex flex-col items-center justify-center py-6 text-muted-foreground"
											>
												<ListChecks class="mb-2 size-8 opacity-50" />
												<p class="text-sm">No selections recorded</p>
											</div>
										{/if}
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Radio Fields Analysis -->
				{#if radioFields.length > 0}
					<section>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
								<CircleCheck class="size-4" />
								Radio Selection Fields
							</h3>
							<Badge variant="outline" class="text-xs">{radioFields.length} fields</Badge>
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							{#each radioFields as def (def.id)}
								{@const counts = aggregateRadioField(def)}
								{@const sortedEntries = [...counts.entries()]
									.sort((a, b) => b[1] - a[1])
									.slice(0, 5)}
								{@const totalResponses = [...counts.values()].reduce((a, b) => a + b, 0)}
								<Card.Root class="shadow-sm">
									<Card.Header class="pb-2">
										<div class="flex items-center justify-between">
											<div>
												<Card.Title class="text-sm font-medium">{def.displayLabel}</Card.Title>
												<Card.Description class="text-xs">
													{totalResponses} responses from {sitios.length} sitios
												</Card.Description>
											</div>
											{#if def.description}
												<HelpTooltip content={def.description} />
											{/if}
										</div>
									</Card.Header>
									<Card.Content class="pt-2">
										{#if sortedEntries.length > 0}
											<BarChart
												data={sortedEntries.map(([label, value]) => ({
													label: label.length > 20 ? label.slice(0, 20) + '...' : label,
													value
												}))}
												height={160}
												orientation="horizontal"
											/>
										{:else}
											<div
												class="flex flex-col items-center justify-center py-6 text-muted-foreground"
											>
												<CircleCheck class="mb-2 size-8 opacity-50" />
												<p class="text-sm">No selections recorded</p>
											</div>
										{/if}
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Array/List Fields Analysis -->
				{#if arrayFields.length > 0}
					<section>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
								<List class="size-4" />
								List Fields Analysis
							</h3>
							<Badge variant="outline" class="text-xs">{arrayFields.length} fields</Badge>
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							{#each arrayFields as def (def.id)}
								{@const counts = aggregateArrayField(def)}
								{@const sortedEntries = [...counts.entries()]
									.sort((a, b) => b[1] - a[1])
									.slice(0, 8)}
								{@const totalItems = [...counts.values()].reduce((a, b) => a + b, 0)}
								<Card.Root class="shadow-sm">
									<Card.Header class="pb-2">
										<div class="flex items-center justify-between">
											<div>
												<Card.Title class="text-sm font-medium">{def.displayLabel}</Card.Title>
												<Card.Description class="text-xs">
													{counts.size} unique items, {totalItems} total across {sitios.length} sitios
												</Card.Description>
											</div>
											{#if def.description}
												<HelpTooltip content={def.description} />
											{/if}
										</div>
									</Card.Header>
									<Card.Content class="pt-2">
										{#if sortedEntries.length > 0}
											<div class="space-y-2">
												{#each sortedEntries as [item, count], idx}
													<div
														class="flex items-center justify-between rounded-lg bg-teal-50/50 px-3 py-2 dark:bg-teal-950/30"
													>
														<div class="flex items-center gap-2">
															<span
																class="flex size-5 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
															>
																{idx + 1}
															</span>
															<span class="text-sm">
																{item.length > 25 ? item.slice(0, 25) + '...' : item}
															</span>
														</div>
														<Badge variant="secondary" class="text-xs">
															{count} sitio{count !== 1 ? 's' : ''}
														</Badge>
													</div>
												{/each}
												{#if counts.size > 8}
													<p class="text-center text-xs text-muted-foreground">
														+{counts.size - 8} more items
													</p>
												{/if}
											</div>
										{:else}
											<div
												class="flex flex-col items-center justify-center py-6 text-muted-foreground"
											>
												<List class="mb-2 size-8 opacity-50" />
												<p class="text-sm">No list items recorded</p>
											</div>
										{/if}
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</section>
				{/if}
			</div>
		{:else}
			<!-- Comparison View - Per Sitio -->
			<div class="space-y-6">
				<!-- Comparison Header -->
				<Card.Root
					class="bg-linear-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30"
				>
					<Card.Content class="p-4">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50"
							>
								<TrendingUp class="size-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p class="font-medium">Per-Sitio Comparison</p>
								<p class="text-sm text-muted-foreground">
									Top 10 sitios ranked by value for each numeric field
								</p>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				{#each numberFields as def (def.id)}
					{@const perSitioData = getPerSitioData(def)}
					{#if perSitioData.length > 0}
						<Card.Root class="shadow-sm">
							<Card.Header class="pb-2">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<div
											class="flex size-8 items-center justify-center rounded-lg"
											style="background-color: {getAggregationColor(def.aggregationType)}20"
										>
											<Hash
												class="size-4"
												style="color: {getAggregationColor(def.aggregationType)}"
											/>
										</div>
										<div>
											<Card.Title class="text-base">{def.displayLabel}</Card.Title>
											<Card.Description class="text-xs">
												{AGGREGATION_TYPE_LABELS[def.aggregationType]} • {perSitioData.length} sitios
												with data
											</Card.Description>
										</div>
									</div>
									{#if def.description}
										<HelpTooltip content={def.description} />
									{/if}
								</div>
							</Card.Header>
							<Card.Content class="pt-4">
								<BarChart
									data={perSitioData}
									height={Math.max(200, perSitioData.length * 35)}
									orientation="horizontal"
								/>
							</Card.Content>
						</Card.Root>
					{/if}
				{/each}

				{#if numberFields.every((def) => getPerSitioData(def).length === 0)}
					<div
						class="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-12 text-center"
					>
						<div class="flex size-12 items-center justify-center rounded-full bg-muted">
							<BarChart3 class="size-6 text-muted-foreground" />
						</div>
						<h4 class="mt-4 font-medium">No Data for Comparison</h4>
						<p class="mt-2 max-w-sm text-sm text-muted-foreground">
							No numeric data has been recorded yet. Data will appear here once sitios have
							supplementary field values.
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
