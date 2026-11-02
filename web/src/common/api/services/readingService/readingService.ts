import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { ReadingApiModel, ReadingId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateReading } from './readingService.type';

const BASE_READINGS_URL = '/readings';

// The history is always newest first, so the list takes a page and nothing else.
type GetReadingsFields = {
  pagination: PaginationUtil;
};

export default {
  getReadings: async ({ pagination }: GetReadingsFields): Promise<ResponseWithPaginationUtil<ReadingApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<ReadingApiModel>>(BASE_READINGS_URL, {
      params: {
        [ApiUrlParamsUtil.page]: pagination.page,
        [ApiUrlParamsUtil.pageSize]: pagination.size,
      },
    });

    return response.data;
  },

  addReading: async (fields: CreateReading): Promise<JSONResponseUtil<ReadingApiModel>> =>
    axiosActions<ReadingApiModel>({ url: BASE_READINGS_URL, method: HttpVerbsUtil.POST, data: fields }),

  deleteReading: async (id: ReadingId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_READINGS_URL}/${id}`, method: HttpVerbsUtil.DELETE }),
};
