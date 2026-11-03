import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { Card, CardContent } from '@components/ui/card';
import NewReadingForm from './components/NewReadingForm';
import { loader } from './newReadingLoader';

function NewReading() {
  const { lastReading, emailDefaults } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">New reading</h1>
      <Card>
        <CardContent>
          <NewReadingForm lastReading={lastReading} emailDefaults={emailDefaults} />
        </CardContent>
      </Card>
    </main>
  );
}

export default NewReading;
