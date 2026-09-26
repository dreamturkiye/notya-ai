/**
 * NOTYA-AYSE-STANDART-01 — açık işler: "Bugün yapmam veya takip etmem gereken bir şey var mı?" (Soru 9) ve
 * "Gözümden kaçabilecek önemli bir şey var mı?" (Soru 10) bu listeden kurulur. LLM'siz, saf.
 *
 * İlke (Dr. Gökhan): kaydı yoksa tamamlanmış sayma — ama "yapılmadı" da deme. Her madde "planlandı / istendi …;
 * uygulandığına / sonuçlandığına dair kayıt yok" biçimindedir. Bir planın karşılığı yalnız SONRAKİ bir kayıttır
 * (aşı satırı, lab sonucu, konsültasyon yanıtı, sonraki vizit, tarama kaydı).
 *
 * Öncelik: 'bugun' (bu vizitte bakılmalı) · 'yakinda' (yakın zamanda) · 'rutin'. Branşa bağlı kalemler (aşı takvimi,
 * büyüme, yaşa göre tarama) BransSorguParametreleri'nden gelir — çekirdek takvim bilmez.
 */
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { gunEkleIso, gunFarkiIso, trGun } from '@/lib/doktor/dosyaOlaylari'
import { eksikDozEtiketi, parametreSec, type AsiDurumu } from '@/lib/asistan/dosyaSorgu/parametreler'
import { SIKAYET_GRUPLARI, terimlerdenBiriGeciyor } from '@/lib/klinik/sikayetEsanlam'
import { asiPlanSatiri, durumAdi, labAdlari, planKarsiligi, planOlaylari } from '@/lib/doktor/planTakibi'
import { alerjiUyarilari } from '@/core/eylemler/ilacUyari'

export type AcikIsOnceligi = 'bugun' | 'yakinda' | 'rutin'
export type AcikIsTuru =
  | 'lab-sonuc-yok' | 'lab-anormal-tekrar-yok' | 'konsultasyon-bekliyor' | 'kontrol-planli' | 'asi-plan-kaydi-yok'
  | 'asi-eksik' | 'asi-yaklasan' | 'tarama-sonuc-yok' | 'tarama-zamani' | 'buyume' | 'gelisim' | 'guvenlik-alerji'
  | 'celiski' | 'tekrarlayan' | 'goruntuleme-sonuc-yok'

export interface AcikIs {
  oncelik: AcikIsOnceligi
  tur: AcikIsTuru
  /** Hekime tek cümle — tarih ve durum açık. */
  metin: string
  tarih?: string
  /** Hasta güvenliği maddesi: cevabın SONUNDA belirgin bildirilir. */
  guvenlik?: boolean
}

export interface AcikIsler { bugun: AcikIs[]; yakinda: AcikIs[]; rutin: AcikIs[] }

export { asiPlanSatiri, durumAdi, labAdlari, planKarsiligi, planOlaylari }

function kontrolVadesi(p: DosyaOlayi): string | null {
  const m = p.metin.toLocaleLowerCase('tr-TR').match(/(\d{1,3})\s*(gün|gun|hafta|ay)\s*sonra/)
  if (!m) return null
  const n = Number(m[1])
  return gunEkleIso(p.tarih, m[2] === 'hafta' ? n * 7 : m[2] === 'ay' ? n * 30 : n)
}

/** Alerji ile çelişen aktif ilaç / son 90 günün reçetesi — hasta güvenliği. */
export function alerjiCatismalari(olaylar: DosyaOlayi[], bugunIso: string): AcikIs[] {
  const alerjiler = olaylar.filter((o) => o.tur === 'alerji').map((o) => o.metin.replace(/^Alerji:\s*/, ''))
  if (!alerjiler.length) return []
  const out: AcikIs[] = []
  const gorulen = new Set<string>()
  for (const o of olaylar) {
    const aday = (o.kaynak === 'ilac' && o.tur === 'ilac' && (o.durum === 'aktif' || o.durum === 'belirsiz'))
      || (o.kaynak === 'ilac' && o.tur === 'recete' && gunFarkiIso(o.tarih, bugunIso) <= 90)
    if (!aday) continue
    const ad = o.metin.split(' — ')[0].replace(/\s*\[.*$/, '').trim()
    const uyari = alerjiUyarilari(alerjiler, ad, o.etken)[0]
    if (!uyari || gorulen.has(ad.toLocaleLowerCase('tr-TR'))) continue
    gorulen.add(ad.toLocaleLowerCase('tr-TR'))
    out.push({ oncelik: 'bugun', tur: 'guvenlik-alerji', guvenlik: true, tarih: o.tarih, metin: `Alerji ile çelişen ilaç: ${ad} (${o.tur === 'recete' ? 'reçete' : 'ilaç kaydı'} ${trGun(o.tarih)}) — ${uyari.metin}` })
  }
  return out
}

/** Son 12 ayda aynı enfeksiyon grubunda ≥ 3 vizit — tekrarlayan patern (tanım hekimindir). */
export function tekrarlayanPaternler(olaylar: DosyaOlayi[], bugunIso: string, esik = 3): { grup: string; tarihler: string[] }[] {
  const alt = gunEkleIso(bugunIso, -365)
  const vizitler = olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'vizit' && o.tarih >= alt)
  const out: { grup: string; tarihler: string[] }[] = []
  for (const g of SIKAYET_GRUPLARI.filter((x) => x.enfeksiyon)) {
    const tarihler = vizitler.filter((v) => terimlerdenBiriGeciyor(v.metin.split(' | Plan:')[0], g.terimler)).map((v) => v.tarih)
    if (new Set(tarihler).size >= esik) out.push({ grup: g.ad, tarihler: [...new Set(tarihler)] })
  }
  return out
}

