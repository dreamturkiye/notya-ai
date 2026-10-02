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
import type { BransSorguParametreleri, AsiDoz, AsiTutarsizligi, BuyumeOzeti, Degerlendirme } from '@/lib/asistan/dosyaSorgu/parametreler'
import type { AcikIs } from '@/lib/doktor/acikIsler'
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { trGun, uzunGun } from '@/lib/doktor/dosyaOlaylari'
import { planKarsiligi, planOlaylari } from '@/lib/doktor/planTakibi'
import { asiPlani, kayitSerisi, onerilenDonem, SERI_AD, type AsiKaydi } from './engines/asiPlan'
import { olcumSatirlari, persentilKaymalari, buyumeHizlari, persentilKisa, zMetni, tutarsizOlcumler, dogrulanmisSatirlar, KAYMA_BASLANGIC_AY, PARAM_AD, PARAM_BIRIM, REFERANS_AD, type BuyumeHizi, type Olcum } from './engines/buyume'
import { vizitPlani, type MchatKaydi, type TaramaKaydi, type TaramaSonuc, type TaramaTur } from './engines/gelisimPlan'
import { yasMetni, tamAy } from './engines/girdi'
import { hesaplaHedefBoy } from '@/lib/clinical/hedefBoy'
import { esanlamGruplariBul } from '@/lib/klinik/sikayetEsanlam'
import type { BuyumeParametre } from '@/lib/clinical/buyumeEgrisi'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

const trS = (n: number, b = 1) => n.toLocaleString('tr-TR', { maximumFractionDigits: b })

type BuyumeOlcumu = 'kilo' | 'boy' | 'basCevresi'
const BUYUME_OLCUMLERI: BuyumeOlcumu[] = ['kilo', 'boy', 'basCevresi']
const OLCUM_KAYNAGI: Record<string, string> = { olcum: 'muayene alanı', cihaz: 'cihaz ölçümü', not: 'not metni' }

export interface OlcumCeliskisi { tarih: string; param: BuyumeOlcumu; degerler: { deger: number; kaynak: string }[] }

/**
 * NOTYA-ILK10-YAPI-01 — büyüme ölçümleri, ÇELİŞENLER AYRILMIŞ olarak. Aynı gün aynı ölçüm için farklı değer taşıyan
 * kayıtlar (muayene alanı / cihaz ölçümü / not metnindeki etiketli değer) çelişkidir: hangisinin doğru olduğu
 * kayıttan anlaşılmaz, bu yüzden o tarihin o ölçümü eğilime, persentil kaymasına ve hız hesabına ALINMAZ — ama
 * gizlenmez, ayrı gösterilir. Not metni yalnız çelişkiyi görmek için okunur; eğilim alan / cihaz ölçümünden kurulur.
 */
export function buyumeOlcumleri(olaylar: DosyaOlayi[]): { olcumler: Olcum[]; celiskiler: OlcumCeliskisi[] } {
  const gorulen = new Map<string, { deger: number; kaynak: string }[]>()
  for (const o of olaylar) {
    const param = (o.kaynak === 'not' && o.tur === 'olcum-metin' ? o.anahtar : o.tur) as BuyumeOlcumu
    if (!BUYUME_OLCUMLERI.includes(param) || o.deger == null || !['olcum', 'cihaz', 'not'].includes(o.kaynak)) continue
    // Not metninden yalnız BULGU bölümündeki etiketli değer: öyküdeki kilo evde tartılmış olabilir, muayene ölçümü değildir.
    if (o.kaynak === 'not' && (o.tur !== 'olcum-metin' || !o.metin.startsWith('Bulgu'))) continue
    const anahtar = `${o.tarih}|${param}`
    gorulen.set(anahtar, [...(gorulen.get(anahtar) || []), { deger: o.deger, kaynak: OLCUM_KAYNAGI[o.kaynak] }])
  }
  const tarihler = new Map<string, Olcum>()
  const celiskiler: OlcumCeliskisi[] = []
  for (const [anahtar, degerler] of gorulen) {
    const [tarih, param] = anahtar.split('|') as [string, BuyumeOlcumu]
    if (new Set(degerler.map((d) => d.deger)).size > 1) { celiskiler.push({ tarih, param, degerler }); continue }
    // Yalnız not metninde geçen değer eğilime girmez (önceki davranış: eğri alan / cihaz ölçümünden kurulur).
    if (degerler.every((d) => d.kaynak === OLCUM_KAYNAGI.not)) continue
    const m: Olcum = tarihler.get(tarih) || { tarih }
    m[param] = degerler[0].deger
    tarihler.set(tarih, m)
  }
  return { olcumler: [...tarihler.values()].sort((a, b) => a.tarih.localeCompare(b.tarih)), celiskiler: celiskiler.sort((a, b) => a.tarih.localeCompare(b.tarih)) }
}

