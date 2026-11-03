import {
  act,
  configure,
  fireEvent,
  render,
  renderHook,
  screen,
  type RenderOptions,
  waitFor,
  within,
} from '@testing-library/react';
import userEventBase from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import AppProviders from '@application/AppProviders';

const ASYNC_QUERY_TIMEOUT_MS = 5000;

// The 1 s default is too short for a cold first render behind the mocks' delay.
configure({ asyncUtilTimeout: ASYNC_QUERY_TIMEOUT_MS });

// `delay: null` drops the waits between key presses.
export const userEvent = userEventBase.setup({ delay: null });

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

export function deferred<T>(): Deferred<T> {
  const settlers: Pick<Deferred<T>, 'resolve' | 'reject'> = { resolve: () => {}, reject: () => {} };

  const promise = new Promise<T>((resolve, reject) => {
    settlers.resolve = resolve;
    settlers.reject = reject;
  });

  return { promise, ...settlers };
}

// The providers main.tsx wraps the app in, so a component reads the same context in a test as in the app.
function renderWithProviders(ui: React.ReactNode, options: RenderOptions = {}) {
  return render(ui, { wrapper: AppProviders, ...options });
}

function renderHookWithProviders<Result>(useHook: () => Result) {
  return renderHook(useHook, { wrapper: AppProviders });
}

type RenderRoutesOptions = RenderOptions & { initialEntries?: string[] };

// React Router empties an object-form `lazy` ({ action: ... }) in place once it has loaded it, and that object is
// shared with the route table. A second router (the next test) would then find no action at all, so each router
// gets its own copy of every `lazy` object.
function withFreshLazyObjects(routes: RouteObject[]): RouteObject[] {
  return routes.map((route) => {
    const lazy = typeof route.lazy === 'object' ? { ...route.lazy } : route.lazy;
    const children = route.children && withFreshLazyObjects(route.children);

    return { ...route, lazy, children } as RouteObject;
  });
}

// The toasts' polite live region, which AppProviders' Toaster renders on every page.
function notificationsRegion() {
  return within(screen.getByRole('region', { name: 'Notifications' }));
}

// A toast, named by its title.
export function findNotification(title: string) {
  return notificationsRegion().findByRole('dialog', { name: title });
}

// Every toast showing now.
export function queryAllNotifications() {
  return notificationsRegion().queryAllByRole('dialog');
}

// Real route objects, so a page's loader and action run as they do in the app. The router comes back too, for a test
// that checks the url a page navigated to.
export function renderRoutes(routes: RouteObject[], { initialEntries = ['/'], ...options }: RenderRoutesOptions = {}) {
  const router = createMemoryRouter(withFreshLazyObjects(routes), { initialEntries });

  return { ...renderWithProviders(<RouterProvider router={router} />, options), router };
}

// fireEvent only for what a user cannot do, such as an image finishing or failing to load.
export {
  act,
  fireEvent,
  renderWithProviders as render,
  renderHookWithProviders as renderHook,
  screen,
  waitFor,
  within,
};
