import type { SitioRecord } from '$lib/types';
import type {
  ReportChartImage,
  ReportConfig,
  ReportSection,
  SECTION_LABELS
} from '$lib/types/report';
import {
  aggregateDemographics,
  aggregateFacilities,
  aggregateInfrastructure,
  aggregateLivelihood,
  aggregatePriorities,
  aggregateSafety,
  aggregateUtilities,
  getYearComparison,
  type DemographicsAggregation,
  type FacilitiesAggregation,
  type InfrastructureAggregation,
  type LivelihoodAggregation,
  type PrioritiesAggregation,
  type SafetyAggregation,
  type UtilitiesAggregation,
  type YearComparison
} from '$lib/utils/sitio-chart-aggregation';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { logAuditAction } from './audit';
import { formatCurrency, formatNumber, formatPercentage } from './formatters';
import { LOGO_BASE64 } from './logo-base64';

// Initialize pdfMake with fonts
if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

// ===== HELPER FUNCTIONS =====

/**
 * Helper function to create a section header
 */
function createSectionHeader(title: string): Content {
  return {
    text: title,
    style: 'sectionHeader',
    margin: [0, 15, 0, 8] as [number, number, number, number]
  };
}

/**
 * Helper function to create a subsection header
 */
function createSubsectionHeader(title: string): Content {
  return {
    text: title,
    style: 'subsectionHeader',
    margin: [0, 10, 0, 5] as [number, number, number, number]
  };
}

/**
 * Helper function to create a key-value row
 */
function createKeyValue(key: string, value: string | number | undefined | null): Content {
  return {
    columns: [
      { text: key, width: 200, style: 'label' },
      { text: value?.toString() || 'N/A', style: 'value' }
    ],
    margin: [0, 2, 0, 2] as [number, number, number, number]
  };
}

/**
 * Create a trend indicator string
 */
function formatTrend(
  value: number | null,
  isPositive: boolean | null,
  suffix: string = ''
): string {
  if (value === null) return '';
  const arrow = isPositive ? '↑' : '↓';
  const sign = value >= 0 ? '+' : '';
  return ` ${arrow} ${sign}${value.toFixed(1)}%${suffix}`;
}

/**
 * Create a stat card for quick stats section
 */
function createStatCard(label: string, value: string, trend?: string): Content {
  const stack: Content[] = [
    { text: label, style: 'statLabel', alignment: 'center' },
    { text: value, style: 'statValue', alignment: 'center' }
  ];

  if (trend) {
    stack.push({
      text: trend,
      style: 'trendText',
      color: trend.includes('↑') ? '#16A34A' : '#DC2626',
      alignment: 'center'
    });
  }

  return {
    stack
  };
}

/**
 * Create a data table
 */
function createTable(
  headers: string[],
  rows: (string | number)[][],
  widths?: (string | number)[]
): Content {
  const tableWidths = widths || headers.map(() => '*');

  return {
    table: {
      widths: tableWidths,
      body: [
        headers.map((h) => ({ text: h, style: 'tableHeader' })),
        ...rows.map((row) => row.map((cell) => ({ text: cell.toString(), style: 'tableCell' })))
      ]
    },
    layout: 'lightHorizontalLines',
    margin: [0, 5, 0, 10] as [number, number, number, number]
  };
}

/**
 * Create signatory section for the end of reports
 */
function createSignatorySection(): Content[] {
  return [
    {
      text: '',
      margin: [0, 40, 0, 0] as [number, number, number, number]
    },
    {
      columns: [
        {
          width: '*',
          stack: [
            {
              text: 'Prepared by:',
              fontSize: 10,
              color: '#64748B',
              margin: [0, 0, 0, 30] as [number, number, number, number]
            },
            {
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 180,
                  y2: 0,
                  lineWidth: 1,
                  lineColor: '#1E293B'
                }
              ]
            },
            {
              text: 'Data Officer / Encoder',
              fontSize: 10,
              color: '#1E293B',
              margin: [0, 5, 0, 0] as [number, number, number, number]
            },
            {
              text: 'Date: _________________',
              fontSize: 9,
              color: '#64748B',
              margin: [0, 10, 0, 0] as [number, number, number, number]
            }
          ],
          alignment: 'center' as const
        },
        {
          width: '*',
          stack: [
            {
              text: 'Reviewed and Approved by:',
              fontSize: 10,
              color: '#64748B',
              margin: [0, 0, 0, 30] as [number, number, number, number]
            },
            {
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 180,
                  y2: 0,
                  lineWidth: 1,
                  lineColor: '#1E293B'
                }
              ]
            },
            {
              text: 'Municipal Planning Officer',
              fontSize: 10,
              color: '#1E293B',
              margin: [0, 5, 0, 0] as [number, number, number, number]
            },
            {
              text: 'Date: _________________',
              fontSize: 9,
              color: '#64748B',
              margin: [0, 10, 0, 0] as [number, number, number, number]
            }
          ],
          alignment: 'center' as const
        }
      ],
      margin: [0, 0, 0, 20] as [number, number, number, number]
    },
    {
      text: 'This report is system-generated from the South Cotabato Convergence Data Bank. The data presented herein has been collected, validated, and approved through the official data management process.',
      fontSize: 8,
      italics: true,
      color: '#9CA3AF',
      alignment: 'center' as const,
      margin: [20, 20, 20, 0] as [number, number, number, number]
    }
  ];
}

// ===== SECTION BUILDERS =====

interface AggregatedData {
  demographics: DemographicsAggregation;
  utilities: UtilitiesAggregation;
  facilities: FacilitiesAggregation;
  infrastructure: InfrastructureAggregation;
  livelihood: LivelihoodAggregation;
  safety: SafetyAggregation;
  priorities: PrioritiesAggregation;
  yearComparison: YearComparison | null;
  sitioCount: number;
}

/**
 * Build overview section content
 */
