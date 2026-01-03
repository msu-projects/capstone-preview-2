<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import type { ReportSection } from '$lib/types/report';
	import { SECTION_DESCRIPTIONS, SECTION_LABELS } from '$lib/types/report';

	interface Props {
		selectedSections: ReportSection[];
		onchange?: (sections: ReportSection[]) => void;
	}

	let { selectedSections = $bindable(), onchange }: Props = $props();

	const allSections: ReportSection[] = [
		'overview',
		'demographics',
		'utilities',
		'facilities',
		'infrastructure',
		'livelihood',
		'safety'
		// 'priorities'
	];

	function toggleSection(section: ReportSection) {
		if (selectedSections.includes(section)) {
			selectedSections = selectedSections.filter((s) => s !== section);
		} else {
			selectedSections = [...selectedSections, section];
		}
		onchange?.(selectedSections);
	}

	function selectAll() {
		selectedSections = [...allSections];
		onchange?.(selectedSections);
	}

	function deselectAll() {
		selectedSections = [];
		onchange?.(selectedSections);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-medium">Report Sections</h3>
		<div class="flex gap-2">
			<button type="button" class="text-xs text-primary hover:underline" onclick={selectAll}>
				Select All
			</button>
			<span class="text-muted-foreground">|</span>
			<button type="button" class="text-xs text-primary hover:underline" onclick={deselectAll}>
				Deselect All
			</button>
		</div>
	</div>

	<div class="grid gap-3 sm:grid-cols-2">
		{#each allSections as section}
			{@const isSelected = selectedSections.includes(section)}
			<div
				class="flex items-start gap-3 rounded-lg border p-3 transition-colors {isSelected
					? 'border-primary bg-primary/5'
					: 'border-border'}"
			>
				<Checkbox
					id="section-{section}"
					checked={isSelected}
					onCheckedChange={() => toggleSection(section)}
				/>
				<div class="flex-1 space-y-1">
					<Label for="section-{section}" class="cursor-pointer text-sm leading-none font-medium">
						{SECTION_LABELS[section]}
					</Label>
					<p class="text-xs text-muted-foreground">
						{SECTION_DESCRIPTIONS[section]}
					</p>
				</div>
			</div>
		{/each}
	</div>

	{#if selectedSections.length === 0}
		<p class="text-sm text-destructive">
			Please select at least one section to include in the report.
		</p>
	{/if}
</div>
