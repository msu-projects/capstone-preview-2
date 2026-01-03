// ==========================================
// PROJECT TYPES
// ==========================================

/**
 * Represents an implemented project in sitios
 */
export interface Project {
	/** Unique identifier for the project */
	id: number;
	/** Project title */
	title: string;
	/** Detailed project description */
	description: string;
	/** Project location coordinates */
	location: {
		latitude: number;
		longitude: number;
	};
	/** List of sitio IDs that are involved in this project */
	sitioIds: number[];
	/** Total project cost in PHP */
	cost: number;
	/** ISO 8601 date when the project was implemented */
	projectDate: string;
	/** Base64 encoded images (max 5, compressed) */
	images: string[];
	/** ISO 8601 timestamp when project was created */
	createdAt: string;
	/** ISO 8601 timestamp when project was last updated */
	updatedAt: string;
}

/**
 * Project form data for creating/editing projects
 */
export interface ProjectFormData {
	title: string;
	description: string;
	location: {
		latitude: number;
		longitude: number;
	};
	sitioIds: number[];
	cost: number;
	/** ISO 8601 date when the project was implemented */
	projectDate: string;
	images: string[];
}

/**
 * Project with resolved sitio names for display
 */
export interface ProjectWithSitios extends Project {
	sitioNames: string[];
}
