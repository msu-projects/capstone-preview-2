<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import RadarChart from '$lib/components/charts/RadarChart.svelte';
	import * as Card from '$lib/components/ui/card';
	import type { SitioRecord } from '$lib/types';
	import {
		aggregateAccessModes,
		aggregateFacilities,
		aggregateInfrastructure,
		aggregateUtilities,
		type AccessModesAggregation,
		type FacilitiesAggregation,
		type InfrastructureAggregation,
		type UtilitiesAggregation
	} from '$lib/utils/sitio-chart-aggregation';
	import {
		Building,
		Droplets,
		GraduationCap,
		Lightbulb,
		Route,
		ShowerHead,
		Signal,
		Toilet,
		Zap
	} from '@lucide/svelte';
	import DashboardStatCard from './DashboardStatCard.svelte';

	interface Props {
		sitios: SitioRecord[];
		selectedYear?: number;
	}

	let { sitios, selectedYear }: Props = $props();

	// Aggregated data
	const infrastructure = $derived<InfrastructureAggregation>(aggregateInfrastructure(sitios));
	const facilities = $derived<FacilitiesAggregation>(aggregateFacilities(sitios));
	const utilities = $derived<UtilitiesAggregation>(aggregateUtilities(sitios));
	const accessModes = $derived<AccessModesAggregation>(aggregateAccessModes(sitios));

	// Road types bar chart
	const roadTypesData = $derived([
		{ label: 'Asphalt', value: infrastructure.roadAsphalt.exists, color: 'hsl(217, 91%, 60%)' },
		{ label: 'Concrete', value: infrastructure.roadConcrete.exists, color: 'hsl(142, 71%, 45%)' },
		{ label: 'Gravel', value: infrastructure.roadGravel.exists, color: 'hsl(45, 93%, 47%)' },
		{ label: 'Natural', value: infrastructure.roadNatural.exists, color: 'hsl(25, 95%, 53%)' }
	]);

	// Road condition radar (average condition 1-5 as percentage)
	const roadConditionData = $derived([
		{ label: 'Asphalt', value: (infrastructure.roadAsphalt.avgCondition / 5) * 100 },
		{ label: 'Concrete', value: (infrastructure.roadConcrete.avgCondition / 5) * 100 },
		{ label: 'Gravel', value: (infrastructure.roadGravel.avgCondition / 5) * 100 },
		{ label: 'Natural', value: (infrastructure.roadNatural.avgCondition / 5) * 100 }
	]);

	// Access modes donut
	const accessModesData = $derived([
		{ label: 'Paved Road', value: accessModes.pavedRoad, color: 'hsl(217, 91%, 60%)' },
		{ label: 'Unpaved Road', value: accessModes.unpavedRoad, color: 'hsl(45, 93%, 47%)' },
		{ label: 'Footpath', value: accessModes.footpath, color: 'hsl(25, 95%, 53%)' },
		{ label: 'Boat', value: accessModes.boat, color: 'hsl(199, 89%, 48%)' }
	]);

	// Water sources bar chart
	const waterSourcesData = $derived([
		{ label: 'Natural', value: infrastructure.waterNatural.exists, color: 'hsl(199, 89%, 48%)' },
		{ label: 'Level 1', value: infrastructure.waterLevel1.exists, color: 'hsl(217, 91%, 60%)' },
		{ label: 'Level 2', value: infrastructure.waterLevel2.exists, color: 'hsl(142, 71%, 45%)' },
		{ label: 'Level 3', value: infrastructure.waterLevel3.exists, color: 'hsl(45, 93%, 47%)' }
	]);

	// Sanitation types donut
	const sanitationData = $derived([
		{
			label: 'Water Sealed',
			value: infrastructure.sanitationWaterSealed,
			color: 'hsl(142, 71%, 45%)'
		},
		{
			label: 'Pit Latrine',
			value: infrastructure.sanitationPitLatrine,
			color: 'hsl(45, 93%, 47%)'
		},
		{
			label: 'Community CR',
			value: infrastructure.sanitationCommunityCR,
			color: 'hsl(217, 91%, 60%)'
		},
		{
			label: 'Open Defecation',
			value: infrastructure.sanitationOpenDefecation,
			color: 'hsl(0, 84%, 60%)'
		}
	]);

	// Utilities coverage radar
	const utilitiesCoverageData = $derived([
		{ label: 'Electricity', value: utilities.electricityPercent },
		{ label: 'Toilet', value: utilities.toiletPercent },
		{ label: 'Internet', value: utilities.internetPercent }
	]);

	// Electricity sources bar chart
	const electricitySourcesData = $derived([
		{ label: 'Grid', value: utilities.electricityGrid, color: 'hsl(217, 91%, 60%)' },
		{ label: 'Solar', value: utilities.electricitySolar, color: 'hsl(45, 93%, 47%)' },
		{ label: 'Battery', value: utilities.electricityBattery, color: 'hsl(142, 71%, 45%)' },
		{ label: 'Generator', value: utilities.electricityGenerator, color: 'hsl(25, 95%, 53%)' }
	]);

	// Mobile signal distribution
	const mobileSignalData = $derived([
		{ label: '5G', value: utilities.signal5G, color: 'hsl(142, 71%, 45%)' },
		{ label: '4G', value: utilities.signal4G, color: 'hsl(217, 91%, 60%)' },
		{ label: '3G', value: utilities.signal3G, color: 'hsl(45, 93%, 47%)' },
		{ label: '2G', value: utilities.signal2G, color: 'hsl(25, 95%, 53%)' },
		{ label: 'None', value: utilities.signalNone, color: 'hsl(0, 84%, 60%)' }
	]);

	// Facility existence bar chart
	const facilityExistenceData = $derived([
		{ label: 'Health Center', value: facilities.healthCenter.exists, color: 'hsl(0, 84%, 60%)' },
		{ label: 'Pharmacy', value: facilities.pharmacy.exists, color: 'hsl(330, 81%, 60%)' },
		{ label: 'Kindergarten', value: facilities.kindergarten.exists, color: 'hsl(142, 71%, 45%)' },
		{ label: 'Elementary', value: facilities.elementarySchool.exists, color: 'hsl(217, 91%, 60%)' },
		{ label: 'High School', value: facilities.highSchool.exists, color: 'hsl(45, 93%, 47%)' },
		{ label: 'Market', value: facilities.market.exists, color: 'hsl(25, 95%, 53%)' }
	]);

	// Students per room distribution
	const studentsPerRoomData = $derived([
		{ label: '<46', value: infrastructure.studentsPerRoomLessThan46, color: 'hsl(142, 71%, 45%)' },
		{ label: '46-50', value: infrastructure.studentsPerRoom46_50, color: 'hsl(217, 91%, 60%)' },
		{ label: '51-55', value: infrastructure.studentsPerRoom51_55, color: 'hsl(45, 93%, 47%)' },
		{ label: '>56', value: infrastructure.studentsPerRoomMoreThan56, color: 'hsl(25, 95%, 53%)' },
		{
			label: 'No Classroom',
			value: infrastructure.studentsPerRoomNoClassroom,
			color: 'hsl(0, 84%, 60%)'
		}
	]);

	// Total road length
	const totalRoadLength = $derived(
		infrastructure.roadAsphalt.totalLength +
			infrastructure.roadConcrete.totalLength +
			infrastructure.roadGravel.totalLength +
			infrastructure.roadNatural.totalLength
	);

	// Total water sources
	const totalWaterSources = $derived(
		infrastructure.waterNatural.exists +
			infrastructure.waterLevel1.exists +
			infrastructure.waterLevel2.exists +
			infrastructure.waterLevel3.exists
	);
