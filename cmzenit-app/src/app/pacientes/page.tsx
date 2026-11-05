'use client'

import React from 'react'
import { PatientView } from '@/components/PatientView'
import { useCMZenit } from '@/context/CMZenitContext'
import { ShieldAlert, LogIn } from 'lucide-react'

export default function PacientesPage() {
  const { currentUser, openAuthModal } = useCMZenit()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {!currentUser ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#02B2C6] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100">
            Acceso al Portal de Pacientes
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Para ver tus citas, récipes médicos y agendar con especialistas necesitas iniciar sesión
            o registrarte como paciente.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => openAuthModal('signin')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar</span>
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#02B2C6] bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 cursor-pointer"
            >
              Registrarme
            </button>
          </div>
        </div>
      ) : (
        <PatientView />
      )}
    </div>
  )
}
