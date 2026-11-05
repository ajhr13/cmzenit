'use client'

import React from 'react'
import { SecretaryView } from '@/components/SecretaryView'
import { useCMZenit } from '@/context/CMZenitContext'
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function RecepcionPage() {
  const { currentUser, openAuthModal } = useCMZenit()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {!currentUser ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#02B2C6] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100">
            Módulo de Recepción & Secretaría
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Acceso exclusivo para el personal de admisión. Inicia sesión con tus credenciales de
            secretaría.
          </p>
          <button
            onClick={() => openAuthModal('signin')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Ingresar como Recepción</span>
          </button>
        </div>
      ) : currentUser.role !== 'secretaria' && currentUser.role !== 'admin' ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Permiso Denegado</h2>
          <p className="text-xs text-slate-500">
            Tu cuenta actual ({currentUser.role}) no tiene permisos para acceder al módulo de recepción.
          </p>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-800 bg-slate-100 hover:bg-slate-200 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      ) : (
        <SecretaryView />
      )}
    </div>
  )
}
