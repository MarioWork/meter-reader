import { Link, useLoaderData } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { LoaderDataUtil } from '@app-types/utility';
import HistoryPager from './components/HistoryPager';
import ReadingHistory from './components/ReadingHistory';
import { loader } from './homeLoader';

const NEW_READING_LINK_CLASSES = `
  self-stretch rounded-md bg-blue-700 px-6 py-4 text-center text-xl font-semibold text-white
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700
`;

function Home() {
  const { readingsResponse } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">History</h1>
      <Link to={READING_ROUTES_PATHS.NEW} className={NEW_READING_LINK_CLASSES}>
        New reading
      </Link>
      <ReadingHistory readings={readingsResponse.data} />
      <HistoryPager currentPage={readingsResponse.currentPage} totalResultNumber={readingsResponse.totalResultNumber} />
    </main>
  );
}

export default Home;
