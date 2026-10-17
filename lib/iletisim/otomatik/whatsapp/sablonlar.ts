/**
 * NOTYA-ILETISIM-03 / WHATSAPP-API-01 — doktorun WhatsApp hesabında Notya'nın oluşturduğu Türkçe UTILITY şablonları.
 *
 * KVKK: şablonlarda tanı, hastalık adı ya da klinik ayrıntı YOK — yalnız randevu bilgisi, genel bir "sonucunuz hazır /
 * bildiriminiz var" cümlesi ve güvenli Sağlığım bağlantısı (lib/iletisim/whatsapp/whatsapp-api.test.ts bunu zorlar).
 * Meta kuralı: gövde bir değişkenle başlayamaz/bitemez ve her değişken için örnek zorunludur.
 * Şablonlar doktorun kendi WABA'sında oluşturulur (her doktor ayrı onaydan geçer; genelde dakikalar).
 * notya_kalkan_yonlendirme bu haritaya EKLENMEZ — Meta’ya elle sunulur (NOTYA-KALKAN-01).
 */
import { graph, GraphHatasi, type FetchFn } from './graph'

export const SAGLIKIM_KOK = 'https://www.notya.io/portal/hasta/'

export type SablonKodu = 'randevu_hatirlatma' | 'saglikim_yeni_mesaj' | 'sonuc_hazir' | 'genel_bildirim' | 'randevu_iptal_onay'

export interface SablonTanimi {
  kod: SablonKodu
  /** Gönderirken beklenen değişken sırası (gonder() `degiskenler`). */
  degiskenler: readonly string[]
  govde: string
  ornek: string[]
  dugme?: { metin: string; url: string; ornek: string }
}

export const SABLONLAR: Record<SablonKodu, SablonTanimi> = {
  randevu_hatirlatma: {
    kod: 'randevu_hatirlatma',
    degiskenler: ['hasta adı', 'tarih', 'saat', 'doktor adı'],
    // The reply words are what the inbound pipeline acts on: EVET confirms, İPTAL cancels (lib/iletisim/whatsapp/niyet.ts).
    // "Merhaba" (not "Sayın"): the guardian greeting for minors is already "Sayın Veli" (VELI_HITABI).
    govde:
      'Merhaba {{1}}, randevunuz {{2}} tarihinde saat {{3}}’te, {{4}} ile. Onaylamak için EVET, iptal etmek için İPTAL yazın.',
    ornek: ['Ayşe', '12 Ekim Pazartesi', '14:30', 'Dr. Mehmet Demir'],
  },
  saglikim_yeni_mesaj: {
    kod: 'saglikim_yeni_mesaj',
    degiskenler: ['hasta adı', 'doktor adı', 'Sağlığım bağlantısı'],
    govde: 'Merhaba {{1}}, {{2}} size Sağlığım üzerinden yeni bir not bıraktı. Okumak için aşağıdaki düğmeye dokunun.',
    ornek: ['Ayşe', 'Dr. Mehmet Demir'],
    dugme: { metin: 'Notu aç', url: `${SAGLIKIM_KOK}{{1}}`, ornek: `${SAGLIKIM_KOK}ornek-baglanti` },
  },
  // Generic "your result is ready": names no test, value or condition — the detail lives behind the PIN-gated link.
  sonuc_hazir: {
    kod: 'sonuc_hazir',
    degiskenler: ['hasta adı', 'doktor adı', 'Sağlığım bağlantısı'],
    govde: 'Merhaba {{1}}, {{2}} tarafından hazırlanan bildiriminiz hazır. Ayrıntılar yalnızca Sağlığım’da görüntülenir; aşağıdaki düğmeye dokunun.',
    ornek: ['Ayşe', 'Dr. Mehmet Demir'],
    dugme: { metin: 'Görüntüle', url: `${SAGLIKIM_KOK}{{1}}`, ornek: `${SAGLIKIM_KOK}ornek-baglanti` },
  },
  // WHATSAPP-CANCEL-01: confirmation of a cancelled appointment. Inside the 24h window the patient gets the same sentence as
  // free text (serbest.ts iptalOnayMetni); this approved template is for a cancel confirmed after the window has closed
  // (the doctor cancels from the inbox card). Date and time only — no reason, no clinical text.
  randevu_iptal_onay: {
    kod: 'randevu_iptal_onay',
    degiskenler: ['hasta adı', 'tarih', 'saat', 'doktor adı'],
    govde: 'Merhaba {{1}}, {{2}} tarihinde saat {{3}}’teki randevunuz iptal edildi. Yeni randevu için {{4}} muayenehanesiyle iletişime geçebilirsiniz.',
    ornek: ['Ayşe', '12 Ekim Pazartesi', '14:30', 'Dr. Mehmet Demir'],
  },
  // Generic fallback: also what a doctor's card reply uses when the patient's 24h session window is closed.
  genel_bildirim: {
    kod: 'genel_bildirim',
    degiskenler: ['hasta adı', 'doktor adı'],
    govde: 'Merhaba {{1}}, {{2}} muayenehanesinden bir bildiriminiz var. Ayrıntı için lütfen muayenehaneyi arayın veya Sağlığım’ı kontrol edin.',
    ornek: ['Ayşe', 'Dr. Mehmet Demir'],
  },
}

