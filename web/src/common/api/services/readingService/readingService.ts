import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { EmailDefaultsApiModel, ReadingApiModel, ReadingEmailApiModel, ReadingId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ReadingStatusUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateReading, SendReading } from './readingService.type';

const BASE_READINGS_URL = '/readings';
// The API takes several statuses in one param, the way it takes several sorting fields.
const STATUS_SEPARATOR = ',';

// The history is always newest first, so the list takes a page and its filters, no sort. Not the `SearchFields`
// mapped type: the days are a range and the statuses a list, not one text value per field. The caller drops empty days.
type GetReadingsFields = {
  pagination: PaginationUtil;
  dateFrom?: string;
  dateTo?: string;
  statuses?: ReadingStatusUtil[];
};

// Undefined when no status is asked for, so the param stays off the wire.
function toStatusParam(statuses: ReadingStatusUtil[] = []): string | undefined {
  if (statuses.length === 0) return undefined;

  return statuses.join(STATUS_SEPARATOR);
}

export default {
  getReadings: async ({
    pagination,
    dateFrom,
    dateTo,
    statuses,
  }: GetReadingsFields): Promise<ResponseWithPaginationUtil<ReadingApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<ReadingApiModel>>(BASE_READINGS_URL, {
      params: {
        [ApiUrlParamsUtil.page]: pagination.page,
        [ApiUrlParamsUtil.pageSize]: pagination.size,
        [ApiUrlParamsUtil.dateFrom]: dateFrom,
        [ApiUrlParamsUtil.dateTo]: dateTo,
        [ReadingApiSearchFields.STATUS]: toStatusParam(statuses),
      },
    });

    return response.data;
  },

  // What a new reading's email starts with, before the reading is saved.
  getEmailDefaults: async (): Promise<EmailDefaultsApiModel> => {
    const response = await axios.get<EmailDefaultsApiModel>(`${BASE_READINGS_URL}/email-defaults`);

    return response.data;
  },

  getReading: async (id: ReadingId): Promise<ReadingApiModel> => {
    const response = await axios.get<ReadingApiModel>(`${BASE_READINGS_URL}/${id}`);

    return response.data;
  },

  addReading: async (fields: CreateReading): Promise<JSONResponseUtil<ReadingApiModel>> =>
    axiosActions<ReadingApiModel>({ url: BASE_READINGS_URL, method: HttpVerbsUtil.POST, data: fields }),

  deleteReading: async (id: ReadingId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_READINGS_URL}/${id}`, method: HttpVerbsUtil.DELETE }),

  // The preview: exactly what sendReading would email, built by the server.
  getReadingEmail: async (id: ReadingId): Promise<ReadingEmailApiModel> => {
    const response = await axios.get<ReadingEmailApiModel>(`${BASE_READINGS_URL}/${id}/email`);

    return response.data;
  },

  // Emails the reading to the provider. Sent or not, the API saves the outcome on the reading.
  sendReading: async (id: ReadingId, fields: SendReading): Promise<JSONResponseUtil<ReadingApiModel>> =>
    axiosActions<ReadingApiModel>({ url: `${BASE_READINGS_URL}/${id}/send`, method: HttpVerbsUtil.POST, data: fields }),
};

export const ReadingApiSearchFields = {
  STATUS: 'status',
} as const;
export type ReadingApiSearchFields = (typeof ReadingApiSearchFields)[keyof typeof ReadingApiSearchFields];
