'use client'
/**
 * BRANS-PAKETI — the patient's branş signature modules: ONE shared view for all 40 branşlar (10 Özel Branşlar + 30
 * medical; the countries reuse it with their own words — gorunum-paritesi). It renders BELOW the existing branş page
 * content (Taban önce: nothing the old page showed is removed). Data: /api/portal/hasta/[token]/brans-paketi, or a
 * fixture on the demo portals (same resolver + payload builder).
 *
 * Phase 2 design pass (Kaan: "how Apple and Steve Jobs would do it — minimalist, great colours, easy to understand"):
 *  - one memorable element: the journey path at the top (Gün N / M, today's step in one sentence) — same in every branş;
 *  - everything else quiet: the doctor's accent, 15 px body, nothing under 13 px, darker muted ink for contrast,
 *    44 px tap targets, 0–10 as tap chips (no slider), danger signs grouped under one heading, past steps folded away;
 *  - empty states teach what to do; no motion; no new client library (inline SVG + CSS).
 * Rules: no diagnosis, no dose, no calorie counter, no score on the screening, no streak / badge; alert marks use the
 * shared palette (UyariIsareti: word + icon, never colour alone); 112 on every acil line.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { portalFetch } from '@/lib/portal/portalFetch'
import { UyariIsareti } from '@/components/doktor/saglikEvi/UyariIsareti'
import type { HastaPaketi, HastaPaketModulu } from '@/lib/portal/bransPaketiSunucu'
import type { BugunOgesi } from '@/lib/portal/bransPaketiYuk'

/** Words are data (one look in every country; a country passes its own). */
export const PAKET_SOZLER = {
  hazirlaniyor: 'Hekiminiz bu bölümü sizin için hazırlıyor. Hazır olduğunda burada görünür.',
  onayYok: 'Kayıtlarınızı hekiminizin görebilmesi için Tercihler bölümünden paylaşım onayı verin. Acil uyarılar her durumda size gösterilir.',
  tercihler: 'Paylaşım onayı ver',
  kaydet: 'Kaydet',
  kaydedildi: 'Kaydedildi.',
  yukleniyor: 'Yükleniyor…',
  hata: 'Bu bölüm şu an yüklenemedi. Sayfayı yenileyin.',
  baslangicYok: 'Hekiminiz başlangıç tarihini girdiğinde adımlarınız takvime oturur.',
  gecti: 'Geçti', bugun: 'Bugün', sirada: 'Sırada',
  gecenAdimlar: (n: number) => `Geçen adımlar (${n})`,
  sonrakiAdimlar: (n: number) => `Sonraki adımlar (${n})`,
  gunSonra: (n: number) => (n === 1 ? 'yarın' : `${n} gün sonra`),
  fotoSec: 'Fotoğraf çek ya da seç', fotoSil: 'Sil', fotoYorum: 'Hekiminizin yorumu', fotoYorumYok: 'Yorum bekleniyor',
  fotoBos: 'İlk fotoğrafınız başlangıç noktası olur. Aynı ışıkta ve aynı mesafeden çekilen fotoğraflar değişimi en iyi gösterir.',
  bolge: 'Bölge (ör. sol kol)',
  aci: 'Açı', evet: 'Evet', hayir: 'Hayır', var: 'Var',
  tehlike: 'Bunlardan biri varsa işaretleyin',
  tehlikeAlt: 'İşaretlediğinizde ne yapmanız gerektiği hemen gösterilir.',
  sonKayitlar: 'Son kayıtlarınız',
  gunlukBos: 'İlk kaydınızı bugün girin. Kayıtlarınız burada birikir; kontrol gününde hekiminizle birlikte bakarsınız.',
  bugunKayitVar: 'Bugünkü kaydınız alındı. Değişiklik olursa yeniden kaydedebilirsiniz.',
  bugunYaptim: 'Yaptım', yapildi: 'Yapıldı',
  programIlerleme: (n: number, m: number) => `Bugün ${n} / ${m}`,
  alisveris: 'Alışveriş listesi', hafta: 'Haftalık plan',
  planYok: 'Diyetisyeniniz haftalık planı yazdığında burada görünür.',
  ilacTakvimi: 'İlaç hatırlatmalarım',
  taramaGonder: 'Gönder',
  degerYok: 'Henüz kayıtlı sonuç yok.',
  hedef: 'Hedef',
  demo: 'Örnek görünüm — bu sayfada kayıt yapılmaz.',
  kahvalti: 'Kahvaltı en erken', kahve: 'Kahve en erken', kalsiyum: 'Kalsiyum / demir en erken',
  bugunBaslik: 'Bugün',
  acil: 'Acil', bildirildi: 'Hekiminize iletildi', dikkat: 'Dikkat',
}
type Sozler = typeof PAKET_SOZLER