function buildOverviewSection(
  data: AggregatedData,
  config: ReportConfig,
  chartImages: Map<string, string>
): Content[] {
  const content: Content[] = [];
  const { demographics, utilities, yearComparison } = data;

  // Use chartImages to avoid unused parameter warning
  void chartImages;

  content.push(createSectionHeader('Overview & Summary'));

  // Quick stats cards
  const populationTrend =
    config.includeTrends && yearComparison?.trends.population
      ? formatTrend(
          yearComparison.trends.population.value,
          yearComparison.trends.population.isPositive
        )
      : undefined;

  const householdTrend =
    config.includeTrends && yearComparison?.trends.households
      ? formatTrend(
          yearComparison.trends.households.value,
          yearComparison.trends.households.isPositive
        )
      : undefined;

  content.push({
    columns: [
      createStatCard('Total Sitios', formatNumber(data.sitioCount)),
      createStatCard(
        'Total Population',
        formatNumber(demographics.totalPopulation),
        populationTrend
      ),
      createStatCard(
        'Total Households',
        formatNumber(demographics.totalHouseholds),
        householdTrend
      ),
      createStatCard('Electrification Rate', formatPercentage(utilities.electricityPercent, 1))
    ],
    margin: [0, 10, 0, 15] as [number, number, number, number]
  });

  // Geographic summary
  content.push(createSubsectionHeader('Geographic Coverage'));
  content.push(createKeyValue('Total Sitios Covered', data.sitioCount));
  if (config.filters.municipality) {
    content.push(createKeyValue('Municipality', config.filters.municipality));
  }
  if (config.filters.barangay) {
    content.push(createKeyValue('Barangay', config.filters.barangay));
  }
  content.push(createKeyValue('Data Year', `as of ${config.filters.year}`));

  // Classification breakdown
  content.push(createSubsectionHeader('Sitio Classifications'));
  content.push(
    createTable(
      ['Classification', 'Count', 'Percentage'],
      [
        [
          'GIDA (Isolated)',
          demographics.gidaCount,
          formatPercentage((demographics.gidaCount / data.sitioCount) * 100, 1)
        ],
        [
          'Indigenous',
          demographics.indigenousCount,
          formatPercentage((demographics.indigenousCount / data.sitioCount) * 100, 1)
        ],
        [
          'Conflict-Affected',
          demographics.conflictCount,
          formatPercentage((demographics.conflictCount / data.sitioCount) * 100, 1)
        ]
      ]
    )
  );

  return content;
}

/**
 * Build demographics section content
 */
function buildDemographicsSection(
  data: AggregatedData,
  config: ReportConfig,
  chartImages: Map<string, string>
): Content[] {
  const content: Content[] = [];
  const { demographics, yearComparison } = data;

  content.push(createSectionHeader('Demographics & Population'));

  // Population breakdown
  content.push(createSubsectionHeader('Population Overview'));
  content.push(
    createTable(
      ['Metric', 'Count', 'Percentage'],
      [
        ['Total Population', formatNumber(demographics.totalPopulation), '100%'],
        [
          'Male',
          formatNumber(demographics.totalMale),
          formatPercentage(demographics.malePercent, 1)
        ],
        [
          'Female',
          formatNumber(demographics.totalFemale),
          formatPercentage(demographics.femalePercent, 1)
        ],
        ['Total Households', formatNumber(demographics.totalHouseholds), '-'],
        ['Avg Household Size', demographics.averageHouseholdSize.toFixed(1), '-']
      ]
    )
  );

  // Age distribution
  content.push(createSubsectionHeader('Age Distribution'));
  content.push(
    createTable(
      ['Age Group', 'Count', 'Percentage'],
      [
        [
          'Youth (0-14)',
          formatNumber(demographics.youth),
          formatPercentage(demographics.youthPercent, 1)
        ],
        [
          'Working Age (15-64)',
          formatNumber(demographics.workingAge),
          formatPercentage(demographics.workingAgePercent, 1)
        ],
        [
          'Elderly (65+)',
          formatNumber(demographics.elderly),
          formatPercentage(demographics.elderlyPercent, 1)
        ]
      ]
    )
  );

  // Vulnerable groups
  content.push(createSubsectionHeader('Vulnerable Groups'));
  content.push(
    createTable(
      ['Group', 'Count'],
      [
        ['Seniors (60+)', formatNumber(demographics.totalSeniors)],
        ['Muslim Population', formatNumber(demographics.totalMuslim)],
        ['Indigenous Peoples (IP)', formatNumber(demographics.totalIP)],
        ['Out-of-School Youth', formatNumber(demographics.totalOSY)],
        ['Without Birth Certificate', formatNumber(demographics.totalNoBirthCert)],
        ['Without National ID', formatNumber(demographics.totalNoNationalID)]
      ]
    )
  );

  // Labor force
  content.push(createSubsectionHeader('Labor Force'));
  const unemploymentTrend =
    config.includeTrends && yearComparison?.trends.employmentRate
      ? formatTrend(
          yearComparison.trends.employmentRate.value,
          yearComparison.trends.employmentRate.isPositive
        )
      : '';

  content.push(createKeyValue('Total Labor Force', formatNumber(demographics.totalLaborWorkforce)));
  content.push(createKeyValue('Unemployed', formatNumber(demographics.totalUnemployed)));
  content.push(
    createKeyValue(
      'Unemployment Rate',
      formatPercentage(demographics.unemploymentRate, 1) + unemploymentTrend
    )
  );
  content.push(createKeyValue('Registered Voters', formatNumber(demographics.totalVoters)));

  // Add chart if available
  if (config.includeCharts && chartImages.has('demographics-gender')) {
    content.push({
      image: chartImages.get('demographics-gender')!,
      width: 400,
      alignment: 'center' as const,
      margin: [0, 10, 0, 10] as [number, number, number, number]
    });
  }

  return content;
}

/**
 * Build utilities section content
 */
function buildUtilitiesSection(
  data: AggregatedData,
  config: ReportConfig,
  chartImages: Map<string, string>
): Content[] {
  const content: Content[] = [];
  const { utilities, yearComparison } = data;

  content.push(createSectionHeader('Utilities & Connectivity'));

  // Coverage rates
  content.push(createSubsectionHeader('Access Rates'));

  const electricityTrend =
    config.includeTrends && yearComparison?.trends.electricityAccess
      ? formatTrend(
          yearComparison.trends.electricityAccess.value,
          yearComparison.trends.electricityAccess.isPositive
        )
      : '';

  const toiletTrend =
    config.includeTrends && yearComparison?.trends.toiletAccess
      ? formatTrend(
          yearComparison.trends.toiletAccess.value,
          yearComparison.trends.toiletAccess.isPositive
        )
      : '';

  const internetTrend =
    config.includeTrends && yearComparison?.trends.internetAccess
      ? formatTrend(
          yearComparison.trends.internetAccess.value,
          yearComparison.trends.internetAccess.isPositive
        )
      : '';

  content.push(
    createTable(
      ['Utility', 'Households', 'Coverage Rate', 'Trend'],
      [
        [
          'Electricity',
          formatNumber(utilities.householdsWithElectricity),
          formatPercentage(utilities.electricityPercent, 1),
          electricityTrend
        ],
        [
          'Toilet Facilities',
          formatNumber(utilities.householdsWithToilet),
          formatPercentage(utilities.toiletPercent, 1),
          toiletTrend
        ],
        [
          'Internet Access',
          formatNumber(utilities.householdsWithInternet),
          formatPercentage(utilities.internetPercent, 1),
          internetTrend
        ]
      ]
    )
  );

  // Electricity sources
  content.push(createSubsectionHeader('Electricity Sources'));
  content.push(
    createTable(
      ['Source', 'Households'],
      [
        ['Grid Connection', formatNumber(utilities.electricityGrid)],
        ['Solar Power', formatNumber(utilities.electricitySolar)],
        ['Battery', formatNumber(utilities.electricityBattery)],
        ['Generator', formatNumber(utilities.electricityGenerator)]
      ]
    )
  );

  // Mobile signal coverage
  content.push(createSubsectionHeader('Mobile Signal Coverage'));
  const totalSignal =
    utilities.signal5G +
    utilities.signal4G +
    utilities.signal3G +
    utilities.signal2G +
    utilities.signalNone;
  content.push(
    createTable(
      ['Signal Type', 'Sitios', 'Percentage'],
      [
        [
          '5G Coverage',
          utilities.signal5G,
          formatPercentage((utilities.signal5G / totalSignal) * 100, 1)
        ],
        [
          '4G Coverage',
          utilities.signal4G,
          formatPercentage((utilities.signal4G / totalSignal) * 100, 1)
        ],
        [
          '3G Coverage',
          utilities.signal3G,
          formatPercentage((utilities.signal3G / totalSignal) * 100, 1)
        ],
        [
          '2G Coverage',
          utilities.signal2G,
          formatPercentage((utilities.signal2G / totalSignal) * 100, 1)
        ],
        [
          'No Signal',
          utilities.signalNone,
          formatPercentage((utilities.signalNone / totalSignal) * 100, 1)
        ]
      ]
    )
  );

  // Add chart if available
  if (config.includeCharts && chartImages.has('utilities-coverage')) {
    content.push({
      image: chartImages.get('utilities-coverage')!,
      width: 400,
      alignment: 'center' as const,
      margin: [0, 10, 0, 10] as [number, number, number, number]
    });
  }

  return content;
}

