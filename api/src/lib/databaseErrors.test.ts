import { Prisma } from '../generated/prisma/client.ts';
import { getErrorLogFields } from './databaseErrors.ts';

const CLIENT_VERSION = '7.10.1';
const SECRET_ARGUMENT = 'refreshToken: "M.C540_BAY.secret"';

describe('getErrorLogFields', () => {
  it('logs only the name of a validation error, whose message quotes the call and its arguments', () => {
    const error = new Prisma.PrismaClientValidationError(`Invalid call: { ${SECRET_ARGUMENT} }`, {
      clientVersion: CLIENT_VERSION,
    });

    const fields = getErrorLogFields(error);

    expect(fields).toEqual({ err: { name: 'PrismaClientValidationError' } });
  });

  it('logs only the code and the model of a known request error', () => {
    const error = new Prisma.PrismaClientKnownRequestError(`Failing row contains (${SECRET_ARGUMENT})`, {
      code: 'P2002',
      clientVersion: CLIENT_VERSION,
      meta: { modelName: 'MailConnection' },
    });

    expect(getErrorLogFields(error)).toEqual({
      err: { name: 'PrismaClientKnownRequestError', code: 'P2002', model: 'MailConnection' },
    });
  });

  it('passes any other error through whole', () => {
    const error = new Error('Microsoft could not be reached');

    expect(getErrorLogFields(error)).toEqual({ err: error });
  });
});
