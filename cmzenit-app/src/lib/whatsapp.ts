export interface WhatsAppNotificationPayload {
  eventType: 'cancellation' | 'confirmation' | 'reminder' | 'status_update'
  patientName: string
  patientPhone: string
  patientCedula?: string
  appointmentDate: string
  appointmentTime: string
  serviceName?: string
  doctorName?: string
  reason?: string
  clinicName?: string
}

/**
 * Envía un evento al Webhook de n8n o API de WhatsApp para notificar a los pacientes / secretaría
 */
export async function sendWhatsAppNotification(
  payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; message?: string }> {
  const webhookUrl = process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL

  if (!webhookUrl || webhookUrl.includes('tu-instancia-n8n.com')) {
    console.warn(
      '[WhatsApp Webhook] URL no configurada o en modo plantilla. Omitiendo envío.'
    )
    return {
      success: false,
      message: 'Webhook URL no configurada en las variables de entorno',
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        clinicName: payload.clinicName || 'Centro Médico Zenit',
        sentAt: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Webhook respondió con estado HTTP ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error('[WhatsApp Webhook Error]:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al enviar webhook',
    }
  }
}
