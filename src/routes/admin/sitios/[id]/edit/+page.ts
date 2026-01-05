import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
  const year = url.searchParams.get('year') || 'latest';
  const pendingChangeId = url.searchParams.get('pendingChangeId') || null;

  return {
    id: params.id,
    year,
    pendingChangeId
  };
};
