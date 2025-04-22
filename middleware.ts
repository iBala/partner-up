import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

  // Handle authenticated user routes
  if (session) {
    // Redirect /jobs to /dashboard/jobs for authenticated users
    if (pathname === '/jobs') {
      return NextResponse.redirect(new URL('/dashboard/jobs', request.url));
    }
    
    // Redirect /dashboard to /dashboard/jobs
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/jobs', request.url));
    }
  } 
  // Handle unauthenticated user routes
  else {
    // If trying to access dashboard routes while unauthenticated, redirect to /jobs
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/jobs', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 