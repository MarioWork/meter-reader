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
import type { CreateReading, SendReading, UpdateReading } from './readingService.type';

const BASE_READINGS_URL = '/readings';
const READINGS_SPREADSHEET_SEGMENT = 'export.xlsx';
const READINGS_BACKUP_JSON_SEGMENT = 'backup.json';
const READINGS_BACKUP_CSV_SEGMENT = 'backup.csv';
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

// The spreadsheet takes the history's filters, no page: it holds every reading they match. `timeZone` is where the
// user is (an IANA name), so the sent times read as their own clock showed them.
type GetReadingsSpreadsheetFields = {
  dateFrom?: string;
  dateTo?: string;
  statuses?: ReadingStatusUtil[];
  timeZone: string;
};

// Undefined when no status is asked for, so the param stays off the wire.
function toStatusParam(statuses: ReadingStatusUtil[] = []): string | undefined {
  if (statuses.length === 0) return undefined;

  return statuses.join(STATUS_SEPARATOR);
}

// The search params with every unset value left out, the way axios leaves them out of a request.
function toSearchParams(params: Record<string, string | undefined>): URLSearchParams {
  const setParams = Object.entries(params).filter((param): param is [string, string] => param[1] !== undefined);

  return new URLSearchParams(setParams);
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

  // A plain download: the browser follows this link with the session cookie, no axios call is involved. Built from
  // the service's path and the url's checked filters only.
  getReadingsSpreadsheetUrl: ({ dateFrom, dateTo, statuses, timeZone }: GetReadingsSpreadsheetFields): string => {
    const searchParams = toSearchParams({
      [ApiUrlParamsUtil.dateFrom]: dateFrom,
      [ApiUrlParamsUtil.dateTo]: dateTo,
      [ReadingApiSearchFields.STATUS]: toStatusParam(statuses),
      [ReadingApiExportParams.TIME_ZONE]: timeZone,
    });

    return `${axios.defaults.baseURL ?? ''}${BASE_READINGS_URL}/${READINGS_SPREADSHEET_SEGMENT}?${searchParams.toString()}`;
  },

  // The backup, plain downloads like the spreadsheet: every reading, whatever Home is filtered to, so no params.
  getReadingsBackupJsonUrl: (): string =>
    `${axios.defaults.baseURL ?? ''}${BASE_READINGS_URL}/${READINGS_BACKUP_JSON_SEGMENT}`,

  getReadingsBackupCsvUrl: (): string =>
    `${axios.defaults.baseURL ?? ''}${BASE_READINGS_URL}/${READINGS_BACKUP_CSV_SEGMENT}`,

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

  // Sets, changes or removes (null) what the reading cost. Never part of its email.
  updateReading: async (id: ReadingId, fields: UpdateReading): Promise<JSONResponseUtil<ReadingApiModel>> =>
    axiosActions<ReadingApiModel>({ url: `${BASE_READINGS_URL}/${id}`, method: HttpVerbsUtil.PATCH, data: fields }),

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

// The spreadsheet's own params, beside the filters it shares with the history.
export const ReadingApiExportParams = {
  TIME_ZONE: 'timeZone',
} as const;
export type ReadingApiExportParams = (typeof ReadingApiExportParams)[keyof typeof ReadingApiExportParams];
