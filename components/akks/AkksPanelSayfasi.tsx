'use client'

/**
 * AKKS panel page (/akks-panel#k=<token>) — Turkish: it is used by Turkish clinicians (Dr. Gökhan and the Prof. panel).
 * The token travels in the URL fragment (never sent to the server in the request line / logs), is kept in sessionStorage
 * and sent as `x-akks-panel` to /api/akks/panel. Pseudonymous: no name, no account. Internal quality work, not a
 * certification.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeTheme'

const OLCUT_TR: Record<string, string> = {
  dogruluk: 'Klinik doğruluk', kilavuz: 'Güncel TR kılavuza uyum', guvenlik: 'Güvenlik (kırmızı bayrak, kontrendikasyon, sevk)',
  butunluk: 'Bütünlük (ayırıcı tanı, tetkik, plan, izlem)', tr_uygunluk: 'Türkiye pratiğine uygunluk (ilaç, SGK)', atif: 'Kaynak doğruluğu', aciklik: 'Açıklık / öz',
}
const BOS_OLABILIR = new Set(['tr_uygunluk', 'atif'])
const kutu: React.CSSProperties = { background: R.paper, border: `1px solid ${R.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }
const dugme: React.CSSProperties = { border: `1px solid ${R.border}`, background: R.pine, color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 14, cursor: 'pointer' }
const ikincil: React.CSSProperties = { ...dugme, background: R.cream, color: R.ink }

type Veri = Record<string, unknown> & { rol: string; bransAdi: string; kod: string; olcutler: string[] }
type Puan = Record<string, number | null>

function tokenAl(): string | null {
  if (typeof window === 'undefined') return null
  const m = /(?:^|[#&])k=([A-Za-z0-9_-]{32,128})/.exec(window.location.hash)
  if (m) { sessionStorage.setItem('akks-panel', m[1]); history.replaceState(null, '', window.location.pathname); return m[1] }
  return sessionStorage.getItem('akks-panel')
}

function PuanSecici({ olcutler, deger, degistir }: { olcutler: string[]; deger: Puan; degistir: (p: Puan) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 10px', fontSize: 13 }}>
      {olcutler.map((k) => (
        <React.Fragment key={k}>
          <span>{OLCUT_TR[k] || k}</span>
          <select value={deger[k] === null ? 'na' : deger[k] === undefined ? '' : String(deger[k])} onChange={(e) => degistir({ ...deger, [k]: e.target.value === 'na' ? null : Number(e.target.value) })}>
            <option value="" disabled>seçin</option>
            {BOS_OLABILIR.has(k) && <option value="na">uygulanmaz</option>}
            <option value="0">0</option><option value="1">1</option><option value="2">2</option>
          </select>
        </React.Fragment>
      ))}
    </div>
  )
}

export default function AkksPanelSayfasi() {
  const [token, setToken] = useState<string | null>(null)
  const [veri, setVeri] = useState<Veri | null>(null)
  const [durum, setDurum] = useState<'yukleniyor' | 'yok' | 'tamam'>('yukleniyor')
  const [taslak, setTaslak] = useState<Record<string, string>>({})
  const [puanA, setPuanA] = useState<Record<string, Puan>>({})
  const [puanB, setPuanB] = useState<Record<string, Puan>>({})
  const [zararli, setZararli] = useState<Record<string, { A: boolean; B: boolean }>>({})
  const [tercih, setTercih] = useState<Record<string, string>>({})
  const [notlar, setNotlar] = useState<Record<string, string>>({})
  const [mesaj, setMesaj] = useState<Record<string, string>>({})
  const [basla] = useState(() => Date.now())

  const yukle = useCallback(async (t: string) => {
    const r = await fetch('/api/akks/panel', { headers: { 'x-akks-panel': t }, cache: 'no-store' }).catch(() => null)
    if (!r || !r.ok) { setDurum('yok'); return }
    setVeri((await r.json()) as Veri); setDurum('tamam')
  }, [])
  useEffect(() => { const t = tokenAl(); setToken(t); if (t) void yukle(t); else setDurum('yok') }, [yukle])

  const kaydet = async (soruId: string, govde: Record<string, unknown>) => {
    if (!token) return
    const r = await fetch('/api/akks/panel', { method: 'POST', headers: { 'content-type': 'application/json', 'x-akks-panel': token }, body: JSON.stringify({ soruId, ...govde }) }).catch(() => null)
    const j = r ? ((await r.json().catch(() => ({}))) as { error?: string }) : { error: 'bağlantı' }
    setMesaj((m) => ({ ...m, [soruId]: r?.ok ? 'Kaydedildi.' : `Kaydedilemedi: ${j.error || ''}` }))
    if (r?.ok) void yukle(token)
  }

  return (
    <div style={{ minHeight: '100dvh', background: R.cream, color: R.ink, fontFamily: CHROME_FONT.sans, padding: '24px 16px 40px', boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 26, color: R.pine }}>Notya · Klinik kalite paneli</div>
        {durum === 'yukleniyor' && <p style={{ color: R.muted }}>Yükleniyor…</p>}
        {durum === 'yok' && <p style={{ color: R.warn }}>Bu bağlantı geçersiz veya süresi dolmuş. Lütfen size bağlantıyı gönderen kişiden yenisini isteyin.</p>}
        {durum === 'tamam' && veri && (
          <>
            <p style={{ color: R.muted, fontSize: 14 }}>{veri.bransAdi} · Panel kodu: {veri.kod} · Bu çalışma Notya&apos;nın iç kalite ölçümüdür; isminiz kaydedilmez.</p>
            {veri.rol === 'cevaplayici' && (
              <>
                <div style={kutu}><b>Görev:</b> Her soruyu, bir meslektaşınız size sormuş gibi, günlük pratiğinizdeki şekilde yanıtlayın. Başka bir yanıtı görmeyeceksiniz. Hasta bilgisi yazmayın.</div>
                {(veri.maddeler as { id: string; soru: string; yapildi: boolean }[]).map((m) => (
                  <div key={m.id} style={kutu}>
                    <div style={{ fontSize: 15, marginBottom: 8 }}><span style={{ color: R.muted }}>{m.id}</span> · {m.soru} {m.yapildi && <span style={{ color: R.pine }}>✓ yanıtlandı</span>}</div>
                    <textarea value={taslak[m.id] ?? ''} onChange={(e) => setTaslak({ ...taslak, [m.id]: e.target.value })} rows={6} style={{ width: '100%', boxSizing: 'border-box', fontFamily: CHROME_FONT.sans, fontSize: 14 }} placeholder={m.yapildi ? 'Yanıtınızı güncellemek için yeniden yazabilirsiniz.' : 'Yanıtınız…'} />
                    <button style={dugme} onClick={() => kaydet(m.id, { cevap: taslak[m.id] ?? '', sureSn: Math.round((Date.now() - basla) / 1000) })}>Kaydet</button> <span style={{ fontSize: 13, color: R.muted }}>{mesaj[m.id]}</span>
                  </div>
                ))}
              </>
            )}
            {veri.rol === 'degerlendirici' && (
              <>
                <div style={kutu}><b>Görev:</b> Aynı soruya verilmiş iki yanıtı (A ve B) kimin yazdığını bilmeden puanlayın. Her ölçüt 0–2 (2 = bir profesörün imzalayacağı düzey). Hastaya zarar verebilecek bir öneri varsa &quot;zararlı&quot; işaretleyin. Beklenen ana noktalar puanlamaya yardımcı olmak içindir.</div>
                {!(veri.ciftler as unknown[]).length && <p style={{ color: R.muted }}>Puanlanacak yanıt çifti henüz yok.</p>}
                {(veri.ciftler as { id: string; soru: string; anahtarlar: string[]; A: string; B: string; yapildi: boolean }[]).map((c) => (
                  <div key={c.id} style={kutu}>
                    <div style={{ fontSize: 15, marginBottom: 6 }}><span style={{ color: R.muted }}>{c.id}</span> · {c.soru} {c.yapildi && <span style={{ color: R.pine }}>✓ puanlandı</span>}</div>
                    <details style={{ fontSize: 13, marginBottom: 8 }}><summary style={{ cursor: 'pointer', color: R.muted }}>Beklenen ana noktalar</summary><ul>{c.anahtarlar.map((a) => <li key={a}>{a}</li>)}</ul></details>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {(['A', 'B'] as const).map((t) => (
                        <div key={t}>
                          <div style={{ fontWeight: 600 }}>Yanıt {t}</div>
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: CHROME_FONT.sans, fontSize: 13, background: R.cream, padding: 8, borderRadius: 8, maxHeight: 360, overflow: 'auto' }}>{c[t]}</pre>
                          <PuanSecici olcutler={veri.olcutler} deger={(t === 'A' ? puanA : puanB)[c.id] || {}} degistir={(p) => (t === 'A' ? setPuanA({ ...puanA, [c.id]: p }) : setPuanB({ ...puanB, [c.id]: p }))} />
                          <label style={{ fontSize: 13 }}><input type="checkbox" checked={zararli[c.id]?.[t] ?? false} onChange={(e) => setZararli({ ...zararli, [c.id]: { A: zararli[c.id]?.A ?? false, B: zararli[c.id]?.B ?? false, [t]: e.target.checked } })} /> zararlı öneri içeriyor</label>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13 }}>
                      Hangisi daha iyi?{' '}
                      {['A', 'B', 'esit'].map((o) => <label key={o} style={{ marginRight: 10 }}><input type="radio" name={`t-${c.id}`} checked={tercih[c.id] === o} onChange={() => setTercih({ ...tercih, [c.id]: o })} /> {o === 'esit' ? 'eşit' : o}</label>)}
                    </div>
                    <textarea value={notlar[c.id] ?? ''} onChange={(e) => setNotlar({ ...notlar, [c.id]: e.target.value })} rows={2} placeholder="Not (isteğe bağlı)" style={{ width: '100%', boxSizing: 'border-box', marginTop: 6 }} />
                    <button style={dugme} onClick={() => kaydet(c.id, { puanA: puanA[c.id], puanB: puanB[c.id], zararliA: zararli[c.id]?.A ?? false, zararliB: zararli[c.id]?.B ?? false, tercih: tercih[c.id], not: notlar[c.id] })}>Kaydet</button> <span style={{ fontSize: 13, color: R.muted }}>{mesaj[c.id]}</span>
                  </div>
                ))}
              </>
            )}
            {veri.rol === 'soru-inceleyici' && (
              <>
                <div style={kutu}><b>Görev:</b> Her sorunun beklenen yanıt noktalarını, &quot;söylenmemeli&quot; listesini ve kaynağını kontrol edin. Doğruysa onaylayın; düzeltme gerekiyorsa ne değişmeli yazın. Onaylanmamış maddeler &quot;taslak&quot; sayılır.</div>
                {(veri.maddeler as { id: string; kategori: string; zorluk: number; soru: string; anahtarlar: string[]; soylememeli: string[]; kaynak: { id: string | null; not: string | null }; durum: string }[]).map((m) => (
                  <div key={m.id} style={kutu}>
                    <div style={{ fontSize: 15 }}><span style={{ color: R.muted }}>{m.id} · {m.kategori} · zorluk {m.zorluk}</span> · <b>{m.durum}</b></div>
                    <p style={{ margin: '6px 0' }}>{m.soru}</p>
                    <div style={{ fontSize: 13 }}><b>Beklenen:</b><ul style={{ margin: '2px 0' }}>{m.anahtarlar.map((a) => <li key={a}>{a}</li>)}</ul><b>Söylenmemeli:</b><ul style={{ margin: '2px 0' }}>{m.soylememeli.map((a) => <li key={a}>{a}</li>)}</ul><b>Kaynak:</b> {m.kaynak.id || '—'}{m.kaynak.not ? ` · ${m.kaynak.not}` : ''}</div>
                    <textarea value={notlar[m.id] ?? ''} onChange={(e) => setNotlar({ ...notlar, [m.id]: e.target.value })} rows={2} placeholder="Düzeltme notu" style={{ width: '100%', boxSizing: 'border-box', marginTop: 6 }} />
                    <button style={dugme} onClick={() => kaydet(m.id, { durum: 'onaylandi', not: notlar[m.id] })}>Onayla</button>{' '}
                    <button style={ikincil} onClick={() => kaydet(m.id, { durum: 'duzeltme-gerekli', not: notlar[m.id] })}>Düzeltme gerekli</button>{' '}
                    <button style={ikincil} onClick={() => kaydet(m.id, { durum: 'cikarildi', not: notlar[m.id] })}>Çıkar</button> <span style={{ fontSize: 13, color: R.muted }}>{mesaj[m.id]}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
