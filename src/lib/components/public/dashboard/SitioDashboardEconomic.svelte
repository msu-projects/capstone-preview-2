<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import TreemapChart from '$lib/components/charts/TreemapChart.svelte';
	import * as Card from '$lib/components/ui/card';
	import type { SitioRecord } from '$lib/types';
	import {
		aggregateLivelihood,
		type LivelihoodAggregation
	} from '$lib/utils/sitio-chart-aggregation';
	import {
		Banknote,
		Briefcase,
		Building2,
		Factory,
		Leaf,
		PiggyBank,
		Tractor,
		Users,
		Warehouse
	} from '@lucide/svelte';
	import DashboardStatCard from './DashboardStatCard.svelte';

	interface Props {
		sitios: SitioRecord[];
		selectedYear?: number;
	}

	let { sitios, selectedYear }: Props = $props();

	// Aggregated livelihood data
	const livelihood = $derived<LivelihoodAggregation>(aggregateLivelihood(sitios));

	// Worker class distribution bar chart
	const workerClassData = $derived([
		{ label: 'Private HH', value: livelihood.workerPrivateHousehold, color: 'hsl(217, 91%, 60%)' },
		{
			label: 'Private Est.',
			value: livelihood.workerPrivateEstablishment,
			color: 'hsl(142, 71%, 45%)'
		},
		{ label: 'Government', value: livelihood.workerGovernment, color: 'hsl(45, 93%, 47%)' },
		{ label: 'Self-Employed', value: livelihood.workerSelfEmployed, color: 'hsl(25, 95%, 53%)' },
		{ label: 'Employer', value: livelihood.workerEmployer, color: 'hsl(330, 81%, 60%)' },
		{ label: 'OFW', value: livelihood.workerOFW, color: 'hsl(199, 89%, 48%)' }
	]);

	// Income class distribution (poverty levels)
	const incomeClassData = $derived([
		{
			label: 'Below Poverty Line (<₱400/day)',
			value: livelihood.povertyCount,
			color: 'hsl(0, 84%, 60%)'
		},
		{
			label: 'Vulnerable (₱400-600/day)',
			value: livelihood.vulnerableCount,
			color: 'hsl(45, 93%, 47%)'
		},
		{
			label: 'Above Threshold (>₱600/day)',
			value: Math.max(
				0,
				livelihood.sitiosWithIncome - livelihood.povertyCount - livelihood.vulnerableCount
			),
			color: 'hsl(142, 71%, 45%)'
		}
	]);

	// Top crops treemap
	const topCrops = $derived(() => {
		const entries = Array.from(livelihood.cropCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);
		return entries.map(([crop, count]) => ({
			label: crop,
			value: count
		}));
	});

	// Top livestock treemap
	const topLivestock = $derived(() => {
		const entries = Array.from(livelihood.livestockCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);
		return entries.map(([animal, count]) => ({
			label: animal,
			value: count
		}));
	});

	// Total workers
	const totalWorkers = $derived(
		livelihood.workerPrivateHousehold +
			livelihood.workerPrivateEstablishment +
			livelihood.workerGovernment +
			livelihood.workerSelfEmployed +
			livelihood.workerEmployer +
			livelihood.workerOFW
	);

	// Poverty rate
	const povertyRate = $derived(
		livelihood.sitiosWithIncome > 0
			? (livelihood.povertyCount / livelihood.sitiosWithIncome) * 100
			: 0
	);
</script>

<div class="space-y-6">
	<!-- Economic Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<DashboardStatCard
			title="Total Farmers"
			value={livelihood.totalFarmers}
			subtitle="{livelihood.totalFarmerOrgs} farmer organizations"
			icon={Tractor}
			variant="success"
		/>
		<DashboardStatCard
			title="Total Farm Area"
			value="{livelihood.totalFarmArea.toFixed(1)} ha"
			subtitle="Estimated hectares"
			icon={Leaf}
			variant="primary"
		/>
		<DashboardStatCard
			title="Avg Daily Income"
			value="₱{livelihood.averageDailyIncomeOverall.toFixed(0)}"
			subtitle="Across {livelihood.sitiosWithIncome} sitios"
			icon={Banknote}
			variant={livelihood.averageDailyIncomeOverall >= 600
				? 'success'
				: livelihood.averageDailyIncomeOverall >= 400
					? 'warning'
					: 'danger'}
		/>
		<DashboardStatCard
			title="Below Poverty Line"
			value="{povertyRate.toFixed(1)}%"
			subtitle="{livelihood.povertyCount} sitios (<₱400/day)"
			icon={PiggyBank}
			variant={povertyRate <= 20 ? 'success' : povertyRate <= 40 ? 'warning' : 'danger'}
		/>
	</div>

	<!-- Worker Stats -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<DashboardStatCard
			title="Total Tracked Workers"
			value={totalWorkers}
			subtitle="By employment type"
			icon={Briefcase}
			variant="default"
		/>
		<DashboardStatCard
			title="Self-Employed"
			value={livelihood.workerSelfEmployed}
			subtitle="{((livelihood.workerSelfEmployed / totalWorkers) * 100 || 0).toFixed(
				1
			)}% of workforce"
			icon={Building2}
			variant="primary"
		/>
		<DashboardStatCard
			title="OFW Workers"
			value={livelihood.workerOFW}
			subtitle="Overseas Filipino Workers"
			icon={Factory}
			variant="success"
		/>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Worker Class Distribution -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Users class="size-5 text-blue-500" />
					Employment by Worker Class
				</Card.Title>
				<Card.Description>Distribution of workers by employment type</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart data={workerClassData} height={300} title="Workers" />
			</Card.Content>
		</Card.Root>

		<!-- Income Distribution -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Banknote class="size-5 text-emerald-500" />
					Income Level Distribution
				</Card.Title>
				<Card.Description>Sitios by average daily income threshold</Card.Description>
			</Card.Header>
			<Card.Content>
				<DonutChart
					data={incomeClassData}
					centerLabel="Sitios"
					centerValue={livelihood.sitiosWithIncome.toString()}
					height={300}
				/>
			</Card.Content>
		</Card.Root>

		<!-- Top Crops -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Leaf class="size-5 text-green-500" />
					Top Crops Grown
				</Card.Title>
				<Card.Description>Most common crops across sitios (by sitio count)</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if topCrops().length > 0}
					<TreemapChart data={topCrops()} height={320} title="Crop Distribution" />
				{:else}
					<div class="flex h-80 items-center justify-center text-slate-500 dark:text-slate-400">
						No crop data available
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Top Livestock -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Warehouse class="size-5 text-amber-500" />
					Top Livestock Raised
				</Card.Title>
				<Card.Description>Most common livestock across sitios (by sitio count)</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if topLivestock().length > 0}
					<TreemapChart data={topLivestock()} height={320} title="Livestock Distribution" />
				{:else}
					<div class="flex h-80 items-center justify-center text-slate-500 dark:text-slate-400">
						No livestock data available
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
