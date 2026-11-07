-- ========================================================
-- CMZenit: Centro Médico & Estética Integral
-- Esquema Completo de Base de Datos para Supabase (Idempotente)
-- Actualizado: 2026-11-05
-- ========================================================

-- 1. TIPOS ENUMERADOS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('paciente', 'secretaria', 'doctor', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_area') THEN
        CREATE TYPE clinic_area AS ENUM ('salud', 'estetica');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM (
            'pendiente',
            'confirmada',
            'en_sala',
            'atendida',
            'solicitud_cancelacion',
            'cancelada'
        );
    END IF;
END $$;

-- 2. TABLA DE PERFILES DE USUARIO (Conectada a Auth de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    cedula TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'email',
    role user_role DEFAULT 'paciente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger automático para registrar perfil cuando un usuario se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, cedula, phone, avatar_url, auth_provider, role)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario CMZenit'),
    NEW.email,
    NEW.raw_user_meta_data->>'cedula',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'paciente'::user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    cedula = COALESCE(EXCLUDED.cedula, public.profiles.cedula),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Función auxiliar para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()::text;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. CATÁLOGO DE SERVICIOS MÉDICOS Y PROCEDIMIENTOS ESTÉTICOS
CREATE TABLE IF NOT EXISTS public.services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category clinic_area NOT NULL DEFAULT 'salud',
    price DECIMAL(10,2) NOT NULL,
    duration TEXT NOT NULL,
    description TEXT,
    promo_tag TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar constraint UNIQUE en name si la tabla ya existía
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'services_name_unique'
    ) THEN
        ALTER TABLE public.services ADD CONSTRAINT services_name_unique UNIQUE (name);
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 4. DOCTORES Y ESPECIALISTAS MÉDICOS / ESTÉTICOS
CREATE TABLE IF NOT EXISTS public.doctors (
    id TEXT PRIMARY KEY DEFAULT ('doc-' || substr(md5(random()::text), 1, 8)),
    user_id TEXT,
    name TEXT NOT NULL,
    area clinic_area NOT NULL DEFAULT 'salud',
    specialty_name TEXT NOT NULL,
    mpps_license TEXT NOT NULL,
    schedule_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CITAS MÉDICAS Y ESTÉTICAS
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT ('apt-' || substr(md5(random()::text), 1, 8)),
    patient_id TEXT,
    patient_name TEXT NOT NULL,
    patient_cedula TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
    service_id INT REFERENCES public.services(id) ON DELETE SET NULL,
    area clinic_area NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    status appointment_status DEFAULT 'confirmada',
    check_in_time TEXT,
    cancellation_reason TEXT,
    whatsapp_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HISTORIAL CLÍNICO / FICHAS DERMOESTÉTICAS
CREATE TABLE IF NOT EXISTS public.medical_records (
    id TEXT PRIMARY KEY DEFAULT ('rec-' || substr(md5(random()::text), 1, 8)),
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_cedula TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
    area clinic_area NOT NULL DEFAULT 'salud',
    admission_date DATE DEFAULT CURRENT_DATE,
    previous_consult_date DATE,
    symptoms TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    recipe_file_url TEXT,
    exams_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alto rendimiento para búsquedas y consultas
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_cedula ON public.appointments (patient_cedula);
CREATE INDEX IF NOT EXISTS idx_medical_records_cedula ON public.medical_records (patient_cedula);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON public.medical_records (doctor_id);

-- ========================================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- SERVICIOS: Lectura pública de servicios activos
DROP POLICY IF EXISTS "Servicios visibles para todos" ON public.services;
CREATE POLICY "Servicios visibles para todos" ON public.services
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin puede gestionar servicios" ON public.services;
CREATE POLICY "Admin puede gestionar servicios" ON public.services
    FOR ALL USING (auth.role() = 'authenticated');

-- DOCTORES: Lectura pública de doctores activos
DROP POLICY IF EXISTS "Doctores visibles para todos" ON public.doctors;
CREATE POLICY "Doctores visibles para todos" ON public.doctors
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin puede gestionar doctores" ON public.doctors;
CREATE POLICY "Admin puede gestionar doctores" ON public.doctors
    FOR ALL USING (auth.role() = 'authenticated');

-- PERFILES: Cada usuario lee/actualiza su propio perfil
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.profiles
    FOR SELECT USING (auth.uid()::text = id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir inserción de perfiles" ON public.profiles;
CREATE POLICY "Permitir inserción de perfiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- CITAS: Pacientes ven sus citas y personal gestiona todo
DROP POLICY IF EXISTS "Lectura de citas" ON public.appointments;
CREATE POLICY "Lectura de citas" ON public.appointments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción de citas" ON public.appointments;
CREATE POLICY "Inserción de citas" ON public.appointments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualización de citas" ON public.appointments;
CREATE POLICY "Actualización de citas" ON public.appointments
    FOR UPDATE USING (true);

-- HISTORIAL MÉDICO: Lectura e inserción controlada
DROP POLICY IF EXISTS "Lectura de historias médicas" ON public.medical_records;
CREATE POLICY "Lectura de historias médicas" ON public.medical_records
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción de historias médicas por médicos" ON public.medical_records;
CREATE POLICY "Inserción de historias médicas por médicos" ON public.medical_records
    FOR INSERT WITH CHECK (true);

-- ========================================================
-- BUCKETS DE ALMACENAMIENTO (SUPABASE STORAGE)
-- ========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('recipes', 'recipes', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para lectura pública de récipes y fotos
DROP POLICY IF EXISTS "Récipes médicos públicos" ON storage.objects;
CREATE POLICY "Récipes médicos públicos" ON storage.objects
    FOR SELECT USING (bucket_id = 'recipes');

DROP POLICY IF EXISTS "Subida de récipes autorizada" ON storage.objects;
CREATE POLICY "Subida de récipes autorizada" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'recipes');

-- ========================================================
-- DATOS SEMILLA ACTUALIZADOS (CMZENIT)
-- ========================================================

-- A. SERVICIOS (18 Servicios Oficiales sin Pediatría)
INSERT INTO public.services (id, name, category, price, duration, description, promo_tag, is_active)
VALUES
    -- Especialidades Médicas (Salud)
    (1, 'Consulta General & Medicina Familiar', 'salud', 30.00, '30 min', 'Evaluación médica integral, control de signos vitales, chequeo de salud general y emisión de récipe digital.', 'Atención Diaria', true),
    (2, 'Hospitalización & Cuidados Clínicos', 'salud', 120.00, '24 horas', 'Habitaciones individuales con monitoreo multiparámetro, atención de enfermería 24/7 y administración de tratamiento endovenoso.', 'Monitoreo 24/7', true),
    (3, 'Oftalmología & Evaluación Visual', 'salud', 50.00, '40 min', 'Examen de agudeza visual, biomicroscopía en lámpara de hendidura, tonometría (presión ocular) y fondo de ojo.', 'Salud Visual', true),
    (4, 'Ginecología & Obstetricia Integral', 'salud', 55.00, '45 min', 'Control ginecológico preventivo, toma de citología (Papanicolau), ecografía pélvica/transvaginal y control prenatal.', 'Chequeo Mujer', true),
    (5, 'Cardiología & Ecocardiografía', 'salud', 55.00, '45 min', 'Electrocardiograma digital, evaluación preoperatoria y control de presión arterial.', 'Más Solicitado', true),
    (6, 'Medicina Interna', 'salud', 45.00, '40 min', 'Diagnóstico integral del adulto, control de glicemia, perfil metabólico y chequeo preventivo.', NULL, true),
    (19, 'Odontología Integral & Diseño de Sonrisa', 'salud', 40.00, '45 min', 'Profilaxis ultrasónica, odontología estética, resinas de alta densidad, blanqueamiento dental y ortodoncia correctiva.', 'Sonrisa Perfecta', true),

    -- Espacio Estética: Masajes y Corporal (Volante CMZenit)
    (8, 'Masajes Post-Operatorios (Drenaje Linfático)', 'estetica', 40.00, '50 min', 'Drenaje linfático manual especializado postcirugía estética, alivio de edemas, prevención de fibrosis y aceleración de recuperación.', 'Post-Cirugía', true),
    (9, 'Masajes Relajantes & Antiestrés', 'estetica', 35.00, '50 min', 'Terapia manual corporal con aceites botánicos y aromaterapia para descargar tensiones musculares y restaurar el bienestar.', 'Bienestar', true),
    (10, 'Tratamiento Anticelulítico & Moldeador', 'estetica', 70.00, '60 min', 'Protocolo reductor intensivo combinado con ultracavitación, radiofrecuencia, criolipólisis y ultrasonido.', 'Combinado 4 en 1', true),
    (11, 'Depilación Láser Diodo (Sesión)', 'estetica', 45.00, '30 min', 'Cabezal refrigerado con tecnología indolora para eliminación progresiva del vello en cualquier fototipo cutáneo.', 'Paquete Disponible', true),

    -- Espacio Estética: Facial (Volante CMZenit)
    (12, 'Hidrafacial + Radiofrecuencia Facial', 'estetica', 65.00, '60 min', 'Limpieza hidro-dermoabrasiva con succión vorticial, infusión de sueros de ácido hialurónico y radiofrecuencia tensora.', 'Piel Radiante', true),
    (13, 'Dermoabrasión & Ultrasonido Facial', 'estetica', 50.00, '45 min', 'Exfoliación mecánica profunda con punta de diamante y ondas ultrasónicas para renovar la capa córnea y limpiar poros.', 'Renovación', true),
    (14, 'Peeling Ultrasónico Profundo', 'estetica', 40.00, '40 min', 'Espátula ultrasónica de alta vibración para remover células muertas, comedones y exceso de sebo sin agredir la piel.', NULL, true),
    (15, 'Terapia con Martillo en Frío (Crioterapia Facial)', 'estetica', 35.00, '30 min', 'Cierre de poros con frío localizado, reducción de inflamación, sellado de nutrientes y efecto tensor inmediato.', 'Calmante', true),
    (16, 'Fototerapia Facial con Máscara LED', 'estetica', 35.00, '35 min', 'Luces terapéuticas espectrales (roja para colágeno, azul bactericida para acné y verde para despigmentación celular).', 'Fotónica', true),
    (17, 'Protocolo de Hidratación & Protector Solar', 'estetica', 45.00, '45 min', 'Velo hidratante concentrado, mascarilla hidroplástica regeneradora y sellado con protector solar dermatológico de amplio espectro.', 'Nutrición', true),
    (18, 'Armonización Facial & Toxina Botulínica (Bótox)', 'estetica', 180.00, '60 min', 'Perfilado labial con ácido hialurónico y atenuación suave de arrugas de expresión con toxina botulínica.', 'Médico Especialista', true)
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    duration = EXCLUDED.duration,
    description = EXCLUDED.description,
    promo_tag = EXCLUDED.promo_tag,
    is_active = EXCLUDED.is_active;

-- Borrar Pediatría si existía previamente en la base de datos
DELETE FROM public.services WHERE name ILIKE '%pediatr%';

-- B. ESPECIALISTAS Y DOCTORES CERTIFICADOS
INSERT INTO public.doctors (id, user_id, name, area, specialty_name, mpps_license, schedule_text, is_active)
VALUES
    ('doc-1', 'user-base-doctor', 'Dr. Carlos Mendoza', 'salud', 'Cardiólogo - Ecocardiografista', 'MPPS 84.920 / CMDC 41.201', 'Lunes a Viernes: 8:00 AM - 1:00 PM', true),
    ('doc-2', 'user-doc-2', 'Dra. Valeria Santos', 'salud', 'Médico Internista & Hospitalización', 'MPPS 92.314 / CMDC 43.850', 'Lunes a Sábado: 8:00 AM - 4:00 PM', true),
    ('doc-5', 'user-doc-5', 'Dra. Mariana Castillo', 'salud', 'Ginecología & Obstetricia - Ecografía', 'MPPS 95.780 / CMDC 46.220', 'Lunes, Miércoles y Viernes: 8:30 AM - 2:00 PM', true),
    ('doc-6', 'user-doc-6', 'Dr. Roberto Blanco', 'salud', 'Oftalmólogo Clínico & Quirúrgico', 'MPPS 88.650 / CMO 32.140', 'Martes, Jueves y Sábados: 9:00 AM - 3:00 PM', true),
    ('doc-7', 'user-doc-7', 'Dra. Carmen Mendoza', 'salud', 'Médico Cirujano - Consulta General', 'MPPS 112.440 / CMDC 51.300', 'Lunes a Sábado: 8:00 AM - 5:00 PM', true),
    ('doc-3', 'user-doc-3', 'Dra. Sofía Rincón', 'estetica', 'Dermatóloga & Medicina Estética', 'MPPS 104.521 / CMM 50.119', 'Lunes a Sábado: 10:00 AM - 4:00 PM', true),
    ('doc-4', 'user-doc-4', 'Lic. Patricia Navas', 'estetica', 'Cosmiatra & Terapeuta Dermoestética', 'COL-EST 12.840', 'Lunes a Viernes: 9:00 AM - 5:00 PM', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    area = EXCLUDED.area,
    specialty_name = EXCLUDED.specialty_name,
    mpps_license = EXCLUDED.mpps_license,
    schedule_text = EXCLUDED.schedule_text,
    is_active = EXCLUDED.is_active;

-- C. USUARIOS PRECONFIGURADOS DE ACCESO DEMO
INSERT INTO public.profiles (id, full_name, cedula, email, phone, avatar_url, auth_provider, role)
VALUES
    ('user-base-paciente', 'Juan Pérez', 'V-18456789', 'paciente@cmzenit.com', '+58 412 1234567', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', 'google', 'paciente'),
    ('user-base-secretaria', 'Lic. María Gómez', 'V-15890123', 'recepcion@cmzenit.com', '+58 414 7654321', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80', 'email', 'secretaria'),
    ('user-base-doctor', 'Dr. Carlos Mendoza', 'V-12345678', 'doctor@cmzenit.com', '+58 416 9988776', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80', 'email', 'doctor'),
    ('user-base-admin', 'Dra. Elena Ramos', 'V-11223344', 'admin@cmzenit.com', '+58 412 9998877', 'https://images.unsplash.com/photo-1594824813587-0b1a030113c2?auto=format&fit=crop&w=150&q=80', 'email', 'admin')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    cedula = EXCLUDED.cedula,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

-- D. CITAS DE EJEMPLO
INSERT INTO public.appointments (id, patient_id, patient_name, patient_cedula, patient_phone, doctor_id, service_id, area, appointment_date, appointment_time, status, check_in_time, cancellation_reason, whatsapp_notified)
VALUES
    ('apt-1', 'user-base-paciente', 'Juan Pérez', 'V-18456789', '+58 412 1234567', 'doc-1', 1, 'salud', CURRENT_DATE, '09:00 AM', 'en_sala', '08:48 AM', NULL, true),
    ('apt-2', 'user-pat-2', 'Mariana Silva', 'V-20112345', '+58 424 9876543', 'doc-3', 12, 'estetica', CURRENT_DATE, '11:00 AM', 'solicitud_cancelacion', NULL, 'Inconveniente laboral de última hora. Solicito reprogramar para la tarde.', false),
    ('apt-3', 'user-base-paciente', 'Juan Pérez', 'V-18456789', '+58 412 1234567', 'doc-4', 10, 'estetica', CURRENT_DATE + INTERVAL '2 days', '02:30 PM', 'confirmada', NULL, NULL, true),
    ('apt-4', 'user-pat-3', 'Carlos Alberto Gil', 'V-14789654', '+58 416 3322110', 'doc-2', 2, 'salud', CURRENT_DATE - INTERVAL '5 days', '10:00 AM', 'atendida', '09:55 AM', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- E. HISTORIAL CLÍNICO Y ANTECEDENTES
INSERT INTO public.medical_records (id, appointment_id, patient_cedula, patient_name, doctor_id, area, admission_date, previous_consult_date, symptoms, diagnosis, treatment, recipe_file_url, exams_json)
VALUES
    (
        'rec-1',
        'apt-4',
        'V-18456789',
        'Juan Pérez',
        'doc-1',
        'salud',
        CURRENT_DATE - INTERVAL '15 days',
        CURRENT_DATE - INTERVAL '45 days',
        'Palpitaciones ocasionales post-esfuerzo, mareos leves matutinos. Tensión arterial basal 135/88 mmHg.',
        'Hipertensión Arterial Estadio 1 controlada. Bradicardia sinusal fisiológica.',
        'Losartán Potásico 50mg (1 comprimido diario en ayunas). Dieta baja en sodio y actividad física moderada 30 min/día.',
        'https://cmzenit.com/recipes/recipe_juan_perez_cardio.pdf',
        '[
            {"name": "Electrocardiograma en Reposo (12 derivaciones)", "type": "Estudio Cardiológico", "result": "Trazado regular, eje normal, sin signos de isquemia aguda.", "date": "2026-10-18"},
            {"name": "Perfil Lipídico Completo & Glicemia", "type": "Laboratorio de Sangre", "result": "Colesterol Total: 195 mg/dL, Triglicéridos: 140 mg/dL, Glicemia: 92 mg/dL.", "date": "2026-10-16"}
        ]'::jsonb
    ),
    (
        'rec-2',
        'apt-2',
        'V-18456789',
        'Juan Pérez',
        'doc-3',
        'estetica',
        CURRENT_DATE - INTERVAL '30 days',
        NULL,
        'Deshidratación facial, comedones en zona T y fotoenvejecimiento leve.',
        'Biotipo cutáneo mixto sensible con daño actínico incipiente.',
        'Protocolo de Limpieza HydraFacial + Sérum Niacinamida al 10% y Fotoprotector SPF 50 toque seco cada 4 horas.',
        'https://cmzenit.com/skincare/rutina_facial_juan_perez.pdf',
        '[
            {"name": "Dermatoscopia Facial Digital", "type": "Evaluación Cutánea", "result": "Sin lesiones melanocíticas atípicas. Poros dilatados en zona centrofacial.", "date": "2026-10-05"}
        ]'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- Habilitar replicación en tiempo real para citas e historias médicas
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_records;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Confirmación de ejecución exitosa
SELECT 'Base de datos CMZenit actualizada con éxito en Supabase.' AS status;
