import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Actualizar sesión de Supabase si existen cookies de auth
  const response = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // 2. Leer rol verificado en cookie
  const roleCookie = request.cookies.get('cmzenit_role')?.value

  // Definición de rutas protegidas
  const isDoctorRoute = pathname.startsWith('/doctor')
  const isReceptionRoute = pathname.startsWith('/recepcion') || pathname.startsWith('/secretaria')
  const isAdminRoute =
    (pathname.startsWith('/admin') || pathname.startsWith('/direccion')) &&
    !pathname.startsWith('/admin/login') &&
    pathname !== '/admin/login'
  const isPatientPortalRoute = pathname.startsWith('/pacientes')

  // Reglas de redirección de seguridad en el Edge
  if (isDoctorRoute) {
    if (!roleCookie || (roleCookie !== 'doctor' && roleCookie !== 'admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login/personal'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  if (isReceptionRoute) {
    if (!roleCookie || (roleCookie !== 'secretaria' && roleCookie !== 'admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login/personal'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  if (isAdminRoute) {
    if (!roleCookie || roleCookie !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  if (isPatientPortalRoute) {
    if (!roleCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto archivos estáticos e imágenes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
