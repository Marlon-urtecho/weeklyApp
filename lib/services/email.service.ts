export class EmailService {
  private readonly apiKey = process.env.RESEND_API_KEY
  private readonly from = process.env.EMAIL_FROM

  async sendPasswordResetCode(to: string, code: string, username: string) {
    if (!this.apiKey || !this.from) {
      throw new Error('Servicio de correo no configurado (RESEND_API_KEY/EMAIL_FROM)')
    }

    const subject = 'Recuperación de contraseña - Weekly'
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2>Recuperación de contraseña</h2>
        <p>Hola ${username},</p>
        <p>Tu código de recuperación es:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>Este código vence en 10 minutos.</p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.from,
        to: [to],
        subject,
        html
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`No se pudo enviar correo de recuperación (${response.status}) ${errorText}`)
    }
  }
}
