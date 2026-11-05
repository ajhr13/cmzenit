'use client'

import React from 'react'
import { useCMZenit } from '@/context/CMZenitContext'
import { PublicLandingView } from '@/components/PublicLandingView'
import { PatientView } from '@/components/PatientView'
import { SecretaryView } from '@/components/SecretaryView'
import { DoctorView } from '@/components/DoctorView'
import { AdminView } from '@/components/AdminView'

export default function Home() {
  const { currentUser } = useCMZenit()

  // 1. Visitante público sin sesión iniciada -> PublicLandingView con diseño MedicalGuide
  if (!currentUser) {
    return <PublicLandingView />
  }

  // 2. Navegación automática según el rol del usuario conectado (RBAC estricto)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {currentUser.role === 'secretaria' && <SecretaryView />}
      {currentUser.role === 'doctor' && <DoctorView />}
      {currentUser.role === 'admin' && <AdminView />}
      {currentUser.role === 'paciente' && <PatientView />}
    </div>
  )
}
