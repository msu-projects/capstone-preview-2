<script lang="ts">
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import AuditLogDetailDialog from '$lib/components/admin/AuditLogDetailDialog.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import type { AuditAction, AuditLog, AuditResourceType } from '$lib/types';
	import { getAuditLogStats, loadAuditLogs } from '$lib/utils/audit';
	import toTitleCase from '$lib/utils/common';
	import {
		Activity,
		Calendar,
		Download,
		FileText,
		LogIn,
		LogOut,
		Pencil,
		Plus,
		RefreshCw,
		Search,
		Trash,
		Upload,
		User
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	// State
	let auditLogs = $state<AuditLog[]>([]);
	let searchQuery = $state('');
	let actionFilter = $state<string>('all');
	let resourceFilter = $state<string>('all');
	let userFilter = $state<string>('all');
	let currentPage = $state(1);
	const perPage = 20;

	// Dialog state
	let selectedLog = $state<AuditLog | null>(null);
	let dialogOpen = $state(false);

	function openLogDetail(log: AuditLog) {
		selectedLog = log;
		dialogOpen = true;
	}

	// Stats
	let stats = $state({
		total: 0,
		byAction: {} as Record<string, number>,
		byResource: {} as Record<string, number>,
		byUser: {} as Record<string, number>
	});

	// Computed
	const filteredLogs = $derived.by(() => {
		let filtered = auditLogs;

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(log) =>
					log.user_name.toLowerCase().includes(query) ||
					log.action.toLowerCase().includes(query) ||
					log.resource_type.toLowerCase().includes(query) ||
					log.resource_name?.toLowerCase().includes(query) ||
					log.details?.toLowerCase().includes(query)
			);
		}

		// Action filter
		if (actionFilter !== 'all') {
			filtered = filtered.filter((log) => log.action === actionFilter);
		}

		// Resource filter
		if (resourceFilter !== 'all') {
			filtered = filtered.filter((log) => log.resource_type === resourceFilter);
		}

		// User filter
		if (userFilter !== 'all') {
			filtered = filtered.filter((log) => log.user_name === userFilter);
		}

		return filtered;
	});

	const paginatedLogs = $derived.by(() => {
		const start = (currentPage - 1) * perPage;
		return filteredLogs.slice(start, start + perPage);
	});

	const totalPages = $derived(Math.ceil(filteredLogs.length / perPage));
	const uniqueUsers = $derived([...new Set(auditLogs.map((log) => log.user_name))]);

	// Load data on mount
	onMount(() => {
		refreshLogs();
	});

	function refreshLogs() {
		auditLogs = loadAuditLogs().reverse(); // Most recent first
		stats = getAuditLogStats();
		currentPage = 1;
	}

	function getActionIcon(action: AuditAction) {
		switch (action) {
			case 'login':
				return LogIn;
			case 'logout':
				return LogOut;
			case 'create':
				return Plus;
			case 'update':
				return Pencil;
			case 'delete':
				return Trash;
			case 'view':
				return FileText;
			case 'export':
				return Download;
			case 'import':
				return Upload;
			default:
				return Activity;
		}
	}

	function getActionBadgeVariant(
		action: AuditAction
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (action) {
			case 'delete':
				return 'destructive';
			case 'create':
				return 'default';
			case 'update':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function getResourceBadgeVariant(
		resource: AuditResourceType
	): 'default' | 'secondary' | 'outline' {
		switch (resource) {
			case 'user':
				return 'default';
			default:
				return 'outline';
		}
	}

	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function exportLogs() {
		const csv = [
			[
				'Timestamp',
				'User',
				'Action',
				'Resource Type',
				'Resource Name',
				'Details',
				'IP Address'
			].join(','),
			...filteredLogs.map((log) =>
				[
					log.timestamp,
					`"${log.user_name}"`,
					log.action,
					log.resource_type,
					`"${log.resource_name || ''}"`,
					`"${log.details || ''}"`,
					log.ip_address || ''
				].join(',')
			)
		].join('\n');

		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Audit Logs - South Cotabato Data Bank</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-muted/30">
	<!-- Header -->
	<AdminHeader
		title="Audit Logs"
		description="Track all system activities and user actions"
		breadcrumbs={[{ label: 'Audit Logs' }]}
	>
		{#snippet actions()}
			<Button variant="outline" onclick={exportLogs} size="sm">
				<Download class="size-4 sm:mr-2" />
				<span class="hidden sm:inline">Export CSV</span>
			</Button>
			<Button variant="outline" onclick={refreshLogs} size="sm">
				<RefreshCw class="size-4 sm:mr-2" />
				<span class="hidden sm:inline">Refresh</span>
			</Button>
		{/snippet}
	</AdminHeader>

	<!-- Content -->
	<div class="flex-1 space-y-6 p-6">
		<!-- Stats Cards -->
		<div class="grid gap-4 md:grid-cols-4">
			<Card.Root>
				<Card.Content class="">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
							<Activity class="h-6 w-6 text-blue-600" />
						</div>
						<div>
							<p class="text-sm text-muted-foreground">Total Activities</p>
							<p class="text-2xl font-bold">{stats.total}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
							<LogIn class="h-6 w-6 text-green-600" />
						</div>
						<div>
							<p class="text-sm text-muted-foreground">Logins</p>
							<p class="text-2xl font-bold">{stats.byAction['login'] || 0}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
							<Pencil class="h-6 w-6 text-yellow-600" />
						</div>
						<div>
							<p class="text-sm text-muted-foreground">Updates</p>
							<p class="text-2xl font-bold">{stats.byAction['update'] || 0}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
							<User class="h-6 w-6 text-purple-600" />
						</div>
						<div>
							<p class="text-sm text-muted-foreground">Active Users</p>
							<p class="text-2xl font-bold">{Object.keys(stats.byUser).length}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Filters -->
		<Card.Root>
			<Card.Content class="">
				<div class="flex flex-col gap-4 md:flex-row md:items-center">
					<div class="relative flex-1">
						<Search
							class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input placeholder="Search logs..." bind:value={searchQuery} class="pl-10" />
					</div>
					<div class="flex flex-wrap gap-2">
						<Select.Root type="single" bind:value={actionFilter}>
							<Select.Trigger class="w-32.5">
								{actionFilter === 'all'
									? 'All Actions'
									: actionFilter.charAt(0).toUpperCase() + actionFilter.slice(1)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all">All Actions</Select.Item>
								<Select.Item value="login">Login</Select.Item>
								<Select.Item value="logout">Logout</Select.Item>
								<Select.Item value="create">Create</Select.Item>
								<Select.Item value="update">Update</Select.Item>
								<Select.Item value="delete">Delete</Select.Item>
								<Select.Item value="view">View</Select.Item>
								<Select.Item value="export">Export</Select.Item>
								<Select.Item value="import">Import</Select.Item>
							</Select.Content>
						</Select.Root>
						<Select.Root type="single" bind:value={resourceFilter}>
							<Select.Trigger class="w-32.5">
								{resourceFilter === 'all'
									? 'All Resources'
									: resourceFilter.charAt(0).toUpperCase() + resourceFilter.slice(1)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all">All Resources</Select.Item>
								<Select.Item value="user">User</Select.Item>
								<Select.Item value="sitio">Sitio</Select.Item>
								<Select.Item value="project">Project</Select.Item>
								<Select.Item value="system">System</Select.Item>
							</Select.Content>
						</Select.Root>
						<Select.Root type="single" bind:value={userFilter}>
							<Select.Trigger class="w-37.5">
								{userFilter === 'all' ? 'All Users' : userFilter}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all">All Users</Select.Item>
								{#each uniqueUsers as user}
									<Select.Item value={user}>{user}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Logs Table -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<FileText class="h-5 w-5" />
					Activity Log ({filteredLogs.length} entries)
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-45">Timestamp</Table.Head>
							<Table.Head>User</Table.Head>
							<Table.Head>Action</Table.Head>
							<Table.Head>Resource</Table.Head>
							<Table.Head>Details</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each paginatedLogs as log (log.id)}
							<Table.Row
								class="cursor-pointer transition-colors hover:bg-muted/50"
								onclick={() => openLogDetail(log)}
							>
								<Table.Cell class="text-sm text-muted-foreground">
									<div class="flex items-center gap-2">
										<Calendar class="h-4 w-4" />
										{formatTimestamp(log.timestamp)}
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
										>
											<User class="h-4 w-4 text-slate-600 dark:text-slate-400" />
										</div>
										<span class="font-medium">{log.user_name}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getActionBadgeVariant(log.action)}>
										{@const ActionIcon = getActionIcon(log.action)}
										<ActionIcon class="mr-1 h-3 w-3" />
										{toTitleCase(log.action)}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Badge variant={getResourceBadgeVariant(log.resource_type)}>
											{toTitleCase(log.resource_type)}
										</Badge>
										{#if log.resource_name}
											<span class="text-sm text-muted-foreground">{log.resource_name}</span>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell class="max-w-75 truncate text-sm text-muted-foreground">
									{log.details || '-'}
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={5} class="py-8 text-center text-muted-foreground">
									{#if auditLogs.length === 0}
										No audit logs yet. Activities will appear here as users interact with the
										system.
									{:else}
										No logs match your filters.
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="mt-4 flex items-center justify-between">
						<p class="text-sm text-muted-foreground">
							Showing {(currentPage - 1) * perPage + 1} to {Math.min(
								currentPage * perPage,
								filteredLogs.length
							)} of {filteredLogs.length} entries
						</p>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage === 1}
								onclick={() => (currentPage = currentPage - 1)}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage === totalPages}
								onclick={() => (currentPage = currentPage + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<AuditLogDetailDialog log={selectedLog} bind:open={dialogOpen} />
