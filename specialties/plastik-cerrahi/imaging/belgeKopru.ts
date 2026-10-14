/**
 * PLASTIK-GORUNTU-OKUMA-01 — Belge Tier A (Asistana raporla) → plastik cerrahi dual-sign okuma
 * taslağı. Pure. Kaynak: belge_analizleri VEYA Plastik Cerrahi › Görüntü'deki hasta_goruntulemeler
 * satırı. Own fields (standardized view + procedure category + day count), own disclaimer, own
 * no-diagnosis scrub — reuses only the generic plumbing (Tier A model call, confidence cap shape,
 * dual-sign state machine). Never derm's lesion/PASI language, never göz's OD/OS language.
 */
import type { BelgeRaporu } from '@/core/belgeler/types'
import { dozVeyaTaniKilidiIceriyorMu } from '../engines/plastik'
import { GORUNUM_AD, PLASTIK_GORUNTU_DISCLAIMER, type PlastikGorunum } from './dualSign'

/** Belge ontolojisi modalitesi → plastik görüntü köprüsü girdisi. 'derm'/'yara' Tier A motor etiketleri
 * plastik cerrahi yara/foto izlem fotoğraflarını da kapsar (core/belgeler/router.ts BRANS_KURALLARI.plastik). */
export function belgeModalitePlastik(m: string | null | undefined): true | null {
  return m === 'yara' || m === 'derm' || m === 'plastik_foto' ? true : null
}

export const TEK_GORUNUM_UST = 70

export function guvenUst(capPct: number | null | undefined): number {
  return capPct != null && Number.isFinite(Number(capPct)) ? Math.max(0, Math.min(100, Number(capPct))) : TEK_GORUNUM_UST
}

export function kopruGorunumDogrula(gorunum: unknown): { ok: true; gorunum: PlastikGorunum } | { ok: false; hata: string } {
  if (typeof gorunum === 'string' && gorunum in GORUNUM_AD) return { ok: true, gorunum: gorunum as PlastikGorunum }
  return { ok: false, hata: 'Standart foto görünümü seçin (frontal / oblik / lateral / bazal / posterior / yakın çekim).' }
}

export function analizKopruyeUygun(durum: string | null | undefined, rapor: BelgeRaporu | null | undefined): { ok: true } | { ok: false; hata: string } {
  if (!rapor || durum === 'hata') return { ok: false, hata: 'Asistan analizi yok veya hata ile bitti — Foto sekmesinde elle not girin.' }
  if (durum === 'kalite_dusuk' || rapor.kalite === 'dusuk') return { ok: false, hata: 'Görüntü kalitesi düşük — gözlem taslağı aktarılmaz; yeniden çekim önerilir (aynı görünüm, aynı mesafe/ışık).' }
  return { ok: true }
}

export interface TaslakGirdi {
  rapor: BelgeRaporu
  gorunum: PlastikGorunum
  procedureKategori: string | null
  gunSayisi: number | null
  guvenUstPct: number
}

/** Dual-sign taslak metni — HEKIM_KILIT_METNI (plastik.ts) ile aynı ruhta: izlem/karar desteği,
 * tanı/komplikasyon adı asla. dozVeyaTaniKilidiIceriyorMu() ile taranır; yakalarsa çağıran reddeder. */
export function belgeTaslakMetni(g: TaslakGirdi): string {
  const r = g.rapor
  const baslik = [`Asistan taslak (Belge Tier A, ${GORUNUM_AD[g.gorunum]})`, g.procedureKategori ? `işlem: ${g.procedureKategori}` : null, g.gunSayisi != null ? `${g.gunSayisi}. gün` : null].filter(Boolean).join(' — ')
  const satir: string[] = [`${baslik} — ${PLASTIK_GORUNTU_DISCLAIMER}`]
  if (r.ozet) satir.push(`Özet: ${r.ozet}`)
  if (r.bulgular.length) satir.push('Görünüm gözlemleri (ödem/eritem/sütur hattı/drenaj — betimsel, tanı değil):', ...r.bulgular.slice(0, 10).map((b, i) => `${i + 1}. ${b}`))
  if (r.acil_bayrak) satir.push('Asistan acil bayrağı kaldırdı — hekim aynı gün değerlendirir; flep/greftte ani renk değişimi veya hızla büyüyen şişlik 112 gerektirir (hekim kararı).')
  if (r.sinirlar.length) satir.push(`Sınırlar: ${[...new Set(r.sinirlar)].join(' · ')}`)
  satir.push('Uzman onayından önce klinik karar verilmez; tanı/komplikasyon adı hekim lezyon/yara kartında kilitlenir.')
  const metin = satir.join('\n').slice(0, 3000)
  return dozVeyaTaniKilidiIceriyorMu(metin) ? metin.replace(/\n.*$/, '\n[Satır tanı/doz dili içerdiği için kaldırıldı — hekim elle girer.]') : metin
}

export function taslakSonrakiAdim(rapor: BelgeRaporu): string {
  if (rapor.acil_bayrak) return 'Aynı gün hekim değerlendirmesi; flep/greft kompromisi şüphesi varsa 112 (hekim kararı).'
  return 'Uzman onayı; sonraki foto/kontrol aynı görünümle planlanır (foto zaman çizgisi).'
}
