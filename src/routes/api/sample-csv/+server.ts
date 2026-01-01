import { readFileSync } from 'fs';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Read the sample CSV file from the sample directory
		const filePath = join(process.cwd(), 'sample', 'sitio-import-template.csv');
		const fileContent = readFileSync(filePath, 'utf-8');

		// Return the file with proper headers for download
		return new Response(fileContent, {
			status: 200,
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': 'attachment; filename="sitio-import-template.csv"',
				'Cache-Control': 'no-cache'
			}
		});
	} catch (error) {
		console.error('Error reading sample CSV file:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to load sample CSV file',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
};
