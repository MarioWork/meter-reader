import { Prisma } from '../generated/prisma/client.ts';
import { getErrorLogFields } from './databaseErrors.ts';

const CLIENT_VERSION = '7.10.1';
const SECRET_ARGUMENT = 'refreshToken: "M.C540_BAY.secret"';

describe('getErrorLogFields', () => {
  it('logs only the name when the error is a validation error, whose message quotes the call arguments', () => {
    const error = new Prisma.PrismaClientValidationError(`Invalid call: { ${SECRET_ARGUMENT} }`, {
      clientVersion: CLIENT_VERSION,
    });

    const fields = getErrorLogFields(error);

    expect(fields).toEqual({ err: { name: 'PrismaClientValidationError' } });
  });

  it('logs only the code and the model when the error is a known request error', () => {
    const error = new Prisma.PrismaClientKnownRequestError(`Failing row contains (${SECRET_ARGUMENT})`, {
      code: 'P2002',
      clientVersion: CLIENT_VERSION,
      meta: { modelName: 'MailConnection' },
    });

    expect(getErrorLogFields(error)).toEqual({
      err: { name: 'PrismaClientKnownRequestError', code: 'P2002', model: 'MailConnection' },
    });
  });

  it('passes the error through whole when it is not a Prisma error', () => {
    const error = new Error('Microsoft could not be reached');

    expect(getErrorLogFields(error)).toEqual({ err: error });
  });
});
