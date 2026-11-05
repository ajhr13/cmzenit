# CMZenit — Salud y Estética Integral

Plataforma integral de gestión médica y estética para **CMZenit**, diseñada para conectar pacientes, médicos especialistas y secretaría con un diseño moderno, intuitivo y responsivo.

---

## 🌟 Características Principales

### 1. Portal del Paciente
* **Agendamiento Digital de Citas**: Selección de especialidad, médico, fecha y turno con cálculo automático de tarifas.
* **Control de Citas & Tratamientos**: Visualización en tiempo real de citas confirmadas, atendidas o en sala de espera.
* **Récipes Médicos & Fichas Dermoestéticas**: Acceso directo e historial de descargas de recetas y fichas clínicas en PDF.
* **Catálogo de Procedimientos**: 18 servicios médicos y estéticos (Salud, Masajes y Dermoestética Facial).

### 2. Consultorio Médico Digital (`/doctor`)
* **Buscador de Pacientes en Tiempo Real**: Búsqueda instantánea por Cédula de Identidad o Nombre para consultar antecedentes e historial médico completo.
* **Registro de Nuevos Pacientes**: Formulario ágil para registrar pacientes desde el consultorio e iniciar consulta inmediata.
* **Evolución Médica & Récipes**: Redacción de diagnóstico, tratamiento posológico, órdenes de exámenes (laboratorio e imagenología) y emisión de récipes.

### 3. Recepción y Secretaría (`/secretaria`)
* **Control de Sala de Espera**: Registro de llegada (Check-in) con marca de tiempo.
* **Gestión de Citas**: Confirmación, reprogramación y cancelaciones con aviso automático vía WhatsApp.

### 4. Dirección Médica y Administración (`/admin`)
* **Gestión de Personal & Usuarios**: Control de roles y accesos (RBAC).
* **Métricas y Reportes**: Indicadores de atención y ocupación de consultorios.

### 5. Asistente Virtual Inteligente (ZenitBot)
* Chatbot interactivo con respuestas rápidas organizadas en dos columnas para atención al paciente las 24 horas.

---

## 🛠️ Stack Tecnológico

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
* **Iconografía**: Lucide React.
* **Base de Datos & Auth**: Supabase (PostgreSQL, Row Level Security, Storage).
* **Móvil**: Capacitor (Sincronizado para Android e iOS).

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* Node.js 18+ y npm.

### Pasos
```bash
# 1. Ingresar a la carpeta de la aplicación
cd cmzenit-app

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo local
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## 📱 Compilación Móvil (Android / iOS)
```bash
cd cmzenit-app
npx cap sync
```
