import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/proxy'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/policies',
  '/add-policy',
  '/processing',
  '/ask',
  '/claims',
  '/documents',
  '/compare',
  '/comparison',
  '/learn',
  '/notifications',
  '/settings',
  '/onboarding',
]

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  // Unauthenticated user attempting to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', `${pathname}${search}`)

    const redirectResponse = NextResponse.redirect(redirectUrl)
    // Copy any updated cookies (e.g. cleared invalid session cookies)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // Authenticated user attempting to access login or signup page
  if (user && isAuthRoute) {
    const nextParam = request.nextUrl.searchParams.get('next')
    const redirectUrl = request.nextUrl.clone()

    // Validate relative redirection target to prevent open redirect vulnerabilities
    if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
      redirectUrl.pathname = nextParam
      redirectUrl.search = ''
    } else {
      redirectUrl.pathname = '/dashboard'
      redirectUrl.search = ''
    }

    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset extensions (.svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
