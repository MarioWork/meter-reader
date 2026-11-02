// Microsoft Graph's sendMail (ADR 0001): one call sends one mail from the signed-in Hotmail, attachment included.
// Nothing here logs, and no error carries a token, the address, the body or Graph's own message (it may quote them).
import { z } from 'zod';
import { AppError } from '../../lib/errors.ts';
import { microsoftUnreachable } from './mail.microsoftIdentity.ts';
import type { MailAttachment, OutgoingMail } from './mail.type.ts';

export const SEND_MAIL_URL = 'https://graph.microsoft.com/v1.0/me/sendMail';
// Graph refuses a request over 4 MB. The attachment travels as base64 (a third bigger than the file), so the limit is
// checked on the encoded request itself, in decimal megabytes so a request near the line is refused here rather than
// by Graph.
export const GRAPH_MAX_REQUEST_BYTES = 4_000_000;
// An attachment takes a while to upload on a slow home connection.
const REQUEST_TIMEOUT_MS = 30_000;
const FILE_ATTACHMENT_TYPE = '#microsoft.graph.fileAttachment';
const TEXT_BODY = 'Text';
const BASE64 = 'base64';
const JSON_CONTENT_TYPE = 'application/json';
const FIRST_SUCCESS_STATUS = 200;
const FIRST_REDIRECT_STATUS = 300;
const UNAUTHORIZED_STATUS = 401;
const TOO_MANY_REQUESTS_STATUS = 429;
// Graph did not take the access token: the caller may refresh it and try once more.
export const MAIL_TOKEN_REJECTED = 'MAIL_TOKEN_REJECTED';
const FIRST_SERVER_ERROR_STATUS = 500;

// A Graph error (`{ error: { code, message } }`): only the stable code is read.
const GraphErrorSchema = z.object({ error: z.object({ code: z.string().min(1) }) });

// The JSON sendMail takes, already serialised: its size is what Graph's limit counts.
export type SendMailRequest = { json: string };

function toGraphAttachment({ name, contentType, contents }: MailAttachment) {
  return { '@odata.type': FILE_ATTACHMENT_TYPE, name, contentType, contentBytes: contents.toString(BASE64) };
}

// The request Graph would get, or MAIL_TOO_LARGE before anything is sent when it is over Graph's limit.
export function buildSendMailRequest({ to, subject, body, attachment }: OutgoingMail): SendMailRequest {
  const message = {
    subject,
    body: { contentType: TEXT_BODY, content: body },
    toRecipients: [{ emailAddress: { address: to } }],
    attachments: attachment ? [toGraphAttachment(attachment)] : [],
  };
  const json = JSON.stringify({ message, saveToSentItems: true });
  const isTooLarge = Buffer.byteLength(json) > GRAPH_MAX_REQUEST_BYTES;

  if (isTooLarge) {
    throw new AppError('The photo is too large to send through Microsoft (4 MB per email). Send it without the photo', {
      code: 'MAIL_TOO_LARGE',
    });
  }

  return { json };
}

async function readGraphErrorCode(response: Response): Promise<string | undefined> {
  try {
    const answer = GraphErrorSchema.safeParse(await response.json());

    return answer.success ? answer.data.error.code : undefined;
  } catch {
    // Not JSON (a gateway error page): no code to give.
    return undefined;
  }
}

// Why Graph did not take the mail: busy or down (try again later), the token refused, or a refusal naming Graph's
// code.
async function toSendFailure(response: Response): Promise<AppError> {
  const isBusy = response.status === TOO_MANY_REQUESTS_STATUS || response.status >= FIRST_SERVER_ERROR_STATUS;

  if (isBusy) {
    return new AppError('Microsoft is busy or down right now. Try again in a few minutes', {
      code: 'MAIL_SERVICE_BUSY',
    });
  }

  const graphCode = (await readGraphErrorCode(response)) ?? `HTTP ${response.status}`;
  const code = response.status === UNAUTHORIZED_STATUS ? MAIL_TOKEN_REJECTED : 'MAIL_REFUSED';

  return new AppError(`Microsoft did not send the email (${graphCode}). Try again`, { code });
}

// Sends the mail. Resolves once Graph has accepted it; throws an AppError saying why when it did not.
export async function postSendMail(accessToken: string, request: SendMailRequest): Promise<void> {
  let response: Response;

  try {
    response = await fetch(SEND_MAIL_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': JSON_CONTENT_TYPE },
      body: request.json,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    throw microsoftUnreachable(error);
  }

  const isAccepted = response.status >= FIRST_SUCCESS_STATUS && response.status < FIRST_REDIRECT_STATUS;

  if (!isAccepted) throw await toSendFailure(response);
}
