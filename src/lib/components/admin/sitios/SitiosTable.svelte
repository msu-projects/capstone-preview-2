<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Empty from '$lib/components/ui/empty';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import type { SitioRecord } from '$lib/types';
	import { formatNumber } from '$lib/utils/formatters';
	import {
		ArrowDownUp,
		Download,
		EllipsisVertical,
		Eye,
		FilterX,
		Home,
		MapPin,
		Plus,
		RefreshCw,
		SquarePen,
		Trash2,
		Upload,
		Users
	} from '@lucide/svelte';

	const isMobile = new IsMobile();

	// Extended Sitio type for table display (flattened for easier display)
	interface SitioDisplay extends SitioRecord {
		/** Display name (mapped from sitioName) */
		name?: string;
		/** Total population from latest year data */
		population?: number;
		/** Total households from latest year data */
		households?: number;
	}

	interface Props {
		sitios: SitioDisplay[];
		totalSitios: number;
		currentPage: number;
		itemsPerPage: number;
		totalPages: number;
		sortBy?: 'name' | 'municipality' | 'barangay' | 'population' | 'households';
		sortOrder?: 'asc' | 'desc';
		onToggleSort?: (
			column: 'name' | 'municipality' | 'barangay' | 'population' | 'households'
		) => void;
		onRefresh: () => void;
		onDelete: (id: number) => void;
		onDownloadPDF: (id: number) => void;
		onPageChange: (page: number) => void;
		onEdit: (id: number) => void;
		onClearFilters?: () => void;
		hasActiveFilters?: boolean;
	}

	let {
		sitios,
		totalSitios,
		currentPage = $bindable(),
		itemsPerPage,
		totalPages,
		sortBy,
		sortOrder,
		onToggleSort,
		onRefresh,
		onDelete,
		onDownloadPDF,
		onEdit,
		onClearFilters,
		hasActiveFilters = false
	}: Props = $props();

	// Mobile sort options
	const sortOptions = [
		{ value: 'name', label: 'Name' },
		{ value: 'barangay', label: 'Barangay' },
		{ value: 'municipality', label: 'Municipality' },
		{ value: 'population', label: 'Population' },
		{ value: 'households', label: 'Households' }
	] as const;

	function handleMobileSortChange(value: string | undefined) {
		if (value && onToggleSort) {
			onToggleSort(value as NonNullable<typeof sortBy>);
		}
	}
</script>

