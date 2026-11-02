import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiError } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';

// The API's error envelope (`{ code, message, issues? }`); only the fields the app shows are read.
type ApiErrorBody = { code: string; message?: unknown };

const UNAUTHORIZED_STATUS = 401;
// The envelope code of a request made without a valid session. Other 401s (a wrong password, a wrong setup code)
// carry their own code and belong to the page that made them.
export const UNAUTHORIZED_ERROR_CODE = 'UNAUTHORIZED';

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string';
}

// The only place a failed request becomes an ApiError.
function toApiError(statusCode: number | undefined, data: unknown): ApiError {
  if (!isApiErrorBody(data)) return { statusCode };

  const message = typeof data.message === 'string' ? data.message : undefined;

  return { statusCode, code: data.code, message };
}

// Only a failed request becomes `success: false`; any other error is a bug and still throws.
export async function axiosActions<T = unknown>(config: AxiosRequestConfig): Promise<JSONResponseUtil<T>> {
  try {
    const response = await axios.request<T>(config);

    return { success: true, data: response.data };
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;

    return { success: false, error: toApiError(error.response?.status, error.response?.data) };
  }
}

function isFailedEnvelope(value: unknown): value is JSONResponseUtil {
  return typeof value === 'object' && value !== null && 'success' in value && value.success === false;
}

// Whether a loader's thrown read or an action's returned envelope means "no valid session". Lives here because
// this is the one file that reads a failed request.
export function isUnauthorizedFailure(value: unknown): boolean {
  if (axios.isAxiosError(value)) return value.response?.status === UNAUTHORIZED_STATUS;

  if (isFailedEnvelope(value)) return value.error?.code === UNAUTHORIZED_ERROR_CODE;

  return false;
}
