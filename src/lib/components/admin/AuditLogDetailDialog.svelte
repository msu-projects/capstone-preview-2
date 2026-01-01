<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import type { AuditAction, AuditLog, AuditResourceType } from '$lib/types';
	import toTitleCase from '$lib/utils/common';
	import {
		Activity,
		ArrowRight,
		Calendar,
		Download,
		FileText,
		Globe,
		Hash,
		LogIn,
		LogOut,
		Pencil,
		Plus,
		Trash,
		Upload,
		User,
		type IconProps
	} from '@lucide/svelte';
	import type { Component } from 'svelte';

	interface Props {
		log: AuditLog | null;
		open: boolean;
		onOpenChange?: (open: boolean) => void;
	}

	let { log, open = $bindable(false), onOpenChange }: Props = $props();

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
	}

	function getActionIcon(action: AuditAction): Component<IconProps> {
		const iconMap: Record<AuditAction, Component<IconProps>> = {
			login: LogIn,
			logout: LogOut,
			create: Plus,
			update: Pencil,
			delete: Trash,
			view: FileText,
			export: Download,
			import: Upload
		};
		return iconMap[action] || Activity;
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

	function formatFullTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function formatRelativeTime(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		return '';
	}

	function formatFieldName(field: string): string {
		return field
			.replace(/_/g, ' ')
			.replace(/([A-Z])/g, ' $1')
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ')
			.trim();
	}

	function formatValue(value: unknown): string {
		if (value === null || value === undefined) return '(empty)';
		if (typeof value === 'boolean') return value ? 'Yes' : 'No';
		if (typeof value === 'object') {
			if (Array.isArray(value)) {
				if (value.length === 0) return '(empty)';
				return value.join(', ');
			}
			return JSON.stringify(value, null, 2);
		}
		return String(value);
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-h-[85vh] max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Activity class="h-5 w-5" />
				Activity Details
			</Dialog.Title>
			<Dialog.Description>Full details of the audit log entry</Dialog.Description>
		</Dialog.Header>

		{#if log}
			{@const ActionIcon = getActionIcon(log.action)}
			<ScrollArea class="max-h-[60vh] pr-4">
				<div class="space-y-4">
					<!-- User Info -->
					<div class="flex items-center gap-3">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
						>
							<User class="h-6 w-6 text-slate-600 dark:text-slate-400" />
						</div>
						<div>
							<p class="font-semibold">{log.user_name}</p>
							<p class="text-sm text-muted-foreground">User ID: {log.user_id}</p>
						</div>
					</div>

					<Separator />

					<!-- Action & Resource -->
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Action</span>
							<Badge variant={getActionBadgeVariant(log.action)}>
								<ActionIcon class="mr-1 h-3 w-3" />
								{toTitleCase(log.action)}
							</Badge>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Resource Type</span>
							<Badge variant={getResourceBadgeVariant(log.resource_type)}>
								{toTitleCase(log.resource_type)}
							</Badge>
						</div>

						{#if log.resource_name}
							<div class="flex items-center justify-between gap-4">
								<span class="shrink-0 text-sm text-muted-foreground">Resource Name</span>
								<span class="truncate text-sm font-medium">{log.resource_name}</span>
							</div>
						{/if}

						{#if log.resource_id}
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Resource ID</span>
								<div class="flex items-center gap-1 font-mono text-sm">
									<Hash class="h-3 w-3" />
									{log.resource_id}
								</div>
							</div>
						{/if}
					</div>

					<Separator />

					<!-- Field Changes -->
					{#if log.changes && log.changes.length > 0}
						<div class="space-y-3">
							<span class="text-sm font-medium"
								>Changes ({log.changes.length} field{log.changes.length !== 1 ? 's' : ''})</span
							>
							<div class="space-y-2">
								{#each log.changes as change}
									<div class="rounded-md border bg-muted/30 p-3">
										<p class="mb-2 text-sm font-medium text-foreground">
											{formatFieldName(change.field)}
										</p>
										<div class="flex items-start gap-2 text-xs">
											<div class="min-w-0 flex-1">
												<p class="mb-1 text-muted-foreground">Before:</p>
												<p
													class="rounded bg-destructive/10 px-2 py-1 font-mono wrap-break-word text-destructive"
												>
													{formatValue(change.oldValue)}
												</p>
											</div>
											<ArrowRight class="mt-5 h-4 w-4 shrink-0 text-muted-foreground" />
											<div class="min-w-0 flex-1">
												<p class="mb-1 text-muted-foreground">After:</p>
												<p
													class="rounded bg-green-500/10 px-2 py-1 font-mono wrap-break-word text-green-600 dark:text-green-400"
												>
													{formatValue(change.newValue)}
												</p>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<Separator />
					{/if}

					<!-- Details -->
					{#if log.details}
						<div class="space-y-2">
							<span class="text-sm font-medium">Details</span>
							<p class="rounded-md bg-muted p-3 text-sm">
								{log.details}
							</p>
						</div>

						<Separator />
					{/if}

					<!-- Metadata -->
					<div class="space-y-3">
						<div class="flex items-start justify-between gap-4">
							<div class="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
								<Calendar class="h-4 w-4" />
								Timestamp
							</div>
							<div class="text-right">
								<p class="text-sm">{formatFullTimestamp(log.timestamp)}</p>
								{#if formatRelativeTime(log.timestamp)}
									<p class="text-xs text-muted-foreground">
										{formatRelativeTime(log.timestamp)}
									</p>
								{/if}
							</div>
						</div>

						{#if log.ip_address}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-1 text-sm text-muted-foreground">
									<Globe class="h-4 w-4" />
									IP Address
								</div>
								<span class="font-mono text-sm">{log.ip_address}</span>
							</div>
						{/if}

						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Log ID</span>
							<span class="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
								{log.id}
							</span>
						</div>
					</div>
				</div>
			</ScrollArea>
		{/if}
	</Dialog.Content>
</Dialog.Root>
