// ==========================================
// SITIO PROFILE DATA MODEL
// ==========================================

import type { PPARecommendation } from './recommendations';

// ==========================================
// SITIO PROFILE DATA MODEL
// ==========================================

/**
 * Sitio Profile Data Model
 * Represents the complete profile of a Sitio (sub-village) as collected by the Catch-up Sitio Profiling Survey.
 * Mapped directly to the sections in the Capstone Document.
 */
export interface SitioProfile {
  // ==========================================
  // SECTION A. BASIC SITIO INFORMATION
  // ==========================================

  /** Name of the municipality */
  municipality: string;

  /** Name of the barangay */
  barangay: string;

  /** Name of the specific Sitio / Purok */
  sitioName: string;

  /** Purok/Sitio Code (if available) */
  sitioCode: string;

  /**
   * GPS Coordinates
   */
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;

  /** Sitio Classification (Select ALL that apply) */
  sitioClassification: {
    /** Geographically Isolated and Disadvantaged Area (GIDA) */
    gida: boolean;
    /** Indigenous Community */
    indigenous: boolean;
    /** Conflict-Affected Area (Past 3 years) */
    conflict: boolean;
  };

  /** Main access to the sitio (Check one) */
  mainAccess: {
    pavedRoad: boolean;
    unpavedRoad: boolean;
    footpath: boolean;
    boat: boolean;
  };

  // ==========================================
  // SECTION B. POPULATION & DEMOGRAPHICS
  // ==========================================

  /** Household and Voter data */
  totalPopulation: number;
  totalHouseholds: number;
  registeredVoters: number;
  laborForceCount: number;
  schoolAgeChildren: number;

  /** Total population */
  population: {
    totalMale: number;
    totalFemale: number;
  };

  /** Vulnerable Groups Data */
  vulnerableGroups: {
    /** Estimated Muslim population */
    muslimCount: number;
    /** Estimated Indigenous Peoples (IP) population */
    ipCount: number;
    /** Seniors (60 years old and above) */
    seniorsCount: number;
    /** Labor force (of which are 60-64 years old) */
    laborForce60to64Count: number;
    /** Estimated unemployed persons */
    unemployedCount: number;
    /** Individuals without birth certificates */
    noBirthCertCount: number;
    /** Individuals without National ID / PhilSys ID */
    noNationalIDCount: number;
    /** Out-of-school youth (OSY) status */
    outOfSchoolYouth: number;
  };

  // ==========================================
  // SECTION C. BASIC UTILITIES & CONNECTIVITY
  // ==========================================

  /** Households with toilet facilities */
  householdsWithToilet: number;

  /** Households with electricity access (Total) */
  householdsWithElectricity: number;

  /** Electricity Sources (Breakdown) */
  electricitySources: {
    grid: number;
    solar: number;
    battery: number;
    generator: number;
  };

  /**
   * Mobile signal availability (Check best available)
   * - 'none': None
   * - '2g': 2G
   * - '3g': 3G
   * - '4g': 4G
   * - '5g': 5G
   */
  mobileSignal: 'none' | '2g' | '3g' | '4g' | '5g';

  /** Households with Internet Connectivity */
  householdsWithInternet: number;

  // ==========================================
  // SECTION D. COMMUNITY FACILITIES
  // ==========================================

  /**
   * Inventory and condition of community facilities.
   * Corresponds to the table in Section D.
   */
  facilities: {
    healthCenter: FacilityDetails;
    pharmacy: FacilityDetails;
    communityToilet: FacilityDetails;
    kindergarten: FacilityDetails;
    elementarySchool: FacilityDetails;
    highSchool: FacilityDetails;
    madrasah: FacilityDetails;
    market: FacilityDetails;
  };

  // ==========================================
  // SECTION E. ROADS & INTERNAL INFRASTRUCTURE
  // ==========================================

  /**
   * Inventory of road types and conditions within the Sitio.
   * Corresponds to the table in Section E.
   */
  infrastructure: {
    asphalt: RoadDetails;
    concrete: RoadDetails;
    gravel: RoadDetails;
    natural: RoadDetails; // Earth surface
  };

  // ==========================================
  // SECTION F. EDUCATION STATUS
  // ==========================================

  /**
   * Number of students per room
   */
  studentsPerRoom: 'less_than_46' | '46_50' | '51_55' | 'more_than_56' | 'no_classroom';

  // ==========================================
  // SECTION G. WATER & SANITATION
  // ==========================================

  /**
   * Status of water sources.
   * Corresponds to table in Section G.
   */
  waterSources: {
    natural: WaterSourceStatus; // Spring/River/Well
    level1: WaterSourceStatus; // Point source/Hand pump
    level2: WaterSourceStatus; // Communal faucet
    level3: WaterSourceStatus; // House connection
  };

  /**
   * Sanitation used by majority of households (Check all that apply)
   */
  sanitationTypes: {
    waterSealed: boolean;
    pitLatrine: boolean;
    communityCR: boolean;
    openDefecation: boolean;
  };

  // ==========================================
  // SECTION H. LIVELIHOOD & AGRICULTURE
  // ==========================================

  /** Class of worker in the sitio (number of) */
  workerClass: {
    privateHousehold: number; // e.g., domestic helper
    privateEstablishment: number; // e.g., company employee
    government: number; // e.g., Barangay Tanod, Teacher
    selfEmployed: number; // e.g., Sari-sari store
    employer: number; // Own family-operated farm/business with employees
    ofw: number;
  };

