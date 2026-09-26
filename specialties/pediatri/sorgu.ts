/**
 * NOTYA-AYSE-STANDART-01 — Ayşe dosya sorgulama standardının PEDİATRİ parametreleri (Dr. Gökhan Mamur, 2026-09-26).
 *
 * Çekirdek (lib/asistan/dosyaSorgu) takvim / eğri / gelişim bilmez; bu dosya pediatrinin mevcut motorlarını BAĞLAR
 * (kopya yok):
 *   - Soru 3 büyüme: engines/buyume.ts (Neyzi LMS persentil / Z, persentilKaymalari, buyumeHizlari) + hedef boy
 *     (lib/clinical/hedefBoy.ts, anne-baba boyu dosyada varsa).
 *   - Soru 4 aşı: engines/asiPlan.ts (SB GBP takvimi, telafi, onerilenDonem) — yalnız aşı TABLOSUNDAKİ satır
 *     "uygulandı"dır; not metnindeki plan çekirdekte ayrıca "planlandı" olarak gösterilir.
 *   - Soru 8 gelişim: engines/gelisimPlan.ts vizitPlani (SB izlem protokolü pencereleri, GİDR basamağı, M-CHAT-R/F
 *     16–30 ay, düzeltilmiş yaş) + notlardaki ebeveyn kaygısı / regresyon ifadeleri.
 */
import type { BransSorguParametreleri, AsiDoz, Degerlendirme } from '@/lib/asistan/dosyaSorgu/parametreler'
import type { AcikIs } from '@/lib/doktor/acikIsler'
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { trGun } from '@/lib/doktor/dosyaOlaylari'
import { planKarsiligi, planOlaylari } from '@/lib/doktor/planTakibi'
import { asiPlani, onerilenDonem, SERI_AD, type AsiKaydi } from './engines/asiPlan'
import { olcumSatirlari, persentilKaymalari, buyumeHizlari, persentilKisa, zMetni, PARAM_AD, PARAM_BIRIM, REFERANS_AD, type Olcum } from './engines/buyume'
import { vizitPlani, type MchatKaydi, type TaramaKaydi, type TaramaSonuc, type TaramaTur } from './engines/gelisimPlan'
import { yasMetni, tamAy } from './engines/girdi'
import { hesaplaHedefBoy } from '@/lib/clinical/hedefBoy'
import { esanlamGruplariBul } from '@/lib/klinik/sikayetEsanlam'
import type { BuyumeParametre } from '@/lib/clinical/buyumeEgrisi'

const trS = (n: number, b = 1) => n.toLocaleString('tr-TR', { maximumFractionDigits: b })

