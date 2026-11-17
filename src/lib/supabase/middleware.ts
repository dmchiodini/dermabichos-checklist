import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // IMPORTANTE: não colocar lógica entre createServerClient e auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  // /admin/print é compartilhado com o tablet; a página valida a sessão por conta própria.
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/print')
  const isLoginRoute = pathname === '/admin/login'

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ''
    const response = NextResponse.redirect(url)
    // Preserva cookies de sessão renovados pelo Supabase durante o redirect.
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  if (!user && isAdminRoute && !isLoginRoute) {
    return redirectTo('/admin/login')
  }

  if (user && isLoginRoute) {
    return redirectTo('/admin/dashboard')
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    return redirectTo('/admin/dashboard')
  }

  return supabaseResponse
}