/**
 * Build facilities section content
 */
function buildFacilitiesSection(
  data: AggregatedData,
  _config: ReportConfig,
  chartImages: Map<string, string>
): Content[] {
  const content: Content[] = [];
  const { facilities } = data;

  content.push(createSectionHeader('Community Facilities'));

  // Facility labels mapping
  const facilityLabels: Record<string, string> = {
    healthCenter: 'Health Center',
    pharmacy: 'Pharmacy',
    communityToilet: 'Community Toilet',
    kindergarten: 'Kindergarten',
    elementarySchool: 'Elementary School',
    highSchool: 'High School',
    madrasah: 'Madrasah',
    market: 'Market'
  };

  // Facility existence
  content.push(createSubsectionHeader('Facility Availability'));

  const facilityRows: (string | number)[][] = [];
  for (const [key, label] of Object.entries(facilityLabels)) {
    const facility = facilities[key as keyof FacilitiesAggregation];
    if (facility && typeof facility === 'object' && 'exists' in facility) {
      facilityRows.push([
        label,
        facility.exists,
        facility.notExist,
        facility.averageDistance > 0 ? `${facility.averageDistance.toFixed(1)} km` : '-'
      ]);
    }
  }

  content.push(createTable(['Facility', 'Exists', 'Not Available', 'Avg Distance'], facilityRows));

  // Facility conditions
  content.push(createSubsectionHeader('Facility Conditions'));

  const conditionRows: (string | number)[][] = [];
  for (const [key, label] of Object.entries(facilityLabels)) {
    const facility = facilities[key as keyof FacilitiesAggregation];
    if (facility && typeof facility === 'object' && 'excellent' in facility) {
      conditionRows.push([
        label,
        facility.excellent,
        facility.good,
        facility.average,
        facility.poor,
        facility.bad
      ]);
    }
  }

  content.push(
    createTable(['Facility', 'Excellent', 'Good', 'Average', 'Poor', 'Bad'], conditionRows, [
      '*',
      60,
      60,
      60,
      60,
      60
    ])
  );

  // Add chart if available
  if (chartImages.has('facilities-existence')) {
    content.push({
      image: chartImages.get('facilities-existence')!,
      width: 400,
      alignment: 'center' as const,
      margin: [0, 10, 0, 10] as [number, number, number, number]
    });
  }

  return content;
}

/**
 * Build infrastructure section content
 */
function buildInfrastructureSection(
  data: AggregatedData,
  config: ReportConfig,
  chartImages: Map<string, string>
): Content[] {
  const content: Content[] = [];
  const { infrastructure, yearComparison } = data;

  content.push(createSectionHeader('Roads & Infrastructure'));

  // Road coverage
  content.push(createSubsectionHeader('Road Coverage'));

  const roadTrend =
    config.includeTrends && yearComparison?.trends.roadLength
      ? formatTrend(
          yearComparison.trends.roadLength.value,
          yearComparison.trends.roadLength.isPositive
        )
      : '';

  const totalRoadLength =
    infrastructure.roadAsphalt.totalLength +
    infrastructure.roadConcrete.totalLength +
    infrastructure.roadGravel.totalLength +
    infrastructure.roadNatural.totalLength;

  content.push(createKeyValue('Total Road Length', `${totalRoadLength.toFixed(1)} km${roadTrend}`));

  content.push(
    createTable(
      ['Road Type', 'Sitios', 'Total Length (km)', 'Excellent', 'Good', 'Average', 'Poor', 'Bad'],
      [
        [
          'Asphalt',
          infrastructure.roadAsphalt.exists,
          infrastructure.roadAsphalt.totalLength.toFixed(1),
          infrastructure.roadAsphalt.excellent,
          infrastructure.roadAsphalt.good,
          infrastructure.roadAsphalt.average,
          infrastructure.roadAsphalt.poor,
          infrastructure.roadAsphalt.bad
        ],
        [
          'Concrete',
          infrastructure.roadConcrete.exists,
          infrastructure.roadConcrete.totalLength.toFixed(1),
          infrastructure.roadConcrete.excellent,
          infrastructure.roadConcrete.good,
          infrastructure.roadConcrete.average,
          infrastructure.roadConcrete.poor,
          infrastructure.roadConcrete.bad
        ],
        [
          'Gravel',
          infrastructure.roadGravel.exists,
          infrastructure.roadGravel.totalLength.toFixed(1),
          infrastructure.roadGravel.excellent,
          infrastructure.roadGravel.good,
          infrastructure.roadGravel.average,
          infrastructure.roadGravel.poor,
          infrastructure.roadGravel.bad
        ],
        [
          'Natural/Earth',
          infrastructure.roadNatural.exists,
          infrastructure.roadNatural.totalLength.toFixed(1),
          infrastructure.roadNatural.excellent,
          infrastructure.roadNatural.good,
          infrastructure.roadNatural.average,
          infrastructure.roadNatural.poor,
          infrastructure.roadNatural.bad
        ]
      ],
      ['*', 50, 80, 60, 50, 50, 50, 50]
    )
  );

  // Water sources
  content.push(createSubsectionHeader('Water Sources'));
  content.push(
    createTable(
      ['Water Source', 'Sitios', 'Functioning', 'Not Functioning'],
      [
        [
          'Natural (Spring/River)',
          infrastructure.waterNatural.exists,
          infrastructure.waterNatural.functioning,
          infrastructure.waterNatural.notFunctioning
        ],
        [
          'Level 1 (Point Source)',
          infrastructure.waterLevel1.exists,
          infrastructure.waterLevel1.functioning,
          infrastructure.waterLevel1.notFunctioning
        ],
        [
          'Level 2 (Communal)',
          infrastructure.waterLevel2.exists,
          infrastructure.waterLevel2.functioning,
          infrastructure.waterLevel2.notFunctioning
        ],
        [
          'Level 3 (House Connection)',
          infrastructure.waterLevel3.exists,
          infrastructure.waterLevel3.functioning,
          infrastructure.waterLevel3.notFunctioning
        ]
      ]
    )
  );

  // Sanitation
  content.push(createSubsectionHeader('Sanitation Types'));
  content.push(
    createTable(
      ['Sanitation Type', 'Sitios Using'],
      [
        ['Water-Sealed Toilet', infrastructure.sanitationWaterSealed],
        ['Pit Latrine', infrastructure.sanitationPitLatrine],
        ['Community CR', infrastructure.sanitationCommunityCR],
        ['Open Defecation', infrastructure.sanitationOpenDefecation]
      ]
    )
  );

  // Education infrastructure
  content.push(createSubsectionHeader('Classroom Capacity'));
  content.push(
    createTable(
      ['Students per Room', 'Sitios'],
      [
        ['Less than 46', infrastructure.studentsPerRoomLessThan46],
        ['46-50', infrastructure.studentsPerRoom46_50],
        ['51-55', infrastructure.studentsPerRoom51_55],
        ['More than 56', infrastructure.studentsPerRoomMoreThan56],
        ['No Classroom', infrastructure.studentsPerRoomNoClassroom]
      ]
    )
  );

  // Add chart if available
  if (chartImages.has('infrastructure-roads')) {
    content.push({
      image: chartImages.get('infrastructure-roads')!,
      width: 400,
      alignment: 'center' as const,
      margin: [0, 10, 0, 10] as [number, number, number, number]
    });
  }

  return content;
}

