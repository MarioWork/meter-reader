import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import NewReadingForm from './components/NewReadingForm';
import { loader } from './newReadingLoader';

function NewReading() {
  const { lastReading } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">New reading</h1>
      <NewReadingForm lastReading={lastReading} />
    </main>
  );
}

export default NewReading;