/** "p10, z −1,29" — motorun (engines/buyume.ts) verdiği değer, yuvarlaması motorun biçimleyicileriyle. */
export const persentilZMetni = (r: { persentil: number; z: number }) => `p${persentilKisa(r.persentil).replace('.', '')}, z ${zMetni(r.z)}`

/**
 * Büyüme hızı satırı: motorun (buyumeHizlari) verdiği fark, aralık ve yıllık hız — hangi iki tarih arasında olduğuyla.
 * Normatif hız eşiği uygulanmaz (motor da uygulamaz); kısa aralıkta yıllık hız yazılmaz, ölçüm hatası büyüktür.
 */
export function buyumeHiziSatiri(h: BuyumeHizi): string {
  const birim = PARAM_BIRIM[h.param]
  const yillik = h.kisaAralik ? '' : `; büyüme hızı ≈ ${h.yillik >= 0 ? '' : '−'}${trS(Math.abs(h.yillik))} ${birim}/yıl`
  return `${PARAM_AD[h.param]} artışı: ${h.fark >= 0 ? '+' : '−'}${trS(Math.abs(h.fark), 2)} ${birim} (${trGun(h.oncekiTarih)} → ${trGun(h.sonTarih)}, ${trS(h.aralikAy)} ay)${yillik}${h.kisaAralik ? ' — kısa aralık, ölçüm hatası büyüktür; yıllık hız verilmedi' : ''}.`
}

