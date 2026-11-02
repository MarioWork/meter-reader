import { useLoaderData } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { LoaderDataUtil } from '@app-types/utility';
import TextLink from '@components/TextLink';
import HistoryPager from './components/HistoryPager';
import ReadingHistory from './components/ReadingHistory';
import { loader } from './homeLoader';

function Home() {
  const { readingsResponse } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">History</h1>
      <TextLink to={READING_ROUTES_PATHS.NEW} variant="primary">
        New reading
      </TextLink>
      <ReadingHistory readings={readingsResponse.data} />
      <HistoryPager currentPage={readingsResponse.currentPage} totalResultNumber={readingsResponse.totalResultNumber} />
    </main>
  );
}

export default Home;
