import { PatientLoginView } from '@/components/auth/PatientLoginView'

export const metadata = {
  title: 'Portal del Paciente - Grupo Médico Zenit',
  description: 'Inicia sesión o regístrate como paciente en Grupo Médico Zenit Caracas.',
}

export default function PatientLoginPage() {
  return (
    <div className="min-h-[82vh] w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <PatientLoginView />
    </div>
  )
}
