export type UserRole = 'paciente' | 'secretaria' | 'doctor' | 'admin'
export type ClinicArea = 'salud' | 'estetica'
export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'en_sala'
  | 'atendida'
  | 'solicitud_cancelacion'
  | 'cancelada'

export interface Profile {
  id: string
  full_name: string
  cedula: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  auth_provider: string | null
  role: UserRole
  created_at: string
}

export interface Service {
  id: number
  name: string
  category: ClinicArea
  price: number
  duration: string
  description: string | null
  promo_tag: string | null
  is_active: boolean
  created_at: string
}

export interface Doctor {
  id: string
  user_id: string | null
  name: string
  area: ClinicArea
  specialty_name: string
  mpps_license: string
  schedule_text: string
  is_active: boolean
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string | null
  patient_name: string
  patient_cedula: string
  patient_phone: string
  doctor_id: string | null
  service_id: number | null
  area: ClinicArea
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  check_in_time: string | null
  cancellation_reason: string | null
  whatsapp_notified: boolean
  created_at: string
}

export interface MedicalRecordExam {
  name: string
  type?: string
  result?: string
  file_url?: string
  date?: string
}

export interface MedicalRecord {
  id: string
  appointment_id: string | null
  patient_cedula: string
  patient_name: string
  doctor_id: string | null
  area: ClinicArea
  admission_date: string
  previous_consult_date: string | null
  symptoms: string
  diagnosis: string
  treatment: string
  recipe_file_url: string | null
  exams_json: MedicalRecordExam[]
  created_at: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name: string
          email: string
          cedula?: string | null
          phone?: string | null
          avatar_url?: string | null
          auth_provider?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: Partial<Profile>
        Relationships: []
      }
      services: {
        Row: Service
        Insert: {
          id?: number
          name: string
          category?: ClinicArea
          price: number
          duration: string
          description?: string | null
          promo_tag?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Service>
        Relationships: []
      }
      doctors: {
        Row: Doctor
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          area?: ClinicArea
          specialty_name: string
          mpps_license: string
          schedule_text: string
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Doctor>
        Relationships: []
      }
      appointments: {
        Row: Appointment
        Insert: {
          id?: string
          patient_id?: string | null
          patient_name: string
          patient_cedula: string
          patient_phone: string
          doctor_id?: string | null
          service_id?: number | null
          area: ClinicArea
          appointment_date: string
          appointment_time: string
          status?: AppointmentStatus
          check_in_time?: string | null
          cancellation_reason?: string | null
          whatsapp_notified?: boolean
          created_at?: string
        }
        Update: Partial<Appointment>
        Relationships: []
      }
      medical_records: {
        Row: MedicalRecord
        Insert: {
          id?: string
          appointment_id?: string | null
          patient_cedula: string
          patient_name: string
          doctor_id?: string | null
          area?: ClinicArea
          admission_date?: string
          previous_consult_date?: string | null
          symptoms: string
          diagnosis: string
          treatment: string
          recipe_file_url?: string | null
          exams_json?: MedicalRecordExam[] | Json
          created_at?: string
        }
        Update: Partial<MedicalRecord>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      clinic_area: ClinicArea
      appointment_status: AppointmentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