function buyume(olaylar: DosyaOlayi[], hasta: DosyaHastasi): Degerlendirme {
  const tarihler = new Map<string, Olcum>()
  for (const o of olaylar) {
    if (!['kilo', 'boy', 'basCevresi'].includes(o.tur) || o.deger == null) continue
    const m: Olcum = tarihler.get(o.tarih) || { tarih: o.tarih }
    m[o.tur as 'kilo' | 'boy' | 'basCevresi'] = o.deger
    tarihler.set(o.tarih, m)
  }
  const olcumler = [...tarihler.values()]
  if (!olcumler.length) return { satirlar: ['Dosyada tarihli kilo / boy / baş çevresi ölçümü bulamadım.'], bayraklar: [] }
  if (!hasta.dogumIso || !hasta.cinsiyet) {
    return { satirlar: [`Doğum tarihi veya cinsiyet kayıtlı olmadığı için persentil hesaplanamadı; ölçümler: ${olcumler.map((o) => `${trGun(o.tarih)} kilo ${o.kilo ?? '—'} kg, boy ${o.boy ?? '—'} cm`).join('; ')}.`], bayraklar: [] }
  }
  const satirlar = olcumSatirlari('neyzi', hasta.cinsiyet, hasta.dogumIso, olcumler)
  const out: string[] = [`Referans: ${REFERANS_AD.neyzi}. Ölçümler (eskiden yeniye):`]
  for (const s of satirlar) {
    const p = (Object.keys(s.deger) as BuyumeParametre[]).filter((k) => k !== 'vki').map((k) => {
      const r = s.sonuc[k]
      return `${PARAM_AD[k]} ${trS(s.deger[k]!, 2)} ${PARAM_BIRIM[k]}${r ? ` (p${persentilKisa(r.persentil).replace('.', '')}, z ${zMetni(r.z)})` : ''}`
    })
    out.push(`- ${trGun(s.tarih)} (${yasMetni(hasta.dogumIso, s.tarih)}): ${p.join('; ')}`)
  }
  const bayraklar: AcikIs[] = []
  if (satirlar.length < 2) out.push('Tek ölçüm var — eğilim (yön / hız) için yeterli veri yok; tek ölçümle karar verilmez.')
  const kaymalar = persentilKaymalari(satirlar)
  for (const k of kaymalar) {
    const yon = k.cizgi < 0 ? 'aşağı' : 'yukarı'
    const cumle = `${PARAM_AD[k.param]} persentili p${Math.round(k.pOnce)} → p${Math.round(k.pSon)} (${trGun(k.oncekiTarih)} → ${trGun(k.sonTarih)}): ${Math.abs(k.cizgi)} majör persentil çizgisi ${yon}`
    out.push(`- Kayma: ${cumle}.`)
    bayraklar.push({ oncelik: k.cizgi < 0 ? 'yakinda' : 'rutin', tur: 'buyume', tarih: k.sonTarih, metin: `Büyüme: ${cumle} — ${k.cizgi < 0 ? 'büyüme eğrisinde düşüş' : 'eğride yukarı kayma'}; hekim değerlendirir.` })
  }
  for (const h of buyumeHizlari(satirlar)) {
    out.push(`- ${PARAM_AD[h.param]} artışı: ${h.fark >= 0 ? '+' : '−'}${trS(Math.abs(h.fark), 2)} ${PARAM_BIRIM[h.param]} (${trGun(h.oncekiTarih)} → ${trGun(h.sonTarih)}, ${trS(h.aralikAy)} ay)${h.kisaAralik ? ' — kısa aralık, ölçüm hatası büyüktür' : ''}.`)
  }
  const son = satirlar[satirlar.length - 1]
  const kp = son?.sonuc.kilo?.persentil, bp = son?.sonuc.boy?.persentil
  if (kp != null && bp != null && Math.abs(kp - bp) >= 50) out.push(`- Kilo-boy orantısı: son ölçümde kilo p${Math.round(kp)}, boy p${Math.round(bp)} — belirgin fark.`)
  const anne = olaylar.find((o) => o.tur === 'anne-boy')?.deger, baba = olaylar.find((o) => o.tur === 'baba-boy')?.deger
  if (anne && baba) {
    const hb = hesaplaHedefBoy({ anneBoy: anne, babaBoy: baba, cinsiyet: hasta.cinsiyet === 'male' ? 'erkek' : 'kiz' })
    if (hb.ok) out.push(`- Hedef boy (anne ${anne} cm, baba ${baba} cm; ${hb.sonuc.formul}): ${trS(hb.sonuc.cocukCm)} cm (${trS(hb.sonuc.altCm)}–${trS(hb.sonuc.ustCm)}).`)
  } else {
    out.push('- Anne-baba boyu dosyada yok; hedef boy hesaplanmadı.')
  }
  return { satirlar: out, bayraklar }
}

