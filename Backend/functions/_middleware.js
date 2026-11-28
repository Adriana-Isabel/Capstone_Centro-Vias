import { clearSessionCookie, getValidSession, json } from './_lib/auth.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  const publicAdminPages = new Set([
    '/Admin-Login',
    '/Admin-Login/',
    '/Admin-Login/Admin-Login.html',
    '/Admin-Login/Admin-Login',
  ]);
  const loginAssets = new Set([
    '/Admin-Login/Admin-Login.css',
    '/Admin-Login/Admin-Login.js',
  ]);

  const isAdminPage =
    path === '/Admin-Login' ||
    path === '/Admin-Login/' ||
    path.startsWith('/Admin-Login/');
  const isAdminApi =
    path.startsWith('/api/') &&
    path !== '/api/login' &&
    path !== '/api/logout' &&
    path !== '/api/team' &&
    path !== '/api/photos' &&
    path !== '/api/photo' &&
    path !== '/api/forms';

  const loginOrAsset =
    publicAdminPages.has(path) ||
    loginAssets.has(path) ||
    path === '/api/login';

  if (!loginOrAsset && (isAdminPage || isAdminApi)) {
    const session = await getValidSession(context.request, context.env);
    if (!session) {
      if (path.startsWith('/api/')) {
        return json({ error: 'No autorizado.' }, 401);
      }
      const response = Response.redirect(
        new URL('/Admin-Login/Admin-Login.html', context.request.url).toString(),
        302,
      );
      if (context.request.headers.get('Cookie')?.includes('cvias_admin_session=')) {
        response.headers.set('Set-Cookie', clearSessionCookie(context.request));
      }
      return response;
    }
  }

  const response = await context.next();
  if (isAdminPage) {
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}
