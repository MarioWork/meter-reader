// A fake of Microsoft Graph's sendMail for the tests, answered from the same MSW server as the sign-in fake.
import { http, HttpResponse } from 'msw/http';
import { SEND_MAIL_URL } from './mail.microsoftGraph.ts';
import { microsoftServer } from './mail.microsoftIdentity.mock.ts';

// Graph answers a sendMail it took with 202 and no body.
const ACCEPTED = 202;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const TOO_MANY_REQUESTS = 429;

export type GraphAnswer = { status: number; body?: Record<string, unknown> };

// A sendMail Graph received: the bearer token it came with, and the JSON it carried.
export type ReceivedSendMail = { authorization: string | null; body: unknown };

export function acceptedAnswer(): GraphAnswer {
  return { status: ACCEPTED };
}

// A Graph error, as Graph sends it: `error.code` is stable, `error.message` is for humans and may name the address.
export function graphErrorAnswer(code: string, status = BAD_REQUEST): GraphAnswer {
  return {
    status,
    body: { error: { code, message: `Graph says no (${code}) to readings@water-provider.example` } },
  };
}

export function expiredTokenAnswer(): GraphAnswer {
  return graphErrorAnswer('InvalidAuthenticationToken', UNAUTHORIZED);
}

export function throttledAnswer(): GraphAnswer {
  return graphErrorAnswer('ApplicationThrottled', TOO_MANY_REQUESTS);
}

// Answers each sendMail with the next answer in line; the last one repeats. Returns what Graph received.
export function answerSendMail(...answers: GraphAnswer[]): ReceivedSendMail[] {
  const received: ReceivedSendMail[] = [];

  microsoftServer.use(
    http.post(SEND_MAIL_URL, async ({ request }) => {
      received.push({ authorization: request.headers.get('authorization'), body: await request.json() });
      const answer = answers[Math.min(received.length, answers.length) - 1] ?? acceptedAnswer();

      if (!answer.body) return new HttpResponse(null, { status: answer.status });

      return HttpResponse.json(answer.body, { status: answer.status });
    }),
  );

  return received;
}

// Graph cannot be reached at all.
export function failGraphNetwork(): void {
  microsoftServer.use(http.post(SEND_MAIL_URL, () => HttpResponse.error()));
}
