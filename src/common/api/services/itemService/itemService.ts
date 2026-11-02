import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { ItemApiModel } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateItem } from './itemService.type';

const BASE_ITEMS_URL = '/items';

export default {
  getItems: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetItemsFields): Promise<ResponseWithPaginationUtil<ItemApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<ItemApiModel>>(BASE_ITEMS_URL, {
      params: {
        [ApiUrlParamsUtil.page]: pagination.page,
        [ApiUrlParamsUtil.pageSize]: pagination.size,
        [ApiUrlParamsUtil.sorting_fields]: sortingField,
        [ApiUrlParamsUtil.sortingDirection]: direction,
        ...searchFields,
      },
    });
    return response.data;
  },

  addItem: async (fields: CreateItem): Promise<JSONResponseUtil<ItemApiModel>> =>
    axiosActions<ItemApiModel>({ url: BASE_ITEMS_URL, method: HttpVerbsUtil.POST, data: fields }),
};

// Value sets, not TypeScript enums: erasableSyntaxOnly bans `enum`, and call sites read the same.
export const ItemApiSortingFields = {
  NAME: 'NAME',
  CREATION_DATE: 'CREATION_DATE',
} as const;
export type ItemApiSortingFields = (typeof ItemApiSortingFields)[keyof typeof ItemApiSortingFields];

export const ItemApiSearchFields = {
  NAME: 'name',
} as const;
export type ItemApiSearchFields = (typeof ItemApiSearchFields)[keyof typeof ItemApiSearchFields];

type SearchFields = { [key in ItemApiSearchFields]?: string };

type GetItemsFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: ItemApiSortingFields;
} & SearchFields;

export const DEFAULT_ITEM_SORT_FIELD = ItemApiSortingFields.CREATION_DATE;
export const DEFAULT_ITEM_SORT_DIRECTION = SortingDirectionUtil.DESC;
