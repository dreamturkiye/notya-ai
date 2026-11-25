'use client'
/**
 * EV-VERISI-V2 — the "Ayrıntılar" half of the doctor's Ev verisi card: alerts + "Gördüm", per-medicine 14-day strip +
 * kritik flag, per-reading list, Kontrol Öncesi Özet, per-patient thresholds. Its own lazy chunk (next/dynamic from
 * EvVerisiKarti.tsx), loaded only when the doctor opens it — the first view stays light (performans-butcesi-koruma).
 * Styles come from the card's stylesheet (.evv-*). Core: identical for every branş.
 */
import { useState } from 'react'
import type { EvVerisiKarti as Veri, DozGunu } from '@/lib/saglikEvi/evVerisi'
import { CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { OLCUM_TANIMLARI, metrikEtiketi } from '@/lib/saglikEvi/olcumler'
import type { EsikSeti } from '@/lib/saglikEvi/hedefler'
import type { OlcumTipi } from '@/lib/saglikEvi/tipler'
import { HALKA_RENK, TON_RENK, acikUyarilar, degerHedefDisi, kisaAd, metrikRengi, sayi, trTarihSaat, type Metrik } from '@/lib/saglikEvi/evVerisiGorunum'

export type Sekme = 'uyarilar' | 'ilaclar' | 'olcumler' | 'ozet' | 'hedefler'

const ALANLAR: Array<[keyof EsikSeti, string]> = [['hedefMin', 'Hedef alt'], ['hedefMax', 'Hedef üst'], ['hedefMax2', 'Hedef üst (diyastolik)'], ['dikkatUst', 'Dikkat ≥'], ['dikkatAlt', 'Dikkat <'], ['bildirUst', 'Bildir ≥'], ['bildirAlt', 'Bildir <'], ['acilUst', 'Acil ≥'], ['acilAlt', 'Acil <'], ['bildirUst2', 'Bildir ≥ (diyastolik)'], ['acilUst2', 'Acil ≥ (diyastolik)'], ['trendDelta', 'Eğilim: haftalık artış ≥'], ['trendTaban', 'Eğilim: haftalık ort. ≥']]
const girdi: React.CSSProperties = { minHeight: 34, borderRadius: 10, border: `1px solid ${R.border}`, padding: '0 10px', fontSize: 13.5, color: R.ink, background: '#fff', font: 'inherit' }

export function EsikPaneli({ veri, kaydet }: { veri: Veri; kaydet: (ayar: Record<string, unknown>) => Promise<void> }) {
  const varsayilan = veri.varsayilan as Record<string, EsikSeti>
  const [esik, setEsik] = useState<Record<string, Partial<Record<keyof EsikSeti, string>>>>(() => Object.fromEntries(Object.entries(veri.hekimAyar.esikler || {}).map(([k, v]) => [k, Object.fromEntries(Object.entries(v || {}).map(([a, n]) => [a, String(n)]))])))
  const [olcumler, setOlcumler] = useState<OlcumTipi[]>(veri.olcumTipleri)
  const [ldl, setLdl] = useState(veri.hekimAyar.ldlHedef ? String(veri.hekimAyar.ldlHedef) : '')
  const [kilo, setKilo] = useState<boolean>(veri.hekimAyar.kiloBildir ?? false)
  const [mesgul, setMesgul] = useState(false)
  const [kaydedildi, setKaydedildi] = useState(false)
  const anahtarlar = Object.keys(varsayilan).filter((k) => Object.keys(varsayilan[k]).length && olcumler.includes(k.split(':')[0] as OlcumTipi))
  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>Bu hastadan istenen ölçümler</div>
      <div className="evv-cipler" style={{ marginBottom: 16 }}>
        {(Object.keys(OLCUM_TANIMLARI) as OlcumTipi[]).map((t) => (
          <button key={t} type="button" className="evv-cip" aria-pressed={olcumler.includes(t)} onClick={() => setOlcumler(olcumler.includes(t) ? olcumler.filter((x) => x !== t) : [...olcumler, t])}>{OLCUM_TANIMLARI[t].ad}</button>
        ))}
      </div>
      {anahtarlar.map((k) => (
        <div key={k} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 7, height: 7, borderRadius: '50%', background: metrikRengi(k), display: 'inline-block' }} />{metrikEtiketi(k)} <span className="evv-kucuk" style={{ fontWeight: 500 }}>{OLCUM_TANIMLARI[k.split(':')[0] as OlcumTipi].birim}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 8 }}>
            {ALANLAR.filter(([a]) => varsayilan[k][a] != null).map(([a, ad]) => (
              <label key={a} style={{ fontSize: 12, color: R.muted, display: 'grid', gap: 3 }}>{ad}
                <input inputMode="decimal" placeholder={String(varsayilan[k][a])} value={esik[k]?.[a] ?? ''} onChange={(e) => { setKaydedildi(false); setEsik({ ...esik, [k]: { ...(esik[k] || {}), [a]: e.target.value.replace(',', '.') } }) }} style={girdi} />
              </label>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', margin: '6px 0 10px' }}>
        <label style={{ fontSize: 13, display: 'inline-flex', gap: 8, alignItems: 'center' }}>LDL hedefi (mg/dL) <input inputMode="numeric" value={ldl} onChange={(e) => setLdl(e.target.value)} style={{ ...girdi, width: 76 }} /></label>
        <label style={{ fontSize: 13, display: 'inline-flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={kilo} onChange={(e) => setKilo(e.target.checked)} />3 günde +2 kg artışı bana bildir</label>
      </div>
      <p className="evv-kucuk" style={{ margin: '0 0 12px', lineHeight: 1.5, maxWidth: '75ch' }}>Boş alanlar kılavuz varsayılanını kullanır (gri değer). Kaynaklar: ESC 2024 / ESH 2023 hipertansiyon, TEMD diyabet kılavuzu (son baskı), ADA Standards of Care, gebelikte SB Doğum Öncesi Bakım Rehberi.</p>
      <button type="button" className="evv-btn evv-btn-ana" disabled={mesgul} onClick={async () => {
        setMesgul(true)
        const temiz: Record<string, Record<string, number>> = {}
        for (const [k, v] of Object.entries(esik)) for (const [a, n] of Object.entries(v || {})) if (n !== '' && n != null && Number.isFinite(Number(n))) (temiz[k] ||= {})[a] = Number(n)
        const ekstra = olcumler.filter((t) => !veri.olcumTipleri.includes(t))
        const kapali = veri.olcumTipleri.filter((t) => !olcumler.includes(t))
        try { await kaydet({ esikler: temiz, olcumler: [...(veri.hekimAyar.olcumler || []).filter((t) => olcumler.includes(t)), ...ekstra], kapali, ldlHedef: ldl ? Number(ldl) : null, kiloBildir: kilo }); setKaydedildi(true) } finally { setMesgul(false) }
      }}>{kaydedildi ? 'Kaydedildi' : 'Kaydet'}</button>
    </div>
  )
}

const GUN_RENK: Record<DozGunu, string> = { tam: HALKA_RENK.ilac, kismi: 'rgba(15,155,142,0.42)', alinmadi: R.warn, yok: '#ebe4d8' }

export default function Ayrintilar({ veri, sirali, sekme, setSekme, metrik, setMetrik, mesgul, istek, kaydet }: {
  veri: Veri; sirali: Metrik[]; sekme: Sekme; setSekme: (s: Sekme) => void; metrik: string | null; setMetrik: (m: string) => void; mesgul: boolean
  istek: (method: 'POST' | 'PATCH', govde: Record<string, unknown>) => Promise<void>; kaydet: (a: Record<string, unknown>) => Promise<void>
}) {
  const acik = acikUyarilar(veri)
  const sekmeler: Array<[Sekme, string]> = [['uyarilar', 'Uyarılar'], ['ilaclar', 'İlaçlar'], ['olcumler', 'Ölçümler'], ['ozet', 'Özet'], ['hedefler', 'Eşikler']]
  const m = sirali.find((x) => x.anahtar === metrik) || sirali[0]
  return (
    <div className="evv-ayr">
      <div className="evv-sekmeler" role="tablist" aria-label="Ev verisi ayrıntıları">
        {sekmeler.map(([k, ad]) => (
          <button key={k} type="button" role="tab" aria-selected={sekme === k} onClick={() => setSekme(k)} aria-label={k === 'uyarilar' && acik.length ? `Uyarılar, ${acik.length} yeni` : undefined}>
            {ad}{k === 'uyarilar' && acik.length ? <i aria-hidden style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: TON_RENK.dikkat.ana, marginLeft: 6, verticalAlign: 'middle' }} /> : null}
          </button>
        ))}
      </div>
      <div className="evv-panel" role="tabpanel">
        {sekme === 'uyarilar' ? (
          veri.uyarilar.length ? (
            <div>
              {veri.uyarilar.slice(0, 12).map((u) => (
                <div key={u.id} className="evv-satir" style={{ gridTemplateColumns: '10px minmax(0,1fr) auto', opacity: u.goruldu ? 0.55 : 1 }}>
                  <i style={{ width: 8, height: 8, borderRadius: '50%', background: u.duzey === 'acil' ? TON_RENK.acil.ana : u.duzey === 'dikkat' ? '#b58a3a' : TON_RENK.dikkat.ana }} />
                  <span style={{ lineHeight: 1.45 }}>{u.metin}</span>
                  <span className="evv-kucuk" style={{ whiteSpace: 'nowrap' }}>{u.goruldu ? 'görüldü · ' : ''}{trTarihSaat(u.tarih)}</span>
                </div>
              ))}
              {acik.length ? <button type="button" className="evv-btn evv-btn-ana" style={{ marginTop: 12 }} disabled={mesgul} onClick={() => istek('POST', { islem: 'gordum' })}>Gördüm</button> : null}
            </div>
          ) : <p className="evv-kucuk" style={{ margin: 0 }}>Açık uyarı yok. Eşik ya da eğilim aşıldığında burada ve Fısıltı&apos;da görünür.</p>
        ) : null}

        {sekme === 'ilaclar' ? (
          veri.uyum.ilaclar.length ? (
            <div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }} className="evv-kucuk">
                <span>Son 14 gün</span>
                {([['tam', 'alındı'], ['kismi', 'eksik'], ['alinmadi', 'alınmadı']] as Array<[DozGunu, string]>).map(([k, ad]) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><b style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block', ...(k === 'alinmadi' ? { boxShadow: `inset 0 0 0 1.5px ${R.warn}` } : { background: GUN_RENK[k] }) }} />{ad}</span>)}
                <span style={{ marginLeft: 'auto' }}>Kritik ilaç 2 gün işaretlenmezse size bildirilir</span>
              </div>
              {veri.uyum.ilaclar.map((i) => {
                const plan = veri.planlar.find((p) => p.id === i.planId)
                return (
                  <div key={i.planId} className="evv-satir evv-ilac">
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{i.ad}</span>{i.kaynak === 'hasta' ? <span className="evv-kucuk"> (hastanın eklediği)</span> : null}
                      {plan?.doz ? <span className="evv-kucuk" style={{ display: 'block', marginTop: 1 }}>{plan.doz}</span> : null}
                    </span>
                    <span className="evv-serit" aria-label={`Son 14 gün: ${i.gunler.filter((g) => g === 'tam').length} gün tam`}>{i.gunler.map((g, k) => <b key={k} data-d={g} style={{ background: GUN_RENK[g] }} />)}</span>
                    <span style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{i.yuzde == null ? '—' : `%${i.yuzde}`}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} className="evv-kucuk">Kritik
                      <button type="button" role="switch" className="evv-anahtar" aria-checked={!!plan?.kritik} aria-label={`${i.ad} kritik ilaç`} title="Kritik ilaç: 2 gün işaretlenmezse size bildirilir" onClick={() => istek('PATCH', { plan: { planId: i.planId, kritik: !plan?.kritik } })} />
                    </span>
                  </div>
                )
              })}
            </div>
          ) : <p className="evv-kucuk" style={{ margin: 0 }}>Planlı ilaç yok. Reçetedeki ilaçlar hastanın Doz Takvimi&apos;ne eklendiğinde uyum burada görünür.</p>
        ) : null}

        {sekme === 'olcumler' ? (
          m ? (
            <div>
              <div className="evv-cipler">
                {sirali.map((x) => <button key={x.anahtar} type="button" className="evv-cip" aria-pressed={x.anahtar === m.anahtar} onClick={() => setMetrik(x.anahtar)}><i style={{ background: metrikRengi(x.anahtar) }} />{kisaAd(x.anahtar)}</button>)}
              </div>
              <div className="evv-kucuk" style={{ margin: '4px 0 2px' }}>
                {m.noktalar.length} ölçüm, son 4 hafta{m.hedefMin != null || m.hedefMax != null ? ` · hedef ${m.hedefMin != null ? `${sayi(m.hedefMin)}–` : '<'}${sayi(m.hedefMax)}${m.hedefMax2 != null ? `/${sayi(m.hedefMax2)}` : ''} ${m.birim}` : ''}
              </div>
              <div className="evv-liste">
                {[...m.noktalar].reverse().map((n, k) => {
                  const disi = degerHedefDisi(m, n.deger, n.deger2)
                  const od = OLCUM_TANIMLARI[m.anahtar.split(':')[0] as OlcumTipi]?.ondalik ?? 0
                  return (
                    <div key={k} className="evv-satir" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', padding: '9px 0' }}>
                      <span className="evv-kucuk" style={{ fontSize: 13.5 }}>{new Date(n.at).toLocaleString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}</span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: disi ? TON_RENK.dikkat.ana : R.ink }}>
                        {n.deger2 != null ? `${sayi(n.deger)}/${sayi(n.deger2)}` : sayi(n.deger, od)} <span className="evv-kucuk" style={{ fontWeight: 500 }}>{m.birim}</span>{disi ? <span className="evv-kucuk" style={{ color: TON_RENK.dikkat.ana, fontWeight: 500 }}> · hedef dışı</span> : null}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : <p className="evv-kucuk" style={{ margin: 0 }}>Son 4 haftada ev ölçümü yok.</p>
        ) : null}

        {sekme === 'ozet' ? (
          <div>
            {veri.kontrolOzeti ? (
              <>
                <div className="evv-kucuk">Hazırlandı {trTarihSaat(veri.kontrolOzeti.olusturmaAt)}{veri.kontrolOzeti.randevuAt ? `, randevu ${trTarihSaat(veri.kontrolOzeti.randevuAt)}` : ''}</div>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.6, background: '#f8f3ea', borderRadius: 14, padding: '14px 16px', margin: '10px 0 12px', maxWidth: '80ch' }}>{veri.kontrolOzeti.metin}</pre>
              </>
            ) : <p className="evv-kucuk" style={{ margin: '0 0 12px' }}>Randevudan bir gün önce kendiliğinden hazırlanır.</p>}
            <button type="button" className="evv-btn" disabled={mesgul} onClick={() => istek('POST', { islem: 'ozet' })}>Şimdi oluştur</button>
          </div>
        ) : null}

        {sekme === 'hedefler' ? <EsikPaneli veri={veri} kaydet={kaydet} /> : null}
      </div>
    </div>
  )
}

