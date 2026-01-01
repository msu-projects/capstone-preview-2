<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { AlertTriangle } from '@lucide/svelte';

	interface Props {
		open: boolean;
		sectionName: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { open = $bindable(), sectionName, onConfirm, onCancel }: Props = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title class="flex items-center gap-2">
				<AlertTriangle class="size-5 text-destructive" />
				Reset {sectionName} Configuration
			</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to reset the <strong>{sectionName}</strong> configuration to its default
				values? This action cannot be undone and any customizations you've made will be lost.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={onCancel}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={onConfirm} class="bg-destructive hover:bg-destructive/90">
				Reset to Default
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
