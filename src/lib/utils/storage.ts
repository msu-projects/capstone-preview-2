import type { SitioRecord } from '$lib/types';
import { calculateChanges, logAuditAction } from './audit';

const SITIOS_STORAGE_KEY = 'sccdp_sitios';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

// ===== SITIOS STORAGE FUNCTIONS =====

/**
 * Save sitios to LocalStorage
 * @param sitios Array of SitioRecord objects to save
 * @returns true if successful, false otherwise
 */
export function saveSitios(sitios: SitioRecord[]): boolean {
	try {
		const json = JSON.stringify(sitios);
		if (json.length > MAX_STORAGE_SIZE) {
			throw new Error('Data exceeds LocalStorage limit (5MB)');
		}
		localStorage.setItem(SITIOS_STORAGE_KEY, json);
		return true;
	} catch (error) {
		console.error('Failed to save sitios:', error);
		return false;
	}
}

/**
 * Load sitios from LocalStorage
 * @returns Array of SitioRecord objects, empty array if none found or on error
 */
export function loadSitios(): SitioRecord[] {
	try {
		const json = localStorage.getItem(SITIOS_STORAGE_KEY);
		return json ? JSON.parse(json) : [];
	} catch (error) {
		console.error('Failed to load sitios:', error);
		return [];
	}
}

/**
 * Clear all sitios from LocalStorage
 */
export function clearSitios(): void {
	localStorage.removeItem(SITIOS_STORAGE_KEY);
}

/**
 * Get current storage size in bytes for sitios
 * @returns Size in bytes
 */
export function getSitiosStorageSize(): number {
	const json = localStorage.getItem(SITIOS_STORAGE_KEY);
	return json ? json.length : 0;
}

/**
 * Get storage usage percentage for sitios
 * @returns Percentage (0-100)
 */
export function getSitiosStorageUsagePercentage(): number {
	const size = getSitiosStorageSize();
	return (size / MAX_STORAGE_SIZE) * 100;
}

/**
 * Check if sitios storage is approaching limit (80%+)
 * @returns true if storage is at or above 80% capacity
 */
export function isSitiosStorageNearLimit(): boolean {
	return getSitiosStorageUsagePercentage() >= 80;
}

/**
 * Add a new sitio to storage
 * @param sitio SitioRecord object to add
 * @returns true if successful, false otherwise
 */
export function addSitio(sitio: SitioRecord): boolean {
	const sitios = loadSitios();
	sitios.push(sitio);
	const success = saveSitios(sitios);
	if (success) {
		logAuditAction(
			'create',
			'sitio',
			sitio.coding,
			sitio.sitioName,
			`Created sitio in ${sitio.barangay}, ${sitio.municipality}`
		);
	}
	return success;
}

/**
 * Update an existing sitio in storage
 * @param id Sitio id to update
 * @param updates Partial sitio data to update
 * @returns true if successful, false otherwise
 */
export function updateSitio(id: number, updates: Partial<SitioRecord>): boolean {
	const sitios = loadSitios();
	const index = sitios.findIndex((s) => s.id === id);

	if (index === -1) {
		console.error(`Sitio with coding ${id} not found`);
		return false;
	}

	const oldSitio = sitios[index];
	const sitioName = updates.sitioName || oldSitio.sitioName;

	// Calculate what fields changed
	const changes = calculateChanges(oldSitio, updates);

	sitios[index] = {
		...oldSitio,
		...updates
	};

	const success = saveSitios(sitios);
	if (success) {
		const changedFields = changes.map((c) => c.field).join(', ');
		logAuditAction(
			'update',
			'sitio',
			id,
			sitioName,
			changedFields ? `Updated: ${changedFields}` : 'Updated sitio information',
			changes
		);
	}
	return success;
}

/**
 * Delete a sitio from storage
 * @param id Sitio coding to delete
 * @returns true if successful, false otherwise
 */
export function deleteSitio(id: number): boolean {
	const sitios = loadSitios();
	const sitioToDelete = sitios.find((s) => s.id === id);
	const filteredSitios = sitios.filter((s) => s.id !== id);

	if (filteredSitios.length === sitios.length) {
		console.error(`Sitio with coding ${id} not found`);
		return false;
	}

	const success = saveSitios(filteredSitios);
	if (success && sitioToDelete) {
		logAuditAction(
			'delete',
			'sitio',
			id,
			sitioToDelete.sitioName,
			`Deleted sitio from ${sitioToDelete.municipality}`
		);
	}
	return success;
}

/**
 * Get a single sitio by coding
 * @param coding Sitio coding
 * @returns SitioRecord object or null if not found
 */
export function getSitioByCoding(coding: string): SitioRecord | null {
	const sitios = loadSitios();
	return sitios.find((s) => s.coding === coding) || null;
}
