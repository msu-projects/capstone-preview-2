import type { SitioProfile } from './sitio-profile.js';

// ==========================================
// MULTI-YEAR DATA STRUCTURES
// ==========================================

/**
 * SitioRecord - Wrapper type for multi-year data storage
 * Contains static sitio information and yearly data snapshots
 */
export interface SitioRecord {
	/** Unique identifier */
	id: number;

	// Static information (doesn't change year to year)
	/** Name of the municipality */
	municipality: string;
	/** Name of the barangay */
	barangay: string;
	/** Name of the specific Sitio */
	sitioName: string;
	/** Unique coding/ID assigned to the Sitio */
	coding: string;
	/** Geographical Latitude */
	latitude: number;
	/** Geographical Longitude */
	longitude: number;

	/** Classification flags (generally static) */
	sitioClassification: {
		/** Geographically Isolated and Disadvantaged Area */
		gida: boolean;
		/** Predominantly Indigenous People community */
		indigenous: boolean;
		/** Currently or recently affected by armed conflict */
		conflict: boolean;
	};

	/**
	 * Year-based data storage
	 * Key: Year as string (e.g., "2021", "2022")
	 * Value: Complete SitioProfile for that year
	 */
	yearlyData: {
		[year: string]: SitioProfile;
	};

	/** Sorted array of available years (e.g., [2021, 2022, 2023, 2024]) */
	availableYears: number[];

	/** ISO timestamp when record was created */
	createdAt: string;

	/** ISO timestamp when record was last updated */
	updatedAt: string;
}

/**
 * LocalStorage Schema
 * Defines the structure of data stored in localStorage
 * Key: "capstone_sitio_data"
 */
export interface LocalStorageSchema {
	/** Array of all sitio records */
	sitios: SitioRecord[];

	/** Metadata about the stored data */
	metadata: {
		/** Schema version for future migrations */
		version: string;
		/** ISO timestamp of last update */
		lastUpdated: string;
		/** Total number of sitios in storage */
		totalSitios: number;
		/** All unique years across all sitios */
		availableYears: number[];
	};
}
