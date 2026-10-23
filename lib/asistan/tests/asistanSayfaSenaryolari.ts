/**
 * AU-DEPTH-PARITY-03 — fixed scenarios of Türkiye's /asistan page (the shared page view). The stored markup of each one
 * (asistanSayfa.baseline.json) was captured from the page BEFORE it was made country-neutral, so the test proves the
 * Turkish page renders byte for byte the same through the shared view. Test data only: never shipped.
 */
import { PERSONAS, PERSONA_ORDER } from '@/lib/asistan/personaEngine'

type Any = any // eslint-disable-line @typescript-eslint/no-explicit-any

const noop = async () => {}
const kart = {
  oneri: { id: 'o1', eylem_anahtar: 'ilac_ekle', etiket: 'İlaç ekle', kademe: 'T1', veri: { ad: 'Parol' }, alanlar: [{ anahtar: 'ad', etiket: 'İlaç', tip: 'metin' }], eksik_alanlar: [] },
  hasta: { ad: 'Mehmet Yılmaz', dogumTarihi: '2019-03-04' },
}

export function temelOturum(): Any {
  const persona = PERSONAS[PERSONA_ORDER[0]]
  return {
    persona, personaKey: PERSONA_ORDER[0], status: 'idle', isActive: false, messages: [], errorMsg: '', sureUzatmaGoster: false, sesKarti: null,
    ortakOturumId: null, hazirla: async () => 'tamam', startConversation: noop, stopConversation: noop, switchPersona() {}, sureUzat() {}, sesKartiniKapat() {},
    yazili: { acik: false, mesajlar: [], girdi: '', bekliyor: false, dinliyor: false, aktifHasta: null },
    setYaziliAcik() {}, setYaziliGirdi() {}, yaziliGonder: noop, yaziliMikrofon() {}, oturumuKapat: noop,
  }
}

const mesajlar = [
  { id: 'm1', role: 'user', text: 'Mehmet Yılmaz kaç kez geldi?', sira: 1 },
  { id: 'm2', role: 'ai', text: '**Toplam:** 3 muayene\n- 12 Mart\n- 4 Nisan\n\n| Tarih | Tanı |\n|---|---|\n| 12 Mart | Otit |', sira: 2 },
]

export type Senaryo = { ad: string; mobil: boolean; o: Any }
export function senaryolar(): Senaryo[] {
  const s = (ad: string, mobil: boolean, yama: (o: Any) => void): Senaryo => { const o = temelOturum(); yama(o); return { ad, mobil, o } }
  return [
    s('bos-bosta-mobil', true, () => {}),
    s('bos-bosta-masaustu', false, () => {}),
    s('baglaniyor', true, (o) => { o.status = 'connecting'; o.isActive = true }),
    s('dinliyor-mesajli', true, (o) => { o.status = 'listening'; o.isActive = true; o.messages = mesajlar }),
    s('konusuyor-masaustu', false, (o) => { o.status = 'speaking'; o.isActive = true; o.messages = mesajlar }),
    s('hata', true, (o) => { o.status = 'error'; o.errorMsg = 'Mikrofona izin verilmedi.'; o.messages = mesajlar.slice(0, 1) }),
    s('sessiz-sure-uzat', true, (o) => { o.status = 'sessiz'; o.sureUzatmaGoster = true; o.messages = mesajlar }),
    s('ses-karti', true, (o) => { o.status = 'listening'; o.isActive = true; o.messages = mesajlar; o.sesKarti = kart }),
    s('yazili-kapali', true, () => {}),
    s('yazili-acik-bos', true, (o) => { o.yazili.acik = true }),
    s('yazili-acik-mesajli', true, (o) => {
      o.yazili = { acik: true, girdi: 'son hastam', bekliyor: true, dinliyor: true, aktifHasta: 'Mehmet Yılmaz', mesajlar: [
        { rol: 'doktor', icerik: 'Mehmet Yılmaz ilaçları?', sira: 3 },
        { rol: 'asistan', icerik: '**Parol** 5 ml', sira: 4, oneriler: [kart.oneri], hasta: kart.hasta, yonlendirme: { metin: 'x', etiket: 'Reçeteye git', yol: '/dashboard/doktor/recete' } },
        { rol: 'asistan', icerik: 'İki öneri', sira: 5, oneriler: [kart.oneri, { ...kart.oneri, id: 'o2' }], hasta: kart.hasta },
      ] }
    }),
    s('yazili-dinlemiyor-girdi-bos', false, (o) => { o.yazili.acik = true; o.yazili.mesajlar = [{ rol: 'doktor', icerik: 'Merhaba', sira: 1 }] }),
  ]
}
