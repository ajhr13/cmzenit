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

    // --- SALUD / ESPECIALIDADES CLÍNICAS & QUIRÚRGICAS ---
    // Oftalmología / Evaluación visual / Cirugía Oculoplástica
    if (srvName.includes('oftalmo') || srvName.includes('visual') || srvName.includes('ojo') || srvName.includes('oculoplást')) {
      return spec.includes('oftalmólog') || spec.includes('oftalmolog') || spec.includes('visual')
    }

    // Cardiología Infantil vs Adulta
    if (srvName.includes('cardio')) {
      if (srvName.includes('infantil') || srvName.includes('pediátr') || srvName.includes('niñ')) {
        return (spec.includes('cardiólog') || spec.includes('cardiolog')) && (spec.includes('infantil') || spec.includes('pediátr'))
      }
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

    // Odontología, Odontopediatría & Patología Bucal
    if (srvName.includes('odontopediatr')) {
      return spec.includes('odontopediatr') || (spec.includes('odont') && spec.includes('pediatr'))
    }
    if (srvName.includes('patología bucal') || srvName.includes('patologia bucal')) {
      return spec.includes('patolog') || spec.includes('bucal')
    }
    if (
      srvName.includes('odonto') ||
      srvName.includes('bucal') ||
      srvName.includes('dental') ||
      srvName.includes('sonrisa') ||
      srvName.includes('ortodoncia')
    ) {
      return spec.includes('odont') || spec.includes('bucal') || spec.includes('dental') || spec.includes('ortodonc')
    }

    // Pediatría general
    if (srvName.includes('pediatría') || srvName.includes('pediatria')) {
      return spec.includes('pediatr') && !spec.includes('cardio') && !spec.includes('odonto')
    }

    // Cirugías especializadas
    if (srvName.includes('cardiovascular')) {
      return spec.includes('cardiovascular')
    }
    if (srvName.includes('oncológica') || srvName.includes('oncologica')) {
      return spec.includes('cirujano oncólogo') || spec.includes('cirugia oncologica') || spec.includes('oncol')
    }
    if (srvName.includes('neurocirugía') || srvName.includes('neurocirugia')) {
      return spec.includes('neurociruj') || spec.includes('neurocirug')
    }
    if (srvName.includes('traumatología') || srvName.includes('traumatologia') || srvName.includes('mano')) {
      return spec.includes('traumatól') || spec.includes('traumatol') || spec.includes('ortoped')
    }
    if (srvName.includes('urología') || srvName.includes('urologia')) {
      return spec.includes('urólog') || spec.includes('urolog')
    }
    if (srvName.includes('neumonología') || srvName.includes('neumonologia')) {
      return spec.includes('neumonól') || spec.includes('neumonol') || spec.includes('pulmonar')
    }
    if (srvName.includes('gastroenterología') || srvName.includes('gastroenterologia')) {
      return spec.includes('gastro')
    }
    if (srvName.includes('oncología médica') || srvName.includes('oncologia medica')) {
      return spec.includes('oncólog') || spec.includes('oncolog')
    }
    if (srvName.includes('endocrinología') || srvName.includes('endocrinologia')) {
      return spec.includes('endocrinól') || spec.includes('endocrinol')
    }
    if (srvName.includes('neurología') || srvName.includes('neurologia')) {
      return (spec.includes('neurólog') || spec.includes('neurolog')) && !spec.includes('neurociruj')
    }
    if (srvName.includes('nefrología') || srvName.includes('nefrologia') || srvName.includes('diálisis')) {
      return spec.includes('nefrólog') || spec.includes('nefrolog') || spec.includes('diálisis')
    }
    if (srvName.includes('infectología') || srvName.includes('infectologia')) {
      return spec.includes('infectól') || spec.includes('infectol')
    }
    if (srvName.includes('nutrición') || srvName.includes('nutricion')) {
      return spec.includes('nutric') || spec.includes('diet')
    }
    if (srvName.includes('psicología') || srvName.includes('psicologia')) {
      return spec.includes('psicól') || spec.includes('psicol')
    }
    if (srvName.includes('fisioterapia') || srvName.includes('rehabilitación') || srvName.includes('rehabilitacion')) {
      return spec.includes('fisioterap') || spec.includes('fisiatra') || spec.includes('kinesio')
    }
    if (srvName.includes('emergencia') || srvName.includes('urgencia')) {
      return spec.includes('emergenc') || spec.includes('urgenc') || spec.includes('general') || spec.includes('internista')
    }
    if (srvName.includes('laboratorio')) {
      return spec.includes('bioanal') || spec.includes('laboratorio')
    }

    // Medicina Interna
    if (srvName.includes('interna')) {
      return spec.includes('internista') || spec.includes('interna')
    }

    // Cirugía General
    if (srvName.includes('cirugía general') || srvName.includes('cirugia general')) {
      return spec.includes('cirujano') || spec.includes('cirugía general') || spec.includes('cirugia general')
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
