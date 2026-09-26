/**
 * NOTYA-ILETISIM-03 — doktorun WhatsApp hesabında Notya'nın oluşturduğu iki Türkçe UTILITY şablonu.
 *
 * KVKK: şablonlarda klinik ayrıntı YOK — yalnız randevu bilgisi ve güvenli Sağlığım bağlantısı.
 * Meta kuralı: gövde bir değişkenle başlayamaz/bitemez ve her değişken için örnek zorunludur.
 * Şablonlar doktorun kendi WABA'sında oluşturulur (her doktor ayrı onaydan geçer; genelde dakikalar).
 * notya_kalkan_yonlendirme bu haritaya EKLENMEZ — Meta’ya elle sunulur (NOTYA-KALKAN-01).
 */
import { graph, GraphHatasi, type FetchFn } from './graph'

export const SAGLIKIM_KOK = 'https://www.notya.io/portal/hasta/'

export type SablonKodu = 'randevu_hatirlatma' | 'saglikim_yeni_mesaj'

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
    govde:
      'Merhaba {{1}}, {{2}} saat {{3}} için {{4}} ile randevunuzu hatırlatırız. Gelemeyecekseniz lütfen bu mesaja yanıt verin.',
    ornek: ['Ayşe', '12 Ekim Pazartesi', '14:30', 'Dr. Mehmet Demir'],
  },
  saglikim_yeni_mesaj: {
    kod: 'saglikim_yeni_mesaj',
    degiskenler: ['hasta adı', 'doktor adı', 'Sağlığım bağlantısı'],
    govde: 'Merhaba {{1}}, {{2}} size Sağlığım üzerinden yeni bir not bıraktı. Okumak için aşağıdaki düğmeye dokunun.',
    ornek: ['Ayşe', 'Dr. Mehmet Demir'],
    dugme: { metin: 'Notu aç', url: `${SAGLIKIM_KOK}{{1}}`, ornek: `${SAGLIKIM_KOK}ornek-baglanti` },
  },
}

export const SABLON_KODLARI = Object.keys(SABLONLAR) as SablonKodu[]

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
  const durumlar = SABLON_KODLARI.map((k) => d[k]?.durum || 'YOK')
  if (durumlar.every((x) => x === 'APPROVED')) return 'hazir'
  if (durumlar.some((x) => x === 'REJECTED' || x === 'DISABLED' || x === 'PAUSED')) return 'sorun'
  return 'bekliyor'
}
