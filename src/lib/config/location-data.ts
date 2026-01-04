/**
 * Location Data Configuration
 *
 * Municipalities and Barangays in South Cotabato
 * Extracted from SC CATCH-UP 2025 DATABANK
 *
 * NOTE: These are default values. Admins can customize via the Configuration page.
 * Use the getter functions (e.g., getMunicipalities()) to get values with overrides.
 */

import {
  CONFIG_STORAGE_KEYS,
  getConfigWithOverrides,
  hasConfigOverride,
  resetConfigToDefault,
  saveConfigOverride,
  type LocationsConfig
} from '$lib/utils/config-storage';

// ============================================
// TYPES
// ============================================

export interface MunicipalityData {
  name: string;
  barangays: string[];
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_MUNICIPALITIES_DATA: MunicipalityData[] = [
  {
    name: 'BANGA',
    barangays: [
      'LIWANAY',
      'RANG-AY',
      'EL NONOK',
      'YANGCO',
      'RIZAL POB.',
      'MALAYA',
      'KUSAN',
      'SAN VICENTE',
      'REYES',
      'CINCO',
      'CABULING',
      'SAN JOSE',
      'LAMBA',
      'BENITEZ',
      'CABUDIAN',
      'RIZAL 3',
      'PUNONG GRANDE',
      'LAM-APOS',
      'IMPROGO'
    ]
  },
  {
    name: 'KORONADAL',
    barangays: [
      'ASSUMPTION',
      'AVANCEÑA',
      'CACUB',
      'CALOOCAN',
      'CARPENTER HILL',
      'CONCEPCION',
      'ESPERANZA',
      'GENERAL PAULINO SANTOS',
      'MABINI',
      'MAGSAYSAY',
      'MAMBUCAL',
      'MORALES',
      'NAMNAMA',
      'NEW PANGASINAN',
      'PARAISO',
      'ROTONDA',
      'SAN ISIDRO',
      'SAN JOSE',
      'SAN ROQUE',
      'SANTA CRUZ',
      'STO. NIÑO',
      'SARAVIA',
      'TOPLAND',
      'ZONE 1',
      'ZONE 2',
      'ZONE 3',
      'ZONE 4'
    ]
  },
  {
    name: 'LAKE SEBU',
    barangays: [
      'BACDULONG',
      'TASIMAN',
      'LUHIB',
      'LAKE LAHIT',
      'LOWER MACULAN',
      'HALILAN',
      'DENLAG',
      'LAMFUGON',
      'UPPER MACULAN',
      'NED',
      'LAMCADE'
    ]
  },
  {
    name: 'NORALA',
    barangays: ['SAN MIGUEL', 'LOPEZ JAENA', 'PUTI', 'LAPUZ', 'DUMAGUIL', 'TINAGO']
  },
  {
    name: 'POLOMOLOK',
    barangays: [
      'KORONADAL PROPER',
      'LAPU',
      'SUMBAKIL',
      'MAGSAYSAY',
      'MALIGO',
      'KINILIS',
      'POLO',
      'CROSSING PALKAN',
      'LUMAKIL',
      'BENTUNG'
    ]
  },
  {
    name: 'STO. NIÑO',
    barangays: ['PANAY', 'AMBALGAN', 'TERESITA', 'M. ROXAS', 'SAN VICENTE']
  },
  {
    name: 'SURALLAH',
    barangays: ['CANAHAY', 'COLONGULO', 'DUENGAS', 'TALAHIK', 'LITTLE BAGUIO', 'UPPER SEPAKA']
  },
  {
    name: 'TAMPAKAN',
    barangays: [
      'SAN ISIDRO',
      'KIPALBIG',
      'STA. CRUZ',
      'MALTANA',
      'DANLAG',
      'PULA BATO',
      'BUTO',
      'LAMPITAK',
      'PALO 19',
      'LAMBAYONG',
      'PULABATO',
      'POBLACION',
      'ALBAGAN',
      'TABLU',
      'LIBERTY'
    ]
  },
  {
    name: 'TANTANGAN',
    barangays: [
      'LIBAS',
      'TINONGCOP',
      'NEW LAMBUNAO',
      'SAN FELIPE',
      'MAGON',
      'NEW CUYAPO',
      'CABULING',
      'MANGILALA',
      'POBLACION',
      'NEW ILOILO',
      'MAIBO',
      'BUKAY PAIT',
      'DUMADALIG'
    ]
  },
  {
    name: "T'BOLI",
    barangays: [
      'KEMATU',
      'LAMBANGAN',
      'LACONON',
      'DATAL DLANAG',
      'TUDOK',
      'LEMSNOLON',
      'SALACAFE',
      'LAMBULING',
      'LAMHAKU',
      'DESAWO',
      'AFUS',
      'TALUFO',
      'TBOLOK',
      'EDWARDS',
      'DATAL BOB',
      'POBLACION',
      'TALCON'
    ]
  },
  {
    name: 'TUPI',
    barangays: ['CEBUANO']
  }
];

// ============================================
// GETTER FUNCTIONS (with localStorage override support)
// ============================================

function getConfig(): LocationsConfig {
  const defaultConfig: LocationsConfig = { municipalities: DEFAULT_MUNICIPALITIES_DATA };
  return getConfigWithOverrides(CONFIG_STORAGE_KEYS.LOCATIONS, defaultConfig);
}

/**
 * Get all municipalities data with barangays
 */
export function getMunicipalitiesData(): MunicipalityData[] {
  return getConfig().municipalities;
}

/**
 * Get sorted list of municipality names
 */
export function getMunicipalities(): string[] {
  return getMunicipalitiesData()
    .map((m) => m.name)
    .sort();
}

/**
 * Get barangays for a specific municipality
 */
export function getBarangaysForMunicipality(municipality: string): string[] {
  const municipalityData = getMunicipalitiesData().find(
    (m) => m.name.toLowerCase() === municipality.toLowerCase()
  );
  return municipalityData?.barangays || [];
}

/**
 * Get all barangays (flattened and sorted)
 */
export function getAllBarangays(): string[] {
  return getMunicipalitiesData()
    .flatMap((m) => m.barangays)
    .sort();
}

/**
 * Check if a municipality exists
 */
export function isMunicipalityValid(municipality: string): boolean {
  return getMunicipalitiesData().some((m) => m.name.toLowerCase() === municipality.toLowerCase());
}

/**
 * Check if a barangay exists in a municipality
 */
export function isBarangayValid(municipality: string, barangay: string): boolean {
  const barangays = getBarangaysForMunicipality(municipality);
  return barangays.some((b) => b.toLowerCase() === barangay.toLowerCase());
}

// ============================================
// FULL CONFIG ACCESS (for admin config page)
// ============================================

export function getLocationsConfig(): LocationsConfig {
  return getConfig();
}

export function getDefaultLocationsConfig(): LocationsConfig {
  return { municipalities: [...DEFAULT_MUNICIPALITIES_DATA] };
}

export function saveLocationsConfig(config: LocationsConfig, changeDescription?: string): boolean {
  return saveConfigOverride(CONFIG_STORAGE_KEYS.LOCATIONS, config, 'locations', changeDescription);
}

export function resetLocationsConfig(): boolean {
  return resetConfigToDefault(CONFIG_STORAGE_KEYS.LOCATIONS, 'locations');
}

export function hasLocationsOverride(): boolean {
  return hasConfigOverride(CONFIG_STORAGE_KEYS.LOCATIONS);
}

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================

/** @deprecated Use getMunicipalitiesData() instead */
export const MUNICIPALITIES_DATA = DEFAULT_MUNICIPALITIES_DATA;

/** @deprecated Use getMunicipalities() instead */
export const MUNICIPALITIES = DEFAULT_MUNICIPALITIES_DATA.map((m) => m.name).sort();

/** @deprecated Use getAllBarangays() instead */
export const ALL_BARANGAYS = DEFAULT_MUNICIPALITIES_DATA.flatMap((m) => m.barangays).sort();
