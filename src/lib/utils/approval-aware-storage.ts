import type { Project, SitioRecord } from '$lib/types';
import { hasPendingChangesForResource, submitForReview } from './pending-changes-storage';
import {
  addProject as directAddProject,
  updateProject as directUpdateProject,
  loadProjects
} from './project-storage';
import {
  addSitio as directAddSitio,
  updateSitio as directUpdateSitio,
  loadSitios
} from './storage';

/**
 * Submit a sitio update for review through the approval workflow.
 * @param sitioId - The ID of the sitio to update
 * @param proposedData - The proposed changes to the sitio
 * @param comment - Optional comment explaining the changes
 * @returns Object with success status and pending change ID or error
 */
export function submitSitioForReview(
  sitioId: number,
  proposedData: Partial<SitioRecord>,
  comment?: string
): { success: boolean; pendingChangeId?: string; error?: string } {
  try {
    const sitios = loadSitios();
    const currentSitio = sitios.find((s) => s.id === sitioId);

    if (!currentSitio) {
      return { success: false, error: `Sitio with ID ${sitioId} not found` };
    }

    const pendingChange = submitForReview({
      resourceType: 'sitio',
      resourceId: sitioId,
      resourceName: currentSitio.sitioName,
      originalData: currentSitio,
      proposedData,
      submitterComment: comment
    });

    if (!pendingChange) {
      return { success: false, error: 'Failed to submit change for review' };
    }

    return { success: true, pendingChangeId: pendingChange.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Submit a project update or creation for review through the approval workflow.
 * @param projectId - The ID of the project to update, or null for a new project
 * @param proposedData - The proposed project data
 * @param comment - Optional comment explaining the changes
 * @returns Object with success status and pending change ID or error
 */
export function submitProjectForReview(
  projectId: number | null,
  proposedData: Partial<Project>,
  comment?: string
): { success: boolean; pendingChangeId?: string; error?: string } {
  try {
    let originalData: Partial<Project> | Record<string, never> = {};
    let resourceName = (proposedData as Project).title || 'New Project';

    if (projectId !== null) {
      const projects = loadProjects();
      const currentProject = projects.find((p) => p.id === projectId);

      if (!currentProject) {
        return { success: false, error: `Project with ID ${projectId} not found` };
      }

      originalData = currentProject;
      resourceName = currentProject.title;
    }

    const pendingChange = submitForReview({
      resourceType: 'project',
      resourceId: projectId ?? 0,
      resourceName,
      originalData,
      proposedData,
      submitterComment: comment
    });

    if (!pendingChange) {
      return { success: false, error: 'Failed to submit change for review' };
    }

    return { success: true, pendingChangeId: pendingChange.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Direct update function for use by reviewers when approving sitio changes.
 * @param sitioId - The ID of the sitio to update (0 for new sitios)
 * @param proposedData - The approved changes to apply
 * @returns True if the update was successful
 */
export function applySitioChange(sitioId: number, proposedData: Partial<SitioRecord>): boolean {
  if (sitioId === 0) {
    // New sitio - directly add it
    return directAddSitio(proposedData as SitioRecord);
  }
  return directUpdateSitio(sitioId, proposedData);
}

/**
 * Direct update/create function for use by reviewers when approving project changes.
 * @param projectId - The ID of the project to update, or null for a new project
 * @param proposedData - The approved project data to apply
 * @returns True if the operation was successful
 */
export function applyProjectChange(
  projectId: number | null,
  proposedData: Project | Partial<Project>
): boolean {
  if (projectId === null) {
    // New project - ensure it has all required fields
    const result = directAddProject(
      proposedData as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
    );
    return result !== null;
  }

  return directUpdateProject(projectId, proposedData);
}

/**
 * Helper to get a sitio by ID.
 * @param id - The sitio ID to look up
 * @returns The sitio record or null if not found
 */
export function getSitioById(id: number): SitioRecord | null {
  const sitios = loadSitios();
  return sitios.find((s) => s.id === id) ?? null;
}

/**
 * Helper to get a project by ID.
 * @param id - The project ID to look up
 * @returns The project or null if not found
 */
export function getProjectById(id: number): Project | null {
  const projects = loadProjects();
  return projects.find((p) => p.id === id) ?? null;
}

/**
 * Check if there are pending changes for a resource.
 * @param resourceType - The type of resource ('sitio' or 'project')
 * @param resourceId - The ID of the resource
 * @returns True if there are pending changes for this resource
 */
export function checkPendingChanges(
  resourceType: 'sitio' | 'project',
  resourceId: number
): boolean {
  return hasPendingChangesForResource(resourceType, resourceId);
}
