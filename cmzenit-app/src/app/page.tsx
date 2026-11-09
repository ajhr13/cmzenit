'use client'

import React from 'react'
import { PublicLandingView } from '@/components/PublicLandingView'

/**
 * Página Principal (Inicio) de Grupo Médico Zenit
 * Siempre renderiza la página web oficial completa de la clínica para que cualquier visitante,
 * paciente registrado o miembro del personal médico pueda consultar especialidades, doctores,
 * espacio de estética, ubicación y agendamiento sin perder la vista del sitio web.
 *
 * El acceso a los paneles de trabajo según rol se gestiona a través del Sub-menú de Operaciones
 * que aparece automáticamente al iniciar sesión.
 */
export default function Home() {
  return <PublicLandingView />
}