/**
 * Build livelihood section content
 */
function buildLivelihoodSection(
  data: AggregatedData,
  config: ReportConfig,
  chartImages: Map<string, string>
): Content[] {
  const content: Content[] = [];
  const { livelihood, yearComparison } = data;

  content.push(createSectionHeader('Livelihood & Agriculture'));

  // Income overview
  content.push(createSubsectionHeader('Income Overview'));

  const incomeTrend =
    config.includeTrends && yearComparison?.trends.averageIncome
      ? formatTrend(
          yearComparison.trends.averageIncome.value,
          yearComparison.trends.averageIncome.isPositive
        )
      : '';

  const povertyTrend =
    config.includeTrends && yearComparison?.trends.poorCount
      ? formatTrend(
          yearComparison.trends.poorCount.value,
          yearComparison.trends.poorCount.isPositive
        )
      : '';

  content.push(
    createKeyValue(
      'Average Daily Income',
      formatCurrency(livelihood.averageDailyIncomeOverall) + '/day' + incomeTrend
    )
  );
  content.push(
    createKeyValue(
      'Poor (Below Poverty Line)',
      `${livelihood.incomeClusterCounts.poor} sitios${povertyTrend}`
    )
  );

  // Worker distribution
  content.push(createSubsectionHeader('Worker Class Distribution'));
  content.push(
    createTable(
      ['Worker Class', 'Count'],
      [
        ['Private Household', formatNumber(livelihood.workerPrivateHousehold)],
        ['Private Establishment', formatNumber(livelihood.workerPrivateEstablishment)],
        ['Government', formatNumber(livelihood.workerGovernment)],
        ['Self-Employed', formatNumber(livelihood.workerSelfEmployed)],
        ['Employer', formatNumber(livelihood.workerEmployer)],
        ['OFW', formatNumber(livelihood.workerOFW)]
      ]
    )
  );

  // Agriculture
  content.push(createSubsectionHeader('Agriculture'));
  content.push(createKeyValue('Total Farmers', formatNumber(livelihood.totalFarmers)));
  content.push(
    createKeyValue('Total Farm Area', `${formatNumber(livelihood.totalFarmArea)} hectares`)
  );
  content.push(createKeyValue('Farmer Organizations', formatNumber(livelihood.totalFarmerOrgs)));

  // Top crops
  if (livelihood.cropCounts.size > 0) {
    content.push(createSubsectionHeader('Top Crops'));
    const sortedCrops = Array.from(livelihood.cropCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    content.push(
      createTable(
        ['Crop', 'Sitios Growing'],
        sortedCrops.map(([crop, count]) => [crop, count])
      )
    );
  }

  // Top livestock
  if (livelihood.livestockCounts.size > 0) {
    content.push(createSubsectionHeader('Top Livestock'));
    const sortedLivestock = Array.from(livelihood.livestockCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    content.push(
      createTable(
        ['Livestock', 'Sitios Raising'],
        sortedLivestock.map(([animal, count]) => [animal, count])
      )
    );
  }

  // Add chart if available
  if (chartImages.has('livelihood-workers')) {
    content.push({
      image: chartImages.get('livelihood-workers')!,
      width: 400,
      alignment: 'center' as const,
      margin: [0, 10, 0, 10] as [number, number, number, number]
    });
  }

  return content;
}

/**
 * Build safety section content
 */
function buildSafetySection(
  data: AggregatedData,
  _config: ReportConfig,
  chartImages: Map<string, string>
): Content[] {
  const content: Content[] = [];
  const { safety } = data;

  content.push(createSectionHeader('Safety & Risk Context'));

  // Food security
  content.push(createSubsectionHeader('Food Security Status'));
  const totalFoodSecurity =
    safety.foodSecure + safety.foodSeasonalScarcity + safety.foodCriticalShortage;
  content.push(
    createTable(
      ['Status', 'Sitios', 'Percentage'],
      [
        [
          'Food Secure',
          safety.foodSecure,
          formatPercentage((safety.foodSecure / totalFoodSecurity) * 100, 1)
        ],
        [
          'Seasonal Scarcity',
          safety.foodSeasonalScarcity,
          formatPercentage((safety.foodSeasonalScarcity / totalFoodSecurity) * 100, 1)
        ],
        [
          'Critical Shortage',
          safety.foodCriticalShortage,
          formatPercentage((safety.foodCriticalShortage / totalFoodSecurity) * 100, 1)
        ]
      ]
    )
  );

  // Hazards summary
  content.push(createSubsectionHeader('Natural Hazards (Past 12 Months)'));

  const hazardSummary = (counts: Map<number, number>): string => {
    const affected = Array.from(counts.entries())
      .filter(([freq]) => freq > 0)
      .reduce((sum, [, count]) => sum + count, 0);
    return `${affected} sitios affected`;
  };

  content.push(
    createTable(
      ['Hazard Type', 'Affected Sitios'],
      [
        ['Flooding', hazardSummary(safety.floodFrequencyCounts)],
        ['Landslide', hazardSummary(safety.landslideFrequencyCounts)],
        ['Drought', hazardSummary(safety.droughtFrequencyCounts)],
        ['Earthquake', hazardSummary(safety.earthquakeFrequencyCounts)]
      ]
    )
  );

  // Add chart if available
  if (chartImages.has('safety-food-security')) {
    content.push({
      image: chartImages.get('safety-food-security')!,
      width: 400,
      alignment: 'center' as const,
      margin: [0, 10, 0, 10] as [number, number, number, number]
    });
  }

  return content;
}

/**
 * Build priorities section content
 * NOTE: Currently hidden from PDF reports as per requirements
 */
function buildPrioritiesSection(): Content[] {
  // _data: AggregatedData,
  // _config: ReportConfig,
  // _chartImages: Map<string, string>
  // Priority Interventions and Most Urgent Needs sections are hidden from PDF reports
  return [];
}

// ===== MAIN REPORT GENERATION FUNCTIONS =====

/**
 * Generate aggregate report PDF
 */
export function generateAggregateReport(
  sitios: SitioRecord[],
  config: ReportConfig,
  chartImages?: ReportChartImage[]
): ReturnType<typeof pdfMake.createPdf> {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Filter sitios based on config
  const filteredSitios = sitios.filter((sitio) => {
    if (config.filters.municipality && sitio.municipality !== config.filters.municipality) {
      return false;
    }
    if (config.filters.barangay && sitio.barangay !== config.filters.barangay) {
      return false;
    }
    return true;
  });

  // Aggregate data
  const year = config.filters.year;
  const aggregatedData: AggregatedData = {
    demographics: aggregateDemographics(filteredSitios, year),
    utilities: aggregateUtilities(filteredSitios, year),
    facilities: aggregateFacilities(filteredSitios, year),
    infrastructure: aggregateInfrastructure(filteredSitios, year),
    livelihood: aggregateLivelihood(filteredSitios, year),
    safety: aggregateSafety(filteredSitios, year),
    priorities: aggregatePriorities(filteredSitios, year),
    yearComparison: config.includeTrends ? getYearComparison(filteredSitios, year) : null,
    sitioCount: filteredSitios.length
  };

  // Convert chart images to map for easy lookup
  const chartImageMap = new Map<string, string>();
  if (chartImages) {
    for (const img of chartImages) {
      chartImageMap.set(img.type, img.imageBase64);
    }
  }

  // Build content
  const content: Content[] = [];

  // Header
  content.push({
    columns: [
      {
        image: LOGO_BASE64,
        width: 60,
        alignment: 'left' as const
      },
      {
        stack: [
          {
            text: 'South Cotabato Convergence Data Bank',
            style: 'documentSubtitle',
            alignment: 'center' as const
          },
          {
            text: config.title || 'AGGREGATE DATA REPORT',
            style: 'documentTitle',
            alignment: 'center' as const
          },
          {
            text: `As of ${year} / Generated ${currentDate}`,
            fontSize: 9,
            italics: true,
            alignment: 'center' as const,
            margin: [0, 5, 0, 0] as [number, number, number, number]
          }
          // {
          //   text: `Generated: ${currentDate}`,
          //   fontSize: 9,
          //   italics: true,
          //   alignment: 'center' as const,
          //   margin: [0, 5, 0, 0] as [number, number, number, number]
          // }
        ],
        width: '*'
      },
      {
        width: 60,
        text: ''
      }
    ],
    margin: [0, 0, 0, 20] as [number, number, number, number]
  });

  // Build sections based on config
  const sectionBuilders: Record<
    ReportSection,
    (data: AggregatedData, config: ReportConfig, chartImages: Map<string, string>) => Content[]
  > = {
    overview: buildOverviewSection,
    demographics: buildDemographicsSection,
    utilities: buildUtilitiesSection,
    facilities: buildFacilitiesSection,
    infrastructure: buildInfrastructureSection,
    livelihood: buildLivelihoodSection,
    safety: buildSafetySection,
    priorities: buildPrioritiesSection
  };

  for (const section of config.sections) {
    const builder = sectionBuilders[section];
    if (builder) {
      content.push(...builder(aggregatedData, config, chartImageMap));
    }
  }

  // Add signatory section at the end
  content.push(...createSignatorySection());

  // Document definition
  const docDefinition: TDocumentDefinitions = {
    pageOrientation: 'portrait',
    pageSize: 'LEGAL',
    pageMargins: [40, 40, 40, 60],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: 'South Cotabato Convergence Data Bank - Aggregate Report',
          fontSize: 8,
          color: '#6B7280',
          margin: [40, 0, 0, 0]
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'right' as const,
          fontSize: 8,
          color: '#6B7280',
          margin: [0, 0, 40, 0]
        }
      ]
    }),
    content,
    styles: {
      documentTitle: {
        fontSize: 16,
        bold: true,
        color: '#1E293B'
      },
      documentSubtitle: {
        fontSize: 11,
        color: '#475569'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#1E40AF',
        decoration: 'underline' as const
      },
      subsectionHeader: {
        fontSize: 11,
        bold: true,
        color: '#334155'
      },
      label: {
        fontSize: 10,
        color: '#64748B'
      },
      value: {
        fontSize: 10,
        color: '#1E293B'
      },
      statLabel: {
        fontSize: 9,
        color: '#64748B'
      },
      statValue: {
        fontSize: 14,
        bold: true,
        color: '#1E293B'
      },
      trendText: {
        fontSize: 8,
        italics: true
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        fillColor: '#E2E8F0',
        color: '#1E293B'
      },
      tableCell: {
        fontSize: 9,
        color: '#374151'
      },
      noData: {
        fontSize: 9,
        italics: true,
        color: '#9CA3AF',
        margin: [0, 5, 0, 10] as [number, number, number, number]
      }
    }
  };

  return pdfMake.createPdf(docDefinition);
}

