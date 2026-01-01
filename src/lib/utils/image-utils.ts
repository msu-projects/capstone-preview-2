/**
 * Image processing and validation utilities
 */

import { nanoid } from 'nanoid';

const ACCEPTED_IMAGE_TYPES = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/webp',
	'image/heic',
	'image/heif'
];

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ImageValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validate image file type and size
 */
export function validateImageFile(
	file: File,
	maxSize: number = DEFAULT_MAX_FILE_SIZE
): ImageValidationResult {
	// Check file type
	if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: `Invalid file type. Accepted formats: JPEG, PNG, WebP, HEIC`
		};
	}

	// Check file size
	if (file.size > maxSize) {
		return {
			valid: false,
			error: `File too large. Maximum size: ${formatFileSize(maxSize)}`
		};
	}

	// Check if file is empty
	if (file.size === 0) {
		return {
			valid: false,
			error: 'File is empty'
		};
	}

	return { valid: true };
}

/**
 * Generate unique ID for photos
 */
export function generateUniqueId(): string {
	return nanoid(12);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Read image dimensions from file
 */
export async function readImageDimensions(
	file: File
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			resolve({
				width: img.width,
				height: img.height
			});
			URL.revokeObjectURL(img.src);
		};

		img.onerror = () => {
			reject(new Error('Failed to load image'));
			URL.revokeObjectURL(img.src);
		};

		img.src = URL.createObjectURL(file);
	});
}

/**
 * Create preview URL from blob
 */
export function createImagePreviewURL(blob: Blob): string {
	return URL.createObjectURL(blob);
}

/**
 * Revoke preview URL to free memory
 */
export function revokeImagePreviewURL(url: string): void {
	URL.revokeObjectURL(url);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
	const parts = filename.split('.');
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
	// Remove special characters and limit length
	return filename
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.substring(0, 100);
}

/**
 * Check if browser supports required APIs
 */
export function checkBrowserSupport(): {
	supported: boolean;
	missing: string[];
} {
	const missing: string[] = [];

	if (!('indexedDB' in window)) {
		missing.push('IndexedDB');
	}

	if (!('FileReader' in window)) {
		missing.push('FileReader');
	}

	if (!('canvas' in document.createElement('canvas'))) {
		missing.push('Canvas API');
	}

	return {
		supported: missing.length === 0,
		missing
	};
}
