'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCMZenit } from '@/context/CMZenitContext'
import { INITIAL_PRECONFIGURED_USERS } from '@/lib/supabase'
import {
  X,
  Mail,
  Lock,
  User,
  CreditCard,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Stethoscope,
  Shield,
} from 'lucide-react'

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsPreconfiguredUser,
    resetPasswordForEmail,
    updateUserPassword,
  } = useCMZenit()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [cedula, setCedula] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Estados para Recuperación de Contraseña
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [receivedCode, setReceivedCode] = useState<string | null>(null)

  if (!isAuthModalOpen) return null

  const handleGoogleClick = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      await loginWithGoogle()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al conectar con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail)
    setPassword('123456')
    loginAsPreconfiguredUser(userEmail)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (authModalTab === 'signin') {
        const res = await loginWithEmail(email, password)
        if (!res.success) {
          setErrorMsg(res.error || 'Credenciales incorrectas')
        }
      } else if (authModalTab === 'signup') {
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
          setErrorMsg(res.error || 'Error al crear la cuenta')
        } else {
          setSuccessMsg('¡Cuenta de paciente creada con éxito!')
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Enviar correo de recuperación
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
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado al solicitar recuperación.')
    } finally {
      setLoading(false)
    }
  }

  // Restablecer contraseña con código
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (newPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.')
      return
    }

    if (!resetCode.trim()) {
      setErrorMsg('Por favor ingresa el código de 6 dígitos enviado a tu correo.')
      return
    }

    setLoading(true)
    try {
      const targetEmail = forgotEmail.trim() || email.trim()
      const res = await updateUserPassword(targetEmail, newPassword)

      if (res.success) {
        setSuccessMsg('¡Contraseña restablecida con éxito! Ingresando al sistema...')
        setTimeout(async () => {
          await loginWithEmail(targetEmail, newPassword)
          setForgotStep('request')
          setResetCode('')
          setNewPassword('')
          setConfirmPassword('')
        }, 1200)
      } else {
        setErrorMsg(res.error || 'Error al actualizar la contraseña.')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado al restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          onClick={closeAuthModal}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {authModalTab === 'forgot' ? (
          /* =========================================================================
             VISTA 1: RECUPERACIÓN DE CONTRASEÑA (OLVIDÉ MI CONTRASEÑA)
             ========================================================================= */
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-2.5 shadow-lg bg-[#02B2C6] shadow-cyan-600/30 p-2">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Recuperar Contraseña
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
                {forgotStep === 'request'
                  ? 'Ingresa tu correo registrado y te enviaremos el código y enlace para restablecer tu clave.'
                  : `Ingresa el código enviado a tu correo y define tu nueva contraseña.`}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2 text-emerald-700 dark:text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{successMsg}</p>
              </div>
            )}

            {forgotStep === 'request' ? (
              /* PASO A: SOLICITAR ENVÍO AL CORREO */
              <form onSubmit={handleForgotSubmit} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Correo Electrónico Registrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@cmzenit.com"
                      value={forgotEmail || email}
                      onChange={(e) => {
                        setForgotEmail(e.target.value)
                        setEmail(e.target.value)
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enviar Instrucciones al Correo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal('signin')
                      setErrorMsg(null)
                      setSuccessMsg(null)
                    }}
                    className="text-xs font-semibold text-zinc-500 hover:text-[#02B2C6] transition cursor-pointer"
                  >
                    ← Volver a Iniciar Sesión
                  </button>
                </div>
              </form>
            ) : (
              /* PASO B: INGRESAR CÓDIGO Y ESTABLECER NUEVA CONTRASEÑA */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-[#02B2C6]/30 text-xs text-[#525862] dark:text-zinc-300 flex items-center justify-between">
                  <span className="truncate">
                    Enviado a: <strong>{forgotEmail}</strong>
                  </span>
                  {receivedCode && (
                    <span className="font-mono bg-[#02B2C6] text-white px-2 py-0.5 rounded text-[11px] font-bold">
                      OTP: {receivedCode}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Código de Seguridad (6 dígitos)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder={receivedCode || '123456'}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition disabled:opacity-50 mt-2 cursor-pointer active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Guardar Nueva Clave e Ingresar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request')
                      setErrorMsg(null)
                    }}
                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                  >
                    ← Cambiar correo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal('signin')
                      setForgotStep('request')
                      setErrorMsg(null)
                    }}
                    className="font-semibold text-[#02B2C6] hover:underline cursor-pointer"
                  >
                    Volver al login
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* =========================================================================
             VISTA 2: INICIAR SESIÓN / REGISTRO TRADICIONAL
             ========================================================================= */
          <>
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg bg-[#02B2C6] shadow-cyan-600/30 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-zenit.png" alt="CMZenit" className="w-9 h-9 object-contain rounded-full bg-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Portal del <span className="text-[#02B2C6]">Paciente</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Inicia sesión o regístrate para confirmar tu cita médica
              </p>
            </div>

            {/* Pestañas Iniciar Sesión / Registro */}
            <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => {
                  openAuthModal('signin')
                  setErrorMsg(null)
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === 'signin'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  openAuthModal('signup')
                  setErrorMsg(null)
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === 'signup'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Registrarme como Paciente
              </button>
            </div>

            {/* Botón Oficial Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            {/* Acceso Rápido Demo Paciente */}
            {authModalTab === 'signin' && (
              <div className="mt-3 p-2.5 rounded-xl bg-cyan-50/80 border border-cyan-100 flex items-center justify-between gap-3">
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#02B2C6] block">
                    Cuenta Paciente Demo
                  </span>
                  <p className="text-[11px] text-[#525862] font-medium">paciente@cmzenit.com</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('paciente@cmzenit.com')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Entrar 1-Click
                </button>
              </div>
            )}

            {/* Separador */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-semibold">
                  O con correo y contraseña
                </span>
              </div>
            </div>

            {/* Avisos de Error o Éxito */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2 text-emerald-700 dark:text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{successMsg}</p>
              </div>
            )}

            {/* Formulario Tradicional */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {authModalTab === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                        Cédula
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="V-18456789"
                          value={cedula}
                          onChange={(e) => setCedula(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                        WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder="+58 412..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@cmzenit.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-zinc-500">
                    Contraseña
                  </label>
                  {authModalTab === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email)
                        openAuthModal('forgot')
                        setErrorMsg(null)
                        setSuccessMsg(null)
                      }}
                      className="text-xs font-semibold text-[#02B2C6] hover:text-[#029baa] hover:underline transition cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition disabled:opacity-50 mt-1 cursor-pointer active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      {authModalTab === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta Paciente'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {authModalTab === 'signup' && (
              <div className="mt-3 p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-[10px] text-zinc-400 flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#02B2C6]" />
                <span>Los nuevos registros obtienen acceso como Paciente de CMZenit</span>
              </div>
            )}

            {/* Enlaces directos a los otros 2 Portales de Acceso */}
            <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                ¿Eres miembro del equipo clínico o administrativo?
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs">
                <Link
                  href="/login/personal"
                  onClick={closeAuthModal}
                  className="flex items-center gap-1 font-bold text-[#02B2C6] hover:underline"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctores & Secretaría →</span>
                </Link>
                <span className="hidden sm:inline text-zinc-300">•</span>
                <Link
                  href="/admin/login"
                  onClick={closeAuthModal}
                  className="flex items-center gap-1 font-medium text-zinc-500 hover:text-[#02B2C6] transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Dirección / Admin</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
