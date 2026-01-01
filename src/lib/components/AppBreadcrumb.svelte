<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Home } from '@lucide/svelte';
	import type { Component, Snippet } from 'svelte';

	export interface BreadcrumbItem {
		label: string;
		href?: string;
		icon?: Component<{ class?: string }>;
	}

	interface Props {
		items: BreadcrumbItem[];
		isAdminView?: boolean;
		sticky?: boolean;
		showSidebarTrigger?: boolean;
		actions?: Snippet;
	}

	let {
		items,
		isAdminView = false,
		sticky = true,
		showSidebarTrigger = true,
		actions
	}: Props = $props();

	// For mobile, we show: first item, ellipsis (if > 3 items), last 2 items
	const shouldTruncate = $derived(items.length > 3);
	const visibleItemsStart = $derived(shouldTruncate ? items.slice(0, 1) : items);
	const hiddenItems = $derived(shouldTruncate ? items.slice(1, -2) : []);
	const visibleItemsEnd = $derived(shouldTruncate ? items.slice(-2) : []);

	// Build the home/admin item
	const homeItem: BreadcrumbItem = $derived(
		isAdminView
			? { label: 'Admin', href: '/admin' }
			: { label: 'Home', href: '/', icon: Home as unknown as Component<{ class?: string }> }
	);
</script>

<div
	class={[
		'border-b border-border bg-white/80 backdrop-blur-sm dark:bg-slate-900/80',
		sticky && 'sticky top-0 z-10'
	]
		.filter(Boolean)
		.join(' ')}
>
	<div class="w-full px-4 py-3 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				{#if isAdminView && showSidebarTrigger}
					<Sidebar.Trigger class="-ml-1 shrink-0" />
					<Separator orientation="vertical" class="h-6" />
				{/if}

				<Breadcrumb.Root>
					<Breadcrumb.List class="flex-wrap">
						<!-- Home/Admin item -->
						<Breadcrumb.Item>
							{#if homeItem.href}
								<Breadcrumb.Link
									href={homeItem.href}
									class="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
								>
									{#if homeItem.icon}
										{@const Icon = homeItem.icon}
										<Icon class="size-4" />
									{:else}
										{homeItem.label}
									{/if}
								</Breadcrumb.Link>
							{:else}
								<Breadcrumb.Page class="font-medium text-slate-900 dark:text-slate-100">
									{homeItem.label}
								</Breadcrumb.Page>
							{/if}
						</Breadcrumb.Item>

						{#if items.length > 0}
							<Breadcrumb.Separator class="text-slate-400 dark:text-slate-500" />
						{/if}

						<!-- Desktop: Show all items -->
						<span class="contents max-sm:hidden">
							{#each items as item, i}
								<Breadcrumb.Item>
									{#if item.href}
										<Breadcrumb.Link
											href={item.href}
											class="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
										>
											{#if item.icon}
												{@const Icon = item.icon}
												<Icon class="size-4" />
											{:else}
												{item.label}
											{/if}
										</Breadcrumb.Link>
									{:else}
										<Breadcrumb.Page class="font-medium text-slate-900 dark:text-slate-100">
											{#if item.icon}
												{@const Icon = item.icon}
												<span class="flex items-center gap-1.5">
													<Icon class="size-4" />
													{item.label}
												</span>
											{:else}
												{item.label}
											{/if}
										</Breadcrumb.Page>
									{/if}
								</Breadcrumb.Item>
								{#if i < items.length - 1}
									<Breadcrumb.Separator class="text-slate-400 dark:text-slate-500" />
								{/if}
							{/each}
						</span>

						<!-- Mobile: Truncated view with ellipsis dropdown -->
						<span class="contents sm:hidden">
							{#each visibleItemsStart as item, i}
								<Breadcrumb.Item>
									{#if item.href}
										<Breadcrumb.Link
											href={item.href}
											class="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
										>
											{#if item.icon}
												{@const Icon = item.icon}
												<Icon class="size-4" />
											{:else}
												{item.label}
											{/if}
										</Breadcrumb.Link>
									{:else}
										<Breadcrumb.Page class="font-medium text-slate-900 dark:text-slate-100">
											{item.label}
										</Breadcrumb.Page>
									{/if}
								</Breadcrumb.Item>
								{#if i < visibleItemsStart.length - 1 || hiddenItems.length > 0 || visibleItemsEnd.length > 0}
									<Breadcrumb.Separator class="text-slate-400 dark:text-slate-500" />
								{/if}
							{/each}

							{#if hiddenItems.length > 0}
								<Breadcrumb.Item>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class="flex items-center gap-1">
											<Breadcrumb.Ellipsis class="size-4" />
											<span class="sr-only">Toggle menu</span>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="start">
											{#each hiddenItems as item}
												{#if item.href}
													<DropdownMenu.Item>
														<a href={item.href} class="flex items-center gap-2">
															{#if item.icon}
																{@const Icon = item.icon}
																<Icon class="size-4" />
															{/if}
															{item.label}
														</a>
													</DropdownMenu.Item>
												{:else}
													<DropdownMenu.Item disabled>{item.label}</DropdownMenu.Item>
												{/if}
											{/each}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Breadcrumb.Item>
								<Breadcrumb.Separator class="text-slate-400 dark:text-slate-500" />
							{/if}

							{#each visibleItemsEnd as item, i}
								<Breadcrumb.Item>
									{#if item.href}
										<Breadcrumb.Link
											href={item.href}
											class="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
										>
											{#if item.icon}
												{@const Icon = item.icon}
												<Icon class="size-4" />
											{:else}
												{item.label}
											{/if}
										</Breadcrumb.Link>
									{:else}
										<Breadcrumb.Page class="font-medium text-slate-900 dark:text-slate-100">
											{item.label}
										</Breadcrumb.Page>
									{/if}
								</Breadcrumb.Item>
								{#if i < visibleItemsEnd.length - 1}
									<Breadcrumb.Separator class="text-slate-400 dark:text-slate-500" />
								{/if}
							{/each}
						</span>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>

			{#if actions}
				<div class="flex shrink-0 items-center gap-2">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
</div>