/** Notta "aşıları tam" beyanı varken takvim o tarihte eksik doz gösteriyorsa: çelişen kayıt. */
export function asiBeyanCeliskileri(olaylar: DosyaOlayi[], asi: AsiDurumu | null): AcikIs[] {
  if (!asi) return []
  const out: AcikIs[] = []
  for (const b of olaylar.filter((o) => o.tur === 'asi-beyan')) {
    const eksik = asi.dozlar.filter((d) => d.onerilen && d.onerilen <= b.tarih && (!d.uygulamaTarihi || d.uygulamaTarihi > b.tarih) && d.durum !== 'yas_disi')
    if (!eksik.length) continue
    out.push({
      oncelik: 'bugun', tur: 'celiski', tarih: b.tarih,
      metin: `Çelişen kayıt: ${trGun(b.tarih)} tarihli notta "aşıları tam" yazıyor; aşı tablosunda o tarihe kadar uygulama kaydı olmayan dozlar var: ${eksik.slice(0, 5).map((d) => d.ad).join(', ')}.`,
    })
  }
  return out
}

/**
 * Brief imzası: `acikIsleriBul(olaylar, yasAy, brans)`. Branşa bağlı kalemler için hasta (doğum tarihi, cinsiyet,
 * bugün) gerekir — verilmezse yalnız çekirdek plan-kayıt eşleştirmesi yapılır.
 */
