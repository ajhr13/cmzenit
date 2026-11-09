import { Service, Doctor } from '@/types/database.types'

/**
 * Filtra los doctores o especialistas que corresponden de manera estricta y semántica
 * con el servicio o tratamiento seleccionado.
 *
 * Reglas de negocio del Centro Médico Zenit:
 * 1. El área (salud vs estética) debe coincidir estrictamente.
 * 2. Si el servicio o tratamiento tiene especialistas asignados que coinciden con su especialidad,
 *    retorna solo esos especialistas colegiados.
 * 3. Si el servicio o tratamiento NO tiene especialistas en el directorio que coincidan con su especialidad,
 *    retorna un arreglo vacío []. NUNCA debe mezclar o mostrar especialistas de otra especialidad.
 *    En ese caso, la cita quedará con doctor_id vacío (null) y la clínica le asignará uno
 *    con la secretaria cuando se valide y confirme la cita.
 */
export function getDoctorsForService(
  service: Service | null | undefined,
  doctors: Doctor[]
): Doctor[] {
  if (!service) return []

  const activeDoctors = doctors.filter((d) => d.is_active)
  // 1. Filtrado por área médica / estética
  const areaDoctors = activeDoctors.filter((d) => d.area === service.category)
  if (areaDoctors.length === 0) return []

  const srvName = (service.name || '').toLowerCase()

  // 2. Coincidencia por especialidad médica
  return areaDoctors.filter((doc) => {
    const spec = (doc.specialty_name || '').toLowerCase()

    // --- SALUD / ESPECIALIDADES CLÍNICAS ---
    // Oftalmología / Evaluación visual
    if (srvName.includes('oftalmo') || srvName.includes('visual') || srvName.includes('ojo')) {
      return spec.includes('oftalmólog') || spec.includes('oftalmolog') || spec.includes('visual')
    }

    // Cardiología / Ecocardiograma
    if (srvName.includes('cardio') || srvName.includes('ecocardio')) {
      return spec.includes('cardiólog') || spec.includes('cardiolog') || spec.includes('ecocardio')
    }

    // Ginecología & Obstetricia
    if (
      srvName.includes('gineco') ||
      srvName.includes('obstet') ||
      srvName.includes('mujer') ||
      srvName.includes('prenatal') ||
      srvName.includes('pélvica')
    ) {
      return spec.includes('ginecol') || spec.includes('obstet')
    }

    // Odontología & Salud Bucal
    if (
      srvName.includes('odonto') ||
      srvName.includes('bucal') ||
      srvName.includes('dental') ||
      srvName.includes('sonrisa')
    ) {
      return spec.includes('odont') || spec.includes('bucal') || spec.includes('dental')
    }

    // Medicina Interna
    if (srvName.includes('interna')) {
      return spec.includes('internista') || spec.includes('interna')
    }

    // Consulta General / Medicina Familiar
    if (srvName.includes('general') || srvName.includes('familiar')) {
      return (
        spec.includes('general') ||
        spec.includes('familiar') ||
        spec.includes('cirujano') ||
        spec.includes('internista')
      )
    }

    // Hospitalización & Cuidados Clínicos
    if (srvName.includes('hospitaliz')) {
      return spec.includes('hospitaliz') || spec.includes('internista') || spec.includes('general')
    }

    // --- DERMOESTÉTICA / BIENESTAR ---
    // Armonización Facial & Bótox / Procedimientos Médicos Estéticos
    if (
      srvName.includes('bótox') ||
      srvName.includes('botox') ||
      srvName.includes('armoniz') ||
      srvName.includes('toxina')
    ) {
      return spec.includes('dermatólog') || spec.includes('dermatolog') || spec.includes('médica estética')
    }

    // Masajes Corporales / Drenaje Linfático / Anticelulítico / Reductor
    if (
      srvName.includes('masaje') ||
      srvName.includes('drenaje') ||
      srvName.includes('anticelul') ||
      srvName.includes('moldeador')
    ) {
      return spec.includes('cosmiatra') || spec.includes('masoterapia')
    }

    // Depilación Láser
    if (srvName.includes('láser') || srvName.includes('laser') || srvName.includes('depilac')) {
      return spec.includes('cosmiatra') || spec.includes('dermatolog') || spec.includes('masoterapia')
    }

    // Tratamientos Faciales (Hidrafacial, Peeling, Dermoabrasión, Fototerapia, Frío, Hidratación)
    if (
      srvName.includes('facial') ||
      srvName.includes('peeling') ||
      srvName.includes('dermoabr') ||
      srvName.includes('ultrasonido') ||
      srvName.includes('martillo') ||
      srvName.includes('fototerapia') ||
      srvName.includes('hidratación') ||
      srvName.includes('limpieza')
    ) {
      return spec.includes('cosmiatra') || spec.includes('dermatólog') || spec.includes('dermatolog')
    }

    // Si es un servicio nuevo o sin coincidencia, NO asigna doctores de otra especialidad
    return false
  })
}