/**
 * Download an aggregate report as PDF
 */
export function downloadAggregateReport(
  sitios: SitioRecord[],
  config: ReportConfig,
  chartImages?: ReportChartImage[],
  fileName?: string
): void {
  const pdf = generateAggregateReport(sitios, config, chartImages);

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const locationStr = config.filters.municipality
    ? `_${config.filters.municipality.replace(/\s+/g, '_')}`
    : '';
  const defaultFileName = `Aggregate_Report${locationStr}_as_of_${config.filters.year}_${dateStr}.pdf`;
  const finalFileName = fileName || defaultFileName;

  pdf.download(finalFileName);

  // Log the export action
  const sectionNames = config.sections.join(', ');
  logAuditAction(
    'export',
    'report',
    `aggregate-${config.filters.year}`,
    finalFileName,
    `Generated aggregate report: ${sitios.length} sitios, sections: ${sectionNames}, year: ${config.filters.year}`
  );
}

// ===== SITIO PROFILE REPORT GENERATION =====

/**
 * Build sitio overview section for profile report
 */
function buildSitioOverviewSection(
  profile: import('$lib/types').SitioProfile,
  sitio: SitioRecord
): Content[] {
  const content: Content[] = [];

  content.push(createSectionHeader('Basic Information'));

  // Location info
  content.push(createSubsectionHeader('Location'));
  content.push(createKeyValue('Municipality', sitio.municipality));
  content.push(createKeyValue('Barangay', sitio.barangay));
  content.push(createKeyValue('Sitio Name', sitio.sitioName));
  content.push(createKeyValue('Sitio Code', sitio.coding));
  content.push(
    createKeyValue('Coordinates', `${sitio.latitude.toFixed(6)}, ${sitio.longitude.toFixed(6)}`)
  );

  // Classification
  content.push(createSubsectionHeader('Classification'));
  const classifications: string[] = [];
  if (sitio.sitioClassification.gida) classifications.push('GIDA (Geographically Isolated)');
  if (sitio.sitioClassification.indigenous) classifications.push('Indigenous Community');
  if (sitio.sitioClassification.conflict) classifications.push('Conflict-Affected Area');
  content.push(
    createKeyValue(
      'Classifications',
      classifications.length > 0 ? classifications.join(', ') : 'None'
    )
  );

  // Main access
  content.push(createSubsectionHeader('Main Access'));
  const accessTypes: string[] = [];
  if (profile.mainAccess.pavedRoad) accessTypes.push('Paved Road');
  if (profile.mainAccess.unpavedRoad) accessTypes.push('Unpaved Road');
  if (profile.mainAccess.footpath) accessTypes.push('Footpath');
  if (profile.mainAccess.boat) accessTypes.push('Boat');
  content.push(
    createKeyValue(
      'Access Types',
      accessTypes.length > 0 ? accessTypes.join(', ') : 'Not specified'
    )
  );

  return content;
}

