/**
 * IndexedDB-based image storage service
 * Manages binary image data separately from project metadata
 * Designed for easy migration to server-based storage
 */

const DB_NAME = 'project-images';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB database
 */
export async function initImageDatabase(): Promise<IDBDatabase> {
	if (dbInstance) return dbInstance;

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			dbInstance = request.result;
			resolve(dbInstance);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create object store for images if it doesn't exist
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
	});
}

/**
 * Save image binary to IndexedDB
 */
export async function saveImage(blob: Blob, id: string): Promise<void> {
	const db = await initImageDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(blob, id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get image binary from IndexedDB
 */
export async function getImage(id: string): Promise<Blob | null> {
	const db = await initImageDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(id);

		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Delete image from IndexedDB
 */
export async function deleteImage(id: string): Promise<void> {
	const db = await initImageDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete(id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Generate thumbnail from image file
 */
export async function generateThumbnail(file: File, maxSize: number = 200): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			reject(new Error('Canvas context not available'));
			return;
		}

		img.onload = () => {
			// Calculate thumbnail dimensions (square crop)
			const size = Math.min(img.width, img.height);
			const offsetX = (img.width - size) / 2;
			const offsetY = (img.height - size) / 2;

			canvas.width = maxSize;
			canvas.height = maxSize;

			// Draw cropped and resized image
			ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, maxSize, maxSize);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Failed to generate thumbnail'));
					}
				},
				'image/jpeg',
				0.8
			);
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = URL.createObjectURL(file);
	});
}

/**
 * Compress image file
 */
export async function compressImage(
	file: File,
	options: {
		maxDimension?: number;
		quality?: number;
	} = {}
): Promise<Blob> {
	const { maxDimension = 1920, quality = 0.85 } = options;

	return new Promise((resolve, reject) => {
		const img = new Image();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			reject(new Error('Canvas context not available'));
			return;
		}

		img.onload = () => {
			let { width, height } = img;

			// Calculate new dimensions if image exceeds max
			if (width > maxDimension || height > maxDimension) {
				if (width > height) {
					height = (height / width) * maxDimension;
					width = maxDimension;
				} else {
					width = (width / height) * maxDimension;
					height = maxDimension;
				}
			}

			canvas.width = width;
			canvas.height = height;

			// Draw resized image
			ctx.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Failed to compress image'));
					}
				},
				file.type,
				quality
			);
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = URL.createObjectURL(file);
	});
}

/**
 * Get storage usage information
 */
export async function getStorageUsage(): Promise<{
	usage: number;
	quota: number;
	percentUsed: number;
}> {
	if ('storage' in navigator && 'estimate' in navigator.storage) {
		const estimate = await navigator.storage.estimate();
		const usage = estimate.usage || 0;
		const quota = estimate.quota || 0;
		const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

		return { usage, quota, percentUsed };
	}

	// Fallback if storage API not available
	return { usage: 0, quota: 0, percentUsed: 0 };
}

/**
 * Placeholder for future server migration
 * Uploads an image to the server and returns the URL
 */
// export async function migrateToServer(photoDoc: PhotoDocumentation): Promise<string> {
// This is a placeholder for future implementation
// When ready to migrate to server:
// 1. Get image blob from IndexedDB
// 2. Upload to server via FormData
// 3. Return server URL
// 4. Update photoDoc.storage_type and storage_ref
// 5. Delete from IndexedDB

// 	throw new Error('Server migration not yet implemented');
// }

/**
 * Clean up orphaned images (images in IndexedDB but not referenced in any project)
 */
export async function cleanupOrphanedImages(referencedIds: string[]): Promise<number> {
	const db = await initImageDatabase();
	let deletedCount = 0;

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.openCursor();

		request.onsuccess = (event) => {
			const cursor = (event.target as IDBRequest).result;
			if (cursor) {
				const id = cursor.key as string;
				// Delete if not in referenced IDs
				if (!referencedIds.includes(id)) {
					cursor.delete();
					deletedCount++;
				}
				cursor.continue();
			} else {
				resolve(deletedCount);
			}
		};

		request.onerror = () => reject(request.error);
	});
}