function buyume(olaylar: DosyaOlayi[], hasta: DosyaHastasi): Degerlendirme {
  const { olcumler, celiskiler } = buyumeOlcumleri(olaylar)
  const celiskiSatirlari = celiskiler.map((c) => `ÇELİŞEN ÖLÇÜM — ${trGun(c.tarih)} ${PARAM_AD[c.param].toLocaleLowerCase('tr-TR')}: ${c.degerler.map((d) => `${trS(d.deger, 2)} ${PARAM_BIRIM[c.param]} (${d.kaynak})`).join(' / ')} — hangisinin doğru olduğu kayıttan anlaşılmıyor; bu tarihin ${PARAM_AD[c.param].toLocaleLowerCase('tr-TR')} değeri eğilime, persentil kaymasına ve hız hesabına ALINMADI.`)
  const kucukAd = (p: BuyumeParametre) => PARAM_AD[p].toLocaleLowerCase('tr-TR')
  const celiskiKisa = celiskiler.map((c) => `${uzunGun(c.tarih)} tarihinde ${kucukAd(c.param)} için iki farklı değer kayıtlı (${c.degerler.map((d) => `${trS(d.deger, 2)} ${PARAM_BIRIM[c.param]}`).join(' ve ')}); doğru değer doğrulanmalı`)
  const celiskiBayraklari: AcikIs[] = celiskiler.map((c, i) => ({ oncelik: 'yakinda', tur: 'celiski', tarih: c.tarih, kisa: celiskiKisa[i], metin: `Çelişen ölçüm: ${trGun(c.tarih)} tarihinde ${PARAM_AD[c.param].toLocaleLowerCase('tr-TR')} için farklı değerler kayıtlı (${c.degerler.map((d) => `${trS(d.deger, 2)} ${PARAM_BIRIM[c.param]} — ${d.kaynak}`).join('; ')}); doğru değer kayıtta düzeltilmeli, büyüme eğilimine alınmadı.` }))
  const olcumsuz = (olcumGunu: number): BuyumeOzeti => ({ olcumGunu, son: [], tutarsizlik: celiskiKisa, kayma: [] })
  if (!olcumler.length) return { satirlar: [...celiskiSatirlari, celiskiler.length ? 'Çelişmeyen tarihli kilo / boy / baş çevresi ölçümü yok; persentil, eğilim ve hız hesaplanmadı (tahmin verilmez).' : 'Dosyada tarihli kilo / boy / baş çevresi ölçümü bulamadım; persentil, eğilim ve hız hesaplanmadı (tahmin verilmez).'], bayraklar: celiskiBayraklari, ozet: olcumsuz(0) }
  if (!hasta.dogumIso || !hasta.cinsiyet) {
    return { satirlar: [...celiskiSatirlari, `Doğum tarihi veya cinsiyet kayıtlı olmadığı için persentil hesaplanamadı; ölçümler: ${olcumler.map((o) => `${trGun(o.tarih)} kilo ${o.kilo ?? '—'} kg, boy ${o.boy ?? '—'} cm`).join('; ')}.`], bayraklar: celiskiBayraklari, ozet: olcumsuz(olcumler.length) }
  }
  const hamSatirlar = olcumSatirlari('neyzi', hasta.cinsiyet, hasta.dogumIso, olcumler)
  // NOTYA-KADEMELI-01d: a value its own series contradicts (engines/buyume.ts tutarsizOlcumler) is shown apart and kept
  // out of every trend, drift, velocity and VKİ computation — the same treatment as a same-day contradiction above.
  const tutarsiz = tutarsizOlcumler(hamSatirlar)
  const satirlar = dogrulanmisSatirlar(hamSatirlar, tutarsiz)
  const tutarsizSatirlari = tutarsiz.map((t) => `TUTARSIZ ÖLÇÜM — ${trGun(t.tarih)} ${kucukAd(t.param)} ${trS(t.deger, 2)} ${PARAM_BIRIM[t.param]}: önceki ${trS(t.onceki.deger, 2)} ${PARAM_BIRIM[t.param]} (${trGun(t.onceki.tarih)}) ve sonraki ${t.sonrakiler.map((s) => `${trS(s.deger, 2)} ${PARAM_BIRIM[t.param]} (${trGun(s.tarih)})`).join(', ')} ölçümleriyle uyumsuz — kayıt doğrulanmalı; bu değer eğilime, persentil kaymasına, hız ve VKİ hesabına ALINMADI, persentili karşılaştırmaya KATILMAZ.`)
  const tutarsizKisa = tutarsiz.map((t) => `${uzunGun(t.tarih)} tarihli ${trS(t.deger, 2)} ${PARAM_BIRIM[t.param]} ${kucukAd(t.param)} kaydı, sonraki ${t.sonrakiler.map((s) => `${trS(s.deger, 2)} ${PARAM_BIRIM[t.param]}`).join(' ve ')} ölçümleriyle uyumsuz; eğri güvenle okunmadan önce bu kayıt doğrulanmalı`)
  const out: string[] = [`Referans: ${REFERANS_AD.neyzi}. Ölçümler (eskiden yeniye):`]
  for (const s of satirlar) {
    const p = (Object.keys(s.deger) as BuyumeParametre[]).filter((k) => k !== 'vki').map((k) => {
      const r = s.sonuc[k]
      return `${PARAM_AD[k]} ${trS(s.deger[k]!, 2)} ${PARAM_BIRIM[k]}${r ? ` (${persentilZMetni(r)})` : ' (referans kapsamı dışında — persentil hesaplanmadı)'}`
    })
    if (p.length) out.push(`- ${trGun(s.tarih)} (${yasMetni(hasta.dogumIso, s.tarih)}): ${p.join('; ')}`)
  }
  out.push(...celiskiSatirlari, ...tutarsizSatirlari)
  const bayraklar: AcikIs[] = [...celiskiBayraklari, ...tutarsiz.map((t, i): AcikIs => ({ oncelik: 'yakinda', tur: 'celiski', tarih: t.tarih, kisa: tutarsizKisa[i], metin: `Tutarsız ölçüm: ${trGun(t.tarih)} tarihli ${trS(t.deger, 2)} ${PARAM_BIRIM[t.param]} ${kucukAd(t.param)} kaydı, önceki (${trS(t.onceki.deger, 2)} ${PARAM_BIRIM[t.param]}, ${trGun(t.onceki.tarih)}) ve sonraki (${t.sonrakiler.map((s) => `${trS(s.deger, 2)} ${PARAM_BIRIM[t.param]}, ${trGun(s.tarih)}`).join('; ')}) ölçümlerle uyumsuz; kayıt doğrulanmalı, büyüme eğilimine alınmadı.` }))]
  if (satirlar.length < 2) out.push('Tek ölçüm var — eğilim (yön / hız) için yeterli veri yok; tek ölçümle karar verilmez.')
  // The crossing assessment starts after the first six months of life: a large newborn settling toward the middle is
  // physiological catch-down, so the birth value is history and never the start of a drift (docs/AYSE-KALITE-STANDARDI.md).
  if (satirlar.some((s) => s.ay < KAYMA_BASLANGIC_AY) && satirlar.some((s) => s.ay >= KAYMA_BASLANGIC_AY)) {
    out.push(`İlk ${KAYMA_BASLANGIC_AY} aydaki ölçümler (doğum dahil) yalnız öyküdür: persentil kayması ${KAYMA_BASLANGIC_AY}. aydan sonraki doğrulanmış ölçümler arasında değerlendirildi; doğum persentilinden bugüne "düşüş" YORUMU YAPMA (ilk aylarda kanal değişimi fizyolojik olabilir).`)
  }
  const kaymalar = persentilKaymalari(satirlar, 2, KAYMA_BASLANGIC_AY)
  const kaymaKisa: BuyumeOzeti['kayma'] = []
  for (const k of kaymalar) {
    const yon = k.cizgi < 0 ? 'aşağı' : 'yukarı'
    const cumle = `${PARAM_AD[k.param]} persentili p${Math.round(k.pOnce)} → p${Math.round(k.pSon)} (${trGun(k.oncekiTarih)} → ${trGun(k.sonTarih)}): ${Math.abs(k.cizgi)} majör persentil çizgisi ${yon}`
    out.push(`- Kayma: ${cumle}.`)
    const kisa = `${kucukAd(k.param)} persentili ${uzunGun(k.oncekiTarih)} ile ${uzunGun(k.sonTarih)} arasında ${Math.abs(k.cizgi)} majör persentil çizgisi ${yon} geçmiş; ölçümün doğrulanması önerilir`
    kaymaKisa.push({ asagi: k.cizgi < 0, kisa })
    // Worded as a suggestion to verify, not an alarm; the doctor reads the curve.
    bayraklar.push({ oncelik: k.cizgi < 0 ? 'yakinda' : 'rutin', tur: 'buyume', tarih: k.sonTarih, kisa, metin: `Büyüme: ${cumle} — ölçümün doğrulanması önerilir (ölçüm tekrarı / kayıt kontrolü); doğruysa eğriyi hekim değerlendirir.` })
  }
  for (const h of buyumeHizlari(satirlar)) out.push(`- ${buyumeHiziSatiri(h)}`)
  const sonDeger = (p: BuyumeOlcumu) => [...satirlar].reverse().find((s) => s.deger[p] != null)
  const ozet: BuyumeOzeti = {
    olcumGunu: hamSatirlar.length,
    son: BUYUME_OLCUMLERI.flatMap((p) => { const s = sonDeger(p); return s ? [{ ad: kucukAd(p), persentil: s.sonuc[p]?.persentil ?? null, tarih: s.tarih }] : [] }),
    tutarsizlik: [...celiskiKisa, ...tutarsizKisa],
    kayma: kaymaKisa,
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
  return { satirlar: out, bayraklar, ozet }
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
  // NOTYA-ILK10-ASI-01 — Fısıltı kuralı (engines/kohort.ts, NOTYA-FISILTI-GIZLE-01): minimum yaş / aralıktan önce (aynı
  // gün dahil), doğumdan önce ya da ileri tarihli görünen kayıt büyük olasılıkla yanlış girilmiştir. O seride "gecikti"
  // denmez; kaydın kontrolü istenir. Aralıklar asiPlan'dan (GBP) gelir — burada yeniden yazılmaz.
  const tutarsiz: AsiTutarsizligi[] = []
  for (const s of plan.seriler) {
    const seriKayitlari = kayitlar.filter((k) => kayitSerisi(k.ad) === s.seri && k.tarih)
    for (const d of s.dozlar) {
      const ad = `${SERI_AD[s.seri]} ${d.etiket}`
      for (const k of d.gecersizler) {
        if (!k.tarih) continue
        const ayniGun = seriKayitlari.find((x) => x.id !== k.id && x.tarih === k.tarih)
        tutarsiz.push({
          seri: s.seri, ad, tarih: k.tarih,
          neden: ayniGun ? `aynı seriden başka bir dozla (${ayniGun.dozNo ? `${ayniGun.dozNo}. doz` : 'doz numarası yazılmamış'}) aynı tarihte kayıtlı` : 'takvimdeki minimum yaştan / önceki dozdan sonraki minimum aralıktan önce kayıtlı',
        })
      }
      if (d.kayit?.tarih && d.kayit.tarih < hasta.dogumIso) tutarsiz.push({ seri: s.seri, ad, tarih: d.kayit.tarih, neden: 'doğum tarihinden önce kayıtlı' })
      else if (d.kayit?.tarih && d.kayit.tarih > hasta.bugunIso) tutarsiz.push({ seri: s.seri, ad, tarih: d.kayit.tarih, neden: 'bugünden ileri bir tarihle kayıtlı' })
    }
  }
  return {
    surum: plan.surum, dozlar, notlar: plan.notlar, tutarsiz,
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
  if (ay >= 18 && ay <= 24) out.push('18–24 ay: sosyal iletişim, ortak dikkat, işaret etme, isme yanıt, göz teması, dil ve tekrarlayıcı davranış özellikle sorulmalı.')

  // NOTYA-ILK10-YAPI-01 — kanıt, cevabın altı başlığının sırasıyla kurulur: genel (yukarıda) → not gözlemleri (güçlü /
  // izlenecek alanlar) → risk ve koruyucu etmenler → tarama durumu → sonraki adım.
  const vizitler = olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'vizit')
  const gozlemler: string[] = []
  const kaygilar: string[] = []
  let regresyon: DosyaOlayi | null = null
  for (const v of vizitler) {
    const oyku = v.metin.split(' | Plan:')[0]
    const n = oyku.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i')
    if (REGRESYON.test(n)) regresyon = v
    if (GELISIM_KAYGI.test(n) || esanlamGruplariBul(oyku).some((g) => g.id === 'gelisim')) kaygilar.push(`${trGun(v.tarih)}: ${oyku.slice(0, 200)}`)
    for (const c of cumleler(oyku)) if (GELISIM_GOZLEMI.test(trAramaNormalize(c))) gozlemler.push(`- ${trGun(v.tarih)}: "${c}"`)
  }
  out.push('NOTLARDAKİ GELİŞİM GÖZLEMLERİ (klinik gözlem ve aile anlatımı — resmi tarama sonucu DEĞİL; güçlü ve izlenecek alanlar buradan):')
  out.push(...(gozlemler.length ? gozlemler.slice(-8) : ['- Notlarda kayıtlı gelişim gözlemi yok; günlük yaşamda neler yapabildiği sorulmalı (GİDR yaklaşımı).']))
  out.push(kaygilar.length ? `Ebeveyn kaygısı / gelişimle ilgili not ifadeleri (klinik veri): ${kaygilar.slice(-4).join(' · ')}` : 'Notlarda ebeveynin gelişimle ilgili bir kaygısı yazılmamış.')
  const bayraklar: AcikIs[] = []
  if (regresyon) {
    out.push(`⚠ Regresyon ifadesi (${trGun(regresyon.tarih)}) — yüksek öncelik.`)
    bayraklar.push({ oncelik: 'bugun', tur: 'gelisim', tarih: regresyon.tarih, metin: `Gelişimsel regresyon ifadesi (${trGun(regresyon.tarih)} notu) — yüksek öncelik; değerlendirme / sevk kaydı hekimde.` })
  }

  const etmen = gelisimEtmenleri(olaylar, hasta, gh, Boolean(regresyon))
  out.push('GELİŞİMSEL RİSK ETMENLERİ (dosyada kayıtlı):', ...(etmen.risk.length ? etmen.risk.map((r) => `- ${r}`) : ['- Dosyada kayıtlı bir gelişimsel risk etmeni bulamadım.']))
  out.push('KORUYUCU ETMENLER (dosyada kayıtlı):', ...(etmen.koruyucu.length ? etmen.koruyucu.map((r) => `- ${r}`) : ['- Dosyada kayıtlı bir koruyucu etmen bulamadım.']))
  if (etmen.kayitsiz.length) out.push(`Dosyada kaydı olmayan etmenler (kayıt yok — "yok" anlamına gelmez, sorulmalı): ${etmen.kayitsiz.join(', ')}.`)

  out.push('TARAMA DURUMU (resmi tarama sonucu yalnız kayıtlıysa söylenir; klinik gözlemden tarama sonucu üretilmez):')
  const kayitli = olaylar.filter((o) => o.kaynak === 'olcum' && o.tur === 'tarama')
  out.push(kayitli.length ? `Kayıtlı tarama sonuçları: ${kayitli.map((o) => `${o.metin} (${trGun(o.tarih)})`).join('; ')}.` : 'Kayıtlı tarama sonucu (GİDR / M-CHAT-R/F / diğer) yok.')
  const acikPlanlar: DosyaOlayi[] = []
  for (const pl of planOlaylari(olaylar).filter((o) => o.tur === 'tarama')) {
    const k = planKarsiligi(pl, olaylar)
    if (!k) acikPlanlar.push(pl)
    out.push(k ? `Planlanan tarama (${trGun(pl.tarih)}: "${pl.metin}") → sonuç kaydı ${trGun(k.tarih)}.` : `Gelişimsel tarama planlanmış (${trGun(pl.tarih)}: "${pl.metin}"); tamamlanmış sonuç dosyada görünmüyor.`)
  }
  const adimlar: string[] = []
  if (regresyon) adimlar.push(`Regresyon ifadesi (${trGun(regresyon.tarih)}): öncelikli gelişimsel değerlendirme; sevk kararı hekimde.`)
  for (const pl of acikPlanlar) adimlar.push(`${trGun(pl.tarih)} tarihinde planlanan taramanın ("${pl.metin}") tamamlanması — sonuç kaydı yok.`)
  for (const k of p.kalemler.filter((x) => x.kod === 'otizm' || x.kod === 'gidr' || x.kod === 'gelisim_testi')) {
    out.push(`Tarama durumu — ${k.ad}: ${k.durum === 'tamam' ? 'bu pencerede kayıtlı' : k.durum === 'gecikti' ? 'penceresi geçti, kayıt yok' : k.durum === 'simdi' ? 'şu an pencerede, kayıt yok' : k.durum === 'dikkat' ? 'dikkat' : k.durum === 'yaklasiyor' ? 'yaklaşıyor' : 'sürekli izlem'} — ${k.ne}`)
    if ((k.durum === 'gecikti' || k.durum === 'simdi') && !acikPlanlar.length) bayraklar.push({ oncelik: 'yakinda', tur: 'tarama-zamani', metin: `${k.ad}: ${k.durum === 'gecikti' ? 'penceresi geçti' : 'şu an pencerede'}; tamamlanmış kayıt dosyada görünmüyor.` })
    if (k.durum === 'dikkat') bayraklar.push({ oncelik: 'bugun', tur: 'gelisim', metin: `${k.ad}: ${k.ne}` })
    if (k.durum === 'gecikti' || k.durum === 'simdi' || k.durum === 'dikkat') adimlar.push(`${k.ad}: ${k.durum === 'gecikti' ? 'penceresi geçti, kayıt yok' : k.durum === 'simdi' ? 'şu an pencerede, kayıt yok' : 'dikkat'} — ${k.ne}`)
  }
  if (etmen.kaygi && !kayitli.some((o) => o.anahtar === 'gidr')) adimlar.push('Ebeveyn kaygısı kayıtlı; GİDR ile yapılandırılmış değerlendirme kaydı yok.')
  out.push('ÖNERİLEN SONRAKİ ADIM (kayda ve izlem protokolüne göre — karar hekimde):')
  out.push(...(adimlar.length ? adimlar.map((a) => `- ${a}`) : ['- Kayda göre bekleyen gelişimsel tarama yok; sonraki sağlam çocuk izleminde gelişim değerlendirmesi sürer.']))
  return { satirlar: out, bayraklar }
}

/** "Yürüyor, 8-10 kelimesi var" — vizit metninin (plan hariç) cümleleri; bölüm etiketi atılır, kısa parça alınmaz. */
function cumleler(oyku: string): string[] {
  return oyku.split(' | ').flatMap((b) => b.replace(/^(Şikayet\/öykü|Bulgu|Değerlendirme|Tanı):\s*/, '').split(/(?<=[.!?])\s+/)).map((c) => c.trim()).filter((c) => c.length >= 8).map((c) => c.slice(0, 180))
}

/** Gelişim basamağı / sosyal iletişim anlatan cümle (katlanmış metin üzerinde). Tanı ve tedavi cümlesi değildir. */
const GELISIM_GOZLEMI = /\b(yuruyor|yurume|emekli|oturuyor|oturma|kelime|cumle|konusuyor|konusma|isaret e|goz temasi|ismine|gulumse|kasik|kosuyor|merdiven|heceli|tutunarak|bas kontrol|donmeye|taklit|el sall|ortak dikkat|gelisim basamak|oyun oynu|ayaga kalk|adim at)/
/** Ebeveynin açık kaygısı — "kelimesi var" gibi olağan bir gözlem kaygı değildir. */
const EBEVEYN_KAYGISI = /endise|kaygi|merak ediyor|yasitlarindan geri|gecikme|gerili|konusmuyor|konusamiyor|yurumuyor|isaret etmiyor|goz temasi (yok|kurmuyor)|ismine (bakmiyor|donmuyor)/
const EKRAN = /\bekran|tablet|televizyon|cizgi film|telefon(la| ile)? (izl|oyn)/
const UYARAN = /uyaran (eksik|az)|az uyaran|ilgilenilmiyor|ihmal/
const PSIKOSOSYAL = /psikososyal|bosanma|aile ici (siddet|gecimsizlik)|siddet|istismar|anne(de)? depresyon|kayip yasadi|goc\b|issizlik/
const YOGUN_BAKIM = /yogun bakim|yybu|kuvoz|entube|ventilator/
const DUYU_SORUNU = /isitme (kaybi|azligi|sorunu)|duymuyor|sasilik|gorme (kaybi|azligi|sorunu)/
const BESLENME = /malnutrisyon|buyume geriligi|kilo alamiyor|gelisme geriligi|yetersiz beslenme/
const KORUYUCU_NOT = /anne sutu|kitap oku|kres|yuva|akranlariyla|oyun oynuyor/

/**
 * NOTYA-ILK10-YAPI-01 — standarttaki gelişimsel risk ve koruyucu etmenler, YALNIZ dosyada kayıtlı olanlar (kaynağı ve
 * tarihiyle). Kaydı olmayan etmen "yok" sayılmaz; `kayitsiz` listesinde "kayıt yok" olarak döner.
 */
function gelisimEtmenleri(olaylar: DosyaOlayi[], hasta: DosyaHastasi, gh: number | null, regresyon: boolean): { risk: string[]; koruyucu: string[]; kayitsiz: string[]; kaygi: boolean } {
  const risk: string[] = [], koruyucu: string[] = [], kayitsiz: string[] = []
  const vizitler = olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'vizit')
  const notta = (re: RegExp): string | null => {
    for (const v of [...vizitler].reverse()) for (const c of cumleler(v.metin.split(' | Plan:')[0])) if (re.test(trAramaNormalize(c))) return `${trGun(v.tarih)} notu: "${c}"`
    return null
  }
  const ekle = (ad: string, kanit: string | null) => { if (kanit) risk.push(`${ad} — ${kanit}`); else kayitsiz.push(ad.toLocaleLowerCase('tr-TR')) }
  const perinatal = olaylar.find((o) => o.tur === 'perinatal')
  // Gebelik haftası kayıtlı ve term ise ne risk ne "kayıt yok".
  if (gh == null) kayitsiz.push('prematürite (gebelik haftası)')
  else if (gh < 37) risk.push(`Prematürite — gebelik haftası ${gh} (beyan)`)
  ekle('Yenidoğan yoğun bakım öyküsü', perinatal && YOGUN_BAKIM.test(trAramaNormalize(perinatal.metin)) ? `ilk kayıt formu: "${perinatal.metin.replace(/^Prenatal \/ natal \(beyan\):\s*/, '')}"` : null)
  const duyuTarama = olaylar.find((o) => o.kaynak === 'olcum' && o.tur === 'tarama' && ['isitme', 'gorme', 'kirmizi_refle', 'rop'].includes(String(o.anahtar)) && /sevk|ileri/.test(o.metin))
  ekle('İşitme / görme sorunu', duyuTarama ? `${duyuTarama.metin} (${trGun(duyuTarama.tarih)})` : notta(DUYU_SORUNU))
  const kronik = olaylar.find((o) => o.tur === 'kronik')
  ekle('Kronik hastalık', kronik ? kronik.metin.replace(/^Kronik \/ özgeçmiş:\s*/, '') : null)
  const kayma = buyume(olaylar, hasta).bayraklar.find((b) => b.tur === 'buyume' && /çizgisi aşağı/.test(b.metin))
  ekle('Malnütrisyon / büyüme sorunu', kayma ? kayma.metin : notta(BESLENME))
  const demirVizit = [...vizitler].reverse().find((v) => esanlamGruplariBul(v.metin.split(' | Plan:')[0]).some((g) => g.id === 'demir'))
  const dusukLab = [...olaylar].reverse().find((o) => o.kaynak === 'lab' && ['Ferritin', 'Hb'].includes(String(o.anahtar)) && o.deger != null && o.refAlt != null && o.deger < o.refAlt)
  const sonLab = dusukLab ? [...olaylar].reverse().find((o) => o.kaynak === 'lab' && o.anahtar === dusukLab.anahtar) : null
  ekle('Demir eksikliği', demirVizit ? `${trGun(demirVizit.tarih)} notunda demir eksikliği / anemi geçiyor` : dusukLab && sonLab === dusukLab ? `${dusukLab.metin} (${trGun(dusukLab.tarih)}) laboratuvar referansının (${dusukLab.refAlt}) altında; yaşa uygunluğu doğrulanmadı` : null)
  if (regresyon) risk.push('Beceri kaybı (regresyon) ifadesi — yüksek öncelikli uyarı')
  const kaygi = notta(EBEVEYN_KAYGISI)
  ekle('Ebeveyn kaygısı', kaygi)
  ekle('Uyaran azlığı', notta(UYARAN))
  ekle('Ekran süresi', notta(EKRAN))
  ekle('Psikososyal stres', notta(PSIKOSOSYAL))

  for (const o of olaylar.filter((x) => x.kaynak === 'olcum' && x.tur === 'tarama')) {
    if (o.anahtar === 'mchat' && /dusuk|düşük/.test(o.metin)) koruyucu.push(`${o.metin} (${trGun(o.tarih)}) — kayıtlı tarama sonucu`)
    else if (o.anahtar === 'gidr' && /sevk önerilmedi/.test(o.metin)) koruyucu.push(`${o.metin} (${trGun(o.tarih)}) — kayıtlı tarama sonucu`)
    else if (['isitme', 'gorme', 'kirmizi_refle'].includes(String(o.anahtar)) && /normal/.test(o.metin)) koruyucu.push(`${o.metin} (${trGun(o.tarih)})`)
  }
  const saglam = vizitler.filter((v) => /saglam cocuk/.test(trAramaNormalize(v.metin)))
  if (saglam.length >= 3) koruyucu.push(`Düzenli sağlam çocuk izlemi: ${saglam.length} vizit (${trGun(saglam[0].tarih)} – ${trGun(saglam[saglam.length - 1].tarih)})`)
  const koruyucuNot = notta(KORUYUCU_NOT)
  if (koruyucuNot) koruyucu.push(koruyucuNot)
  return { risk, koruyucu, kayitsiz, kaygi: Boolean(kaygi) }
}

export const PEDIATRI_SORGU: BransSorguParametreleri = {
  anahtar: 'pediatri',
  ad: 'Pediatri',
  buyume,
  asi,
  asiTakvimiYok: '',
  gelisim,
}
