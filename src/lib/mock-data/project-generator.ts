/**
 * Project Generator
 * Generates realistic mock data for development projects
 */

import type { Project, SitioRecord } from '$lib/types';
import { loadProjects, saveProjects } from '$lib/utils/project-storage';
import { SeededRandom } from './seeded-random';
import { PROJECT_TYPES } from './sitio-name-data';

// Storage keys
export const PROJECTS_INITIALIZED_KEY = 'sccdp_projects_initialized';

/**
 * Check if project mock data has been initialized
 */
export function isProjectsInitialized(): boolean {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem(PROJECTS_INITIALIZED_KEY) === 'true';
}

/**
 * Mark projects as initialized
 */
function markProjectsInitialized(): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(PROJECTS_INITIALIZED_KEY, 'true');
}

/**
 * Generate mock projects based on existing sitios
 */
export function generateProjects(sitios: SitioRecord[], seed: number = 42): Project[] {
	const rng = new SeededRandom(seed);
	const projects: Project[] = [];

	// Generate 15-25 projects
	const projectCount = rng.nextInt(15, 25);

	// Group sitios by municipality for realistic project groupings
	const sitiosByMunicipality = new Map<string, SitioRecord[]>();
	for (const sitio of sitios) {
		const existing = sitiosByMunicipality.get(sitio.municipality) || [];
		existing.push(sitio);
		sitiosByMunicipality.set(sitio.municipality, existing);
	}

	const municipalities = Array.from(sitiosByMunicipality.keys());

	for (let i = 1; i <= projectCount; i++) {
		// Pick a project type
		const projectType = rng.pick(PROJECT_TYPES);

		// Pick a municipality and get its sitios
		const municipality = rng.pick(municipalities);
		const municipalitySitios = sitiosByMunicipality.get(municipality) || [];

		if (municipalitySitios.length === 0) continue;

		// Pick 1-4 sitios for this project (most projects serve 1-2 sitios)
		const sitioCountWeights = [0.45, 0.35, 0.15, 0.05];
		const sitioCount = rng.pickWeighted([1, 2, 3, 4], sitioCountWeights);
		const selectedSitios = rng.shuffle(municipalitySitios).slice(0, sitioCount);

		// Generate title
		const title = rng.pick(projectType.titles);

		// Generate description with placeholders filled in
		let description = rng.pick(projectType.descriptionTemplates);
		const totalHouseholds = selectedSitios.reduce((sum, s) => {
			const latestYear = s.availableYears[s.availableYears.length - 1];
			return sum + (s.yearlyData[String(latestYear)]?.totalHouseholds || 0);
		}, 0);
		const totalBeneficiaries = selectedSitios.reduce((sum, s) => {
			const latestYear = s.availableYears[s.availableYears.length - 1];
			return sum + (s.yearlyData[String(latestYear)]?.totalPopulation || 0);
		}, 0);

		description = description
			.replace('{sitioCount}', String(sitioCount))
			.replace('{municipality}', municipality)
			.replace('{households}', String(totalHouseholds))
			.replace('{beneficiaries}', String(totalBeneficiaries))
			.replace('{capacity}', String(rng.nextInt(5, 20) * 1000))
			.replace('{length}', String(rng.nextFloat(0.3, 3.5).toFixed(1)))
			.replace('{units}', String(rng.nextInt(5, 30)));

		// Calculate cost based on type and scale
		const baseCost = rng.nextInt(projectType.costRange.min, projectType.costRange.max);
		// Adjust cost based on number of sitios
		const cost = Math.round(baseCost * (1 + (sitioCount - 1) * 0.2));

		// Calculate location as average of sitio coordinates
		const avgLat = selectedSitios.reduce((sum, s) => sum + s.latitude, 0) / selectedSitios.length;
		const avgLng = selectedSitios.reduce((sum, s) => sum + s.longitude, 0) / selectedSitios.length;

		// Generate project date (between 2020 and 2025)
		const year = rng.nextInt(2020, 2025);
		const month = rng.nextInt(1, 12);
		const day = rng.nextInt(1, 28);
		const projectDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

		// Generate timestamps
		const createdDate = new Date(year, month - 1, day + rng.nextInt(1, 30));
		const createdAt = createdDate.toISOString();
		const updatedDate = new Date(createdDate.getTime() + rng.nextInt(0, 30 * 24 * 60 * 60 * 1000));
		const updatedAt = updatedDate.toISOString();

		const project: Project = {
			id: i,
			title: `${title} - ${municipality}`,
			description,
			location: {
				latitude: Number(avgLat.toFixed(6)),
				longitude: Number(avgLng.toFixed(6))
			},
			sitioIds: selectedSitios.map((s) => s.id),
			cost,
			projectDate,
			images: [], // No mock images - would be too large
			createdAt,
			updatedAt
		};

		projects.push(project);
	}

	return projects;
}

/**
 * Initialize project mock data if needed
 */
export function initializeProjectsIfNeeded(sitios: SitioRecord[]): Project[] {
	if (typeof window === 'undefined') {
		// Server-side: generate fresh data
		return generateProjects(sitios, 42);
	}

	// Check if already initialized
	if (isProjectsInitialized()) {
		const projects = loadProjects();
		if (projects.length > 0) {
			return projects;
		}
	}

	// Generate and save mock data
	const projects = generateProjects(sitios, 42);
	saveProjects(projects);
	markProjectsInitialized();

	return projects;
}

/**
 * Reset project mock data
 */
export function resetProjectMockData(sitios: SitioRecord[]): Project[] {
	if (typeof window === 'undefined') {
		return [];
	}

	// Clear initialization flag
	localStorage.removeItem(PROJECTS_INITIALIZED_KEY);

	// Regenerate with new seed
	const seed = Date.now() % 1000000;
	const projects = generateProjects(sitios, seed);
	saveProjects(projects);
	markProjectsInitialized();

	return projects;
}

/**
 * Get statistics for projects
 */
export function getProjectStats(projects: Project[]): {
	totalProjects: number;
	totalInvestment: number;
	sitiosWithProjects: number;
	averageProjectCost: number;
	projectsByCategory: { category: string; count: number; investment: number }[];
} {
	const totalProjects = projects.length;
	const totalInvestment = projects.reduce((sum, p) => sum + p.cost, 0);
	const sitiosWithProjects = new Set(projects.flatMap((p) => p.sitioIds)).size;
	const averageProjectCost = totalProjects > 0 ? Math.round(totalInvestment / totalProjects) : 0;

	// Group by category (extract from title)
	const categoryMap = new Map<string, { count: number; investment: number }>();
	for (const project of projects) {
		// Try to match with project type
		let category = 'Other';
		for (const projectType of PROJECT_TYPES) {
			if (projectType.titles.some((t) => project.title.includes(t.split(' ')[0]))) {
				category = projectType.category;
				break;
			}
		}

		const existing = categoryMap.get(category) || { count: 0, investment: 0 };
		existing.count++;
		existing.investment += project.cost;
		categoryMap.set(category, existing);
	}

	const projectsByCategory = Array.from(categoryMap.entries())
		.map(([category, data]) => ({
			category,
			count: data.count,
			investment: data.investment
		}))
		.sort((a, b) => b.count - a.count);

	return {
		totalProjects,
		totalInvestment,
		sitiosWithProjects,
		averageProjectCost,
		projectsByCategory
	};
}
