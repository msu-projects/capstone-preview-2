import type { Activity, ChartDataItem, SitioProfile, SitioRecord, Stats, User } from '$lib/types';
import { loadSitios } from '$lib/utils/storage';
import {
	generateSitios,
	initializeMockDataIfNeeded,
	isMockDataInitialized,
	MOCK_DATA_INITIALIZED_KEY,
	resetMockData
} from './generator';

// Re-export generator functions for external use
export { generateSitios, isMockDataInitialized, MOCK_DATA_INITIALIZED_KEY, resetMockData };

// ===== SITIOS DATA =====

// Initialize LocalStorage with generated mock data if empty (runs only in browser)
function initializeSitios(): SitioProfile[] {
	if (typeof window === 'undefined') {
		// Server-side: generate fresh data for SSR with 3 years
		const records = generateSitios(50, 42, 2023, 3);
		return convertRecordsToProfiles(records);
	}

	try {
		// Check/initialize mock data
		const { sitios: generatedSitios } = initializeMockDataIfNeeded();
		return convertRecordsToProfiles(generatedSitios);
	} catch (error) {
		console.error('Failed to initialize sitios from storage:', error);
		const records = generateSitios(50, 42, 2023, 3);
		return convertRecordsToProfiles(records);
	}
}

// Helper function to convert SitioRecord[] to SitioProfile[] for current year
function convertRecordsToProfiles(records: SitioRecord[], year?: number): SitioProfile[] {
	const targetYear = year ?? new Date().getFullYear();
	return records.map((record) => {
		const yearData = record.yearlyData[String(targetYear)];
		if (yearData) {
			return yearData;
		}
		// Fallback to most recent year if target year not available
		const availableYear = record.availableYears[record.availableYears.length - 1];
		return record.yearlyData[String(availableYear)];
	});
}

// Export sitios with LocalStorage integration
export const sitios: SitioProfile[] = initializeSitios();

// Export function to refresh sitios from storage (useful after imports)
export function refreshSitios(): SitioProfile[] {
	if (typeof window === 'undefined') {
		const records = generateSitios(50, 42, 2023, 3);
		return convertRecordsToProfiles(records);
	}
	const records = loadSitios();
	return convertRecordsToProfiles(records.length > 0 ? records : generateSitios(50, 42, 2023, 3));
}

// ===== USERS DATA =====
// Note: User management is handled by src/lib/utils/user-storage.ts
import { loadUsers } from '$lib/utils/user-storage';
export const users: User[] = loadUsers();

// ===== ACTIVITY LOG =====

export const activities: Activity[] = [
	{
		id: 1,
		user: 'Juan Dela Cruz',
		action: 'Created new sitio profile',
		target: 'Sitio Maligaya',
		timestamp: '2024-11-19T09:30:00Z',
		icon: 'plus-circle'
	},
	{
		id: 2,
		user: 'Maria Santos',
		action: 'Updated sitio data',
		target: 'Sitio Greenhill',
		timestamp: '2024-11-19T08:20:00Z',
		icon: 'edit'
	},
	{
		id: 3,
		user: 'Pedro Reyes',
		action: 'Added new sitio',
		target: 'Sitio Highland',
		timestamp: '2024-11-18T11:00:00Z',
		icon: 'map-pin'
	},
	{
		id: 4,
		user: 'Ana Garcia',
		action: 'Uploaded sitio images',
		target: 'Sitio Riverside',
		timestamp: '2024-11-17T16:30:00Z',
		icon: 'upload'
	},
	{
		id: 5,
		user: 'Juan Dela Cruz',
		action: 'Generated report',
		target: 'Q3 2024 Sitio Assessment Report',
		timestamp: '2024-11-16T10:15:00Z',
		icon: 'file-text'
	}
];

// ===== STATISTICS =====

export const stats: Stats = {
	total_sitios: sitios.length,
	total_beneficiaries: sitios.reduce(
		(sum, s) => sum + (s.population.totalMale + s.population.totalFemale),
		0
	),
	municipalities: [...new Set(sitios.map((s) => s.municipality))].length
};

// ===== CHART DATA =====

export const chartData = {
	sitiosByMunicipality: (() => {
		const municipalities = [...new Set(sitios.map((s) => s.municipality))];
		return municipalities.map(
			(mun) =>
				({
					municipality: mun,
					count: sitios.filter((s) => s.municipality === mun).length
				}) as ChartDataItem
		);
	})(),
	sitiosByNeedLevel: (() => {
		// Note: needScore will be calculated dynamically using the recommendation engine
		// For now, return empty data structure
		const needLevels = ['Critical', 'High', 'Medium', 'Low'];
		return needLevels.map(
			(level) =>
				({
					category: level,
					count: 0
				}) as ChartDataItem
		);
	})()
};

// ===== HELPER FUNCTIONS =====

export function getSitioByName(sitioName: string): SitioProfile | undefined {
	return sitios.find((s) => s.sitioName === sitioName);
}

export interface SitioFilters {
	municipality?: string;
	barangay?: string;
	search?: string;
	needLevel?: string;
	gida?: boolean;
}

export function filterSitios(filters: SitioFilters): SitioProfile[] {
	return sitios.filter((sitio) => {
		if (filters.municipality && sitio.municipality !== filters.municipality) return false;
		if (filters.barangay && sitio.barangay !== filters.barangay) return false;
		if (filters.gida !== undefined && sitio.sitioClassification.gida !== filters.gida) return false;

		// Note: needLevel filtering will be implemented once need score calculation is integrated
		// For now, skip needLevel filtering

		if (filters.search) {
			const searchTerm = filters.search.toLowerCase();
			const searchableText =
				`${sitio.sitioName} ${sitio.barangay} ${sitio.municipality}`.toLowerCase();
			if (!searchableText.includes(searchTerm)) return false;
		}
		return true;
	});
}