/**
 * Build sitio demographics section for profile report
 */
function buildSitioDemographicsSection(profile: import('$lib/types').SitioProfile): Content[] {
  const content: Content[] = [];

  content.push(createSectionHeader('Demographics & Population'));

  // Population overview
  content.push(createSubsectionHeader('Population Overview'));
  content.push(
    createTable(
      ['Metric', 'Value'],
      [
        ['Total Population', formatNumber(profile.totalPopulation)],
        ['Male Population', formatNumber(profile.population.totalMale)],
        ['Female Population', formatNumber(profile.population.totalFemale)],
        ['Total Households', formatNumber(profile.totalHouseholds)],
        ['Registered Voters', formatNumber(profile.registeredVoters)],
        ['Labor Force', formatNumber(profile.laborForceCount)],
        ['School-Age Children', formatNumber(profile.schoolAgeChildren)]
      ]
    )
  );

  // Vulnerable groups
  content.push(createSubsectionHeader('Vulnerable Groups'));
  content.push(
    createTable(
      ['Group', 'Count'],
      [
        ['Seniors (60+)', formatNumber(profile.vulnerableGroups.seniorsCount)],
        ['Labor Force (60-64)', formatNumber(profile.vulnerableGroups.laborForce60to64Count)],
        ['Muslim Population', formatNumber(profile.vulnerableGroups.muslimCount)],
        ['Indigenous Peoples (IP)', formatNumber(profile.vulnerableGroups.ipCount)],
        ['Unemployed', formatNumber(profile.vulnerableGroups.unemployedCount)],
        ['Out-of-School Youth', formatNumber(profile.vulnerableGroups.outOfSchoolYouth)],
        ['Without Birth Certificate', formatNumber(profile.vulnerableGroups.noBirthCertCount)],
        ['Without National ID', formatNumber(profile.vulnerableGroups.noNationalIDCount)]
      ]
    )
  );

  return content;
}

/**
 * Build sitio utilities section for profile report
 */
function buildSitioUtilitiesSection(profile: import('$lib/types').SitioProfile): Content[] {
  const content: Content[] = [];

  content.push(createSectionHeader('Utilities & Connectivity'));

  // Basic utilities
  content.push(createSubsectionHeader('Household Utilities'));
  content.push(
    createTable(
      ['Utility', 'Households'],
      [
        ['With Electricity', formatNumber(profile.householdsWithElectricity)],
        ['With Toilet Facilities', formatNumber(profile.householdsWithToilet)],
        ['With Internet Access', formatNumber(profile.householdsWithInternet)]
      ]
    )
  );

  // Electricity sources
  content.push(createSubsectionHeader('Electricity Sources'));
  content.push(
    createTable(
      ['Source', 'Households'],
      [
        ['Grid Connection', formatNumber(profile.electricitySources.grid)],
        ['Solar Power', formatNumber(profile.electricitySources.solar)],
        ['Battery', formatNumber(profile.electricitySources.battery)],
        ['Generator', formatNumber(profile.electricitySources.generator)]
      ]
    )
  );

  // Mobile signal
  const signalLabels: Record<string, string> = {
    none: 'No Signal',
    '2g': '2G',
    '3g': '3G',
    '4g': '4G',
    '5g': '5G'
  };
  content.push(createKeyValue('Mobile Signal', signalLabels[profile.mobileSignal] || 'Unknown'));

  return content;
}

/**
 * Build sitio facilities section for profile report
 */
function buildSitioFacilitiesSection(profile: import('$lib/types').SitioProfile): Content[] {
  const content: Content[] = [];

  content.push(createSectionHeader('Community Facilities'));

  const conditionLabels: Record<number, string> = {
    1: 'Bad',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent'
  };

  const facilityNames: Record<string, string> = {
    healthCenter: 'Health Center',
    pharmacy: 'Pharmacy',
    communityToilet: 'Community Toilet',
    kindergarten: 'Kindergarten',
    elementarySchool: 'Elementary School',
    highSchool: 'High School',
    madrasah: 'Madrasah',
    market: 'Market'
  };

  const rows: (string | number)[][] = [];
  for (const [key, label] of Object.entries(facilityNames)) {
    const facility = profile.facilities[key as keyof typeof profile.facilities];
    if (facility) {
      rows.push([
        label,
        facility.exists === 'yes' ? 'Yes' : 'No',
        facility.count ?? '-',
        facility.condition ? conditionLabels[facility.condition] : '-',
        facility.distanceToNearest ? `${facility.distanceToNearest} km` : '-'
      ]);
    }
  }

  content.push(createTable(['Facility', 'Exists', 'Count', 'Condition', 'Distance'], rows));

  return content;
}