const CSS = `
.bp{--bp-muted:#6b5e52;--bp-soft:color-mix(in srgb,var(--sg-accent) 9%,#fff);--bp-rail:color-mix(in srgb,var(--sg-accent) 28%,#e8e1d6);display:grid;gap:14px;margin:4px var(--sg-pad-x,16px) 18px;color:var(--sg-ink);font-size:15px;line-height:1.5}
.bp *{box-sizing:border-box}
.bp button,.bp input,.bp textarea,.bp select{font:inherit;color:inherit}
.bp :focus-visible{outline:3px solid color-mix(in srgb,var(--sg-accent) 55%,transparent);outline-offset:2px;border-radius:10px}
.bp-not{margin:0;font-size:14px;color:var(--bp-muted);line-height:1.5}
.bp-yol{background:#fff;border-radius:22px;padding:18px 18px 16px;box-shadow:inset 0 0 0 1px var(--sg-line)}
.bp-yol-ust{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.bp-yol-ad{margin:0;font-size:14px;font-weight:600;color:var(--bp-muted)}
.bp-yol-gun{font-family:var(--sg-font-display);font-size:40px;line-height:1;letter-spacing:-.02em;font-weight:500}
.bp-yol-gun small{font-family:var(--sg-font-ui);font-size:14px;font-weight:500;color:var(--bp-muted);margin-left:6px;letter-spacing:0}
.bp-yol-cubuk{position:relative;height:6px;border-radius:6px;background:var(--bp-rail);margin:14px 0 12px;overflow:hidden}
.bp-yol-cubuk i{position:absolute;inset:0 auto 0 0;border-radius:6px;background:var(--sg-accent)}
.bp-yol-cumle{margin:0;font-size:17px;font-weight:600;line-height:1.35}
.bp-satirlar{display:grid;gap:2px;margin-top:12px}
.bp-satir{display:flex;gap:12px;align-items:center;padding:9px 0;border-top:1px solid var(--sg-line);min-height:48px}
.bp-satir:first-child{border-top:0}
.bp-satir-ad{display:grid;gap:1px;min-width:0;flex:1}
.bp-satir-ad b{font-size:15px;font-weight:600}
.bp-satir-ad span{font-size:13.5px;color:var(--bp-muted)}
.bp-tik{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 2px var(--bp-rail);color:#fff}
.bp-tik[data-tamam="1"]{background:var(--sg-accent);box-shadow:none}
.bp-modul{background:#fff;border-radius:22px;padding:18px;box-shadow:inset 0 0 0 1px var(--sg-line);display:grid;gap:12px;min-width:0}
.bp-bas{display:flex;gap:12px;align-items:flex-start}
.bp-ikon{flex:none;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--bp-soft);color:var(--sg-accent)}
.bp-bas h2{margin:0;font-family:var(--sg-font-display);font-size:21px;font-weight:500;letter-spacing:-.01em;line-height:1.2}
.bp-bas p{margin:3px 0 0;font-size:14px;color:var(--bp-muted);line-height:1.45;max-width:62ch}
.bp-btn{min-height:var(--sg-touch,44px);padding:10px 18px;border-radius:14px;border:0;background:var(--sg-accent);color:#fff;font-weight:600;font-size:15px;cursor:pointer}
.bp-btn:disabled{opacity:.45;cursor:default}
.bp-btn--tam{width:100%}
.bp-btn--ikincil{background:#fff;color:var(--sg-ink);box-shadow:inset 0 0 0 1px var(--sg-line)}
.bp-alan{display:grid;gap:8px}
.bp-alan>span{font-size:15px;font-weight:500}
.bp-alan>span small{color:var(--bp-muted);font-weight:400;margin-left:4px}
.bp-cipler{display:flex;flex-wrap:wrap;gap:6px}
.bp-cip{min-width:44px;min-height:44px;padding:0 12px;border-radius:12px;border:0;background:#f6f2ea;cursor:pointer;font-weight:600;font-size:15px}
.bp-cip[aria-pressed="true"]{background:var(--sg-accent);color:#fff}
.bp-olcek .bp-cip{min-width:40px;padding:0;flex:1 0 40px}
.bp-olcek-uc{display:flex;justify-content:space-between;font-size:12.5px;color:var(--bp-muted)}
.bp-giris{width:100%;min-height:44px;padding:10px 12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--sg-ink) 18%,transparent);font-size:16px;background:#fff}
.bp-tehlike{display:grid;gap:8px;padding:14px;border-radius:16px;background:#fbf7f3;box-shadow:inset 0 0 0 1px rgba(139,58,46,.16)}
.bp-tehlike>b{font-size:15px}
.bp-tehlike>small{font-size:13px;color:var(--bp-muted);margin-top:-6px}
.bp-isaret{display:flex;gap:12px;align-items:center;width:100%;min-height:48px;padding:10px 12px;border-radius:12px;border:0;background:#fff;text-align:left;cursor:pointer;box-shadow:inset 0 0 0 1px var(--sg-line);font-size:15px;line-height:1.35}
.bp-isaret i{flex:none;width:22px;height:22px;border-radius:6px;box-shadow:inset 0 0 0 2px #b9a99a;display:grid;place-items:center;color:#fff}
.bp-isaret[aria-pressed="true"]{box-shadow:inset 0 0 0 2px #8B3A2E}
.bp-isaret[aria-pressed="true"] i{background:#8B3A2E;box-shadow:none}
.bp-tepki{display:grid;gap:6px;padding:12px 14px;border-radius:14px;background:#fff8f5;box-shadow:inset 0 0 0 1px rgba(139,58,46,.2)}
.bp-tepki p{margin:0;font-size:15px;line-height:1.5}
.bp-tamam{margin:0;font-size:14px;color:var(--sg-ok);font-weight:500}
.bp-ray{list-style:none;margin:0;padding:0;display:grid}
.bp-adim{position:relative;display:grid;grid-template-columns:22px 1fr;gap:12px;padding:0 0 16px}
.bp-adim::before{content:"";position:absolute;left:10px;top:20px;bottom:0;width:2px;background:var(--bp-rail)}
.bp-adim:last-child::before{display:none}
.bp-adim-nokta{width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px var(--bp-rail);margin-top:1px;position:relative;z-index:1}
.bp-adim[data-durum="gecti"] .bp-adim-nokta{background:var(--bp-rail);box-shadow:none}
.bp-adim[data-durum="bugun"] .bp-adim-nokta,.bp-adim[data-durum="sirada"] .bp-adim-nokta{background:var(--sg-accent);box-shadow:0 0 0 5px var(--bp-soft)}
.bp-adim-ust{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.bp-adim-ust b{font-size:15.5px;font-weight:600}
.bp-adim-ust span{font-size:13px;color:var(--bp-muted);white-space:nowrap}
.bp-adim[data-durum="bugun"] .bp-adim-ust span,.bp-adim[data-durum="sirada"] .bp-adim-ust span{color:var(--sg-accent);font-weight:600}
.bp-adim p{margin:3px 0 0;font-size:14px;color:var(--bp-muted);line-height:1.5}
.bp-adim[data-durum="bugun"] p,.bp-adim[data-durum="sirada"] p{color:var(--sg-ink)}
.bp-katla{border-radius:14px;background:#faf7f1;padding:4px 12px}
.bp-katla>summary{min-height:44px;display:flex;align-items:center;font-size:14px;font-weight:600;cursor:pointer;color:var(--bp-muted)}
.bp-katla[open]>summary{margin-bottom:6px}
.bp-liste{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.bp-liste-sat{display:flex;gap:12px;align-items:center;width:100%;min-height:48px;padding:10px 12px;border:0;border-radius:14px;background:#faf7f1;text-align:left;cursor:pointer;font-size:15px;line-height:1.4}
.bp-liste-sat[aria-checked="true"]{background:var(--bp-soft)}
.bp-liste-sat[aria-checked="true"] span{color:var(--bp-muted)}
.bp-kutu{flex:none;width:24px;height:24px;border-radius:50%;box-shadow:inset 0 0 0 2px #b9a99a;display:grid;place-items:center;color:#fff}
.bp-liste-sat[aria-checked="true"] .bp-kutu{background:var(--sg-accent);box-shadow:none}
.bp-bilgi{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.bp-bilgi li{display:grid;grid-template-columns:8px 1fr;gap:12px;font-size:15px;line-height:1.45}
.bp-bilgi li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--sg-accent);margin-top:9px}
.bp-prog-sat{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:14px;background:#faf7f1;min-height:56px}
.bp-prog-sat[data-yapildi="1"]{background:var(--bp-soft)}
.bp-prog-sat span{font-size:15px;line-height:1.4}
.bp-son{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:13.5px;color:var(--bp-muted)}
.bp-son b{color:var(--sg-ink);font-weight:600}
.bp-foto-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.bp-foto{margin:0;border-radius:16px;overflow:hidden;background:#faf7f1}
.bp-foto img,.bp-foto .bp-foto-yer{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#ece5d8}
.bp-foto figcaption{padding:8px 10px;font-size:13px;display:grid;gap:4px}
.bp-riza{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45}
.bp-riza input{width:22px;height:22px;margin-top:1px;accent-color:var(--sg-accent)}
.bp-yukle{display:inline-flex;align-items:center;justify-content:center;gap:8px}
.bp-grup{font-size:13px;font-weight:600;color:var(--bp-muted);margin-top:10px}
@media (max-width:420px){.bp-modul,.bp-yol{padding:16px}.bp-yol-gun{font-size:34px}}
`

