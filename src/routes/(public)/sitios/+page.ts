import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const municipality = url.searchParams.get('municipality') || 'all';
	const barangay = url.searchParams.get('barangay') || 'all';
	const tab = url.searchParams.get('tab') || 'overview';

	return {
		municipality,
		barangay,
		tab
	};
};
