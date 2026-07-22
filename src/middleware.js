import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the token from the cookies
  const token = request.cookies.get('tenant_token');

  // Define protected routes
  const isProtectedTenantRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                                  request.nextUrl.pathname.startsWith('/onboarding');

  const isProtectedAdminRoute = request.nextUrl.pathname.startsWith('/super-admin');

  // If it's a protected route and there is no token, redirect to login
  if ((isProtectedTenantRoute || isProtectedAdminRoute) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Define public routes that authenticated users shouldn't access (like login/register)
  const isAuthRoute = request.nextUrl.pathname === '/login' || 
                      request.nextUrl.pathname === '/register';

  // If already logged in and trying to access login/register, 
  // just proceed to let the page handle it (we can't decode JWT in middleware without edge runtime)
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
