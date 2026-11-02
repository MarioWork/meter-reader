import getMailStatusHandler from './getMailStatus.mock.handler';

export const mailMockHandlers = (baseUrl: string) => [...getMailStatusHandler(baseUrl)];
