import { createClient } from '@/lib/supabase/client'

export interface SignUpPatientParams {
  email: string
  password: string
  name: string
  cedula: string
  phone: string
  role?: string
}

export interface SignInCredentials {
  email: string
  password: string
}

/**
 * Iniciar sesión con Google OAuth con redirección automática a /auth/callback
 */
export async function signInWithGoogle() {
  const supabase = createClient()
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

/**
 * Registro de paciente con Correo, Cédula y Teléfono
 */
export async function signUpPatient({
  email,
  password,
  name,
  cedula,
  phone,
  role = 'paciente',
}: SignUpPatientParams) {
  const supabase = createClient()
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        cedula,
        phone,
        role,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

/**
 * Iniciar sesión tradicional con correo y contraseña
 */
export async function signInWithEmail({ email, password }: SignInCredentials) {
  const supabase = createClient()
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const supabase = createClient()
  return await supabase.auth.signOut()
}

/**
 * Obtener usuario actual en cliente
 */
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