  /** Average Household Income (per day) */
  averageDailyIncome: number;

  /** Agricultural Statistics */
  agriculture: {
    numberOfFarmers: number;
    numberOfAssociations: number;
    estimatedFarmAreaHectares: number;
  };

  /**
   * Main Crops Produced
   * Dynamic list to handle checkboxes + "others".
   * Common values: 'Palay', 'Corn', 'Banana', 'Coconut'
   */
  crops: string[];

  /**
   * Livestock/Poultry Produced
   * Dynamic list to handle checkboxes + "others".
   * Common values: 'Pig', 'Cow', 'Kalabaw', 'Horse', 'Goat', 'Chicken', 'Duck'
   */
  livestock: string[];

  /**
   * Pet Statistics
   * Counts of cats and dogs in the sitio with vaccination data
   */
  pets: {
    /** Total number of cats */
    catsCount: number;
    /** Total number of dogs */
    dogsCount: number;
    /** Number of vaccinated cats */
    vaccinatedCats: number;
    /** Number of vaccinated dogs */
    vaccinatedDogs: number;
  };

  /**
   * Backyard Gardens Information
   * Households with backyard gardens and their common crops
   */
  backyardGardens: {
    /** Number of households with backyard gardens */
    householdsWithGardens: number;
    /** Most common crops grown in backyard gardens (Vegetables, Fruits, or Root Crops) */
    commonCrops: BackyardCropCategory[];
  };

  // ==========================================
  // SECTION I. SAFETY & RISK CONTEXT
  // ==========================================

  /** Environmental & Natural Hazards (Frequency in past 12 months) */
  hazards: {
    flood: HazardDetails;
    landslide: HazardDetails;
    drought: HazardDetails;
    earthquake: HazardDetails;
  };

  /** Primary food security concern */
  foodSecurity: 'secure' | 'seasonal_scarcity' | 'critical_shortage';

  // ==========================================
  // SECTION J. SITIO PRIORITY NEEDS
  // ==========================================

  /**
   * Priority interventions with rating scale 0-3
   * Each priority item contains:
   * - name: The intervention name (e.g., "waterSystem", "communityCR", etc.)
   * - rating: Priority rating (0 = Not needed, 1 = Low, 2 = Medium, 3 = Very urgent)
   *
   * Common priority intervention names:
   * - waterSystem, communityCR, solarStreetLights, roadOpening
   * - farmTools, healthServices, educationSupport
   */
  priorities: PriorityItem[];

  // ==========================================
  // SECTION K. RECOMMENDATION
  // ==========================================

  averageNeedScore: number;
  recommendations: PPARecommendation[];

  // ==========================================
  // SECTION L. CUSTOM/SUPPLEMENTARY FIELDS
  // ==========================================

  /**
   * Custom fields defined by administrators via the Dynamic Form Builder.
   * Key: Custom field ID from CustomFieldDefinition
   * Value: Field value (type depends on field's dataType)
   */
  customFields?: Record<string, unknown>;
}

// ==========================================
// HELPER INTERFACES
// ==========================================

/**
 * Standard priority names used in the system
 */
export type PriorityName =
  | 'waterSystem'
  | 'communityCR'
  | 'solarStreetLights'
  | 'roadOpening'
  | 'farmTools'
  | 'healthServices'
  | 'educationSupport';

/**
 * Priority rating scale
 * 0 = Not needed, 1 = Low, 2 = Medium, 3 = Very urgent
 */
export type PriorityRating = 0 | 1 | 2 | 3;

/**
 * Priority intervention item (Section J)
 */
export interface PriorityItem {
  /** The intervention name */
  name: PriorityName;
  /** Priority rating (0 = Not needed, 1 = Low, 2 = Medium, 3 = Very urgent) */
  rating: PriorityRating;
}

/**
 * Details for Community Facilities (Section D)
 */
export interface FacilityDetails {
  /** Does the facility exist? */
  exists: 'yes' | 'no';
  /** Number of facilities (if exists) */
  count?: number;
  /** Distance to nearest in km (if does not exist) */
  distanceToNearest?: number;
  /** Condition of best facility (1=Bad to 5=Excellent) */
  condition?: 1 | 2 | 3 | 4 | 5;
}

/**
 * Details for Road Infrastructure (Section E)
 */
export interface RoadDetails {
  /** Does this road type exist? */
  exists: 'yes' | 'no';
  /** Length in KMs (if exists) */
  length?: number;
  /** Condition code (1=Bad to 5=Excellent) */
  condition?: 1 | 2 | 3 | 4 | 5;
}

/**
 * Details for Water Sources (Section G)
 */
export interface WaterSourceStatus {
  /** Does this source exist? */
  exists: 'yes' | 'no';
  /** Number of Functioning units/stations */
  functioningCount?: number;
  /** Number of Not Functioning units/stations */
  notFunctioningCount?: number;
}

/**
 * Details for Natural Hazards (Section I)
 * Captures the frequency of hazards in the past 12 months.
 */
export interface HazardDetails {
  /**
   * Frequency (number of occurrences in the past 12 months)
   */
  frequency: number;
}

/**
 * Backyard garden crop categories
 * Represents the three main categories of crops grown in household gardens
 */
export type BackyardCropCategory = 'Vegetables' | 'Fruits' | 'Root Crops';
