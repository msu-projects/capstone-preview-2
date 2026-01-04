/**
 * Municipality Profiles for South Cotabato
 * Based on actual characteristics for realistic data generation
 */

export interface MunicipalityProfile {
  name: string;
  type: 'urban' | 'semi-urban' | 'rural' | 'highland';
  // Approximate center coordinates
  centerLat: number;
  centerLng: number;
  // Coordinate spread for sitios
  latSpread: number;
  lngSpread: number;
  // Characteristics
  gidaProbability: number;
  indigenousProbability: number;
  conflictProbability: number;
  baseIncomeMultiplier: number;
  infrastructureLevel: number; // 0-1, higher = better
  primaryCrops: string[];
  primaryLivestock: string[];
  hazardProfile: {
    flood: number;
    landslide: number;
    drought: number;
  };
}

export const MUNICIPALITY_PROFILES: MunicipalityProfile[] = [
  {
    name: 'KORONADAL',
    type: 'urban',
    centerLat: 6.5022,
    centerLng: 124.8469,
    latSpread: 0.08,
    lngSpread: 0.08,
    gidaProbability: 0.1,
    indigenousProbability: 0.15,
    conflictProbability: 0.05,
    baseIncomeMultiplier: 1.4,
    infrastructureLevel: 0.85,
    primaryCrops: ['Palay', 'Corn', 'Vegetables', 'Banana'],
    primaryLivestock: ['Chicken', 'Pig', 'Duck'],
    hazardProfile: { flood: 0.4, landslide: 0.1, drought: 0.2 }
  },
  {
    name: 'POLOMOLOK',
    type: 'semi-urban',
    centerLat: 6.2214,
    centerLng: 125.0644,
    latSpread: 0.12,
    lngSpread: 0.1,
    gidaProbability: 0.25,
    indigenousProbability: 0.3,
    conflictProbability: 0.1,
    baseIncomeMultiplier: 1.2,
    infrastructureLevel: 0.7,
    primaryCrops: ['Banana', 'Pineapple', 'Corn', 'Coconut'],
    primaryLivestock: ['Chicken', 'Pig', 'Cow'],
    hazardProfile: { flood: 0.3, landslide: 0.2, drought: 0.25 }
  },
  {
    name: 'LAKE SEBU',
    type: 'highland',
    centerLat: 6.2167,
    centerLng: 124.7167,
    latSpread: 0.15,
    lngSpread: 0.12,
    gidaProbability: 0.7,
    indigenousProbability: 0.85,
    conflictProbability: 0.15,
    baseIncomeMultiplier: 0.7,
    infrastructureLevel: 0.35,
    primaryCrops: ['Palay', 'Coffee', 'Abaca', 'Vegetables'],
    primaryLivestock: ['Tilapia', 'Chicken', 'Pig', 'Kalabaw'],
    hazardProfile: { flood: 0.5, landslide: 0.6, drought: 0.15 }
  },
  {
    name: "T'BOLI",
    type: 'highland',
    centerLat: 6.1833,
    centerLng: 124.6833,
    latSpread: 0.18,
    lngSpread: 0.15,
    gidaProbability: 0.65,
    indigenousProbability: 0.9,
    conflictProbability: 0.2,
    baseIncomeMultiplier: 0.65,
    infrastructureLevel: 0.3,
    primaryCrops: ['Palay', 'Abaca', 'Coffee', 'Corn'],
    primaryLivestock: ['Horse', 'Kalabaw', 'Chicken', 'Pig'],
    hazardProfile: { flood: 0.3, landslide: 0.7, drought: 0.2 }
  },
  {
    name: 'BANGA',
    type: 'rural',
    centerLat: 6.4233,
    centerLng: 124.7833,
    latSpread: 0.1,
    lngSpread: 0.1,
    gidaProbability: 0.3,
    indigenousProbability: 0.25,
    conflictProbability: 0.08,
    baseIncomeMultiplier: 1.0,
    infrastructureLevel: 0.6,
    primaryCrops: ['Palay', 'Corn', 'Coconut', 'Banana'],
    primaryLivestock: ['Pig', 'Chicken', 'Cow', 'Kalabaw'],
    hazardProfile: { flood: 0.45, landslide: 0.15, drought: 0.3 }
  },
  {
    name: 'SURALLAH',
    type: 'semi-urban',
    centerLat: 6.3667,
    centerLng: 124.7333,
    latSpread: 0.1,
    lngSpread: 0.08,
    gidaProbability: 0.35,
    indigenousProbability: 0.3,
    conflictProbability: 0.1,
    baseIncomeMultiplier: 1.0,
    infrastructureLevel: 0.6,
    primaryCrops: ['Palay', 'Corn', 'Coconut', 'Vegetables'],
    primaryLivestock: ['Pig', 'Chicken', 'Cow', 'Duck'],
    hazardProfile: { flood: 0.5, landslide: 0.2, drought: 0.25 }
  },
  {
    name: 'TAMPAKAN',
    type: 'rural',
    centerLat: 6.4167,
    centerLng: 125.0333,
    latSpread: 0.15,
    lngSpread: 0.12,
    gidaProbability: 0.5,
    indigenousProbability: 0.6,
    conflictProbability: 0.25,
    baseIncomeMultiplier: 0.85,
    infrastructureLevel: 0.45,
    primaryCrops: ['Corn', 'Palay', 'Coconut', 'Cassava'],
    primaryLivestock: ['Chicken', 'Pig', 'Goat', 'Cow'],
    hazardProfile: { flood: 0.25, landslide: 0.5, drought: 0.35 }
  },
  {
    name: 'TANTANGAN',
    type: 'rural',
    centerLat: 6.3833,
    centerLng: 124.85,
    latSpread: 0.1,
    lngSpread: 0.08,
    gidaProbability: 0.35,
    indigenousProbability: 0.25,
    conflictProbability: 0.1,
    baseIncomeMultiplier: 0.95,
    infrastructureLevel: 0.55,
    primaryCrops: ['Palay', 'Corn', 'Vegetables', 'Coconut'],
    primaryLivestock: ['Pig', 'Chicken', 'Duck', 'Cow'],
    hazardProfile: { flood: 0.4, landslide: 0.2, drought: 0.3 }
  },
  {
    name: 'NORALA',
    type: 'rural',
    centerLat: 6.5167,
    centerLng: 124.65,
    latSpread: 0.08,
    lngSpread: 0.08,
    gidaProbability: 0.25,
    indigenousProbability: 0.2,
    conflictProbability: 0.05,
    baseIncomeMultiplier: 1.0,
    infrastructureLevel: 0.65,
    primaryCrops: ['Palay', 'Corn', 'Vegetables', 'Banana'],
    primaryLivestock: ['Pig', 'Chicken', 'Cow', 'Duck'],
    hazardProfile: { flood: 0.35, landslide: 0.1, drought: 0.35 }
  },
  {
    name: 'STO. NIÑO',
    type: 'rural',
    centerLat: 6.3,
    centerLng: 124.6,
    latSpread: 0.1,
    lngSpread: 0.1,
    gidaProbability: 0.4,
    indigenousProbability: 0.4,
    conflictProbability: 0.12,
    baseIncomeMultiplier: 0.9,
    infrastructureLevel: 0.5,
    primaryCrops: ['Palay', 'Corn', 'Coconut', 'Cassava'],
    primaryLivestock: ['Pig', 'Chicken', 'Kalabaw', 'Goat'],
    hazardProfile: { flood: 0.35, landslide: 0.3, drought: 0.3 }
  },
  {
    name: 'TUPI',
    type: 'semi-urban',
    centerLat: 6.3333,
    centerLng: 125.0333,
    latSpread: 0.1,
    lngSpread: 0.1,
    gidaProbability: 0.3,
    indigenousProbability: 0.35,
    conflictProbability: 0.1,
    baseIncomeMultiplier: 1.1,
    infrastructureLevel: 0.65,
    primaryCrops: ['Banana', 'Pineapple', 'Corn', 'Vegetables'],
    primaryLivestock: ['Pig', 'Chicken', 'Cow', 'Duck'],
    hazardProfile: { flood: 0.3, landslide: 0.25, drought: 0.25 }
  }
];

// Default profile for municipalities not in the list
export const DEFAULT_MUNICIPALITY_PROFILE: MunicipalityProfile = {
  name: 'DEFAULT',
  type: 'rural',
  centerLat: 6.35,
  centerLng: 124.85,
  latSpread: 0.1,
  lngSpread: 0.1,
  gidaProbability: 0.35,
  indigenousProbability: 0.3,
  conflictProbability: 0.1,
  baseIncomeMultiplier: 1.0,
  infrastructureLevel: 0.5,
  primaryCrops: ['Palay', 'Corn', 'Coconut', 'Banana'],
  primaryLivestock: ['Pig', 'Chicken', 'Cow', 'Duck'],
  hazardProfile: { flood: 0.35, landslide: 0.25, drought: 0.3 }
};

export function getMunicipalityProfile(municipalityName: string): MunicipalityProfile {
  return (
    MUNICIPALITY_PROFILES.find((p) => p.name === municipalityName) || DEFAULT_MUNICIPALITY_PROFILE
  );
}
