/**
 * Philippine National Averages
 *
 * Reference data for utility access and infrastructure benchmarks
 * Used for comparison analytics across sitio profiles and dashboards
 */

export const NATIONAL_AVERAGES = {
	electricity: {
		percent: 93.12,
		source: 'Department of Energy (DOE), 2024',
		url: 'https://www.pna.gov.ph/articles/1228482'
	},
	sanitaryToilet: {
		percent: 91.7,
		source: 'PSA 2020 Census of Population and Housing',
		url: 'https://psa.gov.ph/content/household-characteristics-2020-census-population-and-housing'
	},
	internet: {
		percent: 48.8,
		source: 'PSA/DICT 2024 NICTHS Survey',
		url: 'https://ptvnews.ph/psa-dict-record-spike-in-internet-connected-households-increased-online-access-among-filipino-populace/'
	},
	pavedRoads: {
		percent: 99.11,
		source: 'DPWH Atlas 2024',
		url: 'https://www.dpwh.gov.ph/dpwh/DPWH_ATLAS_2024/Road%20Data%202024/index.htm'
	},
	unpavedRoads: {
		percent: 0.89,
		source: 'DPWH Atlas 2024',
		url: 'https://www.dpwh.gov.ph/dpwh/DPWH_ATLAS_2024/Road%20Data%202024/index.htm'
	}
} as const;
