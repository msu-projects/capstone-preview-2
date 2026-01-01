<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="space-y-6">
	<!-- KPI Cards Skeleton -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each Array(4) as _}
			<Card.Root class="border-0 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
				<Card.Content class="p-4 sm:p-5">
					<div class="flex items-center gap-3 sm:gap-4">
						<Skeleton class="size-10 rounded-xl sm:size-12" />
						<div class="flex-1 space-y-2">
							<Skeleton class="h-4 w-20" />
							<Skeleton class="h-6 w-24" />
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Charts Row Skeleton -->
	<div class="grid gap-6 lg:grid-cols-2">
		<Card.Root class="border-0 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
			<Card.Header>
				<Skeleton class="h-5 w-40" />
				<Skeleton class="h-4 w-60" />
			</Card.Header>
			<Card.Content>
				<Skeleton class="h-55 w-full rounded-lg" />
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-0 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
			<Card.Header>
				<Skeleton class="h-5 w-40" />
				<Skeleton class="h-4 w-60" />
			</Card.Header>
			<Card.Content>
				<Skeleton class="h-55 w-full rounded-lg" />
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Additional Stats Row Skeleton -->
	<div class="grid gap-4 sm:grid-cols-3">
		{#each Array(3) as _}
			<Card.Root class="border-0 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="space-y-2">
							<Skeleton class="h-4 w-24" />
							<Skeleton class="h-7 w-16" />
						</div>
						<Skeleton class="size-9 rounded-lg" />
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>
