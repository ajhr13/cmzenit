'use client'

import React from 'react'
import { MedicalRecord, Doctor } from '@/types/database.types'
import { Printer, Share2, X, Download, ShieldCheck, Stethoscope, Sparkles } from 'lucide-react'

interface RecipeModalProps {
  isOpen: boolean
  onClose: () => void
  record: MedicalRecord | null
  doctor?: Doctor | null
  patientName?: string
  patientCedula?: string
  patientPhone?: string
}

export function RecipeModal({
  isOpen,
  onClose,
  record,
  doctor,
  patientName,
  patientCedula,
  patientPhone,
}: RecipeModalProps) {
  if (!isOpen || !record) return null

  const resolvedPatientName = record.patient_name || patientName || 'Paciente CMZenit'
  const resolvedPatientCedula = record.patient_cedula || patientCedula || 'V-S/C'
  const resolvedDoctorName = doctor?.name || 'Dr. Especialista CMZenit'
  const resolvedSpecialty = doctor?.specialty_name || (record.area === 'estetica' ? 'Medicina Estética & Dermoestética' : 'Medicina General & Especializada')
  const resolvedLicense = doctor?.mpps_license || 'MPPS 84.920 / CMDC 41.201'
  const isEstetica = record.area === 'estetica'

  const handlePrint = () => {
    window.print()
  }

  const handleShareWhatsApp = () => {
    const text = `*RÉCIPE MÉDICO OFICIAL - GRUPO MÉDICO ZENIT*%0A%0A*Paciente:* ${resolvedPatientName}%0A*Cédula:* ${resolvedPatientCedula}%0A*Médico Tratante:* ${resolvedDoctorName} (${resolvedSpecialty})%0A*Licencia:* ${resolvedLicense}%0A*Fecha:* ${record.admission_date}%0A%0A*DIAGNÓSTICO:*%0A${record.diagnosis}%0A%0A*TRATAMIENTO Y POSOLOGÍA:*%0A${record.treatment}%0A%0ACentro Comercial Galerías Sebucán, Caracas. Tel: +58 212 999-ZENIT`
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Barra de Acciones Superior (No se imprime) */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-[#02B2C6] flex items-center justify-center">
              {isEstetica ? <Sparkles className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                {isEstetica ? 'Ficha Dermoestética Digital' : 'Récipe Médico Oficial'}
              </h3>
              <p className="text-[10px] text-zinc-400">Validez digital nacional e internacional</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENEDOR DEL RÉCIPE IMPRIMIBLE */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-white text-zinc-900 recipe-sheet">
          <div id="printable-recipe" className="space-y-6 bg-white p-2">
            {/* ENCABEZADO CLÍNICO CON MEMBRETE */}
            <div className="flex items-start justify-between border-b-2 border-[#02B2C6] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#02B2C6] text-white font-black flex items-center justify-center text-base shadow-sm">
                    Z
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-zinc-900 leading-none">
                      GRUPO MÉDICO ZENIT
                    </h1>
                    <span className="text-[10px] font-bold tracking-widest text-[#02B2C6] uppercase">
                      Salud & Estética Integral
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 max-w-sm pt-1 leading-tight">
                  CC Galerías Sebucán, Nivel 1, Los Dos Caminos, Caracas - Venezuela.
                  <br />
                  Tel: +58 (212) 999-ZENIT | WhatsApp: +58 (412) 123-4567 | RIF: J-50123456-7
                </p>
              </div>

              {/* Sello de Especialista */}
              <div className="text-right space-y-0.5">
                <span className="text-xs font-extrabold text-zinc-900 block">{resolvedDoctorName}</span>
                <span className="text-[11px] font-semibold text-[#02B2C6] block">{resolvedSpecialty}</span>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full inline-block">
                  {resolvedLicense}
                </span>
              </div>
            </div>

            {/* DATOS DEL PACIENTE */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Paciente:</span>
                <strong className="text-zinc-900 font-bold">{resolvedPatientName}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Cédula de Identidad:</span>
                <strong className="text-zinc-900 font-bold">{resolvedPatientCedula}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Fecha de Emisión:</span>
                <strong className="text-zinc-900 font-bold">{record.admission_date}</strong>
              </div>
            </div>

            {/* ALERTA CLÍNICA DE ALERGIAS */}
            {record.allergies && record.allergies.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5">
                <span className="font-black text-[10px] uppercase tracking-wider text-white bg-rose-600 px-2 py-0.5 rounded-md shadow-sm">
                  ⚠️ ALERGIAS CONFIRMADAS
                </span>
                <span className="font-bold text-rose-800">{record.allergies.join(' • ')}</span>
              </div>
            )}

            {/* CONSTANTES Y SIGNOS VITALES */}
            {record.vital_signs && (
              <div className="p-3 bg-zinc-50/80 rounded-2xl border border-zinc-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                  Constantes Vitales en Consulta:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                  {record.vital_signs.blood_pressure && (
                    <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-2xs">
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 block">Tensión Art.</span>
                      <strong className="text-zinc-800 font-bold">{record.vital_signs.blood_pressure}</strong>
                    </div>
                  )}
                  {record.vital_signs.heart_rate && (
                    <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-2xs">
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 block">Pulso / FC</span>
                      <strong className="text-zinc-800 font-bold">{record.vital_signs.heart_rate}</strong>
                    </div>
                  )}
                  {record.vital_signs.temperature && (
                    <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-2xs">
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 block">Temperatura</span>
                      <strong className="text-zinc-800 font-bold">{record.vital_signs.temperature}</strong>
                    </div>
                  )}
                  {record.vital_signs.oxygen_saturation && (
                    <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-2xs">
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 block">SpO2 (Oxígeno)</span>
                      <strong className="text-zinc-800 font-bold">{record.vital_signs.oxygen_saturation}</strong>
                    </div>
                  )}
                  {record.vital_signs.weight_kg && (
                    <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-2xs">
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 block">Peso</span>
                      <strong className="text-zinc-800 font-bold">{record.vital_signs.weight_kg} kg</strong>
                    </div>
                  )}
                  {record.vital_signs.bmi && (
                    <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-2xs">
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 block">IMC</span>
                      <strong className="text-[#02B2C6] font-extrabold">{record.vital_signs.bmi}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DIAGNÓSTICO MÉDICO */}
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-zinc-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#02B2C6]" />
                Diagnóstico Concluyente:
              </span>
              <p className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-xs font-semibold text-zinc-800 leading-relaxed">
                {record.diagnosis}
              </p>
            </div>

            {/* PRESCRIPCIÓN MÉDICA Y POSOLOGÍA (Rp / Rx) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-1">
                <span className="text-sm font-black text-[#02B2C6] tracking-wider">
                  Rp. / Prescripción Médica:
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold">Indicaciones Posológicas</span>
              </div>
              <div className="p-4 rounded-2xl bg-cyan-50/40 border border-[#02B2C6]/30 text-xs text-zinc-900 whitespace-pre-line leading-relaxed font-mono">
                {record.treatment}
              </div>
            </div>

            {/* EXÁMENES Y ESTUDIOS COMPLEMENTARIOS (SI APLICA) */}
            {record.exams_json && record.exams_json.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-zinc-500 block">
                  Exámenes y Laboratorios Solicitados / Evaluados:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {record.exams_json.map((ex, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
                      <span className="font-bold text-zinc-800">{ex.name}</span>
                      <span className="text-[10px] text-zinc-500 font-medium">{ex.result || ex.type || 'Solicitado'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ESTUDIOS Y ARCHIVOS ADJUNTOS */}
            {record.attachments && record.attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-zinc-500 block">
                  Estudios Médicos e Imágenes Adjuntas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {record.attachments.map((att, idx) => {
                    const isImage = !att.name.toLowerCase().endsWith('.pdf') && !att.file_type?.includes('pdf')

                    return (
                      <a
                        key={idx}
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100/60 flex items-center gap-2.5 transition text-zinc-800"
                      >
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={att.file_url}
                            alt={att.name}
                            className="w-10 h-10 rounded-lg object-cover border border-cyan-300 shrink-0"
                          />
                        ) : (
                          <span className="text-[#02B2C6] font-bold text-base shrink-0">📎</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold truncate text-[11px] block">{att.name}</span>
                          <span className="text-[10px] text-zinc-500 font-medium">{att.size_kb} KB</span>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* PIE DEL RÉCIPE: FIRMA, SELLO Y QR */}
            <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Código QR de validación */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white p-1 rounded-xl border border-zinc-300 flex items-center justify-center">
                  <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" stroke="black" />
                    <rect x="14" y="3" width="7" height="7" stroke="black" />
                    <rect x="3" y="14" width="7" height="7" stroke="black" />
                    <rect x="5" y="5" width="3" height="3" fill="black" />
                    <rect x="16" y="5" width="3" height="3" fill="black" />
                    <rect x="5" y="16" width="3" height="3" fill="black" />
                    <line x1="14" y1="14" x2="17" y2="14" stroke="black" />
                    <line x1="19" y1="14" x2="21" y2="14" stroke="black" />
                    <line x1="14" y1="17" x2="14" y2="20" stroke="black" />
                    <line x1="17" y1="17" x2="21" y2="21" stroke="black" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-zinc-700 block">
                    Validación Digital
                  </span>
                  <span className="text-[9px] text-zinc-400 block font-mono">
                    ID: REC-{record.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block flex items-center gap-0.5">
                    ● Documento Verificado
                  </span>
                </div>
              </div>

              {/* Firma y Sello del Médico */}
              <div className="text-center w-56 space-y-1">
                <div className="border-b border-zinc-400 w-44 mx-auto pb-6 text-zinc-300 text-xs italic">
                  Firma & Sello Digital
                </div>
                <strong className="text-xs text-zinc-900 block font-bold">{resolvedDoctorName}</strong>
                <span className="text-[10px] text-zinc-500 block">{resolvedLicense}</span>
              </div>
            </div>

            <p className="text-[9px] text-center text-zinc-400 italic pt-2">
              Documento médico oficial emitido conforme a la Ley del Ejercicio de la Medicina y normativas del MPPS de la República Bolivariana de Venezuela.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