<Card.Card class="gap-4 shadow-sm transition-shadow hover:shadow-md">
	<Card.CardHeader>
		<div class="flex items-center justify-between">
			<Card.CardTitle class="text-xl font-semibold">All Sitios ({totalSitios})</Card.CardTitle>
			<div class="flex items-center gap-2">
				<!-- Mobile Sort Dropdown -->
				{#if isMobile.current && onToggleSort}
					<Select.Root type="single" value={sortBy} onValueChange={handleMobileSortChange}>
						<Select.Trigger class="">
							<ArrowDownUp class="mr-2 size-4" />
							<!-- {sortOptions.find((o) => o.value === sortBy)?.label || 'Sort by'} -->
						</Select.Trigger>
						<Select.Content>
							{#each sortOptions as option}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/if}
				<Button variant="ghost" size="icon" onclick={onRefresh}>
					<RefreshCw class="size-4" />
				</Button>
			</div>
		</div>
	</Card.CardHeader>
	<Card.CardContent class="">
		<!-- Mobile Card View -->
		{#if isMobile.current}
			<div class="space-y-3">
				{#if sitios.length === 0}
					<Empty.Root class="border-none py-8">
						<Empty.Media>
							<MapPin class="size-12 text-muted-foreground/50" />
						</Empty.Media>
						<Empty.Header>
							<Empty.Title>
								{hasActiveFilters ? 'No matching sitios' : 'No sitios yet'}
							</Empty.Title>
							<Empty.Description>
								{#if hasActiveFilters}
									Try adjusting your search or filters to find what you're looking for.
								{:else}
									Get started by adding your first sitio or importing data from a CSV file.
								{/if}
							</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<div class="flex flex-col gap-2 sm:flex-row">
								{#if hasActiveFilters && onClearFilters}
									<Button variant="outline" size="sm" onclick={onClearFilters}>
										<FilterX class="mr-2 size-4" />
										Clear Filters
									</Button>
								{/if}
								<Button variant="outline" size="sm" onclick={() => goto('/admin/import')}>
									<Upload class="mr-2 size-4" />
									Import Data
								</Button>
								<Button size="sm" onclick={() => goto('/admin/sitios/new')}>
									<Plus class="mr-2 size-4" />
									Add Sitio
								</Button>
							</div>
						</Empty.Content>
					</Empty.Root>
				{:else}
					{#each sitios as sitio (sitio.id)}
						<button
							type="button"
							class="block w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-md focus:ring-2 focus:ring-primary/20 focus:outline-none"
							onclick={() => goto(`/admin/sitios/${sitio.id}`)}
						>
							<!-- Header: Name & Location -->
							<div class="mb-3 flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<h3 class="truncate font-semibold text-foreground">{sitio.name}</h3>
									<p class="mt-0.5 truncate text-sm text-muted-foreground">
										{sitio.barangay}, {sitio.municipality}
									</p>
								</div>
								<!-- Actions Dropdown -->
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button
											variant="ghost"
											size="icon"
											class="size-8 shrink-0"
											onclick={(e) => e.stopPropagation()}
										>
											<EllipsisVertical class="size-4" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item
											onclick={(e) => {
												e.stopPropagation();
												goto(`/admin/sitios/${sitio.id}`);
											}}
										>
											<Eye class="mr-2 size-4" />
											View Details
										</DropdownMenu.Item>
										<DropdownMenu.Item
											onclick={(e) => {
												e.stopPropagation();
												onEdit(sitio.id);
											}}
										>
											<SquarePen class="mr-2 size-4" />
											Edit Sitio
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											onclick={(e) => {
												e.stopPropagation();
												onDownloadPDF(sitio.id);
											}}
										>
											<Download class="mr-2 size-4" />
											Download PDF
										</DropdownMenu.Item>
										<DropdownMenu.Item
											onclick={(e) => {
												e.stopPropagation();
												onDelete(sitio.id);
											}}
											class="text-destructive"
										>
											<Trash2 class="mr-2 size-4" />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>

							<!-- Stats Grid -->
							<div class="grid grid-cols-2 gap-3">
								<div class="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
									<Users class="size-4 text-muted-foreground" />
									<div>
										<p class="text-xs text-muted-foreground">Population</p>
										<p class="text-sm font-medium">{formatNumber(sitio.population)}</p>
									</div>
								</div>
								<div class="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
									<Home class="size-4 text-muted-foreground" />
									<div>
										<p class="text-xs text-muted-foreground">Households</p>
										<p class="text-sm font-medium">{formatNumber(sitio.households)}</p>
									</div>
								</div>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		{:else}
			<!-- Desktop Table View -->
			<div class="overflow-x-auto rounded-md border">
				<Table.Table>
					<Table.TableHeader>
						<Table.TableRow>
							<Table.TableHead class="w-62.5">
								{#if onToggleSort}
									<button
										class="flex items-center gap-1 hover:text-foreground"
										onclick={() => onToggleSort?.('name')}
									>
										Sitio
										<ArrowDownUp
											class="size-3 {sortBy === 'name' ? 'opacity-100' : 'opacity-30'}"
										/>
									</button>
								{:else}
									Sitio
								{/if}
							</Table.TableHead>
							<Table.TableHead class="w-50">
								{#if onToggleSort}
									<button
										class="flex items-center gap-1 hover:text-foreground"
										onclick={() => onToggleSort?.('barangay')}
									>
										Barangay
										<ArrowDownUp
											class="size-3 {sortBy === 'barangay' ? 'opacity-100' : 'opacity-30'}"
										/>
									</button>
								{:else}
									Barangay
								{/if}
							</Table.TableHead>
							<Table.TableHead class="w-50">
								{#if onToggleSort}
									<button
										class="flex items-center gap-1 hover:text-foreground"
										onclick={() => onToggleSort?.('municipality')}
									>
										Municipality
										<ArrowDownUp
											class="size-3 {sortBy === 'municipality' ? 'opacity-100' : 'opacity-30'}"
										/>
									</button>
								{:else}
									Municipality
								{/if}
							</Table.TableHead>
							<Table.TableHead class="w-35 text-right">
								{#if onToggleSort}
									<button
										class="flex items-center gap-1 hover:text-foreground"
										onclick={() => onToggleSort?.('population')}
									>
										Population
										<ArrowDownUp
											class="size-3 {sortBy === 'population' ? 'opacity-100' : 'opacity-30'}"
										/>
									</button>
								{:else}
									Population
								{/if}
							</Table.TableHead>
							<Table.TableHead class="w-35 text-right">
								{#if onToggleSort}
									<button
										class="flex items-center gap-1 hover:text-foreground"
										onclick={() => onToggleSort?.('households')}
									>
										Households
										<ArrowDownUp
											class="size-3 {sortBy === 'households' ? 'opacity-100' : 'opacity-30'}"
										/>
									</button>
								{:else}
									Households
								{/if}
							</Table.TableHead>

							<Table.TableHead class="w-25 text-right">Actions</Table.TableHead>
						</Table.TableRow>
					</Table.TableHeader>
					<Table.TableBody>
						{#if sitios.length === 0}
							<Table.TableRow>
								<Table.TableCell colspan={7} class="h-64">
									<Empty.Root class="border-none">
										<Empty.Media>
											<MapPin class="size-12 text-muted-foreground/50" />
										</Empty.Media>
										<Empty.Header>
											<Empty.Title>
												{hasActiveFilters ? 'No matching sitios' : 'No sitios yet'}
											</Empty.Title>
											<Empty.Description>
												{#if hasActiveFilters}
													Try adjusting your search or filters to find what you're looking for.
												{:else}
													Get started by adding your first sitio or importing data from a CSV file.
												{/if}
											</Empty.Description>
										</Empty.Header>
										<Empty.Content>
											<div class="flex flex-wrap justify-center gap-2">
												{#if hasActiveFilters && onClearFilters}
													<Button variant="outline" size="sm" onclick={onClearFilters}>
														<FilterX class="mr-2 size-4" />
														Clear Filters
													</Button>
												{/if}
												<Button variant="outline" size="sm" onclick={() => goto('/admin/import')}>
													<Upload class="mr-2 size-4" />
													Import Data
												</Button>
												<Button size="sm" onclick={() => goto('/admin/sitios/new')}>
													<Plus class="mr-2 size-4" />
													Add Sitio
												</Button>
											</div>
										</Empty.Content>
									</Empty.Root>
								</Table.TableCell>
							</Table.TableRow>
						{:else}
							{#each sitios as sitio (sitio.id)}
								<Table.TableRow
									class="cursor-pointer transition-colors hover:bg-accent/10"
									onclick={() => goto(`/admin/sitios/${sitio.id}`)}
								>
									<!-- Sitio Name -->
									<Table.TableCell>
										<div class="font-medium">{sitio.name}</div>
									</Table.TableCell>

									<!-- Barangay -->
									<Table.TableCell>
										<div class="text-sm">{sitio.barangay}</div>
									</Table.TableCell>

									<!-- Municipality -->
									<Table.TableCell>
										<div class="text-sm">{sitio.municipality}</div>
									</Table.TableCell>

									<!-- Population -->
									<Table.TableCell class="">
										<div class="text-sm font-medium">{formatNumber(sitio.population)}</div>
									</Table.TableCell>

									<!-- Households -->
									<Table.TableCell class="">
										<div class="text-sm font-medium">{formatNumber(sitio.households)}</div>
									</Table.TableCell>

									<!-- Actions -->
									<Table.TableCell class="text-right">
										<div class="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												onclick={(e) => {
													e.stopPropagation();
													onEdit(sitio.id);
												}}
											>
												<SquarePen class="size-4" />
											</Button>
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													<Button variant="ghost" size="icon" onclick={(e) => e.stopPropagation()}>
														<EllipsisVertical class="size-4" />
													</Button>
												</DropdownMenu.Trigger>
												<DropdownMenu.Content align="end">
													<DropdownMenu.Item
														onclick={(e) => {
															e.stopPropagation();
															goto(`/admin/sitios/${sitio.id}`);
														}}
													>
														<Eye class="mr-2 size-4" />
														View Details
													</DropdownMenu.Item>
													<DropdownMenu.Item
														onclick={(e) => {
															e.stopPropagation();
															onEdit(sitio.id);
														}}
													>
														<SquarePen class="mr-2 size-4" />
														Edit Sitio
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														onclick={(e) => {
															e.stopPropagation();
															onDownloadPDF(sitio.id);
														}}
													>
														<Download class="mr-2 size-4" />
														Download PDF
													</DropdownMenu.Item>
													<DropdownMenu.Item
														onclick={(e) => {
															e.stopPropagation();
															onDelete(sitio.id);
														}}
														class="text-destructive"
													>
														<Trash2 class="mr-2 size-4" />
														Delete
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</div>
									</Table.TableCell>
								</Table.TableRow>
							{/each}
						{/if}
					</Table.TableBody>
				</Table.Table>
			</div>
		{/if}
	</Card.CardContent>

	<!-- Pagination -->
	{#if totalPages > 1}
		<Card.CardFooter class="flex flex-col gap-3 sm:flex-row sm:justify-between">
			<div class="text-center text-sm text-muted-foreground sm:text-left">
				{#if isMobile.current}
					Page {currentPage} of {totalPages}
				{:else}
					Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(
						currentPage * itemsPerPage,
						totalSitios
					)} of {totalSitios} sitios
				{/if}
			</div>
			<div class="flex justify-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={currentPage === 1}
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
				>
					Previous
				</Button>
				{#if !isMobile.current}
					<div class="flex items-center gap-1">
						{#each Array(totalPages) as _, i (i)}
							{#if i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
								<Button
									variant={currentPage === i + 1 ? 'default' : 'outline'}
									size="sm"
									onclick={() => (currentPage = i + 1)}
								>
									{i + 1}
								</Button>
							{:else if i + 1 === currentPage - 2 || i + 1 === currentPage + 2}
								<span class="px-2">...</span>
							{/if}
						{/each}
					</div>
				{/if}
				<Button
					variant="outline"
					size="sm"
					disabled={currentPage === totalPages}
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
				>
					Next
				</Button>
			</div>
		</Card.CardFooter>
	{/if}
</Card.Card>
