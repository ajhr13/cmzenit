'use client'

import React, { useState } from 'react'
import { useCMZenit } from '@/context/CMZenitContext'
import { ClinicArea, UserRole } from '@/types/database.types'
import {
  Users,
  Briefcase,
  CalendarCheck,
  TrendingUp,
  Plus,
  CheckCircle,
  UserCheck,
  ShieldAlert,
} from 'lucide-react'

export function AdminView() {
  const {
    services,
    doctors,
    appointments,
    systemUsers,
    createSystemUser,
    addDoctor,
    addService,
    toggleDoctorActive,
    toggleServiceActive,
  } = useCMZenit()

  // Formulario Gestión de Usuarios
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('123456')
  const [userCedula, setUserCedula] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('doctor')
  const [userSuccess, setUserSuccess] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)

  // Formulario Doctor
  const [docName, setDocName] = useState('')
  const [docArea, setDocArea] = useState<ClinicArea>('salud')
  const [docSpecialty, setDocSpecialty] = useState('')
  const [docLicense, setDocLicense] = useState('')
  const [docSchedule, setDocSchedule] = useState('')
  const [docSuccess, setDocSuccess] = useState(false)

  // Formulario Servicio
  const [srvName, setSrvName] = useState('')
  const [srvArea, setSrvArea] = useState<ClinicArea>('salud')
  const [srvPrice, setSrvPrice] = useState('50.00')
  const [srvDuration, setSrvDuration] = useState('45 min')
  const [srvDesc, setSrvDesc] = useState('')
  const [srvPromo, setSrvPromo] = useState('')
  const [srvSuccess, setSrvSuccess] = useState(false)

  // Métricas
  const totalCitas = appointments.length
  const citasAtendidas = appointments.filter((a) => a.status === 'atendida').length
  const totalIngresos = appointments
    .filter((a) => a.status === 'atendida')
    .reduce((acc, curr) => {
      const srv = services.find((s) => s.id === curr.service_id)
      return acc + (srv?.price || 0)
    }, 0)

  // Handler para crear usuario y asignar rol
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserError(null)

    if (!userName.trim() || !userEmail.trim() || !userCedula.trim() || !userPhone.trim()) {
      setUserError('Completa todos los campos obligatorios.')
      return
    }

    const res = await createSystemUser({
      full_name: userName,
      email: userEmail,
      password: userPassword,
      cedula: userCedula,
      phone: userPhone,
      role: userRole,
    })

    if (!res.success) {
      setUserError(res.error || 'Error al crear usuario')
      return
    }

    setUserSuccess(true)
    setTimeout(() => {
      setUserSuccess(false)
      setUserName('')
      setUserEmail('')
      setUserPassword('123456')
      setUserCedula('')
      setUserPhone('')
      setUserRole('doctor')
    }, 2000)
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docName.trim() || !docSpecialty.trim() || !docLicense.trim() || !docSchedule.trim()) return

    await addDoctor({
      user_id: null,
      name: docName,
      area: docArea,
      specialty_name: docSpecialty,
      mpps_license: docLicense,
      schedule_text: docSchedule,
      is_active: true,
    })

    setDocSuccess(true)
    setTimeout(() => {
      setDocSuccess(false)
      setDocName('')
      setDocSpecialty('')
      setDocLicense('')
      setDocSchedule('')
    }, 2000)
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!srvName.trim() || !srvPrice || !srvDuration.trim()) return

    await addService({
      name: srvName,
      category: srvArea,
      price: parseFloat(srvPrice) || 0,
      duration: srvDuration,
      description: srvDesc || null,
      promo_tag: srvPromo || null,
      is_active: true,
    })

    setSrvSuccess(true)
    setTimeout(() => {
      setSrvSuccess(false)
      setSrvName('')
      setSrvPrice('50.00')
      setSrvDuration('45 min')
      setSrvDesc('')
      setSrvPromo('')
    }, 2000)
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-cyan-950 dark:text-purple-300'
      case 'doctor':
        return 'bg-cyan-50 text-[#02B2C6] dark:bg-cyan-950 dark:text-[#02B2C6]'
      case 'secretaria':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    }
  }

  return (
    <div className="space-y-10 pb-16">
      {/* HEADER DE ADMINISTRACIÓN */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-wider text-[#02B2C6] bg-cyan-50 dark:bg-cyan-950 px-2.5 py-1 rounded-full">
          Dirección Médica & Control Global
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
          Panel de Control Administrativo
        </h1>
        <p className="text-xs text-zinc-500">
          Gestión de accesos, altas de personal médico MPPS, catálogo de servicios y métricas de ingresos
        </p>
      </div>

      {/* 1. KPIS GENERALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase">Citas Registradas</span>
            <CalendarCheck className="w-4 h-4 text-[#02B2C6]" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{totalCitas}</p>
          <span className="text-[10px] text-zinc-400">En todas las especialidades</span>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase">Usuarios Registrados</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{systemUsers.length}</p>
          <span className="text-[10px] text-zinc-400">Con roles asignados</span>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase">Servicios Ofertados</span>
            <Briefcase className="w-4 h-4 text-[#02B2C6]" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {services.filter((s) => s.is_active).length}
          </p>
          <span className="text-[10px] text-zinc-400">En catálogo público</span>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase">Ingresos Estimados</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            ${totalIngresos.toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-400">USD</span>
          </p>
          <span className="text-[10px] text-zinc-400">De {citasAtendidas} citas atendidas</span>
        </div>
      </div>

      {/* 2. NUEVO BLOQUE: GESTIÓN DE USUARIOS Y ROLES (REQUERIMIENTO PRINCIPAL) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#02B2C6]" />
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
                Gestión de Usuarios & Asignación de Roles
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Crea credenciales oficiales para doctores, secretarias, administradores o pacientes
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950 text-purple-700 dark:text-purple-300">
            {systemUsers.length} Cuentas Activas
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulario Crear Usuario */}
          <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#02B2C6]" />
              Crear Nuevo Usuario con Rol
            </h3>

            {userSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>¡Usuario creado exitosamente con su rol asignado!</span>
              </div>
            )}

            {userError && (
              <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>{userError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dr. Roberto Gómez"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Correo Electrónico (Login) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@cmzenit.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Rol en el Sistema *
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-purple-700 dark:text-purple-300"
                  >
                    <option value="doctor">🩺 Doctor / Especialista</option>
                    <option value="secretaria">📋 Secretaría / Recepción</option>
                    <option value="admin">🛡️ Dirección / Administrador</option>
                    <option value="paciente">👤 Paciente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="V-12345678"
                    value={userCedula}
                    onChange={(e) => setUserCedula(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+58 412..."
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95 mt-2"
              >
                Crear Usuario y Asignar Rol
              </button>
            </form>
          </div>

          {/* Tabla de Usuarios Registrados */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Usuarios con Acceso Habilitado</span>
              <span className="text-[11px] font-normal text-zinc-400">
                Pueden iniciar sesión de inmediato
              </span>
            </h3>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-[440px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] text-zinc-400 uppercase font-bold">
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Correo & Cédula</th>
                    <th className="py-2.5 px-3">Rol Asignado</th>
                    <th className="py-2.5 px-3 text-right">Clave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {systemUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {u.full_name}
                        </span>
                        <span className="text-[10px] text-zinc-400">{u.phone}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-zinc-700 dark:text-zinc-300 block">{u.email}</span>
                        <span className="text-[10px] text-zinc-400">{u.cedula}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-mono text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {u.password || '123456'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FORMULARIOS: ALTA DE DOCTOR Y ALTA DE SERVICIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario Registrar Especialista */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#02B2C6]" />
              Alta de Doctor / Especialista
            </h3>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Catálogo Clínico</span>
          </div>

          {docSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>¡Especialista registrado y disponible para agendamiento!</span>
            </div>
          )}

          <form onSubmit={handleAddDoctor} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Nombre y Título *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Dr. Andrés Bello"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Área de Atención
                </label>
                <select
                  value={docArea}
                  onChange={(e) => setDocArea(e.target.value as ClinicArea)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                >
                  <option value="salud">Salud (Médico)</option>
                  <option value="estetica">Estética & Dermo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Licencia MPPS / Colegio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MPPS 123.456"
                  value={docLicense}
                  onChange={(e) => setDocLicense(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Especialidad Médica *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Traumatología & Ortopedia"
                value={docSpecialty}
                onChange={(e) => setDocSpecialty(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Horario de Consulta *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Lunes a Viernes 8:00 AM - 1:00 PM"
                value={docSchedule}
                onChange={(e) => setDocSchedule(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95"
            >
              Registrar Especialista
            </button>
          </form>
        </div>

        {/* Formulario Registrar Servicio / Tratamiento */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#02B2C6]" />
              Alta de Servicio o Tratamiento
            </h3>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Catálogo</span>
          </div>

          {srvSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>¡Servicio publicado y disponible en catálogo público!</span>
            </div>
          )}

          <form onSubmit={handleAddService} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Nombre del Servicio *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Peeling Químico Médico"
                value={srvName}
                onChange={(e) => setSrvName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Categoría
                </label>
                <select
                  value={srvArea}
                  onChange={(e) => setSrvArea(e.target.value as ClinicArea)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                >
                  <option value="salud">Salud</option>
                  <option value="estetica">Estética</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Precio (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50.00"
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Duración *
                </label>
                <input
                  type="text"
                  required
                  placeholder="45 min"
                  value={srvDuration}
                  onChange={(e) => setSrvDuration(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Descripción para Pacientes
              </label>
              <textarea
                rows={2}
                placeholder="Detalle de la evaluación o protocolo..."
                value={srvDesc}
                onChange={(e) => setSrvDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                Etiqueta Promocional (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Más Solicitado, Tendencia, Glow"
                value={srvPromo}
                onChange={(e) => setSrvPromo(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95"
            >
              Publicar en Catálogo
            </button>
          </form>
        </div>
      </div>

      {/* 4. TABLAS DE GESTIÓN: DOCTORES & SERVICIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla Doctores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
            Plantilla Médica ({doctors.length})
          </h3>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
            {doctors.map((d) => (
              <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{d.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    {d.specialty_name} ({d.area}) • {d.mpps_license}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDoctorActive(d.id)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg transition ${
                    d.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {d.is_active ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla Servicios */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
            Catálogo de Servicios ({services.length})
          </h3>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
            {services.map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{s.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    ${s.price} USD • {s.category === 'estetica' ? 'Estética' : 'Salud'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleServiceActive(s.id)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg transition ${
                    s.is_active
                      ? 'bg-cyan-50 text-purple-700 dark:bg-cyan-950 dark:text-purple-300'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {s.is_active ? 'Activo' : 'Pausado'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