function tarihYaz(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

const Tik = ({ boyut = 14 }: { boyut?: number }) => <svg width={boyut} height={boyut} viewBox="0 0 16 16" aria-hidden><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>

/** One quiet line icon per module KIND (same in every branş). */
const IKON: Record<string, string> = {
  zaman: 'M4 12h3l2-5 4 10 2-5h5', liste: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  gunluk: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5', foto: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z',
  program: 'M5 12l4 4L19 6', hatirlatma: 'M12 4a6 6 0 016 6v4l2 3H4l2-3v-4a6 6 0 016-6zM10 20a2 2 0 004 0',
  biyobelirtec: 'M4 18l5-6 4 3 7-9', tabak: 'M12 20a8 8 0 100-16 8 8 0 000 16zM12 15a3 3 0 100-6 3 3 0 000 6z',
  plan: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4', tarama: 'M9 9a3 3 0 115 2c-1 1-2 1.5-2 3M12 18h.01', 'ilac-saati': 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
}
function Ikon({ tur }: { tur: string }) {
  return <span className="bp-ikon" aria-hidden><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={IKON[tur] || IKON.liste} /></svg></span>
}

interface Ortak { veri: HastaPaketi; demo: boolean; sozler: Sozler; gonder: (govde: Record<string, unknown>) => Promise<{ ok: boolean; mesaj: string; duzey: string | null; ek?: Record<string, unknown> }>; fotoUrl: (id: string) => string; fotoYukle: (modul: string, dosya: File, etiket: string | null) => Promise<string | null>; fotoSil: (id: string) => Promise<void> }

function Tepki({ t, s }: { t: { mesaj: string; duzey: string | null } | null; s: Sozler }) {
  if (!t) return null
  if (t.duzey === 'acil' || t.duzey === 'hekime_bildir' || t.duzey === 'dikkat') {
    return (
      <div role="alert" className="bp-tepki">
        <UyariIsareti ton={t.duzey} etiket={t.duzey === 'acil' ? s.acil : t.duzey === 'hekime_bildir' ? s.bildirildi : s.dikkat} />
        <p>{t.mesaj}</p>
      </div>
    )
  }
  return <p className="bp-tamam" role="status">{t.mesaj}</p>
}

/** "Ağrı (0 yok – 10 en şiddetli)" → label "Ağrı" + ends ["yok", "en şiddetli"]; default ends Yok / En şiddetli. */
export function olcekEtiketi(etiket: string): { ad: string; uclar: [string, string] } {
  const r = /\s*\(0\s+(.+?)\s*[–—-]\s*10\s+(.+?)\)\s*$/.exec(etiket)
  const buyuk = (x: string) => x.charAt(0).toLocaleUpperCase('tr-TR') + x.slice(1)
  return r ? { ad: etiket.slice(0, r.index), uclar: [buyuk(r[1]), buyuk(r[2])] } : { ad: etiket, uclar: ['Yok', 'En şiddetli'] }
}

function degerMetni(v: unknown, s: Sozler): string { return v === true ? s.evet : v === false ? s.hayir : String(v) }

function Gunluk({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const [g, setG] = useState<Record<string, unknown>>({})
  const [t, setT] = useState<{ mesaj: string; duzey: string | null } | null>(null)
  const [mesgul, setMesgul] = useState(false)
  const [gp, setGp] = useState<Record<string, string> | null>((m.ayar.gunPlani as Record<string, string>) || null)
  const tumKayit = o.veri.kayitlar.filter((k) => k.modul === m.kod)
  const son = tumKayit.slice(0, 5)
  const bugunVar = tumKayit.some((k) => k.gun === o.veri.bugun)
  const alanlar = m.icerik.alanlar || []
  const olagan = alanlar.filter((a) => !(a.tur === 'evet' && a.isaret))
  const tehlike = alanlar.filter((a) => a.tur === 'evet' && a.isaret)
  async function kaydet() {
    setMesgul(true)
    try {
      const r = await o.gonder({ modul: m.kod, veri: g })
      setT({ mesaj: r.mesaj, duzey: r.duzey })
      if (r.ok) { setG({}); if (r.ek?.gunPlani) setGp(r.ek.gunPlani as Record<string, string>) }
    } finally { setMesgul(false) }
  }
  const hedefler: string[] = []
  if (typeof m.ayar.proteinHedefG === 'number') hedefler.push(`Protein: ${m.ayar.proteinHedefG} g / gün`)
  if (typeof m.ayar.korseSaat === 'number') hedefler.push(`Korse: ${m.ayar.korseSaat} saat / gün`)
  if (typeof m.ayar.hedefSaat === 'number') hedefler.push(`Cihaz: ${m.ayar.hedefSaat} saat / gün`)
  if (typeof m.ayar.uykuHedef === 'number') hedefler.push(`Uyku: ${m.ayar.uykuHedef} saat`)
  if (typeof m.ayar.adimHedef === 'number') hedefler.push(`Adım: ${m.ayar.adimHedef}`)
  if (typeof m.ayar.aktifHedef === 'number') hedefler.push(`Hareket: haftada ${m.ayar.aktifHedef} dakika`)
  if (typeof m.ayar.ogunSaatleri === 'string') hedefler.push(`Öğün saatleri: ${m.ayar.ogunSaatleri}`)
  if (typeof m.ayar.siviSiniri === 'number') hedefler.push(`Sıvı: günde en fazla ${m.ayar.siviSiniri} bardak`)
  const sec = (id: string, v: unknown) => setG((x) => ({ ...x, [id]: x[id] === v ? undefined : v }))
  return (
    <>
      {hedefler.length > 0 && <p className="bp-not" style={{ color: 'var(--sg-ink)' }}><b>{o.sozler.hedef}:</b> {hedefler.join(', ')}</p>}
      {gp && (
        <ul className="bp-bilgi">
          <li>{o.sozler.kahvalti}: <b>{gp.kahvalti}</b></li>
          <li>{o.sozler.kahve}: <b>{gp.kahve}</b></li>
          <li>{o.sozler.kalsiyum}: <b>{gp.kalsiyumDemir}</b></li>
        </ul>
      )}
      {bugunVar && !t && <p className="bp-tamam">{o.sozler.bugunKayitVar}</p>}
      {olagan.map((a) => (
        <div key={a.id} className="bp-alan" role="group" aria-label={a.etiket}>
          <span>{a.tur === 'olcek' ? olcekEtiketi(a.etiket).ad : a.etiket}{a.birim ? <small>({a.birim})</small> : null}</span>
          {a.tur === 'evet' ? (
            <div className="bp-cipler">
              {[true, false].map((v) => <button key={String(v)} type="button" className="bp-cip" disabled={o.demo} aria-pressed={g[a.id] === v} onClick={() => sec(a.id, v)}>{v ? o.sozler.evet : o.sozler.hayir}</button>)}
            </div>
          ) : a.tur === 'olcek' ? (
            <>
              <div className="bp-cipler bp-olcek">
                {Array.from({ length: (a.max ?? 10) - (a.min ?? 0) + 1 }, (_, i) => (a.min ?? 0) + i).map((n) => (
                  <button key={n} type="button" className="bp-cip" disabled={o.demo} aria-pressed={g[a.id] === n} aria-label={`${a.etiket}: ${n}`} onClick={() => sec(a.id, n)}>{n}</button>
                ))}
              </div>
              <div className="bp-olcek-uc" aria-hidden><span>{olcekEtiketi(a.etiket).uclar[0]}</span><span>{olcekEtiketi(a.etiket).uclar[1]}</span></div>
            </>
          ) : a.tur === 'metin' ? (
            <textarea rows={2} className="bp-giris" disabled={o.demo} value={String(g[a.id] ?? '')} onChange={(e) => setG((x) => ({ ...x, [a.id]: e.target.value }))} />
          ) : (
            <input type={a.tur === 'saat' ? 'time' : 'number'} className="bp-giris" inputMode={a.tur === 'sayi' ? 'decimal' : undefined} disabled={o.demo} value={String(g[a.id] ?? '')}
              onChange={(e) => setG((x) => ({ ...x, [a.id]: a.tur === 'sayi' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value }))} />
          )}
        </div>
      ))}
      {tehlike.length > 0 && (
        <div className="bp-tehlike" role="group" aria-label={o.sozler.tehlike}>
          <b>{o.sozler.tehlike}</b>
          <small>{o.sozler.tehlikeAlt}</small>
          {tehlike.map((a) => (
            <button key={a.id} type="button" className="bp-isaret" disabled={o.demo} aria-pressed={g[a.id] === true} onClick={() => setG((x) => ({ ...x, [a.id]: x[a.id] === true ? undefined : true }))}>
              <i aria-hidden>{g[a.id] === true ? <Tik /> : null}</i><span>{a.etiket}</span>
            </button>
          ))}
        </div>
      )}
      {alanlar.length > 0 && <button type="button" className="bp-btn bp-btn--tam" disabled={o.demo || mesgul || !Object.values(g).some((v) => v !== undefined && v !== '')} onClick={kaydet}>{o.sozler.kaydet}</button>}
      <Tepki t={t} s={o.sozler} />
      {son.length > 0 ? (
        <details className="bp-katla">
          <summary>{o.sozler.sonKayitlar}</summary>
          <ul className="bp-son">
            {son.map((k) => <li key={k.id}><b>{tarihYaz(k.gun)}</b> {Object.entries(k.veri).map(([id, v]) => `${alanlar.find((a) => a.id === id)?.etiket || id}: ${degerMetni(v, o.sozler)}`).join('; ')}</li>)}
          </ul>
        </details>
      ) : alanlar.length > 0 ? <p className="bp-not">{o.sozler.gunlukBos}</p> : null}
      {m.icerik.not && <p className="bp-not">{m.icerik.not}</p>}
    </>
  )
}

function Zaman({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const adimlar = m.zaman || []
  const gecen = adimlar.filter((a) => a.durum === 'gecti')
  const kalan = adimlar.filter((a) => a.durum !== 'gecti')
  const one = kalan.slice(0, 3), sonra = kalan.slice(3)
  const fark = m.baslangic ? Math.round((Date.parse(`${o.veri.bugun}T00:00:00Z`) - Date.parse(`${m.baslangic}T00:00:00Z`)) / 86_400_000) : null
  const Adim = ({ a }: { a: (typeof adimlar)[number] }) => {
    const soz = a.durum === 'gecti' ? o.sozler.gecti : a.durum === 'bugun' ? o.sozler.bugun : a.durum === 'sirada' && fark != null ? o.sozler.gunSonra(a.gun - fark) : null
    return (
      <li className="bp-adim" data-durum={a.durum} aria-current={a.durum === 'bugun' ? 'step' : undefined}>
        <span className="bp-adim-nokta" aria-hidden />
        <div>
          <div className="bp-adim-ust"><b>{a.baslik}</b><span>{soz && a.durum !== 'gecti' ? soz : a.tarih ? tarihYaz(a.tarih) : `${a.gun}. gün`}</span></div>
          <p>{a.ayrinti}</p>
        </div>
      </li>
    )
  }
  return (
    <>
      {!m.baslangic ? <p className="bp-not">{o.sozler.baslangicYok}</p> : m.baslangicEtiketi ? <p className="bp-not">{m.baslangicEtiketi}: {tarihYaz(m.baslangic)}</p> : null}
      {gecen.length > 0 && (
        <details className="bp-katla">
          <summary>{o.sozler.gecenAdimlar(gecen.length)}</summary>
          <ol className="bp-ray">{gecen.map((a) => <Adim key={`${a.gun}-${a.baslik}`} a={a} />)}</ol>
        </details>
      )}
      <ol className="bp-ray">{one.map((a) => <Adim key={`${a.gun}-${a.baslik}`} a={a} />)}</ol>
      {sonra.length > 0 && (
        <details className="bp-katla">
          <summary>{o.sozler.sonrakiAdimlar(sonra.length)}</summary>
          <ol className="bp-ray">{sonra.map((a) => <Adim key={`${a.gun}-${a.baslik}`} a={a} />)}</ol>
        </details>
      )}
      {m.icerik.not && <p className="bp-not">{m.icerik.not}</p>}
    </>
  )
}

function Liste({ m, o, satirlar }: { m: HastaPaketModulu; o: Ortak; satirlar: string[] }) {
  const isaretli = useMemo(() => {
    const s = new Map<number, boolean>()
    for (const k of [...o.veri.kayitlar].filter((k) => k.modul === m.kod).reverse()) if (typeof k.veri.madde === 'number') s.set(k.veri.madde as number, k.veri.tamam !== false)
    return s
  }, [o.veri.kayitlar, m.kod])
  const [yerel, setYerel] = useState<Map<number, boolean>>(new Map())
  if (!m.isaretlenir) return <ul className="bp-bilgi">{satirlar.map((s, i) => <li key={i}>{s}</li>)}</ul>
  return (
    <ul className="bp-liste">
      {satirlar.map((s, i) => {
        const tamam = yerel.get(i) ?? isaretli.get(i) ?? false
        return (
          <li key={i}>
            <button type="button" role="checkbox" aria-checked={tamam} className="bp-liste-sat" disabled={o.demo}
              onClick={async () => { const v = !tamam; setYerel((x) => new Map(x).set(i, v)); await o.gonder({ modul: m.kod, madde: i, tamam: v }) }}>
              <span className="bp-kutu" aria-hidden>{tamam ? <Tik /> : null}</span><span>{s}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Program({ m, o, satirlar }: { m: HastaPaketModulu; o: Ortak; satirlar: string[] }) {
  const bugunYapilan = useMemo(() => new Set(o.veri.kayitlar.filter((k) => k.modul === m.kod && k.gun === o.veri.bugun && k.veri.tamam !== false).map((k) => k.veri.madde as number)), [o.veri, m.kod])
  const [yerel, setYerel] = useState<Set<number>>(new Set())
  const yapilan = satirlar.filter((_, i) => bugunYapilan.has(i) || yerel.has(i)).length
  return (
    <>
      <p className="bp-not" aria-live="polite">{o.sozler.programIlerleme(yapilan, satirlar.length)}</p>
      <ul className="bp-liste">
        {satirlar.map((s, i) => {
          const yapildi = bugunYapilan.has(i) || yerel.has(i)
          return (
            <li key={i} className="bp-prog-sat" data-yapildi={yapildi ? '1' : '0'}>
              <span>{s}</span>
              <button type="button" className={`bp-btn${yapildi ? ' bp-btn--ikincil' : ''}`} disabled={o.demo || yapildi} onClick={async () => { setYerel((x) => new Set(x).add(i)); await o.gonder({ modul: m.kod, madde: i }) }}>
                {yapildi ? <span className="bp-yukle"><Tik />{o.sozler.yapildi}</span> : o.sozler.bugunYaptim}
              </button>
            </li>
          )
        })}
      </ul>
      {m.icerik.not && <p className="bp-not">{m.icerik.not}</p>}
    </>
  )
}

function Foto({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const [riza, setRiza] = useState(false)
  const [aci, setAci] = useState<string>(m.icerik.acilar?.[0] || '')
  const [bolge, setBolge] = useState('')
  const [mesaj, setMesaj] = useState('')
  const fotolar = o.veri.fotolar.filter((f) => f.modul === m.kod)
  const ayHatirlatma = m.icerik.aylar?.length ? `Hatırlatma ayları: ${m.icerik.aylar.join(', ')}. ay` : null
  const serbest = !!m.serbestEtiket
  return (
    <>
      {m.tur === 'tabak' && m.icerik.maddeler && <ul className="bp-bilgi">{m.icerik.maddeler.map((x) => <li key={x}>{x}</li>)}</ul>}
      {ayHatirlatma && <p className="bp-not">{ayHatirlatma}</p>}
      {m.icerik.acilar && m.icerik.acilar.length > 0 && (
        <div className="bp-alan" role="group" aria-label={o.sozler.aci}>
          <span>{o.sozler.aci}</span>
          <div className="bp-cipler">{m.icerik.acilar.map((a) => <button key={a} type="button" className="bp-cip" disabled={o.demo} aria-pressed={aci === a} onClick={() => setAci(a)}>{a}</button>)}</div>
        </div>
      )}
      {serbest && <label className="bp-alan"><span>{o.sozler.bolge}</span><input className="bp-giris" value={bolge} maxLength={60} disabled={o.demo} onChange={(e) => setBolge(e.target.value)} /></label>}
      {m.fotoRizaMetni && (
        <label className="bp-riza"><input type="checkbox" checked={riza} disabled={o.demo} onChange={(e) => setRiza(e.target.checked)} /><span>{m.fotoRizaMetni}</span></label>
      )}
      <label className={`bp-btn bp-yukle${!riza && m.fotoRizaMetni ? ' bp-btn--ikincil' : ''}`} style={{ opacity: (m.fotoRizaMetni && !riza) || o.demo ? 0.5 : 1, justifySelf: 'start' }}>
        {o.sozler.fotoSec}
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden disabled={(!!m.fotoRizaMetni && !riza) || o.demo} onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ''
          if (!f) return
          const etiket = serbest && bolge.trim() ? `${bolge.trim()}${aci ? ` (${aci})` : ''}` : aci || null
          const h = await o.fotoYukle(m.kod, f, etiket)
          setMesaj(h || o.sozler.kaydedildi)
        }} />
      </label>
      {mesaj && <p className="bp-not" role="status">{mesaj}</p>}
      {fotolar.length > 0 ? (
        <div className="bp-foto-izgara">
          {fotolar.map((f) => (
            <figure key={f.id} className="bp-foto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {!o.demo ? <img src={o.fotoUrl(f.id)} alt={f.etiket || m.baslik} loading="lazy" /> : <div className="bp-foto-yer" />}
              <figcaption>
                <span style={{ color: 'var(--bp-muted)' }}>{tarihYaz(f.at)}{f.etiket ? `, ${f.etiket}` : ''}</span>
                {m.tur === 'tabak' && <span><b>{o.sozler.fotoYorum}:</b> {f.yorum || o.sozler.fotoYorumYok}</span>}
                {m.tur !== 'tabak' && f.yorum && <span><b>{o.sozler.fotoYorum}:</b> {f.yorum}</span>}
                {!o.demo && <button type="button" onClick={() => o.fotoSil(f.id)} style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--sg-coral-ink)', padding: '6px 0', fontSize: 13, cursor: 'pointer', minHeight: 32 }}>{o.sozler.fotoSil}</button>}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : <p className="bp-not">{o.sozler.fotoBos}</p>}
      {m.icerik.not && <p className="bp-not">{m.icerik.not}</p>}
    </>
  )
}

function Plan({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const plan = m.ayar.plan as { gunler: Array<{ gun: string; ogunler: Array<{ ad: string; yiyecekler: string[] }> }> } | undefined
  const alisveris = (m.ayar.alisveris || []) as Array<{ grup: string; kalemler: Array<{ ad: string; kez: number }> }>
  const dolu = plan?.gunler.filter((g) => g.ogunler.length) || []
  const [gun, setGun] = useState(0)
  if (!dolu.length) return <p className="bp-not">{o.sozler.planYok}</p>
  const g = dolu[Math.min(gun, dolu.length - 1)]
  return (
    <>
      <div role="tablist" className="bp-cipler" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
        {dolu.map((d, i) => <button key={d.gun} role="tab" aria-selected={i === gun} aria-pressed={i === gun} type="button" className="bp-cip" onClick={() => setGun(i)}>{d.gun.slice(0, 3)}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {g.ogunler.map((og) => (
          <div key={og.ad} className="bp-prog-sat" style={{ display: 'grid', gap: 2 }}>
            <b style={{ fontSize: 15 }}>{og.ad}</b>
            <span>{og.yiyecekler.join(', ')}</span>
          </div>
        ))}
      </div>
      {alisveris.length > 0 && (
        <details className="bp-katla" open>
          <summary>{o.sozler.alisveris}</summary>
          {alisveris.map((a) => (
            <div key={a.grup}>
              <div className="bp-grup">{a.grup}</div>
              <ul className="bp-son" style={{ color: 'var(--sg-ink)' }}>
                {a.kalemler.map((k) => <li key={k.ad}><label className="bp-riza"><input type="checkbox" /> {k.ad}{k.kez > 1 ? ` (${k.kez} öğün)` : ''}</label></li>)}
              </ul>
            </div>
          ))}
        </details>
      )}
      {m.icerik.not && <p className="bp-not">{m.icerik.not}</p>}
    </>
  )
}

function Tarama({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const sorular = m.icerik.maddeler || []
  const [c, setC] = useState<Array<boolean | null>>(sorular.map(() => null))
  const [bitti, setBitti] = useState<string | null>(null)
  if (!o.veri.taramaZamani && !bitti) return null
  if (bitti) return <p className="bp-tamam">{bitti}</p>
  return (
    <>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 14 }}>
        {sorular.map((s, i) => (
          <li key={i} style={{ lineHeight: 1.45 }}>
            {s}
            <div className="bp-cipler" style={{ marginTop: 8 }}>
              {[true, false].map((v) => <button key={String(v)} type="button" className="bp-cip" disabled={o.demo} aria-pressed={c[i] === v} onClick={() => setC((x) => x.map((y, j) => (j === i ? v : y)))}>{v ? o.sozler.evet : o.sozler.hayir}</button>)}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="bp-btn bp-btn--tam" disabled={o.demo || c.some((x) => x === null)} onClick={async () => { const r = await o.gonder({ modul: m.kod, cevaplar: c }); setBitti(r.mesaj) }}>{o.sozler.taramaGonder}</button>
      {m.icerik.not && <p className="bp-not">{m.icerik.not}</p>}
    </>
  )
}

function Degerler({ o }: { o: Ortak }) {
  if (!o.veri.lab.length) return <p className="bp-not">{o.sozler.degerYok}</p>
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {o.veri.lab.map((s) => {
        const d = s.noktalar.map((n) => n.deger)
        const min = Math.min(...d), max = Math.max(...d)
        const yol = s.noktalar.map((n, i) => `${i === 0 ? 'M' : 'L'}${s.noktalar.length === 1 ? 50 : (i / (s.noktalar.length - 1)) * 100},${max === min ? 15 : 28 - ((n.deger - min) / (max - min)) * 26}`).join(' ')
        const son = s.noktalar[s.noktalar.length - 1]
        return (
          <div key={s.anahtar} className="bp-prog-sat">
            <div className="bp-satir-ad"><b>{s.ad}</b><span>{String(son.deger).replace('.', ',')}{s.birim ? ` ${s.birim}` : ''}, {tarihYaz(son.tarih)}{s.noktalar.length > 1 ? ` (${s.noktalar.length} ölçüm)` : ''}</span></div>
            <svg viewBox="0 0 100 30" width="100" height="32" aria-hidden><path d={yol} fill="none" stroke="var(--sg-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        )
      })}
    </div>
  )
}

function Modul({ m, o, basePath }: { m: HastaPaketModulu; o: Ortak; basePath: string }) {
  const satirlar = Array.isArray(m.ayar.satirlar) && (m.ayar.satirlar as string[]).length ? (m.ayar.satirlar as string[]) : m.icerik.maddeler || []
  const listeSatirlari = m.kod === 'cer-hazirlik' ? [...(m.icerik.maddeler || []), ...((m.ayar.satirlar as string[]) || [])] : satirlar
  if (m.tur === 'tarama' && !o.veri.taramaZamani) return null
  return (
    <section className="bp-modul" data-paket-modul={m.kod} aria-labelledby={`bp-${m.kod}`}>
      <div className="bp-bas">
        <Ikon tur={m.tur} />
        <div><h2 id={`bp-${m.kod}`}>{m.baslik}</h2><p>{m.aciklama}</p></div>
      </div>
      {m.tur === 'zaman' && <Zaman m={m} o={o} />}
      {m.tur === 'liste' && <Liste m={m} o={o} satirlar={listeSatirlari} />}
      {m.tur === 'program' && <Program m={m} o={o} satirlar={satirlar} />}
      {(m.tur === 'gunluk' || m.tur === 'ilac-saati') && <Gunluk m={m} o={o} />}
      {m.tur === 'hatirlatma' && (
        <>
          {(typeof m.ayar.katiSaat === 'string' || typeof m.ayar.berrakSaat === 'string') && (
            <div className="bp-tehlike" style={{ background: 'var(--bp-soft)', boxShadow: 'none' }}>
              {typeof m.ayar.katiSaat === 'string' && <b>Katı gıda en son: {m.ayar.katiSaat}</b>}
              {typeof m.ayar.berrakSaat === 'string' && <b>Su ve berrak sıvılar en son: {m.ayar.berrakSaat}</b>}
            </div>
          )}
          <Liste m={{ ...m, isaretlenir: false }} o={o} satirlar={satirlar} />
          {(m.icerik.alanlar || []).length > 0 && <Gunluk m={m} o={o} />}
          <Link href={`${basePath}/doz-takvimi`} className="bp-btn bp-btn--ikincil" style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>{o.sozler.ilacTakvimi}</Link>
        </>
      )}
      {(m.tur === 'foto' || m.tur === 'tabak') && <Foto m={m} o={o} />}
      {m.tur === 'plan' && <Plan m={m} o={o} />}
      {m.tur === 'tarama' && <Tarama m={m} o={o} />}
      {m.tur === 'biyobelirtec' && <Degerler o={o} />}
    </section>
  )
}

/** The one memorable element: the journey path (timeline module) or today's open items, same in every branş. */
function YolSeridi({ o }: { o: Ortak }) {
  const ozet = o.veri.ozet
  if (!ozet || !ozet.ogeler.length) return null
  const yol = ozet.ogeler.find((x) => x.tur === 'zaman' && x.ilerleme)
  const digerleri = ozet.ogeler.filter((x) => x !== yol)
  return (
    <section className="bp-yol" aria-label={`${o.sozler.bugunBaslik}: ${ozet.ad || ''}`}>
      <div className="bp-yol-ust">
        <p className="bp-yol-ad">{o.sozler.bugunBaslik}{ozet.ad ? `, ${ozet.ad.toLocaleLowerCase('tr-TR')}` : ''}</p>
        {ozet.bugunBayrak ? <UyariIsareti ton={ozet.bugunBayrak} etiket={ozet.bugunBayrak === 'acil' ? o.sozler.acil : ozet.bugunBayrak === 'hekime_bildir' ? o.sozler.bildirildi : o.sozler.dikkat} kucuk /> : null}
      </div>
      {yol?.ilerleme && (
        <>
          <div className="bp-yol-gun" style={{ marginTop: 6 }}>{yol.ilerleme.etiket}<small>{yol.baslik}</small></div>
          <div className="bp-yol-cubuk" role="progressbar" aria-valuemin={0} aria-valuemax={yol.ilerleme.m} aria-valuenow={yol.ilerleme.n} aria-label={yol.baslik}><i style={{ width: `${Math.round((yol.ilerleme.n / yol.ilerleme.m) * 100)}%` }} /></div>
          <p className="bp-yol-cumle">{yol.metin}</p>
        </>
      )}
      {digerleri.length > 0 && <BugunSatirlari ogeler={digerleri} />}
    </section>
  )
}

/** Rows shared by the package page strip and the Bugün card. */
export function BugunSatirlari({ ogeler }: { ogeler: Array<Pick<BugunOgesi, 'kod' | 'baslik' | 'metin' | 'tamam'>> }) {
  return (
    <div className="bp-satirlar">
      {ogeler.map((x) => (
        <div key={x.kod} className="bp-satir">
          <span className="bp-tik" data-tamam={x.tamam ? '1' : '0'} aria-hidden>{x.tamam ? <Tik /> : null}</span>
          <span className="bp-satir-ad"><b>{x.baslik}</b><span>{x.metin}</span></span>
        </div>
      ))}
    </div>
  )
}

export function PaketStili() { return <style>{CSS}</style> }

export function BransPaketiView({ token, basePath, demo, sozler = PAKET_SOZLER, yol }: { token?: string; basePath: string; demo?: HastaPaketi; sozler?: Sozler; yol?: string }) {
  const [veri, setVeri] = useState<HastaPaketi | null>(demo ?? null)
  const [hata, setHata] = useState(false)
  const kok = token ? `/api/portal/hasta/${encodeURIComponent(token)}/brans-paketi` : ''
  const yukle = useCallback(async () => {
    if (!kok) return
    try {
      const r = await portalFetch(kok, { cache: 'no-store' })
      if (!r.ok) { setHata(true); return }
      setVeri(await r.json()); setHata(false)
    } catch { setHata(true) }
  }, [kok])
  useEffect(() => { if (!demo) void yukle() }, [demo, yukle])

  const o: Ortak | null = veri ? {
    veri, demo: !!demo, sozler,
    gonder: async (govde) => {
      if (demo || !kok) return { ok: false, mesaj: sozler.demo, duzey: null }
      const r = await portalFetch(kok, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) return { ok: false, mesaj: String(j.error || sozler.hata), duzey: null }
      void yukle()
      return { ok: true, mesaj: String(j.tepki?.metin || sozler.kaydedildi), duzey: j.tepki?.duzey ?? null, ek: j.tepki }
    },
    fotoUrl: (id) => `${kok}/foto?id=${encodeURIComponent(id)}`,
    fotoYukle: async (modul, dosya, etiket) => {
      if (demo || !kok) return sozler.demo
      const f = new FormData()
      f.set('modul', modul); f.set('riza', '1'); f.set('file', dosya)
      if (etiket) f.set('etiket', etiket)
      const r = await portalFetch(`${kok}/foto`, { method: 'POST', body: f })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) return String(j.error || sozler.hata)
      void yukle()
      return null
    },
    fotoSil: async (id) => {
      if (demo || !kok) return
      await portalFetch(`${kok}/foto?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      void yukle()
    },
  } : null

  // The doctor's preview has no token and no fixture: nothing to show (no endless "loading").
  if (!kok && !demo) return null
  // A shared page (Takip) mounts the view for one branş's package only.
  if (yol && veri && veri.yol !== yol) return null
  if (hata && !veri) return <div className="bp"><PaketStili /><p className="bp-not">{sozler.hata}</p></div>
  if (!o) return <div className="bp" aria-busy="true"><PaketStili /><p className="bp-not">{sozler.yukleniyor}</p></div>
  if (!o.veri.moduller.length) {
    return o.veri.hazirlaniyor > 0 ? <div className="bp"><PaketStili /><p className="bp-not">{sozler.hazirlaniyor}</p></div> : null
  }
  return (
    <div className="bp" data-brans-paketi={o.veri.brans || ''}>
      <PaketStili />
      {demo && <p className="bp-not">{sozler.demo}</p>}
      <YolSeridi o={o} />
      {!o.veri.paylasimOnayi && !demo && (
        <p className="bp-not" style={{ color: 'var(--sg-ink)' }}>
          {sozler.onayYok} <Link href={`${basePath}/tercihler`} style={{ color: 'var(--sg-accent-ink)', fontWeight: 600 }}>{sozler.tercihler}</Link>
        </p>
      )}
      {o.veri.moduller.map((m) => <Modul key={m.kod} m={m} o={o} basePath={basePath} />)}
      <p className="bp-not" style={{ fontSize: 13 }}>{o.veri.acil}</p>
    </div>
  )
}