function asi(olaylar: DosyaOlayi[], hasta: DosyaHastasi) {
  if (!hasta.dogumIso) return null
  const kayitlar: AsiKaydi[] = olaylar.filter((o) => o.kaynak === 'asi').map((o) => ({
    id: o.kaynakId, ad: o.metin.replace(/\s*\(.*$/, ''), dozNo: o.doz ?? null, tarih: o.tarih === '0000-00-00' ? null : o.tarih, kaynak: 'kayit' as const,
  }))
  const plan = asiPlani({ dogumIso: hasta.dogumIso, bugunIso: hasta.bugunIso, donem: onerilenDonem(hasta.dogumIso, kayitlar), kayitlar })
  const dozlar: AsiDoz[] = plan.seriler.flatMap((s) => s.dozlar.map((d) => ({
    seri: s.seri, no: d.no, ad: `${SERI_AD[s.seri]} ${d.etiket}`, durum: d.durum === 'yapildi' ? 'uygulandi' as const : d.durum,
    onerilen: d.onerilen || null, uygulamaTarihi: d.kayit?.tarih ?? null, telafi: d.telafi,
  })))
  return {
    surum: plan.surum, dozlar, notlar: plan.notlar,
    eslesmeyen: [...plan.eslesmeyen, ...plan.fazla].map((k) => `${k.ad}${k.tarih ? ` (${trGun(k.tarih)})` : ''}`),
    riskBazli: plan.ozel.filter((o) => o.kayitlar.length || o.uygunluk === 'uygun').map((o) => `${o.ad}: ${o.kayitlar.length ? `kayıtlı (${o.kayitlar.map((k) => trGun(k.tarih)).join(', ')})` : 'takvim dışı (özel / risk bazlı) — kayıt yok, yaşa göre konuşulabilir'}`),
  }
}

const GELISIM_KAYGI = /endise|kaygi|merak ediyor|soruyor|gecikme|gerili|konusmuyor|konusamiyor|kelime|yurumuyor|goz temasi|ismine|ortak dikkat|isaret etmiyor|oyun oynamiyor/
const REGRESYON = /regresyon|gerileme|kaybetti|artik (konusmuyor|yapmiyor|yurumuyor|soylemiyor)|once .* simdi .*(yapmiyor|soylemiyor)/

function gelisim(olaylar: DosyaOlayi[], hasta: DosyaHastasi): Degerlendirme {
  if (!hasta.dogumIso) return { satirlar: ['Doğum tarihi kayıtlı değil; yaşa göre gelişim değerlendirmesi kurulamadı.'], bayraklar: [] }
  const gh = olaylar.find((o) => o.tur === 'perinatal')?.deger ?? null
  const tarama = (a: string) => olaylar.filter((o) => o.kaynak === 'olcum' && o.tur === 'tarama' && o.anahtar === a)
  const mchat: MchatKaydi[] = tarama('mchat').map((o) => ({ tarih: o.tarih, risk: /yuksek|yüksek/.test(o.metin) ? 'yuksek' : /orta/.test(o.metin) ? 'orta' : 'dusuk' }))
  const gidr = tarama('gidr').map((o) => ({ tarih: o.tarih, sevk: /sevk önerildi/.test(o.metin) }))
  const TUR: TaramaTur[] = ['isitme', 'kirmizi_refle', 'gorme', 'rop', 'otizm', 'dvit', 'demir', 'hb']
  const taramalar: TaramaKaydi[] = olaylar.filter((o) => o.kaynak === 'olcum' && o.tur === 'tarama' && TUR.includes(o.anahtar as TaramaTur))
    .map((o) => ({ tur: o.anahtar as TaramaTur, tarih: o.tarih, sonuc: (/normal/.test(o.metin) ? 'normal' : /sevk/.test(o.metin) ? 'sevk' : /ileri/.test(o.metin) ? 'ileri_degerlendirme' : 'yapildi') as TaramaSonuc }))
  const seanslar = olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'vizit').map((o) => o.tarih)
  const p = vizitPlani({ dogumIso: hasta.dogumIso, bugunIso: hasta.bugunIso, gebelikHaftasi: gh, mchat, gidr, taramalar, seanslar })

  const ay = tamAy(hasta.dogumIso, hasta.bugunIso)
  const out: string[] = []
  out.push(`Kronolojik yaş: ${yasMetni(hasta.dogumIso, hasta.bugunIso)} (${ay} ay)${p.duzeltilmisGun != null ? `; düzeltilmiş yaş ≈ ${Math.floor(p.duzeltilmisGun / 30.4375)} ay (gebelik haftası ${gh}) — gelişim düzeltilmiş yaşla, aşı takvim yaşıyla` : ''}.`)
  out.push(p.gidrBasamak ? `GİDR yaş basamağı: ${p.gidrBasamak.etiket} (açık uçlu, günlük yaşam soruları — GİDR ayrı veri kaynağıdır).` : 'GİDR basamağı: 36 ay üstü — GİDR itemli liste yok; gelişimsel gözlem ve ebeveyn anlatımı esas.')
  if (ay >= 18 && ay <= 24) out.push('18–24 ay: sosyal iletişim, ortak dikkat, isme yanıt ve işaret etme özellikle sorulmalı.')

  const kayitli = olaylar.filter((o) => o.kaynak === 'olcum' && o.tur === 'tarama')
  out.push(kayitli.length ? `Kayıtlı tarama sonuçları: ${kayitli.map((o) => `${o.metin} (${trGun(o.tarih)})`).join('; ')}.` : 'Kayıtlı tarama sonucu (GİDR / M-CHAT-R/F / diğer) yok.')
  for (const pl of planOlaylari(olaylar).filter((o) => o.tur === 'tarama')) {
    const k = planKarsiligi(pl, olaylar)
    out.push(k ? `Planlanan tarama (${trGun(pl.tarih)}: "${pl.metin}") → sonuç kaydı ${trGun(k.tarih)}.` : `Gelişimsel tarama planlanmış (${trGun(pl.tarih)}: "${pl.metin}"); tamamlanmış sonuç dosyada görünmüyor.`)
  }
  const bayraklar: AcikIs[] = []
  for (const k of p.kalemler.filter((x) => x.kod === 'otizm' || x.kod === 'gidr' || x.kod === 'gelisim_testi')) {
    out.push(`Tarama durumu — ${k.ad}: ${k.durum === 'tamam' ? 'bu pencerede kayıtlı' : k.durum === 'gecikti' ? 'penceresi geçti, kayıt yok' : k.durum === 'simdi' ? 'şu an pencerede, kayıt yok' : k.durum === 'dikkat' ? 'dikkat' : k.durum === 'yaklasiyor' ? 'yaklaşıyor' : 'sürekli izlem'} — ${k.ne}`)
    const planVar = planOlaylari(olaylar).some((o) => o.tur === 'tarama' && !planKarsiligi(o, olaylar))
    if ((k.durum === 'gecikti' || k.durum === 'simdi') && !planVar) bayraklar.push({ oncelik: 'yakinda', tur: 'tarama-zamani', metin: `${k.ad}: ${k.durum === 'gecikti' ? 'penceresi geçti' : 'şu an pencerede'}; tamamlanmış kayıt dosyada görünmüyor.` })
    if (k.durum === 'dikkat') bayraklar.push({ oncelik: 'bugun', tur: 'gelisim', metin: `${k.ad}: ${k.ne}` })
  }

  const kaygilar: string[] = []
  let regresyon: DosyaOlayi | null = null
  for (const v of olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'vizit')) {
    const oyku = v.metin.split(' | Plan:')[0]
    const n = oyku.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i')
    if (REGRESYON.test(n)) regresyon = v
    if (GELISIM_KAYGI.test(n) || esanlamGruplariBul(oyku).some((g) => g.id === 'gelisim')) kaygilar.push(`${trGun(v.tarih)}: ${oyku.slice(0, 200)}`)
  }
  out.push(kaygilar.length ? `Ebeveyn kaygısı / gelişimle ilgili not ifadeleri (klinik veri): ${kaygilar.slice(-4).join(' · ')}` : 'Notlarda ebeveynin gelişimle ilgili bir kaygısı yazılmamış.')
  if (regresyon) {
    out.push(`⚠ Regresyon ifadesi (${trGun(regresyon.tarih)}) — yüksek öncelik.`)
    bayraklar.push({ oncelik: 'bugun', tur: 'gelisim', tarih: regresyon.tarih, metin: `Gelişimsel regresyon ifadesi (${trGun(regresyon.tarih)} notu) — yüksek öncelik; değerlendirme / sevk kaydı hekimde.` })
  }
  return { satirlar: out, bayraklar }
}

export const PEDIATRI_SORGU: BransSorguParametreleri = {
  anahtar: 'pediatri',
  ad: 'Pediatri',
  buyume,
  asi,
  asiTakvimiYok: '',
  gelisim,
}
