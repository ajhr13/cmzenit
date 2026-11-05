import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database, UserRole } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Determina si las credenciales de Supabase están configuradas y no son los valores por defecto
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('tu-proyecto') &&
    !supabaseUrl.includes('your-project')
  )
}

/**
 * Cliente de Supabase en el navegador con soporte SSR y fallback seguro
 */
export function createClient() {
  if (isSupabaseConfigured()) {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  // Cliente fallback con credenciales temporales para evitar crash si faltan llaves
  return createSupabaseClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
  )
}

export const supabase = createClient()

// Tipos para autenticación
export interface SignUpData {
  email: string
  password: string
  full_name: string
  cedula: string
  phone: string
  role?: UserRole
}

export interface SystemUser {
  id: string
  email: string
  password?: string
  full_name: string
  cedula: string
  phone: string
  role: UserRole
  avatar?: string
  provider: 'email' | 'google'
  created_at: string
}

/**
 * 4 Usuarios Base Preconfigurados para cada Rol
 */
export const INITIAL_PRECONFIGURED_USERS: SystemUser[] = [
  {
    id: 'user-base-paciente',
    email: 'paciente@cmzenit.com',
    password: '123456',
    full_name: 'Juan Pérez (Paciente)',
    cedula: 'V-18456789',
    phone: '+58 412 1234567',
    role: 'paciente',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    provider: 'google',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-base-secretaria',
    email: 'recepcion@cmzenit.com',
    password: '123456',
    full_name: 'Lic. María Gómez (Recepción)',
    cedula: 'V-15890123',
    phone: '+58 414 7654321',
    role: 'secretaria',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    provider: 'email',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-base-doctor',
    email: 'doctor@cmzenit.com',
    password: '123456',
    full_name: 'Dr. Carlos Mendoza (Especialista)',
    cedula: 'V-12345678',
    phone: '+58 416 9988776',
    role: 'doctor',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80',
    provider: 'email',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-base-admin',
    email: 'admin@cmzenit.com',
    password: '123456',
    full_name: 'Dra. Elena Rivas (Dirección)',
    cedula: 'V-10111222',
    phone: '+58 424 5551122',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1594824813584-3c6511b8110b?auto=format&fit=crop&w=150&q=80',
    provider: 'google',
    created_at: new Date().toISOString(),
  },
]

export const DEMO_ACCOUNTS = INITIAL_PRECONFIGURED_USERS

/**
 * Iniciar sesión con correo y contraseña
 */
export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    // Buscar si es un usuario preconfigurado
    const found = INITIAL_PRECONFIGURED_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

    if (found) {
      if (password && password !== found.password && password !== '123456') {
        return {
          data: { user: null, session: null },
          error: { message: 'Contraseña incorrecta. Para cuentas demo usa: 123456' },
        }
      }

      return {
        data: {
          user: {
            id: found.id,
            email: found.email,
            user_metadata: {
              full_name: found.full_name,
              role: found.role,
              cedula: found.cedula,
              phone: found.phone,
            },
          },
          session: { access_token: 'demo-token' },
        },
        error: null,
      }
    }

    // Usuario demo genérico
    return {
      data: {
        user: {
          id: 'demo-user-id',
          email,
          user_metadata: { full_name: email.split('@')[0], role: 'paciente' },
        },
        session: { access_token: 'demo-token' },
      },
      error: null,
    }
  }

  return await supabase.auth.signInWithPassword({ email, password })
}

/**
 * Registro con Correo, Cédula y Teléfono en Supabase Auth (Rol paciente por defecto)
 */
export async function signUpWithEmail({
  email,
  password,
  full_name,
  cedula,
  phone,
  role = 'paciente',
}: SignUpData) {
  if (!isSupabaseConfigured()) {
    return {
      data: {
        user: {
          id: 'demo-new-user-' + Date.now(),
          email,
          user_metadata: { full_name, cedula, phone, role },
        },
        session: null,
      },
      error: null,
    }
  }

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        cedula,
        phone,
        role,
      },
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
    },
  })
}

/**
 * Iniciar sesión con Google OAuth
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    return {
      data: { provider: 'google', url: null },
      error: null,
    }
  }

  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
    },
  })
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  if (!isSupabaseConfigured()) {
    return { error: null }
  }
  return await supabase.auth.signOut()
}
