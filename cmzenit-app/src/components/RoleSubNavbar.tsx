'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  Calendar,
  FileText,
  PlusCircle,
  Stethoscope,
  Users,
  FilePlus,
  History,
  ClipboardList,
  DollarSign,
  MessageSquare,
  Shield,
  UserCheck,
  Layers,
  User,
} from 'lucide-react'

export function RoleSubNavbarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab') || ''
  const { currentUser, appointments, exchangeRate } = useCMZenit()

  if (!currentUser) return null

  // Métricas en tiempo real
  const waitingPatientsCount = appointments.filter((a) => a.status === 'en_sala').length
  const pendingValidationCount = appointments.filter((a) => a.status === 'pendiente').length
  const myAppointmentsCount = appointments.filter(
    (a) =>
      a.patient_cedula === currentUser.cedula ||
      (currentUser.id && a.patient_id === currentUser.id)
  ).length

  interface SubMenuItem {
    id: string
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number | string
    badgeColor?: string
    highlight?: boolean
  }

  let menuItems: SubMenuItem[] = []

  switch (currentUser.role) {
    case 'paciente':
      menuItems = [
        {
          id: 'citas',
          label: 'Mis Citas',
          href: '/pacientes?tab=citas',
          icon: Calendar,
          badge: myAppointmentsCount > 0 ? myAppointmentsCount : undefined,
          badgeColor: 'bg-[#02B2C6] text-white',
        },
        {
          id: 'recipes',
          label: 'Mis Récipes & Fichas',
          href: '/pacientes?tab=recipes',
          icon: FileText,
        },
        {
          id: 'perfil',
          label: 'Mi Perfil',
          href: '/pacientes?tab=perfil',
          icon: User,
        },
        {
          id: 'catalogo',
          label: 'Catálogo de Servicios',
          href: '/pacientes?tab=catalogo',
          icon: Layers,
        },
        {
          id: 'agendar',
          label: 'Agendar Cita',
          href: '/pacientes?tab=agendar',
          icon: PlusCircle,
          highlight: true,
        },
      ]
      break

    case 'doctor':
      menuItems = [
        { id: 'agenda', label: 'Agenda de Hoy', href: '/doctor?tab=agenda', icon: Calendar },
        {
          id: 'sala',
          label: 'En Sala de Espera',
          href: '/doctor?tab=sala',
          icon: Users,
          badge: waitingPatientsCount > 0 ? `${waitingPatientsCount} en sala` : undefined,
          badgeColor: 'bg-emerald-600 text-white animate-pulse',
        },
        { id: 'consulta', label: 'Atención Médica', href: '/doctor?tab=consulta', icon: FilePlus },
        { id: 'archivo', label: 'Archivo de Historias', href: '/doctor?tab=archivo', icon: History },
        {
          id: 'nuevo-paciente',
          label: '+ Nuevo Paciente',
          href: '/doctor?tab=nuevo-paciente',
          icon: PlusCircle,
          highlight: true,
        },
      ]
      break

    case 'secretaria':
      menuItems = [
        {
          id: 'espera',
          label: 'Recepción & Admisión',
          href: '/recepcion?tab=espera',
          icon: ClipboardList,
          badge:
            pendingValidationCount > 0
              ? `${pendingValidationCount} por validar`
              : waitingPatientsCount > 0
              ? `${waitingPatientsCount}`
              : undefined,
          badgeColor:
            pendingValidationCount > 0
              ? 'bg-amber-500 text-white animate-pulse'
              : 'bg-[#02B2C6] text-white',
        },
        {
          id: 'caja',
          label: 'Caja & Cobranzas',
          href: '/recepcion?tab=caja',
          icon: DollarSign,
          badge: `Tasa: ${exchangeRate.toFixed(2)} Bs.`,
          badgeColor: 'bg-slate-200 text-[#525862]',
        },
        { id: 'avisos', label: 'Avisos WhatsApp', href: '/recepcion?tab=avisos', icon: MessageSquare },
        {
          id: 'nueva-cita',
          label: 'Nueva Cita Presencial',
          href: '/recepcion?tab=nueva-cita',
          icon: PlusCircle,
          highlight: true,
        },
      ]
      break

    case 'admin':
      menuItems = [
        { id: 'metricas', label: 'Balance & KPIs', href: '/direccion?tab=metricas', icon: Shield },
        { id: 'usuarios', label: 'Gestión Usuarios', href: '/direccion?tab=usuarios', icon: UserCheck },
        { id: 'doctores', label: 'Cuerpo Médico', href: '/direccion?tab=doctores', icon: Stethoscope },
        { id: 'servicios', label: 'Servicios & Tarifas', href: '/direccion?tab=servicios', icon: Layers },
      ]
      break
  }

  // Comprobar si un ítem de menú está activo
  const checkIsActive = (item: SubMenuItem) => {
    const [itemPath, itemQuery] = item.href.split('?')
    if (pathname !== itemPath) return false

    if (!itemQuery) return true
    const itemTab = new URLSearchParams(itemQuery).get('tab')
    if (itemTab) {
      return currentTab === itemTab || (!currentTab && item.id === menuItems[0]?.id)
    }
    return false
  }

  return (
    <>
      {/* SUB-NAVBAR UNIFICADA (Limpia, responsiva con scroll horizontal táctil y sin duplicidad) */}
      <div className="w-full bg-[#f8fafc] dark:bg-zinc-900 border-b border-slate-200/90 dark:border-zinc-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
          <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 no-scrollbar scroll-smooth">
            {menuItems.map((item) => {
              const isActive = checkIsActive(item)

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#02B2C6] text-white shadow-2xs font-extrabold'
                      : item.highlight
                      ? 'bg-cyan-50 dark:bg-cyan-950 text-[#02B2C6] hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800'
                      : 'text-[#525862] dark:text-zinc-300 hover:text-[#02B2C6] hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <item.icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-white' : item.highlight ? 'text-[#02B2C6]' : 'text-[#777777]'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/30 text-white' : item.badgeColor || 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}

export function RoleSubNavbar() {
  return (
    <React.Suspense fallback={null}>
      <RoleSubNavbarContent />
    </React.Suspense>
  )
}
