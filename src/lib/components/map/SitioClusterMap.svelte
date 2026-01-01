<script lang="ts">
	import { cn } from '$lib/utils';
	import type { CoordinatesAggregation } from '$lib/utils/sitio-chart-aggregation';
	import type { Map as LeafletMap } from 'leaflet';
	import { onMount } from 'svelte';

	interface SitioMarker {
		id: number;
		name: string;
		barangay: string;
		municipality: string;
		latitude: number;
		longitude: number;
		needScore?: number;
		classification?: {
			gida?: boolean;
			indigenous?: boolean;
			conflict?: boolean;
		};
	}

	interface Props {
		markers: SitioMarker[];
		bounds?: CoordinatesAggregation['bounds'];
		center?: CoordinatesAggregation['center'];
		height?: string;
		onMarkerClick?: (marker: SitioMarker) => void;
		class?: string;
	}

	let {
		markers,
		bounds,
		center,
		height = '400px',
		onMarkerClick,
		class: className
	}: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | null = null;
	let leafletModule: typeof import('leaflet') | null = null;
	let markerLayerGroup: import('leaflet').LayerGroup | null = null;

	// Get marker color based on classification first, then need score
	function getMarkerColor(
		classification?: SitioMarker['classification'],
		needScore?: number
	): string {
		// Priority: classification over need score
		if (classification) {
			// Multiple classifications: use red for conflict (highest priority)
			if (classification.conflict) return 'red';
			// Then GIDA
			if (classification.gida) return 'orange';
			// Then indigenous
			if (classification.indigenous) return 'violet';
		}

		// Fall back to need score coloring
		if (!needScore) return 'blue';
		if (needScore >= 3.5) return 'red';
		if (needScore >= 2.5) return 'orange';
		if (needScore >= 1.5) return 'gold';
		return 'green';
	}

	// Get classification badges
	function getClassificationBadges(classification?: SitioMarker['classification']): string {
		if (!classification) return '';
		const badges: string[] = [];
		if (classification.gida) badges.push('<span class="badge gida">GIDA</span>');
		if (classification.indigenous) badges.push('<span class="badge ip">IP</span>');
		if (classification.conflict) badges.push('<span class="badge conflict">Conflict</span>');
		return badges.join(' ');
	}

	function updateMarkers() {
		if (!map || !leafletModule || !markerLayerGroup) return;

		const L = leafletModule;

		// Clear existing markers
		markerLayerGroup.clearLayers();

		if (markers.length === 0) return;

		// Add markers
		for (const marker of markers) {
			if (!marker.latitude || !marker.longitude) continue;

			const color = getMarkerColor(marker.classification, marker.needScore);
			const customIcon = L.icon({
				iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41]
			});

			const popupContent = `
				<div class="sitio-popup">
					<strong class="sitio-name">${marker.name}</strong>
					<div class="sitio-location">${marker.barangay}, ${marker.municipality}</div>
					${marker.needScore !== undefined ? `<div class="sitio-score">Need Score: <strong>${marker.needScore.toFixed(2)}</strong></div>` : ''}
					<div class="sitio-badges">${getClassificationBadges(marker.classification)}</div>
					<div class="sitio-coords">
						<small>Lat: ${marker.latitude.toFixed(6)}, Lng: ${marker.longitude.toFixed(6)}</small>
					</div>
				</div>
			`;

			const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon: customIcon })
				.bindPopup(popupContent)
				.on('click', () => onMarkerClick?.(marker));

			markerLayerGroup.addLayer(leafletMarker);
		}

		// Fit bounds to markers
		if (markers.length > 0) {
			const validMarkers = markers.filter((m) => m.latitude && m.longitude);
			if (validMarkers.length > 0) {
				const latLngs = validMarkers.map((m) => [m.latitude, m.longitude] as [number, number]);
				const markerBounds = L.latLngBounds(latLngs);
				map.fitBounds(markerBounds, { padding: [50, 50], maxZoom: 14 });
			}
		}
	}

	onMount(() => {
		import('leaflet').then((L) => {
			leafletModule = L;

			// Import Leaflet CSS
			if (!document.querySelector('link[href*="leaflet"]')) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
				document.head.appendChild(link);
			}

			// Add custom popup styles
			if (!document.querySelector('style[data-sitio-map]')) {
				const style = document.createElement('style');
				style.setAttribute('data-sitio-map', 'true');
				style.textContent = `
					.sitio-popup { padding: 4px 0; }
					.sitio-popup .sitio-name { font-size: 14px; color: #1e293b; display: block; margin-bottom: 4px; }
					.sitio-popup .sitio-location { font-size: 12px; color: #64748b; margin-bottom: 4px; }
					.sitio-popup .sitio-score { font-size: 12px; color: #475569; margin-bottom: 4px; }
					.sitio-popup .sitio-badges { margin-bottom: 4px; }
					.sitio-popup .badge { 
						display: inline-block; 
						padding: 2px 6px; 
						border-radius: 4px; 
						font-size: 10px; 
						font-weight: 600;
						margin-right: 4px;
					}
					.sitio-popup .badge.gida { background: #fef3c7; color: #92400e; }
					.sitio-popup .badge.ip { background: #dbeafe; color: #1e40af; }
					.sitio-popup .badge.conflict { background: #fee2e2; color: #991b1b; }
					.sitio-popup .sitio-coords { color: #94a3b8; }
				`;
				document.head.appendChild(style);
			}

			// Default center (South Cotabato approximate center)
			const defaultCenter = center || { lat: 6.2635, lng: 124.85 };

			// Initialize map
			map = L.map(mapContainer).setView([defaultCenter.lat, defaultCenter.lng], 10);

			// Add OpenStreetMap tile layer
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);

			// Create marker layer group
			markerLayerGroup = L.layerGroup().addTo(map);

			// Initial marker update
			updateMarkers();
		});

		return () => {
			map?.remove();
		};
	});

	// Update markers when they change
	$effect(() => {
		if (markers) {
			updateMarkers();
		}
	});
</script>

<div
	bind:this={mapContainer}
	style="height: {height}; width: 100%;"
	class={cn('rounded-lg border border-slate-200 dark:border-slate-700', className)}
></div>

<style>
	:global(.leaflet-container) {
		border-radius: 0.5rem;
		font-family: Inter, ui-sans-serif, system-ui, sans-serif;
	}
</style>
