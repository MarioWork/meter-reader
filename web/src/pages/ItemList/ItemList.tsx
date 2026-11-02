import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import AddItemForm from './components/AddItemForm';
import { loader } from './itemListLoader';

function ItemList() {
  const { itemsResponse } = useLoaderData<LoaderDataUtil<typeof loader>>();

  const hasItems = itemsResponse.data.length > 0;

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Items</h1>
      <AddItemForm />
      {hasItems ? (
        <ul className="list-disc pl-6">
          {itemsResponse.data.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ) : (
        <p>No items yet</p>
      )}
    </main>
  );
}

export default ItemList;