/**
 * Build sitio infrastructure section for profile report
 */
function buildSitioInfrastructureSection(profile: import('$lib/types').SitioProfile): Content[] {
  const content: Content[] = [];

  content.push(createSectionHeader('Roads & Infrastructure'));

  const conditionLabels: Record<number, string> = {
    1: 'Bad',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent'
  };

  // Roads
  content.push(createSubsectionHeader('Road Infrastructure'));
  const roadTypes: Record<string, string> = {
    asphalt: 'Asphalt',
    concrete: 'Concrete',
    gravel: 'Gravel',
    natural: 'Natural/Earth'
  };

  const roadRows: (string | number)[][] = [];
  for (const [key, label] of Object.entries(roadTypes)) {
    const road = profile.infrastructure[key as keyof typeof profile.infrastructure];
    if (road) {
      roadRows.push([
        label,
        road.exists === 'yes' ? 'Yes' : 'No',
        road.length ? `${road.length} km` : '-',
        road.condition ? conditionLabels[road.condition] : '-'
      ]);
    }
  }
  content.push(createTable(['Road Type', 'Exists', 'Length', 'Condition'], roadRows));

  // Water sources
  content.push(createSubsectionHeader('Water Sources'));
  const waterTypes: Record<string, string> = {
    natural: 'Natural (Spring/River/Well)',
    level1: 'Level 1 (Point Source)',
    level2: 'Level 2 (Communal)',
    level3: 'Level 3 (House Connection)'
  };

  const waterRows: (string | number)[][] = [];
  for (const [key, label] of Object.entries(waterTypes)) {
    const water = profile.waterSources[key as keyof typeof profile.waterSources];
    if (water) {
      waterRows.push([
        label,
        water.exists === 'yes' ? 'Yes' : 'No',
        water.functioningCount ?? '-',
        water.notFunctioningCount ?? '-'
      ]);
    }
  }
  content.push(
    createTable(['Water Source', 'Exists', 'Functioning', 'Not Functioning'], waterRows)
  );

  // Sanitation
  content.push(createSubsectionHeader('Sanitation'));
  const sanitationTypes: string[] = [];
  if (profile.sanitationTypes.waterSealed) sanitationTypes.push('Water-Sealed Toilet');
  if (profile.sanitationTypes.pitLatrine) sanitationTypes.push('Pit Latrine');
  if (profile.sanitationTypes.communityCR) sanitationTypes.push('Community CR');
  if (profile.sanitationTypes.openDefecation) sanitationTypes.push('Open Defecation');
  content.push(
    createKeyValue(
      'Sanitation Types',
      sanitationTypes.length > 0 ? sanitationTypes.join(', ') : 'None specified'
    )
  );

  // Education
  const roomLabels: Record<string, string> = {
    less_than_46: 'Less than 46',
    '46_50': '46-50',
    '51_55': '51-55',
    more_than_56: 'More than 56',
    no_classroom: 'No Classroom'
  };
  content.push(
    createKeyValue('Students per Room', roomLabels[profile.studentsPerRoom] || 'Unknown')
  );

  return content;
}

/**
 * Build sitio economy section for profile report
 */
function buildSitioEconomySection(profile: import('$lib/types').SitioProfile): Content[] {
  const content: Content[] = [];

  content.push(createSectionHeader('Livelihood & Agriculture'));

  // Income
  content.push(createSubsectionHeader('Income'));
  content.push(
    createKeyValue('Average Daily Income', formatCurrency(profile.averageDailyIncome) + '/day')
  );

  // Worker distribution
  content.push(createSubsectionHeader('Worker Distribution'));
  content.push(
    createTable(
      ['Worker Class', 'Count'],
      [
        ['Private Household', formatNumber(profile.workerClass.privateHousehold)],
        ['Private Establishment', formatNumber(profile.workerClass.privateEstablishment)],
        ['Government', formatNumber(profile.workerClass.government)],
        ['Self-Employed', formatNumber(profile.workerClass.selfEmployed)],
        ['Employer', formatNumber(profile.workerClass.employer)],
        ['OFW', formatNumber(profile.workerClass.ofw)]
      ]
    )
  );

  // Agriculture
  content.push(createSubsectionHeader('Agriculture'));
  content.push(
    createKeyValue('Number of Farmers', formatNumber(profile.agriculture.numberOfFarmers))
  );
  content.push(
    createKeyValue(
      'Farm Area',
      `${formatNumber(profile.agriculture.estimatedFarmAreaHectares)} hectares`
    )
  );
  content.push(
    createKeyValue('Farmer Associations', formatNumber(profile.agriculture.numberOfAssociations))
  );

  // Crops and livestock
  if (profile.crops.length > 0) {
    content.push(createKeyValue('Main Crops', profile.crops.join(', ')));
  }
  if (profile.livestock.length > 0) {
    content.push(createKeyValue('Livestock/Poultry', profile.livestock.join(', ')));
  }

  // Pets
  content.push(createSubsectionHeader('Pet Statistics'));
  content.push(
    createTable(
      ['Animal', 'Total', 'Vaccinated'],
      [
        ['Dogs', formatNumber(profile.pets.dogsCount), formatNumber(profile.pets.vaccinatedDogs)],
        ['Cats', formatNumber(profile.pets.catsCount), formatNumber(profile.pets.vaccinatedCats)]
      ]
    )
  );

  // Backyard gardens
  if (profile.backyardGardens.householdsWithGardens > 0) {
    content.push(createSubsectionHeader('Backyard Gardens'));
    content.push(
      createKeyValue(
        'Households with Gardens',
        formatNumber(profile.backyardGardens.householdsWithGardens)
      )
    );
    if (profile.backyardGardens.commonCrops.length > 0) {
      content.push(createKeyValue('Common Crops', profile.backyardGardens.commonCrops.join(', ')));
    }
  }

  return content;
}

/**
 * Build sitio safety section for profile report
 */
function buildSitioSafetySection(profile: import('$lib/types').SitioProfile): Content[] {
  const content: Content[] = [];

  content.push(createSectionHeader('Safety & Risk Context'));

  // Food security
  const foodSecurityLabels: Record<string, string> = {
    secure: 'Food Secure',
    seasonal_scarcity: 'Seasonal Scarcity',
    critical_shortage: 'Critical Shortage'
  };
  content.push(
    createKeyValue('Food Security Status', foodSecurityLabels[profile.foodSecurity] || 'Unknown')
  );

  // Hazards
  content.push(createSubsectionHeader('Natural Hazards (Past 12 Months)'));
  content.push(
    createTable(
      ['Hazard Type', 'Occurrences'],
      [
        ['Flooding', profile.hazards.flood.frequency],
        ['Landslide', profile.hazards.landslide.frequency],
        ['Drought', profile.hazards.drought.frequency],
        ['Earthquake', profile.hazards.earthquake.frequency]
      ]
    )
  );

  return content;
}

