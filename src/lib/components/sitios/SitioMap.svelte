<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Map as LeafletMap } from 'leaflet';
	import { onMount } from 'svelte';

	interface Props {
		latitude: number;
		longitude: number;
		sitioName: string;
		height?: string;
		class?: string;
	}

	let { latitude, longitude, sitioName, height = '300px', class: className }: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | null = null;

	onMount(() => {
		// Dynamically import Leaflet to avoid SSR issues
		import('leaflet').then((L) => {
			// Import Leaflet CSS
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);

			// Initialize map
			map = L.map(mapContainer).setView([latitude, longitude], 13);

			// Add OpenStreetMap tile layer
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);

			// Custom marker icon (blue pin)
			const customIcon = L.icon({
				iconUrl:
					'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41]
			});

			// Add marker
			L.marker([latitude, longitude], { icon: customIcon })
				.addTo(map)
				.bindPopup(
					`<div class="text-center">
						<strong>${sitioName}</strong><br>
						<small>Lat: ${latitude.toFixed(6)}<br>
						Lng: ${longitude.toFixed(6)}</small>
					</div>`
				)
				.openPopup();
		});

		return () => {
			map?.remove();
		};
	});
</script>

<div
	bind:this={mapContainer}
	style="height: {height}; width: 100%;"
	class={cn('rounded-lg', className)}
></div>

<style>
	:global(.leaflet-container) {
		border-radius: 0.5rem;
	}
</style>
