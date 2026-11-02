import type { MailStatusApiModel } from '@app-types/models';
import { MailStateUtil } from '@app-types/utility';

// Connected by default, so dev, the demo and the tests open without the Hotmail banner.
export const createMailStatusMockModel = (overrides?: Partial<MailStatusApiModel>): MailStatusApiModel => ({
  state: MailStateUtil.CONNECTED,
  ...overrides,
});
