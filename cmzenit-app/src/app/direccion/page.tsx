'use client'

import React from 'react'
import { AdminView } from '@/components/AdminView'
import { useCMZenit } from '@/context/CMZenitContext'
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function DireccionPage() {
  const { currentUser, openAuthModal } = useCMZenit()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {!currentUser ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#02B2C6] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100">
            Dirección Médica & Gestión
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Acceso restringido para la gerencia y dirección médica de CMZenit.
          </p>
          <button
            onClick={() => openAuthModal('signin')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Ingresar como Dirección</span>
          </button>
        </div>
      ) : currentUser.role !== 'admin' ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Acceso No Autorizado</h2>
          <p className="text-xs text-slate-500">
            Solo usuarios con rol de Dirección (admin) pueden acceder a este panel.
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
        <AdminView />
      )}
    </div>
  )
}
