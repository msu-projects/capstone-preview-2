/**
 * Configuration Storage Layer
 *
 * Provides localStorage persistence for system configuration with:
 * - Override mechanism that merges with code defaults
 * - Per-section reset functionality
 * - Audit logging for all configuration changes
 */

import { logAuditAction } from './audit';

// ===== STORAGE KEYS =====

export const CONFIG_STORAGE_KEYS = {
	LOCATIONS: 'sccdp_config_locations'
} as const;

export type ConfigStorageKey = (typeof CONFIG_STORAGE_KEYS)[keyof typeof CONFIG_STORAGE_KEYS];

// ===== CONFIG SECTION TYPES =====

export type ConfigSection = 'locations';

export const CONFIG_SECTION_LABELS: Record<ConfigSection, string> = {
	locations: 'Municipalities & Barangays'
};

export const CONFIG_SECTION_DESCRIPTIONS: Record<ConfigSection, string> = {
	locations: 'Manage the list of municipalities and their barangays in South Cotabato.'
};

// ===== GENERIC CONFIG STORAGE FUNCTIONS =====

/**
 * Load configuration override from localStorage
 */
export function loadConfigOverride<T>(key: ConfigStorageKey): T | null {
	if (typeof window === 'undefined') return null;

	try {
		const json = localStorage.getItem(key);
		return json ? JSON.parse(json) : null;
	} catch (error) {
		console.error(`Failed to load config override for ${key}:`, error);
		return null;
	}
}

/**
 * Save configuration override to localStorage
 */
export function saveConfigOverride<T>(
	key: ConfigStorageKey,
	data: T,
	section: ConfigSection,
	changeDescription?: string
): boolean {
	if (typeof window === 'undefined') return false;

	try {
		localStorage.setItem(key, JSON.stringify(data));

		// Log audit action
		logAuditAction(
			'update',
			'system',
			undefined,
			CONFIG_SECTION_LABELS[section],
			changeDescription || `Updated ${CONFIG_SECTION_LABELS[section]} configuration`
		);

		return true;
	} catch (error) {
		console.error(`Failed to save config override for ${key}:`, error);
		return false;
	}
}

/**
 * Reset configuration to defaults (remove localStorage override)
 */
export function resetConfigToDefault(key: ConfigStorageKey, section: ConfigSection): boolean {
	if (typeof window === 'undefined') return false;

	try {
		localStorage.removeItem(key);

		// Log audit action
		logAuditAction(
			'update',
			'system',
			undefined,
			CONFIG_SECTION_LABELS[section],
			`Reset ${CONFIG_SECTION_LABELS[section]} to default values`
		);

		return true;
	} catch (error) {
		console.error(`Failed to reset config for ${key}:`, error);
		return false;
	}
}

/**
 * Check if a configuration has custom overrides
 */
export function hasConfigOverride(key: ConfigStorageKey): boolean {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem(key) !== null;
}

/**
 * Get configuration with overrides merged with defaults
 * For simple arrays: override replaces default entirely
 */
export function getConfigWithOverrides<T>(key: ConfigStorageKey, defaults: T): T {
	const override = loadConfigOverride<T>(key);
	return override !== null ? override : defaults;
}

// ===== LOCATIONS CONFIG =====

export interface LocationsConfig {
	municipalities: Array<{
		name: string;
		barangays: string[];
	}>;
}
