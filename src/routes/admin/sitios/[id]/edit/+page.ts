import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	const year = url.searchParams.get('year') || 'latest';

	return {
		id: params.id,
		year
	};
};
