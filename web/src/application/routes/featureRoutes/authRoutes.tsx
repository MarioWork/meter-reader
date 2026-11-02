import type { RouteObject } from 'react-router';
import { AUTH_ROUTES_PATHS } from '../routesUtils';

// Open to anyone: the setup page (from the server's setup link), the login page, and signing out.
export const authRoutes: RouteObject[] = [
  {
    path: AUTH_ROUTES_PATHS.SETUP,
    lazy: () => import('@pages/Setup/Setup.route'),
  },
  {
    path: AUTH_ROUTES_PATHS.LOGIN,
    lazy: () => import('@pages/Login/Login.route'),
  },
  {
    path: AUTH_ROUTES_PATHS.LOGOUT,
    lazy: { action: async () => (await import('@pages/Login/loginActions')).logoutAction },
  },
];
