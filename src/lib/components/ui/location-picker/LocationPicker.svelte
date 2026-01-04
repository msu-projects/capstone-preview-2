<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { LoaderCircle, MapPin, Search, X } from '@lucide/svelte';
  import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
  import { onMount } from 'svelte';

  let {
    lat = $bindable(0),
    lng = $bindable(0),
    municipality = '',
    barangay = '',
    errors = {}
  }: {
    lat: number;
    lng: number;
    municipality?: string;
    barangay?: string;
    errors?: { lat?: string; lng?: string };
  } = $props();

  let mapContainer = $state<HTMLDivElement | undefined>();
  let map: LeafletMap | null = $state(null);
  let marker: LeafletMarker | null = $state(null);
  let L: typeof import('leaflet') | null = $state(null);

  // Search state
  let searchQuery = $state('');
  let searchResults = $state<
    Array<{
      display_name: string;
      lat: string;
      lon: string;
      type: string;
      importance: number;
    }>
  >([]);
  let isSearching = $state(false);
  let showResults = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Default center - South Cotabato, Philippines
  const defaultCenter: [number, number] = [6.5, 124.85];
  const defaultZoom = 10;

  // Municipality coordinates in South Cotabato (approximate centers)
  const municipalityCoords: Record<string, [number, number]> = {
    BANGA: [6.423294, 124.7755],
    KORONADAL: [6.5008, 124.8469],
    'LAKE SEBU': [6.2167, 124.7],
    NORALA: [6.5333, 124.6667],
    POLOMOLOK: [6.2167, 125.0667],
    'STO. NIÑO': [6.4, 124.5667],
    SURALLAH: [6.3761, 124.7356],
    TAMPAKAN: [6.45, 125.0833],
    "T'BOLI": [6.3667, 124.9],
    TUPI: [6.3333, 124.95]
  };

  // Barangay coordinates (approximate - relative to municipality centers)
  const barangayCoords: Record<string, Record<string, [number, number]>> = {
    BANGA: {
      LIWANAY: [6.32, 124.78],
      'RANG-AY': [6.315, 124.775],
      'EL NONOK': [6.325, 124.785],
      YANGCO: [6.318, 124.79],
      'RIZAL POB.': [6.3186, 124.7792],
      MALAYA: [6.31, 124.77],
      KUSAN: [6.322, 124.782],
      'SAN VICENTE': [6.316, 124.776],
      REYES: [6.32, 124.788],
      CINCO: [6.314, 124.774],
      CABULING: [6.326, 124.786],
      'SAN JOSE': [6.312, 124.772],
      LAMBA: [6.324, 124.784],
      BENITEZ: [6.311, 124.771],
      CABUDIAN: [6.328, 124.788],
      'RIZAL 3': [6.313, 124.773],
      'PUNONG GRANDE': [6.33, 124.79],
      'LAM-APOS': [6.309, 124.769],
      IMPROGO: [6.332, 124.792]
    },
    KORONADAL: {},
    'LAKE SEBU': {
      BACDULONG: [6.22, 124.71],
      TASIMAN: [6.215, 124.705],
      LUHIB: [6.225, 124.715],
      'LAKE LAHIT': [6.218, 124.708],
      'LOWER MACULAN': [6.212, 124.695],
      HALILAN: [6.228, 124.718],
      DENLAG: [6.21, 124.69],
      LAMFUGON: [6.23, 124.72],
      'UPPER MACULAN': [6.208, 124.688],
      NED: [6.232, 124.722],
      LAMCADE: [6.206, 124.686]
    },
    NORALA: {
      'SAN MIGUEL': [6.535, 124.668],
      'LOPEZ JAENA': [6.53, 124.663],
      PUTI: [6.54, 124.673],
      LAPUZ: [6.528, 124.661],
      DUMAGUIL: [6.542, 124.675],
      TINAGO: [6.526, 124.659]
    },
    POLOMOLOK: {
      'KORONADAL PROPER': [6.2167, 125.0667],
      LAPU: [6.22, 125.07],
      SUMBAKIL: [6.215, 125.065],
      MAGSAYSAY: [6.225, 125.075],
      MALIGO: [6.212, 125.062],
      KINILIS: [6.228, 125.078],
      POLO: [6.21, 125.06],
      'CROSSING PALKAN': [6.23, 125.08],
      LUMAKIL: [6.208, 125.058],
      BENTUNG: [6.232, 125.082]
    },
    'STO. NIÑO': {
      PANAY: [6.405, 124.572],
      AMBALGAN: [6.398, 124.565],
      TERESITA: [6.408, 124.575],
      'M. ROXAS': [6.395, 124.562],
      'SAN VICENTE': [6.41, 124.578]
    },
    SURALLAH: {
      CANAHAY: [6.38, 124.74],
      COLONGULO: [6.375, 124.735],
      DUENGAS: [6.385, 124.745],
      TALAHIK: [6.372, 124.732],
      'LITTLE BAGUIO': [6.388, 124.748],
      'UPPER SEPAKA': [6.37, 124.73]
    },
    TAMPAKAN: {
      'SAN ISIDRO': [6.455, 125.088],
      KIPALBIG: [6.45, 125.083],
      'STA. CRUZ': [6.46, 125.093],
      MALTANA: [6.448, 125.081],
      DANLAG: [6.462, 125.095],
      'PULA BATO': [6.446, 125.079],
      BUTO: [6.464, 125.097],
      LAMPITAK: [6.444, 125.077],
      'PALO 19': [6.466, 125.099],
      LAMBAYONG: [6.442, 125.075],
      PULABATO: [6.468, 125.101],
      POBLACION: [6.45, 125.0833],
      ALBAGAN: [6.47, 125.103],
      TABLU: [6.44, 125.073],
      LIBERTY: [6.472, 125.105]
    },
    TANTANGAN: {
      LIBAS: [6.62, 124.76],
      TINONGCOP: [6.615, 124.755],
      'NEW LAMBUNAO': [6.625, 124.765],
      'SAN FELIPE': [6.612, 124.752],
      MAGON: [6.628, 124.768],
      'NEW CUYAPO': [6.61, 124.75],
      CABULING: [6.63, 124.77],
      MANGILALA: [6.608, 124.748],
      POBLACION: [6.62, 124.76],
      'NEW ILOILO': [6.632, 124.772],
      MAIBO: [6.606, 124.746],
      'BUKAY PAIT': [6.634, 124.774],
      DUMADALIG: [6.604, 124.744]
    },
    "T'BOLI": {
      KEMATU: [6.372, 124.905],
      LAMBANGAN: [6.368, 124.902],
      LACONON: [6.376, 124.908],
      'DATAL DLANAG': [6.365, 124.898],
      TUDOK: [6.378, 124.91],
      LEMSNOLON: [6.362, 124.895],
      SALACAFE: [6.38, 124.912],
      LAMBULING: [6.36, 124.892],
      LAMHAKU: [6.382, 124.914],
      DESAWO: [6.358, 124.89],
      AFUS: [6.384, 124.916],
      TALUFO: [6.356, 124.888],
      TBOLOK: [6.386, 124.918],
      EDWARDS: [6.354, 124.886],
      'DATAL BOB': [6.388, 124.92],
      POBLACION: [6.3667, 124.9],
      TALCON: [6.352, 124.884]
    },
    TUPI: {
      CEBUANO: [6.3333, 124.95]
    }
  };

  onMount(async () => {
    // Dynamically import Leaflet only on client side
    L = (await import('leaflet')).default;

    // Import Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Initialize map after a short delay to ensure DOM is ready
    setTimeout(() => {
      initMap();
    }, 50);
  });

  // Watch for municipality/barangay changes and update map center and search query
  $effect(() => {
    // Update search query based on municipality and barangay
    if (municipality && barangay) {
      searchQuery = `${barangay}, ${municipality}, South Cotabato`;
    } else if (municipality) {
      searchQuery = `${municipality}, South Cotabato`;
    }

    if (!map) return;

    // If barangay is selected, center on barangay
    if (municipality && barangay) {
      const barangayData = barangayCoords[municipality.toUpperCase()];
      if (barangayData) {
        const coords = barangayData[barangay.toUpperCase()];
        if (coords) {
          map.setView(coords, 14);
          return;
        }
      }
    }

    // Otherwise, center on municipality if selected
    if (municipality) {
      const coords = municipalityCoords[municipality.toUpperCase()];
      if (coords) {
        map.setView(coords, 12);
      }
    }
  });

  function initMap() {
    if (!L || !mapContainer || map) return;

    // Initialize map
    const center: [number, number] = lat !== 0 && lng !== 0 ? [lat, lng] : defaultCenter;

    map = L.map(mapContainer).setView(center, lat !== 0 && lng !== 0 ? 13 : defaultZoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Add marker if coordinates exist
    if (lat !== 0 && lng !== 0) {
      addMarker([lat, lng]);
    }

    // Click event to set coordinates
    map.on('click', (e) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      lat = parseFloat(newLat.toFixed(6));
      lng = parseFloat(newLng.toFixed(6));
      addMarker([lat, lng]);
    });

    // Force map to refresh size
    setTimeout(() => {
      map?.invalidateSize();
    }, 100);
  }

  function addMarker(coords: [number, number]) {
    if (!L || !map) return;

    // Remove existing marker
    if (marker) {
      map.removeLayer(marker);
    }

    // Add new marker
    marker = L.marker(coords).addTo(map);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat = parseFloat(position.coords.latitude.toFixed(6));
        lng = parseFloat(position.coords.longitude.toFixed(6));

        if (map) {
          map.setView([lat, lng], 13);
          addMarker([lat, lng]);
        }
      },
      (error) => {
        alert('Unable to get your location: ' + error.message);
      }
    );
  }

  function handleLatChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      lat = parseFloat(value.toFixed(6));
      if (map && lng !== 0) {
        map.setView([lat, lng], 13);
        addMarker([lat, lng]);
      }
    }
  }

  function handleLngChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      lng = parseFloat(value.toFixed(6));
      if (map && lat !== 0) {
        map.setView([lat, lng], 13);
        addMarker([lat, lng]);
      }
    }
  }

  function handleLatFocus(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.value === '0' || input.value === '0.000000') {
      input.value = '';
    }
  }

  function handleLngFocus(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.value === '0' || input.value === '0.000000') {
      input.value = '';
    }
  }

  function handleLatBlur(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.value === '' || input.value === '-') {
      lat = 0;
      input.value = '0.000000';
    }
  }

  function handleLngBlur(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.value === '' || input.value === '-') {
      lng = 0;
      input.value = '0.000000';
    }
  }

  async function searchLocation() {
    if (!searchQuery.trim()) {
      searchResults = [];
      showResults = false;
      return;
    }

    isSearching = true;
    try {
      // Use Nominatim API with South Cotabato bounds as priority
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchQuery)}&` +
          `format=json&` +
          `limit=5&` +
          `countrycodes=ph&` +
          `viewbox=124.5,6.1,125.3,6.8&` +
          `bounded=0`
      );

      if (response.ok) {
        const data = await response.json();
        searchResults = data;
        showResults = data.length > 0;
      }
    } catch (error) {
      console.error('Search failed:', error);
      searchResults = [];
      showResults = false;
    } finally {
      isSearching = false;
    }
  }

  function handleSearchInput() {
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If search query is empty, clear results immediately
    if (!searchQuery.trim()) {
      searchResults = [];
      showResults = false;
      isSearching = false;
      return;
    }

    // Show loading state
    isSearching = true;

    // Set a new timeout to search after 500ms of no typing
    searchTimeout = setTimeout(() => {
      searchLocation();
    }, 500);
  }

  function selectSearchResult(result: (typeof searchResults)[0]) {
    lat = parseFloat(parseFloat(result.lat).toFixed(6));
    lng = parseFloat(parseFloat(result.lon).toFixed(6));

    if (map) {
      map.setView([lat, lng], 15);
      addMarker([lat, lng]);
    }

    searchQuery = result.display_name;
    showResults = false;
  }

  function clearSearch() {
    searchQuery = '';
    searchResults = [];
    showResults = false;
  }

  // Close search results when clicking outside
  function handleSearchBlur() {
    setTimeout(() => {
      showResults = false;
    }, 200);
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <MapPin class="size-5" />
      Location Coordinates
    </Card.Title>
    <Card.Description>
      Click on the map to set the location, or enter coordinates manually
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    <!-- Search Location -->
    <div class="relative">
      <Label for="location-search">Search Location</Label>
      <div class="mt-2 flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="location-search"
            type="text"
            bind:value={searchQuery}
            oninput={handleSearchInput}
            onblur={handleSearchBlur}
            onfocus={() => {
              if (searchResults.length > 0) showResults = true;
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchLocation();
              }
            }}
            placeholder="Search for a place, address, or landmark..."
            class="pr-9 pl-9"
          />
          {#if searchQuery && !isSearching}
            <button
              type="button"
              onclick={clearSearch}
              class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X class="size-4" />
            </button>
          {/if}
          {#if isSearching}
            <div class="absolute top-1/2 right-3 -translate-y-1/2">
              <LoaderCircle class="size-4 animate-spin text-muted-foreground" />
            </div>
          {/if}
        </div>
        <Button
          type="button"
          onclick={searchLocation}
          disabled={!searchQuery.trim() || isSearching}
          class="shrink-0"
        >
          <Search class="mr-2 size-4" />
          Search
        </Button>
      </div>

      <!-- Search Results Dropdown -->
      {#if showResults && searchResults.length > 0}
        <div
          class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg"
        >
          {#each searchResults as result, i (i)}
            <button
              type="button"
              onclick={() => selectSearchResult(result)}
              class="flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-accent"
            >
              <div class="flex items-start gap-2">
                <MapPin class="mt-0.5 size-4 shrink-0 text-primary" />
                <div class="flex-1">
                  <div class="font-medium text-foreground">{result.display_name}</div>
                  <div class="text-xs text-muted-foreground">
                    {result.type} • {result.lat}, {result.lon}
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2">
      <Button type="button" variant="outline" onclick={useCurrentLocation} class="flex-1">
        <MapPin class="mr-2 size-4" />
        Use My Location
      </Button>
    </div>

    <!-- Map Container - Always Visible -->
    <div
      bind:this={mapContainer}
      class="relative z-0 h-125 w-full overflow-hidden rounded-md border border-border"
    ></div>

    <!-- Manual Input Fields - Always Visible -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <Label for="manual-lat">Latitude</Label>
        <Input
          id="manual-lat"
          type="number"
          step="0.000001"
          value={lat}
          oninput={handleLatChange}
          onfocus={handleLatFocus}
          onblur={handleLatBlur}
          placeholder="0.000000"
          class={errors?.lat ? 'border-destructive' : ''}
        />
        {#if errors?.lat}
          <p class="text-sm text-destructive">{errors.lat}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="manual-lng">Longitude</Label>
        <Input
          id="manual-lng"
          type="number"
          step="0.000001"
          value={lng}
          oninput={handleLngChange}
          onfocus={handleLngFocus}
          onblur={handleLngBlur}
          placeholder="0.000000"
          class={errors?.lng ? 'border-destructive' : ''}
        />
        {#if errors?.lng}
          <p class="text-sm text-destructive">{errors.lng}</p>
        {/if}
      </div>
    </div>
  </Card.Content>
</Card.Root>