export function acikIsleriBul(olaylar: DosyaOlayi[], yasAy: number | null, brans: string | null, hasta?: DosyaHastasi): AcikIsler {
  const bugunIso = hasta?.bugunIso || olaylar[olaylar.length - 1]?.tarih || new Date().toISOString().slice(0, 10)
  const isler: AcikIs[] = []
  const ekle = (i: AcikIs) => { if (!isler.some((x) => x.metin === i.metin)) isler.push(i) }
  const sonVizit = [...olaylar].reverse().find((o) => o.kaynak === 'not' && o.tur === 'vizit')

  for (const p of planOlaylari(olaylar)) {
    const k = planKarsiligi(p, olaylar)
    if (p.tur === 'asi') {
      if (k && k.guven === 'kayit') continue
      ekle({
        oncelik: 'bugun', tur: 'asi-plan-kaydi-yok', tarih: p.tarih,
        metin: k ? `${asiPlanSatiri(p)}; sonraki notta uygulandığı yazıyor (${trGun(k.tarih)}) ama aşı tablosunda uygulama satırı yok.` : `${asiPlanSatiri(p)}; uygulandığına dair kayıt bulamadım.`,
      })
    } else if (p.tur === 'lab' && !k) {
      ekle({ oncelik: 'bugun', tur: 'lab-sonuc-yok', tarih: p.tarih, metin: `${labAdlari(p.anahtarlar)} — istendi, sonuç yok (istem: ${trGun(p.tarih)}, not: "${p.metin}").` })
    } else if (p.tur === 'konsultasyon' && !k) {
      ekle({ oncelik: 'yakinda', tur: 'konsultasyon-bekliyor', tarih: p.tarih, metin: `Konsültasyon / sevk ${durumAdi(p.durum)} (${trGun(p.tarih)}, not: "${p.metin}"); yanıt / rapor kaydı bulamadım.` })
    } else if (p.tur === 'tarama' && !k) {
      ekle({ oncelik: 'yakinda', tur: 'tarama-sonuc-yok', tarih: p.tarih, metin: `Gelişimsel tarama (${p.anahtar === 'mchat' ? 'M-CHAT-R/F' : p.anahtar === 'gidr' ? 'GİDR' : p.anahtar === 'denver' ? 'standart gelişim testi' : 'tarama'}) ${durumAdi(p.durum)} (${trGun(p.tarih)}); tamamlanmış sonuç dosyada görünmüyor.` })
    } else if (p.tur === 'goruntuleme' && !k) {
      ekle({ oncelik: 'yakinda', tur: 'goruntuleme-sonuc-yok', tarih: p.tarih, metin: `Görüntüleme ${durumAdi(p.durum)} (${trGun(p.tarih)}, not: "${p.metin}"); sonuç / rapor kaydı bulamadım.` })
    } else if (p.tur === 'kontrol' && !k && p.vizitId === sonVizit?.vizitId) {
      const vade = kontrolVadesi(p)
      const gelecekRandevu = olaylar.find((o) => o.kaynak === 'randevu' && o.durum === 'randevu')
      if (gelecekRandevu) ekle({ oncelik: 'rutin', tur: 'kontrol-planli', tarih: gelecekRandevu.tarih, metin: `Planlı kontrol: randevu ${trGun(gelecekRandevu.tarih)} (son vizitte: "${p.metin}").` })
      else if (vade && vade <= bugunIso) ekle({ oncelik: 'bugun', tur: 'kontrol-planli', tarih: vade, metin: `Kontrol ${trGun(vade)} için planlanmıştı (${trGun(p.tarih)} notu: "${p.metin}"); sonraki vizit kaydı yok.` })
      else ekle({ oncelik: vade ? 'yakinda' : 'rutin', tur: 'kontrol-planli', tarih: vade || p.tarih, metin: `Kontrol ${vade ? `${trGun(vade)} için ` : ''}planlandı (${trGun(p.tarih)} notu: "${p.metin}"); randevu kaydı yok.` })
    }
  }

  // Laboratuvar referansı dışında kalan SON değer, sonrasında tekrar yok (H/L işaretine değil ham referansa bakılır; yaşa
  // uygunluğunu hekim değerlendirir).
  const sonLab = new Map<string, DosyaOlayi>()
  for (const o of olaylar) if (o.kaynak === 'lab' && o.anahtar) sonLab.set(o.anahtar, o)
  for (const l of sonLab.values()) {
    if (l.deger == null || (l.refAlt == null && l.refUst == null)) continue
    const disari = (l.refAlt != null && l.deger < l.refAlt) || (l.refUst != null && l.deger > l.refUst)
    if (!disari) continue
    ekle({ oncelik: 'yakinda', tur: 'lab-anormal-tekrar-yok', tarih: l.tarih, metin: `${l.metin} (${trGun(l.tarih)}) laboratuvarın verdiği referansın (${l.refAlt ?? '—'}–${l.refUst ?? '—'}) dışında; yaşa uygunluğu doğrulanmadı; sonrasında tekrar ölçüm kaydı yok.` })
  }

  // Açık konsültasyonlar (yapılandırılmış satır).
  for (const s of olaylar.filter((o) => o.kaynak === 'konsultasyon' && o.durum === 'istendi')) {
    ekle({ oncelik: 'yakinda', tur: 'konsultasyon-bekliyor', tarih: s.tarih, metin: `${s.metin} — istendi (${trGun(s.tarih)}); yanıt kaydı yok.` })
  }

  // Branş parametreleri: aşı takvimi, büyüme, yaşa göre tarama.
  if (hasta) {
    const p = parametreSec(brans ?? hasta.brans, hasta.dogumIso, hasta.bugunIso)
    const asi = p.asi(olaylar, hasta)
    if (asi) {
      const planli = planOlaylari(olaylar).filter((o) => o.tur === 'asi')
      for (const d of asi.dozlar) {
        if (d.durum === 'gecikti' || d.durum === 'zamani_geldi' || d.durum === 'bugun') {
          const plan = planli.find((o) => o.anahtar === d.seri && (o.doz == null || o.doz === d.no))
          if (plan) continue // "planlandı; kayıt yok" maddesi zaten var
          ekle({ oncelik: 'bugun', tur: 'asi-eksik', metin: `${d.ad} — ${eksikDozEtiketi(d, bugunIso)} (önerilen ${trGun(d.onerilen)}); uygulandığına dair kayıt bulamadım.` })
        } else if (d.durum === 'yaklasiyor') {
          ekle({ oncelik: 'rutin', tur: 'asi-yaklasan', metin: `${d.ad} — yaklaşıyor (önerilen ${trGun(d.onerilen)}).` })
        }
      }
      for (const c of asiBeyanCeliskileri(olaylar, asi)) ekle(c)
    }
    for (const b of p.buyume(olaylar, hasta).bayraklar) ekle(b)
    if (p.gelisim) for (const b of p.gelisim(olaylar, hasta).bayraklar) ekle(b)
    if (p.yasaGoreIsler && yasAy != null) for (const b of p.yasaGoreIsler(olaylar, hasta)) ekle(b)
  }

  for (const t of tekrarlayanPaternler(olaylar, bugunIso)) {
    ekle({ oncelik: 'yakinda', tur: 'tekrarlayan', metin: `Tekrarlayan patern: ${t.grup} — son 12 ayda ${t.tarihler.length} vizit (${t.tarihler.map(trGun).join(', ')}).` })
  }
  for (const a of alerjiCatismalari(olaylar, bugunIso)) ekle(a)

  return {
    bugun: isler.filter((i) => i.oncelik === 'bugun'),
    yakinda: isler.filter((i) => i.oncelik === 'yakinda'),
    rutin: isler.filter((i) => i.oncelik === 'rutin'),
  }
}