export const SABLON_KODLARI = Object.keys(SABLONLAR) as SablonKodu[]

/** The two templates the card's "Hazır / Onay bekliyor / Onaylanmadı" summary and the reminder flow depend on. */
export const CEKIRDEK_SABLONLAR: readonly SablonKodu[] = ['randevu_hatirlatma', 'saglikim_yeni_mesaj']

/** Short Turkish name of a template for the status list on the card. */
export const SABLON_ADI: Record<SablonKodu, string> = {
  randevu_hatirlatma: 'Randevu hatırlatma',
  saglikim_yeni_mesaj: 'Sağlığım’da yeni mesaj',
  sonuc_hazir: 'Bildirim hazır',
  genel_bildirim: 'Genel bildirim',
  randevu_iptal_onay: 'Randevu iptal onayı',
}

/** Meta'nın şablon durumları + henüz oluşturulamadıysa YOK. */
export type SablonDurumu = 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED' | 'YOK' | string

export interface SablonKaydi {
  id: string | null
  durum: SablonDurumu
  guncellendi: string
}

export type SablonDurumlari = Partial<Record<SablonKodu, SablonKaydi>>

export function sablonGovdesi(t: SablonTanimi) {
  const components: Record<string, unknown>[] = [
    { type: 'BODY', text: t.govde, example: { body_text: [t.ornek] } },
  ]
  if (t.dugme) {
    components.push({ type: 'BUTTONS', buttons: [{ type: 'URL', text: t.dugme.metin, url: t.dugme.url, example: [t.dugme.ornek] }] })
  }
  return { name: t.kod, language: 'tr', category: 'UTILITY', components }
}

/** Eksik şablonları oluşturur, var olanların güncel durumunu okur. Hiçbir hata bağlanmayı durdurmaz. */
export async function sablonlariHazirla(wabaId: string, token: string, f: FetchFn = fetch): Promise<SablonDurumlari> {
  const simdi = new Date().toISOString()
  const mevcut = await sablonDurumlariniOku(wabaId, token, f).catch(() => ({} as SablonDurumlari))
  const sonuc: SablonDurumlari = { ...mevcut }
  for (const kod of SABLON_KODLARI) {
    if (sonuc[kod] && sonuc[kod]!.durum !== 'YOK') continue
    try {
      const r = await graph<{ id?: string; status?: string }>(`${wabaId}/message_templates`, { method: 'POST', token, body: sablonGovdesi(SABLONLAR[kod]) }, f)
      sonuc[kod] = { id: r.id ? String(r.id) : null, durum: String(r.status || 'PENDING').toUpperCase(), guncellendi: simdi }
    } catch (e) {
      // Aynı adla zaten varsa (ör. yeniden bağlama) bir sonraki okumada durum gelir.
      sonuc[kod] = { id: null, durum: 'YOK', guncellendi: simdi }
      if (!(e instanceof GraphHatasi)) throw e
    }
  }
  return sonuc
}

export async function sablonDurumlariniOku(wabaId: string, token: string, f: FetchFn = fetch): Promise<SablonDurumlari> {
  const simdi = new Date().toISOString()
  const r = await graph<{ data?: { id?: string; name?: string; status?: string; language?: string }[] }>(
    `${wabaId}/message_templates`,
    { token, query: { fields: 'id,name,status,language', limit: '100' } },
    f
  )
  const sonuc: SablonDurumlari = {}
  for (const s of r.data || []) {
    const kod = s.name as SablonKodu
    if (!SABLON_KODLARI.includes(kod) || (s.language && s.language !== 'tr')) continue
    sonuc[kod] = { id: s.id ? String(s.id) : null, durum: String(s.status || 'PENDING').toUpperCase(), guncellendi: simdi }
  }
  return sonuc
}

/** Doktorun gördüğü sade dil: tümü onaylıysa Hazır, reddedildiyse söyle, yoksa Onay bekliyor. */
export function sablonOzeti(d: SablonDurumlari): 'hazir' | 'bekliyor' | 'sorun' {
  const durumlar = CEKIRDEK_SABLONLAR.map((k) => d[k]?.durum || 'YOK')
  if (durumlar.every((x) => x === 'APPROVED')) return 'hazir'
  if (durumlar.some((x) => x === 'REJECTED' || x === 'DISABLED' || x === 'PAUSED')) return 'sorun'
  return 'bekliyor'
}
