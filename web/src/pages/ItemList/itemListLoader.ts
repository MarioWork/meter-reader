import type { LoaderFunctionArgs } from 'react-router';
import itemService, { DEFAULT_ITEM_SORT_DIRECTION, DEFAULT_ITEM_SORT_FIELD } from '@services/itemService/itemService';
import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE, PAGE_SIZE } from '@app-types/utility';

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;

  const fields = {
    pagination: { page: searchParams.get(ApiUrlParamsUtil.page) ?? DEFAULT_FIRST_PAGE, size: PAGE_SIZE },
    sortingField: DEFAULT_ITEM_SORT_FIELD,
    direction: DEFAULT_ITEM_SORT_DIRECTION,
  };

  const itemsResponse = await itemService.getItems(fields);

  return { itemsResponse };
}
