// WhatsApp hatirlatma engine
// Turkiye: %88.6 WhatsApp kullanim orani (TUIK 2025)
// Strategy: WhatsApp Business Cloud API (server-side) + click-to-chat fallback

export interface HatirlatmaPayload {
  musteriAdi: string
  sirketAdi: string
  beyanTuru: string
  sonGun: string   // YYYY-MM-DD
  gunKaldi: number
  musteriTelefon?: string
  musavirAdi?: string
}

// Format son gun as Turkish date
export function formatTarih(iso: string): string {
  const d = new Date(iso)
  const months = ['Ocak','Subat','Mart','Nisan','Mayis','Haziran','Temmuz','Agustos','Eylul','Ekim','Kasim','Aralik']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

// Generate WhatsApp message text for a reminder
export function olusturMesaj(p: HatirlatmaPayload): string {
  const tarih = formatTarih(p.sonGun)
  const aciliyet = p.gunKaldi <= 1 ? 'BUGÜN SON GÜN' : p.gunKaldi <= 3 ? 'ACİL' : 'Hatırlatma'

  return `Sayın ${p.musteriAdi},

${aciliyet}: ${p.beyanTuru} için son gün ${tarih} (${p.gunKaldi} gün kaldı).

Beyanname hazırlığınız için lütfen bizimle iletişime geçin.

${p.musavirAdi ? p.musavirAdi + ' - Mali Müşavirlik' : 'Mali Müşavirlik'}

_Notya AI tarafından hazırlanmıştır_`
}

// Generate WhatsApp click-to-chat URL (no API needed)
// Opens WhatsApp with pre-filled message - user just hits Send
export function olusturWhatsAppLink(telefon: string, mesaj: string): string {
  // Normalize Turkish phone: 05XX -> 905XX
  const normalized = telefon.replace(/\s/g,'').replace(/^0/, '90').replace(/^\+/, '')
  const encoded = encodeURIComponent(mesaj)
  return `https://wa.me/${normalized}?text=${encoded}`
}

// Generate WhatsApp Business API payload (for server-side sending)
// Requires WHATSAPP_BUSINESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID env vars
export function olusturApiPayload(telefon: string, mesaj: string) {
  const normalized = telefon.replace(/\s/g,'').replace(/^0/, '90').replace(/^\+/, '')
  return {
    messaging_product: 'whatsapp',
    to: normalized,
    type: 'text',
    text: { body: mesaj }
  }
}

// Days until deadline
export function gunHesapla(sonGun: string): number {
  const today = new Date()
  today.setHours(0,0,0,0)
  const deadline = new Date(sonGun)
  deadline.setHours(0,0,0,0)
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
