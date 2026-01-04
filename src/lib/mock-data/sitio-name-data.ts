/**
 * Sitio Name Data Constants
 * Authentic Filipino sitio/purok names and agricultural data
 */

// ===== SITIO NAME GENERATORS =====
// More authentic Filipino sitio/purok names

export const SITIO_PREFIXES_RURAL = ['Sitio', 'Purok', 'Upper', 'Lower'];
export const SITIO_PREFIXES_URBAN = ['Zone', 'Purok', 'Phase'];
export const SITIO_PREFIXES_INDIGENOUS = ['Sitio', 'Upper', 'Lower'];

export const SITIO_NAMES_COMMON = [
  'Maligaya',
  'Masagana',
  'Pagasa',
  'Mabuhay',
  'Kalinaw',
  'Kalayaan',
  'Bagong Silang',
  'San Antonio',
  'San Jose',
  'San Miguel',
  'Santa Cruz',
  'Santo Niño',
  'Fatima',
  'Guadalupe',
  'Del Pilar',
  'Rizal',
  'Bonifacio',
  'Mabini',
  'Sampaguita',
  'Rosal',
  'Orchid',
  'Jasmine'
];

export const SITIO_NAMES_NATURE = [
  'Riverside',
  'Hillside',
  'Lakeview',
  'Mountain View',
  'Valley View',
  'Spring',
  'Watershed',
  'Crossing',
  'Junction',
  'Centro'
];

export const SITIO_NAMES_INDIGENOUS = [
  'Lambayong',
  'Lamcade',
  'Lamfugon',
  'Lemsnolon',
  'Tudok',
  'Datal',
  'Kematu',
  'Salacafe',
  'Talufo',
  'Lamhaku',
  'Desawo',
  'Afus'
];

// ===== CROP AND LIVESTOCK OPTIONS =====
// More comprehensive and region-specific

export const CROP_OPTIONS_LOWLAND = ['Palay', 'Corn', 'Vegetables', 'Banana', 'Coconut', 'Cassava'];
export const CROP_OPTIONS_HIGHLAND = [
  'Coffee',
  'Abaca',
  'Vegetables',
  'Palay',
  'Sweet Potato',
  'Taro'
];
export const CROP_OPTIONS_COMMERCIAL = ['Banana', 'Pineapple', 'Corn', 'Coconut'];

export const LIVESTOCK_OPTIONS_COMMON = ['Chicken', 'Pig', 'Duck'];
export const LIVESTOCK_OPTIONS_RURAL = ['Cow', 'Kalabaw', 'Goat'];
export const LIVESTOCK_OPTIONS_HIGHLAND = ['Horse', 'Kalabaw', 'Goat'];
export const LIVESTOCK_AQUACULTURE = ['Tilapia', 'Carp'];

// ===== PROJECT TYPES FOR MOCK DATA =====
// Based on common rural development projects

