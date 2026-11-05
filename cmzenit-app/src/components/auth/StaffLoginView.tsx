'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  Stethoscope,
  ClipboardList,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Shield,
  User,
} from 'lucide-react'

export function StaffLoginView() {
  const router = useRouter()
  const { currentUser, loginWithEmail, loginAsPreconfiguredUser, resetPasswordForEmail, updateUserPassword } =
    useCMZenit()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Recuperación
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [receivedCode, setReceivedCode] = useState<string | null>(null)

  // Si ya hay usuario conectado con rol doctor o secretaria
  if (currentUser && (currentUser.role === 'doctor' || currentUser.role === 'secretaria')) {
    return (
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white border border-gray-100 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-cyan-50 text-[#02B2C6] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#525862]">Sesión de Personal Activa</h2>
        <p className="text-xs text-[#777777]">
          Conectado como <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()}).
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => router.push(currentUser.role === 'doctor' ? '/doctor' : '/recepcion')}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition"
          >
            Ir a Mi Panel de Trabajo
          </button>
        </div>
      </div>
    )
  }

  const handleQuickLogin = (userEmail: string) => {
    loginAsPreconfiguredUser(userEmail)
    if (userEmail.includes('doctor')) {
      router.push('/doctor')
    } else {
      router.push('/recepcion')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await loginWithEmail(email, password)
      if (!res.success) {
        setErrorMsg(res.error || 'Credenciales de personal clínico incorrectas.')
      } else {
        // Redirigir según el rol del usuario autenticado
        setSuccessMsg('¡Credenciales verificadas exitosamente!')
        setTimeout(() => {
          if (email.toLowerCase().includes('doctor')) {
            router.push('/doctor')
          } else if (email.toLowerCase().includes('recepcion') || email.toLowerCase().includes('secretaria')) {
            router.push('/recepcion')
          } else {
            router.push('/')
          }
        }, 800)
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado durante la autenticación')
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
        setErrorMsg('Por favor ingresa un correo institucional válido.')
        setLoading(false)
        return
      }

      setForgotEmail(targetEmail)
      const res = await resetPasswordForEmail(targetEmail)

      if (res.success) {
        setSuccessMsg(res.message || 'Código de seguridad enviado a tu correo institucional.')
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
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const targetEmail = forgotEmail.trim() || email.trim()
      const res = await updateUserPassword(targetEmail, newPassword)

      if (res.success) {
        setSuccessMsg('Contraseña actualizada. Ya puedes iniciar sesión.')
        setIsForgotOpen(false)
      } else {
        setErrorMsg(res.error || 'Error al actualizar contraseña.')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al restablecer contraseña.')
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
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#525862] bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
          Personal MPPS
        </span>
      </div>

      {/* Header Marca */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#525862] text-white flex items-center justify-center shadow-lg p-3 mb-2.5">
          <Stethoscope className="w-8 h-8 text-[#02B2C6]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#525862]">
          Portal <span className="text-[#02B2C6]">Médico & Secretaría</span>
        </h1>
        <p className="text-xs text-[#777777] mt-1 max-w-xs leading-relaxed">
          Acceso exclusivo para especialistas médicos colegiados y recepción de pacientes.
        </p>
      </div>

      {/* Banner de Aviso Sanitario */}
      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-[#525862] text-xs">
        <ShieldAlert className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Área restringida. Todos los actos médicos y récipes emitidos quedan registrados bajo tu número de colegiatura MPPS.
        </p>
      </div>

      {/* Acceso Rápido 1-Click para Doctores y Secretaria */}
      <div className="mb-5 p-3.5 rounded-2xl bg-cyan-50/50 border border-cyan-100">
        <div className="flex items-center gap-1.5 mb-2.5 text-[#525862]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#02B2C6]">
            Cuentas Institucionales de Prueba (Clave: 123456)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('doctor@cmzenit.com')}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#02B2C6] text-left transition group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#525862] group-hover:text-[#02B2C6]">
              <Stethoscope className="w-3.5 h-3.5 text-[#02B2C6]" />
              <span>DOCTOR</span>
            </div>
            <p className="text-[10px] text-[#777777] truncate mt-0.5">doctor@cmzenit.com</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('recepcion@cmzenit.com')}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#02B2C6] text-left transition group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#525862] group-hover:text-[#02B2C6]">
              <ClipboardList className="w-3.5 h-3.5 text-[#02B2C6]" />
              <span>SECRETARÍA</span>
            </div>
            <p className="text-[10px] text-[#777777] truncate mt-0.5">recepcion@cmzenit.com</p>
          </button>
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

      {isForgotOpen ? (
        /* Recuperación de Clave de Personal */
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#525862]">
            Recuperar Contraseña Institucional
          </h3>

          {forgotStep === 'request' ? (
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                  Correo Institucional (@cmzenit.com)
                </label>
                <input
                  type="email"
                  required
                  placeholder="doctor@cmzenit.com"
                  value={forgotEmail || email}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#525862] hover:bg-[#3d424b] shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enviar Código</span>}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="text-xs text-[#777777] hover:text-[#525862] cursor-pointer"
                >
                  ← Volver al formulario de acceso
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                  Código OTP ({receivedCode || '123456'})
                </label>
                <input
                  type="text"
                  required
                  placeholder={receivedCode || '123456'}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tracking-widest text-center rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
                  Nueva Contraseña Institucional
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Actualizar Clave</span>}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Formulario Tradicional de Personal */
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#525862] mb-1">
              Correo Institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="doctor@cmzenit.com o recepcion@cmzenit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-200 text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase text-[#525862]">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(true)
                  setForgotEmail(email)
                  setErrorMsg(null)
                }}
                className="text-xs font-semibold text-[#02B2C6] hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
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
                className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-gray-200 text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-[#525862]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#525862] hover:bg-[#3d424b] shadow-sm transition active:scale-95 disabled:opacity-50 mt-1 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Ingresar al Sistema Clínico</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Enlaces de Cambio de Portal */}
      <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-[#777777] gap-2">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[#02B2C6] hover:underline font-bold"
        >
          <User className="w-3.5 h-3.5" />
          <span>← Portal de Pacientes</span>
        </Link>
        <Link
          href="/admin/login"
          className="flex items-center gap-1.5 text-[#525862] hover:text-[#02B2C6] transition font-medium"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Dirección Médica (Admin) →</span>
        </Link>
      </div>
    </div>
  )
}