/**
 * Build sitio priorities section for profile report
 */
// function buildSitioPrioritiesSection(profile: import('$lib/types').SitioProfile): Content[] {
//   const content: Content[] = [];

//   content.push(createSectionHeader('Priority Interventions'));

//   const priorityLabels: Record<string, string> = {
//     waterSystem: 'Water System',
//     communityCR: 'Community CR',
//     solarStreetLights: 'Solar Street Lights',
//     roadOpening: 'Road Opening',
//     farmTools: 'Farm Tools',
//     healthServices: 'Health Services',
//     educationSupport: 'Education Support'
//   };

//   const ratingLabels: Record<number, string> = {
//     0: 'Not Needed',
//     1: 'Low Priority',
//     2: 'Medium Priority',
//     3: 'Very Urgent'
//   };

//   if (profile.priorities && profile.priorities.length > 0) {
//     const sortedPriorities = [...profile.priorities].sort((a, b) => b.rating - a.rating);
//     content.push(
//       createTable(
//         ['Intervention', 'Priority Level'],
//         sortedPriorities.map((p) => [
//           priorityLabels[p.name] || p.name,
//           ratingLabels[p.rating] || 'Unknown'
//         ])
//       )
//     );

//     content.push(createKeyValue('Average Need Score', profile.averageNeedScore.toFixed(2)));
//   } else {
//     content.push({ text: 'No priority data available', style: 'noData' });
//   }

//   return content;
// }

/**
 * Generate sitio profile report PDF
 */
export function generateSitioProfileReport(
  sitio: SitioRecord,
  year: number
): ReturnType<typeof pdfMake.createPdf> {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get the profile for the specified year
  const profile = sitio.yearlyData[year.toString()];
  if (!profile) {
    throw new Error(`No data available for year ${year}`);
  }

  // Build content
  const content: Content[] = [];

  // Header
  content.push({
    columns: [
      {
        image: LOGO_BASE64,
        width: 60,
        alignment: 'left' as const
      },
      {
        stack: [
          {
            text: 'SOUTH COTABATO CATCH - UP',
            style: 'documentSubtitle',
            alignment: 'center' as const
          },
          {
            text: `${sitio.sitioName.toUpperCase()} PROFILE REPORT`,
            style: 'documentTitle',
            alignment: 'center' as const
          },
          {
            text: `${sitio.barangay}, ${sitio.municipality}`,
            style: 'documentSubtitle',
            alignment: 'center' as const
          },
          {
            text: `Data as of ${year} | Generated: ${currentDate}`,
            fontSize: 9,
            italics: true,
            alignment: 'center' as const,
            margin: [0, 5, 0, 0] as [number, number, number, number]
          }
        ],
        width: '*'
      },
      {
        width: 60,
        text: ''
      }
    ],
    margin: [0, 0, 0, 20] as [number, number, number, number]
  });

  // Build all sections
  content.push(...buildSitioOverviewSection(profile, sitio));
  content.push(...buildSitioDemographicsSection(profile));
  content.push(...buildSitioUtilitiesSection(profile));
  content.push(...buildSitioFacilitiesSection(profile));
  content.push(...buildSitioInfrastructureSection(profile));
  content.push(...buildSitioEconomySection(profile));
  content.push(...buildSitioSafetySection(profile));
  // content.push(...buildSitioPrioritiesSection(profile));

  // Add signatory section at the end
  content.push(...createSignatorySection());

  // Document definition
  const docDefinition: TDocumentDefinitions = {
    pageOrientation: 'portrait',
    pageSize: 'LEGAL',
    pageMargins: [40, 40, 40, 60],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `${sitio.sitioName} Profile Report - South Cotabato Convergence Data Bank`,
          fontSize: 8,
          color: '#6B7280',
          margin: [40, 0, 0, 0]
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'right' as const,
          fontSize: 8,
          color: '#6B7280',
          margin: [0, 0, 40, 0]
        }
      ]
    }),
    content,
    styles: {
      documentTitle: {
        fontSize: 16,
        bold: true,
        color: '#1E293B'
      },
      documentSubtitle: {
        fontSize: 11,
        color: '#475569'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#1E40AF',
        decoration: 'underline' as const
      },
      subsectionHeader: {
        fontSize: 11,
        bold: true,
        color: '#334155'
      },
      label: {
        fontSize: 10,
        color: '#64748B'
      },
      value: {
        fontSize: 10,
        color: '#1E293B'
      },
      statLabel: {
        fontSize: 9,
        color: '#64748B'
      },
      statValue: {
        fontSize: 14,
        bold: true,
        color: '#1E293B'
      },
      trendText: {
        fontSize: 8,
        italics: true
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        fillColor: '#E2E8F0',
        color: '#1E293B'
      },
      tableCell: {
        fontSize: 9,
        color: '#374151'
      },
      noData: {
        fontSize: 9,
        italics: true,
        color: '#9CA3AF',
        margin: [0, 5, 0, 10] as [number, number, number, number]
      }
    }
  };

  return pdfMake.createPdf(docDefinition);
}

/**
 * Download a sitio profile report as PDF
 */
export function downloadSitioProfileReport(
  sitio: SitioRecord,
  year: number,
  fileName?: string
): void {
  const pdf = generateSitioProfileReport(sitio, year);

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const sitioName = sitio.sitioName.replace(/\s+/g, '_');
  const defaultFileName = `${sitioName}_Profile_as_of_${year}_${dateStr}.pdf`;
  const finalFileName = fileName || defaultFileName;

  pdf.download(finalFileName);

  // Log the export action
  logAuditAction(
    'export',
    'report',
    `sitio-profile-${sitio.coding}`,
    finalFileName,
    `Generated sitio profile report for ${sitio.sitioName} (${sitio.municipality}, ${sitio.barangay}) as of ${year}`
  );
}

/**
 * Get section label for display
 */
export function getSectionLabel(section: ReportSection): string {
  const labels: typeof SECTION_LABELS = {
    overview: 'Overview & Summary',
    demographics: 'Demographics & Population',
    utilities: 'Utilities & Connectivity',
    facilities: 'Community Facilities',
    infrastructure: 'Roads & Infrastructure',
    livelihood: 'Livelihood & Agriculture',
    safety: 'Safety & Risk Context',
    priorities: 'Priority Interventions'
  };
  return labels[section] || section;
}