</script>

<div class="space-y-6">
	<!-- Infrastructure Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<DashboardStatCard
			title="Electrification Rate"
			value="{utilities.electricityPercent.toFixed(1)}%"
			subtitle="{utilities.householdsWithElectricity.toLocaleString()} households"
			icon={Zap}
			variant={utilities.electricityPercent >= 80
				? 'success'
				: utilities.electricityPercent >= 50
					? 'warning'
					: 'danger'}
		/>
		<DashboardStatCard
			title="Toilet Access"
			value="{utilities.toiletPercent.toFixed(1)}%"
			subtitle="{utilities.householdsWithToilet.toLocaleString()} households"
			icon={Toilet}
			variant={utilities.toiletPercent >= 80
				? 'success'
				: utilities.toiletPercent >= 50
					? 'warning'
					: 'danger'}
		/>
		<DashboardStatCard
			title="Internet Access"
			value="{utilities.internetPercent.toFixed(1)}%"
			subtitle="{utilities.householdsWithInternet.toLocaleString()} households"
			icon={Lightbulb}
			variant={utilities.internetPercent >= 50
				? 'success'
				: utilities.internetPercent >= 25
					? 'warning'
					: 'danger'}
		/>
		<DashboardStatCard
			title="Total Road Length"
			value="{totalRoadLength.toFixed(1)} km"
			subtitle="Across all road types"
			icon={Route}
			variant="primary"
		/>
	</div>

	<!-- Charts Grid - Row 1 -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Road Types -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Route class="size-5 text-blue-500" />
					Road Types by Sitio
				</Card.Title>
				<Card.Description>Number of sitios with each road type</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart data={roadTypesData} height={280} title="Sitios" />
			</Card.Content>
		</Card.Root>

		<!-- Road Conditions Radar -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Route class="size-5 text-emerald-500" />
					Average Road Condition
				</Card.Title>
				<Card.Description>Condition score as percentage (100% = Excellent)</Card.Description>
			</Card.Header>
			<Card.Content>
				<RadarChart
					data={roadConditionData}
					height={280}
					title="Condition %"
					color="hsl(217, 91%, 60%)"
				/>
			</Card.Content>
		</Card.Root>

		<!-- Access Modes -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Route class="size-5 text-amber-500" />
					Main Access Modes
				</Card.Title>
				<Card.Description>Primary transportation access to sitios</Card.Description>
			</Card.Header>
			<Card.Content>
				<DonutChart data={accessModesData} centerLabel="Total" height={280} />
			</Card.Content>
		</Card.Root>

		<!-- Water Sources -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Droplets class="size-5 text-sky-500" />
					Water Sources
				</Card.Title>
				<Card.Description>
					Water infrastructure by level ({totalWaterSources} total sources)
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart data={waterSourcesData} height={280} title="Sitios" />
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Charts Grid - Row 2 -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Sanitation Types -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<ShowerHead class="size-5 text-teal-500" />
					Sanitation Types
				</Card.Title>
				<Card.Description>Distribution of sanitation facilities across sitios</Card.Description>
			</Card.Header>
			<Card.Content>
				<DonutChart data={sanitationData} centerLabel="Sitios" height={280} />
			</Card.Content>
		</Card.Root>

		<!-- Electricity Sources -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Zap class="size-5 text-yellow-500" />
					Electricity Sources
				</Card.Title>
				<Card.Description>Households by electricity source type</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart data={electricitySourcesData} height={280} title="Households" />
			</Card.Content>
		</Card.Root>

		<!-- Mobile Signal -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Signal class="size-5 text-indigo-500" />
					Mobile Signal Coverage
				</Card.Title>
				<Card.Description>Sitios by mobile network availability</Card.Description>
			</Card.Header>
			<Card.Content>
				<DonutChart data={mobileSignalData} centerLabel="Sitios" height={280} />
			</Card.Content>
		</Card.Root>

		<!-- Utilities Coverage Radar -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Lightbulb class="size-5 text-emerald-500" />
					Utilities Coverage Overview
				</Card.Title>
				<Card.Description>Household access rates to basic utilities</Card.Description>
			</Card.Header>
			<Card.Content>
				<RadarChart
					data={utilitiesCoverageData}
					height={280}
					title="Coverage %"
					color="hsl(142, 71%, 45%)"
				/>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Facilities Section -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Facility Existence -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<Building class="size-5 text-slate-500" />
					Facilities Present in Sitios
				</Card.Title>
				<Card.Description>Number of sitios with each facility type</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart
					data={facilityExistenceData}
					height={300}
					orientation="horizontal"
					title="Sitios"
				/>
			</Card.Content>
		</Card.Root>

		<!-- Students per Room -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<GraduationCap class="size-5 text-blue-500" />
					Classroom Density
				</Card.Title>
				<Card.Description>Students per classroom ratio across sitios</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart data={studentsPerRoomData} height={300} title="Sitios" />
			</Card.Content>
		</Card.Root>
	</div>
</div>
