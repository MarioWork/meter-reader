import axios from 'axios';
import type { MailStatusApiModel } from '@app-types/models';

const BASE_MAIL_URL = '/mail';

// The server's Hotmail connection (ADR 0001). It is made on the server with yarn mail:connect, never from here: the
// web app only asks whether it holds.
export default {
  getStatus: async (): Promise<MailStatusApiModel> => {
    const response = await axios.get<MailStatusApiModel>(`${BASE_MAIL_URL}/status`);

    return response.data;
  },
};
