import axios, { type AxiosRequestConfig } from 'axios';
import type { JSONResponseUtil } from '@app-types/utility';

// Only a failed request becomes `success: false`; any other error is a bug and still throws.
export async function axiosActions<T = unknown>(config: AxiosRequestConfig): Promise<JSONResponseUtil<T>> {
  try {
    const response = await axios.request<T>(config);

    return { success: true, data: response.data };
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;

    return { success: false, error: { statusCode: error.response?.status } };
  }
}
