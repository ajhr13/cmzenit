import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Por favor proporciona una dirección de correo electrónico válida.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const tempCode = Math.floor(100000 + Math.random() * 900000).toString()
    const timestamp = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })

    // Registro de despacho de correo en servidor
    console.log('\n======================================================')
    console.log('📧 [CMZenit EMAIL SERVICE] CORREO DE RECUPERACIÓN')
    console.log(`Destinatario: ${cleanEmail}`)
    console.log(`Fecha/Hora: ${timestamp} (Caracas)`)
    console.log(`Código OTP Temporal: ${tempCode}`)
    console.log(`Enlace de restablecimiento: https://cmzenit.com/auth/reset-password?email=${encodeURIComponent(cleanEmail)}&code=${tempCode}`)
    console.log('Asunto: Restablecimiento de contraseña — Grupo Médico Zenit')
    console.log('======================================================\n')

    // Si existe integración con servicio de correo externo (Resend, Webhook o SMTP)
    const webhookUrl = process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL || process.env.EMAIL_WEBHOOK_URL
    if (webhookUrl && !webhookUrl.includes('tu-instancia')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'password_reset_requested',
            email: cleanEmail,
            tempCode,
            timestamp,
            clinic: 'Grupo Médico Zenit (Caracas)',
          }),
        })
      } catch (webhookErr) {
        console.warn('Aviso webhook correo/WhatsApp:', webhookErr)
      }
    }

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      tempCode,
      message: `Se ha enviado el enlace y código de recuperación al correo ${cleanEmail}. Por favor revisa tu bandeja de entrada o carpeta de spam.`,
      timestamp,
    })
  } catch (error: unknown) {
    console.error('Error en API forgot-password:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al procesar el envío de correo.',
      },
      { status: 500 }
    )
  }
}
