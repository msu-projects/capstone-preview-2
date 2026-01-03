/**
 * Project Storage Utilities
 * Handles CRUD operations for implemented projects in sitios
 */

import type { Project, ProjectWithSitios, SitioRecord } from '$lib/types';
import { logAuditAction } from './audit';
import { loadSitios } from './storage';
import { createStorageRepository } from './storage-repository';

const PROJECTS_STORAGE_KEY = 'sccdp_projects';

// Create the repository instance
const projectRepository = createStorageRepository<Project>(PROJECTS_STORAGE_KEY, {
	maxSize: 10 * 1024 * 1024 // 10MB to accommodate images
});

/**
 * Load all projects from localStorage
 */
export function loadProjects(): Project[] {
	return projectRepository.load();
}

/**
 * Save all projects to localStorage
 */
export function saveProjects(projects: Project[]): boolean {
	return projectRepository.save(projects);
}

/**
 * Get a project by ID
 */
export function getProjectById(id: number): Project | null {
	return projectRepository.getById(id);
}

/**
 * Add a new project
 */
export function addProject(
	projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Project | null {
	const now = new Date().toISOString();
	const newProject: Project = {
		...projectData,
		id: projectRepository.getNextId(),
		createdAt: now,
		updatedAt: now
	};

	const success = projectRepository.add(newProject);

	if (success) {
		logAuditAction(
			'create',
			'project',
			newProject.id,
			newProject.title,
			`Created project "${newProject.title}" with ${newProject.sitioIds.length} sitios involved`
		);
		return newProject;
	}

	return null;
}

/**
 * Update an existing project
 */
export function updateProject(
	id: number,
	updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): boolean {
	const existingProject = projectRepository.getById(id);
	if (!existingProject) {
		console.error(`Project with id ${id} not found`);
		return false;
	}

	const updatedProject = {
		...updates,
		updatedAt: new Date().toISOString()
	};

	const success = projectRepository.update(id, updatedProject);

	if (success) {
		logAuditAction(
			'update',
			'project',
			id,
			existingProject.title,
			`Updated project "${updates.title || existingProject.title}"`
		);
	}

	return success;
}

/**
 * Delete a project by ID
 */
export function deleteProject(id: number): boolean {
	const project = projectRepository.getById(id);
	if (!project) {
		console.error(`Project with id ${id} not found`);
		return false;
	}

	const success = projectRepository.delete(id);

	if (success) {
		logAuditAction('delete', 'project', id, project.title, `Deleted project "${project.title}"`);
	}

	return success;
}

/**
 * Get all projects associated with a specific sitio
 */
export function getProjectsBySitioId(sitioId: number): Project[] {
	const projects = loadProjects();
	return projects.filter((project) => project.sitioIds.includes(sitioId));
}

/**
 * Get project with resolved sitio names
 */
export function getProjectWithSitios(project: Project): ProjectWithSitios {
	const sitios = loadSitios();
	const sitioMap = new Map<number, SitioRecord>();

	sitios.forEach((sitio) => {
		sitioMap.set(sitio.id, sitio);
	});

	const sitioNames = project.sitioIds
		.map((id) => {
			const sitio = sitioMap.get(id);
			return sitio ? `${sitio.sitioName}, ${sitio.barangay}` : `Unknown Sitio (ID: ${id})`;
		})
		.filter(Boolean);

	return {
		...project,
		sitioNames
	};
}

/**
 * Get all projects with resolved sitio names
 */
export function loadProjectsWithSitios(): ProjectWithSitios[] {
	const projects = loadProjects();
	return projects.map(getProjectWithSitios);
}

/**
 * Get projects by sitio ID with resolved sitio names
 */
export function getProjectsWithSitiosBySitioId(sitioId: number): ProjectWithSitios[] {
	const projects = getProjectsBySitioId(sitioId);
	return projects.map(getProjectWithSitios);
}

/**
 * Get the next available project ID
 */
export function getNextProjectId(): number {
	return projectRepository.getNextId();
}

/**
 * Get storage size information
 */
export function getProjectsStorageSize(): number {
	return projectRepository.getStorageSize();
}

/**
 * Check if projects storage is near limit
 */
export function isProjectsStorageNearLimit(): boolean {
	return projectRepository.isNearLimit();
}

/**
 * Clear all projects (use with caution)
 */
export function clearProjects(): void {
	projectRepository.clear();
	logAuditAction('delete', 'project', undefined, undefined, 'Cleared all projects');
}

/**
 * Check if a sitio has any associated projects
 * This is used to prevent sitio deletion when projects exist
 */
export function sitioHasProjects(sitioId: number): boolean {
	const projects = loadProjects();
	return projects.some((project) => project.sitioIds.includes(sitioId));
}

/**
 * Get count of projects for a sitio
 */
export function getProjectCountForSitio(sitioId: number): number {
	return getProjectsBySitioId(sitioId).length;
}