export const PROJECT_TYPES = [
  {
    category: 'Water System',
    titles: [
      'Level II Water System Installation',
      'Deep Well Construction',
      'Spring Development Project',
      'Water Tank Construction',
      'Water Distribution System Upgrade'
    ],
    descriptionTemplates: [
      'Installation of Level II water system to provide potable water access to {sitioCount} sitio(s) in {municipality}.',
      'Construction of deep well with motorized pump to serve {households} households.',
      'Development and protection of natural spring source for community water supply.',
      'Construction of elevated water tank with {capacity}L capacity for water storage.',
      'Upgrade of existing water distribution system with new pipes and fittings.'
    ],
    costRange: { min: 150000, max: 2500000 }
  },
  {
    category: 'Road Infrastructure',
    titles: [
      'Farm-to-Market Road Concreting',
      'Road Opening Project',
      'Barangay Road Rehabilitation',
      'Slope Protection Works',
      'Bridge Construction'
    ],
    descriptionTemplates: [
      'Concreting of {length}km farm-to-market road to improve agricultural product transport.',
      'Opening of {length}km access road connecting remote sitios to main barangay road.',
      'Rehabilitation of existing barangay road with gravel overlay and drainage improvement.',
      'Construction of slope protection structures along landslide-prone road sections.',
      'Construction of {length}m reinforced concrete bridge over river crossing.'
    ],
    costRange: { min: 500000, max: 15000000 }
  },
  {
    category: 'Livelihood',
    titles: [
      'Farming Equipment Distribution',
      'Livestock Dispersal Program',
      'Rice Mill Establishment',
      'Fishing Boat Distribution',
      "Farmers' Training Center Construction"
    ],
    descriptionTemplates: [
      'Distribution of farming tools and equipment to {beneficiaries} farmer beneficiaries.',
      'Dispersal of livestock (pig/goat/chicken) to qualified households for livelihood support.',
      'Establishment of community rice mill to reduce post-harvest losses and improve farmer income.',
      'Distribution of motorized fishing boats to fisherfolk associations.',
      'Construction of multi-purpose training center for agricultural extension services.'
    ],
    costRange: { min: 100000, max: 3000000 }
  },
  {
    category: 'Health & Sanitation',
    titles: [
      'Barangay Health Station Construction',
      'Community Toilet Facility',
      'Sanitary Landfill Development',
      'Medical Equipment Provision',
      'Water Purification System'
    ],
    descriptionTemplates: [
      'Construction of barangay health station with basic medical facilities.',
      'Construction of community toilet facility with septic tank for public use.',
      'Development of engineered sanitary landfill for proper waste management.',
      'Provision of medical equipment and supplies for health station.',
      'Installation of water purification system for safe drinking water.'
    ],
    costRange: { min: 200000, max: 5000000 }
  },
  {
    category: 'Education',
    titles: [
      'Day Care Center Construction',
      'School Building Construction',
      'School Furniture Provision',
      'Learning Materials Distribution',
      'Computer Laboratory Setup'
    ],
    descriptionTemplates: [
      'Construction of standard day care center building for early childhood education.',
      'Construction of 2-classroom school building with comfort room facilities.',
      'Provision of armchairs, teachers tables, and blackboards for schools.',
      'Distribution of learning materials, books, and school supplies.',
      'Setup of computer laboratory with 10 units and internet connectivity.'
    ],
    costRange: { min: 150000, max: 8000000 }
  },
  {
    category: 'Electrification',
    titles: [
      'Solar Street Light Installation',
      'Rural Electrification Project',
      'Solar Home System Distribution',
      'Power Line Extension',
      'Community Solar Power Plant'
    ],
    descriptionTemplates: [
      'Installation of {units} units solar-powered street lights along main roads.',
      'Extension of electric distribution lines to unserved households.',
      'Distribution of solar home systems to off-grid households.',
      'Extension of power lines covering {length}km to reach remote areas.',
      'Establishment of community solar power plant with battery storage system.'
    ],
    costRange: { min: 100000, max: 10000000 }
  },
  {
    category: 'Disaster Risk Reduction',
    titles: [
      'Flood Control Structure',
      'Evacuation Center Construction',
      'Seawall Construction',
      'Early Warning System Installation',
      'Riprap Construction'
    ],
    descriptionTemplates: [
      'Construction of flood control dike along river to protect adjacent communities.',
      'Construction of multi-purpose evacuation center with emergency facilities.',
      'Construction of seawall/revetment for coastal erosion protection.',
      'Installation of early warning system for flood and landslide monitoring.',
      'Construction of stone riprap along riverbank for erosion protection.'
    ],
    costRange: { min: 300000, max: 20000000 }
  },
  {
    category: 'Community Facilities',
    titles: [
      'Multi-Purpose Hall Construction',
      'Covered Court Construction',
      'Public Market Improvement',
      'Community Center Renovation',
      'Barangay Hall Construction'
    ],
    descriptionTemplates: [
      'Construction of multi-purpose hall for community gatherings and events.',
      'Construction of covered basketball court for sports and community activities.',
      'Improvement and expansion of public market stalls and facilities.',
      'Renovation and improvement of existing community center.',
      'Construction of 2-storey barangay hall with office spaces.'
    ],
    costRange: { min: 500000, max: 12000000 }
  }
];
