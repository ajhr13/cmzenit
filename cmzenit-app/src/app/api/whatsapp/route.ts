import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      phone,
      patientName,
      doctorName,
      serviceName,
      date,
      time,
      reason,
      eventType = 'cancellation',
    } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Número de teléfono requerido' },
        { status: 400 }
      )
    }

    // Normalizar número telefónico eliminando espacios, guiones y signos más
    const cleanPhone = phone.replace(/[^0-9]/g, '')

    // Construir mensaje preformateado para WhatsApp
    let messageText = ''
    if (eventType === 'cancellation') {
      messageText = `🏥 *Centro Médico & Estética Zenit*\n\nEstimado(a) *${patientName || 'Paciente'}*,\nLe contactamos de Secretaría para informarle que su cita médica${
        serviceName ? ` de *${serviceName}*` : ''
      }${doctorName ? ` con *${doctorName}*` : ''} pautada para el día *${date}* a las *${time}* ha sido *cancelada*.\n\n📌 *Motivo:* ${
        reason || 'Requerimiento médico / administrativo'
      }.\n\nPor favor contáctenos a este mismo número para coordinar su reprogramación a la brevedad posible.\n\n_Atentamente, Secretaría CMZenit._`
    } else {
      messageText = `🏥 *Centro Médico & Estética Zenit*\n\nEstimado(a) *${patientName || 'Paciente'}*,\nLe confirmamos su cita${
        serviceName ? ` de *${serviceName}*` : ''
      } para el día *${date}* a las *${time}*.\n\n¡Le esperamos con gusto en nuestras instalaciones!`
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`

    // Log de auditoría
    console.log(`[WhatsApp API Audit] Notificación generada para ${patientName} (${cleanPhone}) - Evento: ${eventType}`)

    // Disparar Webhook hacia n8n o servicio de mensajería si está configurado
    const webhookUrl = process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL
    let webhookStatus = 'omitted'

    if (webhookUrl && !webhookUrl.includes('tu-instancia-n8n.com')) {
      try {
        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            patientName,
            doctorName,
            serviceName,
            date,
            time,
            reason,
            eventType,
            formattedMessage: messageText,
            timestamp: new Date().toISOString(),
          }),
        })
        webhookStatus = webhookRes.ok ? 'sent' : `failed_${webhookRes.status}`
      } catch (err) {
        console.error('[WhatsApp API Webhook Error]:', err)
        webhookStatus = 'network_error'
      }
    }

    return NextResponse.json({
      success: true,
      waUrl,
      formattedMessage: messageText,
      webhookStatus,
      sentAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[WhatsApp API Error]:', error)
    return NextResponse.json(
      { success: false, error: 'Error procesando solicitud de WhatsApp' },
      { status: 500 }
    )
  }
}
