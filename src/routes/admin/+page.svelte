<script lang="ts">
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import ActivityFeed from '$lib/components/admin/dashboard/ActivityFeed.svelte';
	import { loadAuditLogs } from '$lib/utils/audit';

	// Loading state for async data simulation
	let isLoading = $state(false);

	// Recent activities from audit logs
	const recentActivities = loadAuditLogs().reverse().slice(0, 10);
</script>

<svelte:head>
	<title>Admin Dashboard - South Cotabato Data Bank</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-muted/30">
	<!-- Header -->
	<AdminHeader title="Dashboard" description="Overview of projects, sitios, and activities" />

	<!-- Content -->
	<div class="flex-1 space-y-6 p-6">
		<div class="grid gap-6 lg:grid-cols-3">
			<ActivityFeed activities={recentActivities} {isLoading} />
		</div>
	</div>
</div>
