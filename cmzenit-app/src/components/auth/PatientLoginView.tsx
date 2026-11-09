'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  User,
  Lock,
  Mail,
  Phone,
  CreditCard,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Stethoscope,
  Shield,
  ArrowLeft,
} from 'lucide-react'

export function PatientLoginView() {
  const router = useRouter()
  const {
    currentUser,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsPreconfiguredUser,
    resetPasswordForEmail,
    updateUserPassword,
  } = useCMZenit()

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [cedula, setCedula] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Recuperación de Contraseña
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [receivedCode, setReceivedCode] = useState<string | null>(null)

  // Si ya hay usuario conectado como paciente, mostrar estado o redirección
  if (currentUser && currentUser.role === 'paciente') {
    return (
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white border border-gray-100 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-cyan-50 text-[#02B2C6] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#525862]">Sesión Iniciada como Paciente</h2>
        <p className="text-xs text-[#777777]">
          Bienvenido(a), <strong>{currentUser.name}</strong>. Ya tienes una sesión activa en el Portal de Pacientes.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition"
          >
            Ir a Mi Panel de Citas
          </button>
        </div>
      </div>
    )
  }

  const handleGoogleClick = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      await loginWithGoogle()
      router.push('/')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al conectar con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPatientLogin = () => {
    loginAsPreconfiguredUser('paciente@cmzenit.com')
    router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (activeTab === 'signin') {
        const res = await loginWithEmail(email, password)
        if (!res.success) {
          setErrorMsg(res.error || 'Credenciales de paciente incorrectas.')
        } else {
          router.push('/')
        }
      } else if (activeTab === 'signup') {
        if (!fullName.trim() || !cedula.trim() || !phone.trim()) {
          setErrorMsg('Por favor completa Nombre, Cédula y Teléfono de contacto.')
          setLoading(false)
          return
        }

        const res = await registerWithEmail({
          email,
          password,
          full_name: fullName,
          cedula,
          phone,
          role: 'paciente',
        })

        if (!res.success) {
          setErrorMsg(res.error || 'Error al registrar tu cuenta de paciente.')
        } else {
          setSuccessMsg('¡Cuenta de paciente creada exitosamente!')
          setTimeout(() => router.push('/'), 1200)
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const targetEmail = forgotEmail.trim() || email.trim()
      if (!targetEmail || !targetEmail.includes('@')) {
        setErrorMsg('Por favor ingresa un correo electrónico válido.')
        setLoading(false)
        return
      }

      setForgotEmail(targetEmail)
      const res = await resetPasswordForEmail(targetEmail)

      if (res.success) {
        setSuccessMsg(res.message || 'Instrucciones enviadas a tu correo electrónico.')
        if (res.tempCode) {
          setReceivedCode(res.tempCode)
          setResetCode(res.tempCode)
        }
        setForgotStep('verify')
      } else {
        setErrorMsg(res.error || 'Error al solicitar recuperación.')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (newPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifica.')
      return
    }

    if (receivedCode && resetCode.trim() !== receivedCode.trim()) {
      setErrorMsg('El código de seguridad ingresado es incorrecto.')
      return
    }

    setLoading(true)
    try {
      const targetEmail = forgotEmail.trim() || email.trim()
      const res = await updateUserPassword(targetEmail, newPassword)

      if (res.success) {
        setSuccessMsg('¡Contraseña actualizada exitosamente! Iniciando sesión...')
        const loginRes = await loginWithEmail(targetEmail, newPassword)
        if (loginRes.success) {
          setTimeout(() => router.push('/'), 1200)
        } else {
          setActiveTab('signin')
        }
      } else {
        setErrorMsg(res.error || 'Error al actualizar contraseña.')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white border border-gray-100 rounded-3xl shadow-2xl">
      {/* Botón Volver al Inicio */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#777777] hover:text-[#02B2C6] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#02B2C6] bg-cyan-50 px-2.5 py-0.5 rounded-full">
          Portal Paciente
        </span>
      </div>

      {/* Header Marca */}
      <div className="flex flex-col items-center text-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-zenit.png"
          alt="Grupo Médico Zenit"
          className="w-14 h-14 object-contain rounded-full shadow-md bg-white p-1 mb-2"
        />
        <h1 className="text-2xl font-bold tracking-tight text-[#525862]">
          Portal del <span className="text-[#02B2C6]">Paciente</span>
        </h1>
        <p className="text-xs text-[#777777] mt-1 max-w-xs leading-relaxed">
          Gestiona tus citas médicas, accede a récipes digitales e historial clínico en Caracas.
        </p>
      </div>

      {activeTab === 'forgot' ? (
        /* VISTA: RECUPERACIÓN DE CONTRASEÑA */
        <div className="space-y-4">
          <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100 text-xs text-[#525862] text-center">
            <KeyRound className="w-5 h-5 text-[#02B2C6] mx-auto mb-1" />
            <h3 className="font-bold text-[#525862]">Recuperación de Contraseña</h3>
            <p className="text-[11px] text-[#777777] mt-0.5">
              {forgotStep === 'request'
                ? 'Ingresa tu correo registrado para recibir el código de restablecimiento.'
                : 'Ingresa el código OTP recibido y define tu nueva contraseña.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-700 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          {forgotStep === 'request' ? (
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="paciente@cmzenit.com"
                    value={forgotEmail || email}
                    onChange={(e) => {
                      setForgotEmail(e.target.value)
                      setEmail(e.target.value)
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-200 bg-white text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enviar Código al Correo</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin')
                    setErrorMsg(null)
                  }}
                  className="text-xs font-semibold text-[#777777] hover:text-[#02B2C6] transition cursor-pointer"
                >
                  ← Volver a Iniciar Sesión
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                  Código de Seguridad OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder={receivedCode || '123456'}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tracking-widest text-center rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Guardar Nueva Clave</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep('request')
                    setErrorMsg(null)
                  }}
                  className="text-xs text-[#777777] hover:text-[#02B2C6] cursor-pointer"
                >
                  ← Cambiar correo
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* VISTA: INICIAR SESIÓN / REGISTRO */
        <>
          {/* Pestañas */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-white text-[#525862] shadow-sm'
                  : 'text-[#777777] hover:text-[#525862]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-[#525862] shadow-sm'
                  : 'text-[#777777] hover:text-[#525862]'
              }`}
            >
              Registrarme
            </button>
          </div>

          {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-gray-200 rounded-xl font-semibold text-xs text-[#525862] bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Acceso Rápido Demo Paciente */}
          {activeTab === 'signin' && (
            <div className="mt-3 p-3 rounded-2xl bg-cyan-50/60 border border-cyan-100 flex items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#02B2C6] block">
                  Cuenta Paciente Demo
                </span>
                <p className="text-[11px] text-[#525862] font-medium">paciente@cmzenit.com</p>
              </div>
              <button
                type="button"
                onClick={handleQuickPatientLogin}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Entrar 1-Click
              </button>
            </div>
          )}

          {/* Separador */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-3 text-[#777777] font-semibold">
                O con tu correo registrado
              </span>
            </div>
          </div>

          {/* Avisos */}
          {errorMsg && (
            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-700 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {activeTab === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                      Cédula de Identidad
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="V-12345678"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                      WhatsApp / Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="+58 412..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@cmzenit.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase text-[#525862]">
                  Contraseña
                </label>
                {activeTab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot')
                      setForgotEmail(email)
                      setErrorMsg(null)
                    }}
                    className="text-xs font-semibold text-[#02B2C6] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-gray-200 text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-[#525862]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 disabled:opacity-50 mt-1 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{activeTab === 'signin' ? 'Iniciar Sesión Paciente' : 'Crear Cuenta Paciente'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {activeTab === 'signup' && (
            <div className="mt-3 p-2 bg-gray-50 rounded-xl text-[10px] text-[#777777] flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#02B2C6]" />
              <span>Tus datos de salud están protegidos bajo protocolos de privacidad médica</span>
            </div>
          )}
        </>
      )}

      {/* INFORMACIÓN DE APOYO AL PACIENTE */}
      <div className="mt-6 pt-5 border-t border-gray-100 space-y-2 text-center text-xs text-[#777777]">
        <p className="text-[11px] text-[#525862]">
          ¿Tienes dudas o necesitas asistencia con tus citas médicas?
        </p>
        <div className="flex items-center justify-center gap-2 text-[11px]">
          <a
            href="https://wa.me/584220241622"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#02B2C6] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Atención al Paciente vía WhatsApp: (422) 0241622</span>
          </a>
        </div>
      </div>
    </div>
  )
}
