// @vitest-environment jsdom
import { http, HttpResponse } from 'msw/http';
import { server } from '@mocks/server';
import { userEvent } from '@test-utils';
import { interceptMockNewTabLinks } from './mockNewTabLinks';

const BASE_API_URL = '/api';
const BILL_PATH = '/api/bills/1';
const OBJECT_URL = 'blob:http://localhost:3000/0c7d2e4a-8b1f-4e3c-a6d5-9f2b1c0e8a74';
const PDF = 'application/pdf';
const NOT_FOUND = 404;

type FakeTab = { opener: unknown; location: { href: string }; close: () => void };

const createObjectUrl = vi.fn((_file: Blob) => OBJECT_URL);
const openWindow = vi.fn();

function addNewTabLink(href: string): HTMLAnchorElement {
  const link = document.createElement('a');

  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'october.pdf';
  document.body.append(link);

  return link;
}

// The tab window.open gives back, to see where it was sent.
function fakeNewTab(): FakeTab {
  const tab: FakeTab = { opener: window, location: { href: '' }, close: vi.fn() };

  openWindow.mockReturnValue(tab);

  return tab;
}

function answerBill(response: () => Response) {
  server.use(http.get(`${window.location.origin}${BILL_PATH}`, response));
}

beforeAll(() => {
  interceptMockNewTabLinks(BASE_API_URL);
});

beforeEach(() => {
  // jsdom has no object URLs.
  URL.createObjectURL = createObjectUrl;
  URL.revokeObjectURL = vi.fn();
  window.open = openWindow;
});

afterEach(() => {
  document.body.replaceChildren();
});

it('opens a new-tab link into the API in a tab of its own, showing what the mocks answer for it', async () => {
  answerBill(() => new HttpResponse(new Blob(['%PDF-1.7']), { headers: { 'Content-Type': PDF } }));
  const tab = fakeNewTab();

  await userEvent.click(addNewTabLink(BILL_PATH));

  expect(openWindow).toHaveBeenCalledWith('', '_blank');
  expect(tab.opener).toBeNull();
  await vi.waitFor(() => expect(tab.location.href).toBe(OBJECT_URL));
  expect(createObjectUrl.mock.calls[0]?.[0]).toMatchObject({ type: PDF });
});

it('opens a new-tab link into the API through the mocks on a middle click too', async () => {
  answerBill(() => new HttpResponse(new Blob(['%PDF-1.7']), { headers: { 'Content-Type': PDF } }));
  const tab = fakeNewTab();

  await userEvent.pointer({ keys: '[MouseMiddle]', target: addNewTabLink(BILL_PATH) });

  await vi.waitFor(() => expect(tab.location.href).toBe(OBJECT_URL));
});

it('closes the tab again when the mocks have no file for the link', async () => {
  answerBill(() => HttpResponse.json({ code: 'NOT_FOUND', message: 'Bill not found' }, { status: NOT_FOUND }));
  const tab = fakeNewTab();

  await userEvent.click(addNewTabLink(BILL_PATH));

  await vi.waitFor(() => expect(tab.close).toHaveBeenCalled());
  expect(tab.location.href).toBe('');
});

it('leaves a new-tab link anywhere else to the browser', async () => {
  const tab = fakeNewTab();
  const link = addNewTabLink('https://example.com/help');
  let isPrevented = true;
  link.addEventListener('click', (event) => {
    isPrevented = event.defaultPrevented;
    event.preventDefault();
  });

  await userEvent.click(link);

  expect(openWindow).not.toHaveBeenCalled();
  expect(isPrevented).toBe(false);
  expect(tab.location.href).toBe('');
});
