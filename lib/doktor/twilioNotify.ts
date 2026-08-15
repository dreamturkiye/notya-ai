/** Twilio WhatsApp / SMS helpers for doktor hatırlatma. */

export function normalizeTrPhoneE164(raw: string): string | null {
  let digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length === 11) digits = '90' + digits.slice(1)
  if (digits.length === 10 && digits.startsWith('5')) digits = '90' + digits
  if (!digits.startsWith('90') || digits.length < 12) return null
  return '+' + digits
}

function cleanEnv(value: string | undefined | null): string {
  return String(value || '')
    .split('#')[0]
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim()
}

function twilioBasicAuth(): string | null {
  const apiKey = cleanEnv(process.env.TWILIO_API_KEY)
  const apiSecret = cleanEnv(process.env.TWILIO_API_SECRET)
  if (apiKey && apiSecret) {
    return Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  }
  const sid = cleanEnv(process.env.TWILIO_ACCOUNT_SID)
  const token = cleanEnv(process.env.TWILIO_AUTH_TOKEN)
  if (sid && token) {
    return Buffer.from(`${sid}:${token}`).toString('base64')
  }
  return null
}

function whatsappFrom(): string | null {
  const from = cleanEnv(process.env.TWILIO_WHATSAPP_FROM)
  return from || null
}

function smsFrom(): string | null {
  // Never reuse WhatsApp From for SMS — that number is often not an SMS-capable
  // Twilio Incoming Phone Number and returns "not a Twilio phone number".
  const explicit = cleanEnv(
    process.env.TWILIO_SMS_FROM ||
      process.env.TWILIO_PHONE_NUMBER ||
      process.env.TWILIO_FROM_NUMBER
  )
  return explicit || null
}

export type TwilioSendResult =
  | { ok: true; sid: string; channel: 'whatsapp' | 'sms' }
  | { ok: false; error: string; channel: 'whatsapp' | 'sms' }

export async function sendTwilioMessage(opts: {
  channel: 'whatsapp' | 'sms'
  toPhone: string
  body: string
}): Promise<TwilioSendResult> {
  const accountSid = cleanEnv(process.env.TWILIO_ACCOUNT_SID)
  const auth = twilioBasicAuth()
  if (!accountSid || !auth) {
    return { ok: false, channel: opts.channel, error: 'Twilio yapılandırması eksik' }
  }

  const e164 = normalizeTrPhoneE164(opts.toPhone)
  if (!e164) {
    return { ok: false, channel: opts.channel, error: 'Geçersiz telefon numarası' }
  }

  let from: string | null
  let to: string
  if (opts.channel === 'whatsapp') {
    from = whatsappFrom()
    to = e164.startsWith('whatsapp:') ? e164 : `whatsapp:${e164}`
    if (from && !from.toLowerCase().startsWith('whatsapp:')) {
      from = `whatsapp:${from}`
    }
  } else {
    from = smsFrom()
    to = e164
  }

  if (!from) {
    return {
      ok: false,
      channel: opts.channel,
      error:
        opts.channel === 'sms'
          ? 'SMS için Twilio telefon numarası yok. TWILIO_SMS_FROM ekleyin veya WhatsApp kullanın.'
          : 'WhatsApp gönderici numarası yok',
    }
  }

  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: opts.body }).toString(),
    }
  )

  const text = await resp.text()
  let json: { sid?: string; message?: string; error_message?: string } = {}
  try {
    json = JSON.parse(text) as typeof json
  } catch {
    /* plain text error */
  }

  if (!resp.ok) {
    const raw =
      json.error_message || json.message || text.slice(0, 180) || `Twilio ${resp.status}`
    const lower = raw.toLowerCase()
    let error = raw
    if (
      lower.includes('region indicated') ||
      lower.includes('geo') ||
      lower.includes('21408') ||
      lower.includes('permission to send an sms has not been enabled')
    ) {
      error =
        'Twilio Türkiye SMS izni kapalı. Console → Messaging → Settings → Geo Permissions içinde Turkey’i açın. Şimdilik WhatsApp deneyin.'
    } else if (
      lower.includes('not a twilio phone number') ||
      lower.includes('short code country mismatch') ||
      lower.includes('is not a valid')
    ) {
      error =
        'SMS gönderici numarası Twilio SMS numarası değil. Console’dan SMS özellikli numara alın, TWILIO_SMS_FROM olarak ekleyin; veya WhatsApp kullanın.'
    }
    return {
      ok: false,
      channel: opts.channel,
      error,
    }
  }

  return { ok: true, channel: opts.channel, sid: String(json.sid || '') }
}
