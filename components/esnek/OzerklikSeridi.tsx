'use client'
/**
 * ESNEK-MUAYENE-B3 — the autonomy ladder on the note screen: one strip, per field green (confident) / auto-accepted (B2+) /
 * yellow (needs a look — always for drugs/doses, side, allergy, diagnosis codes) / draft (B0), the yellow sentences listed,
 * and the one-tap hint when the note qualifies. Each field can be lowered one step from here. Records "opened" for the daily
 * batch. The approve button stays the page's own (the ONE approval path). Country-neutral (words + API injected).
 */
import { useCallback, useEffect, useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import type { AlanGorunumu } from '@/core/esnek/ozerklik'
import { EL_RENK as R } from '@/components/elNotu/renk'
import type { Getirici } from '@/components/elNotu/ElNotuYakala'

type Durum = { alanlar: AlanGorunumu[]; tekDokunus: boolean; topluUygun: boolean; bakilacak: number; onayli: boolean }

const RENK: Record<AlanGorunumu['durum'], { bg: string; fg: string }> = {
  otomatik: { bg: '#e8ede6', fg: '#2f4334' },
  yesil: { bg: '#e8ede6', fg: '#2f4334' },
  sari: { bg: '#FEF3C7', fg: '#B54708' },
  taslak: { bg: '#F6F0E4', fg: '#8b7d70' },
}

export default function OzerklikSeridi(p: { metin: EsnekMetinleri; getir: Getirici; api: string; noteId: string }) {
  const M = p.metin.ozerklik
  const [d, setD] = useState<Durum | null>(null)
  const [acik, setAcik] = useState(false)
  const { getir, api, noteId } = p
  const yukle = useCallback(async () => {
    const r = await getir(`${api}/not-durumu?noteId=${encodeURIComponent(noteId)}`).catch(() => null)
    setD(r?.ok ? await r.json() : null)
  }, [getir, api, noteId])
  // once per note (never per keystroke): the ladder view + "opened" for the daily batch
  useEffect(() => {
    void yukle()
    void getir(`${api}/not-durumu`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteId, tur: 'acildi' }) }).catch(() => undefined)
  }, [yukle, getir, api, noteId])

  if (!d || d.onayli || !d.alanlar.length) return null
  if (d.alanlar.every((a) => a.basamak === 0 && !a.korumali)) return null // B0 everywhere: nothing to show yet
  async function indir(alan: string) {
    await p.getir(`${p.api}/profil`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ islem: 'ozerklik', alt: 'indir', alan }) }).catch(() => null)
    await yukle()
  }
  return (
    <div style={{ background: '#fff', border: `1px solid ${R.cizgi}`, borderRadius: 12, padding: '10px 12px', display: 'grid', gap: 8, margin: '8px 0' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: d.tekDokunus ? R.cam : R.murekkep }}>{d.tekDokunus ? M.tekDokunus : M.bakilacak(d.bakilacak)}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {d.alanlar.map((a) => (
          <button key={a.alan} type="button" onClick={() => setAcik((x) => !x)} title={M.basamak[a.basamak]}
            style={{ border: 'none', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600, background: RENK[a.durum].bg, color: RENK[a.durum].fg, cursor: 'pointer' }}>
            {M.alan[a.alan]} · {M.durum[a.durum]}
          </button>
        ))}
      </div>
      {acik && (
        <div style={{ display: 'grid', gap: 6 }}>
          {d.alanlar.filter((a) => a.sariCumleler.length || a.basamak > 0).map((a) => (
            <div key={a.alan} style={{ fontSize: 12, color: R.murekkep }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <b>{M.alan[a.alan]}</b><span style={{ color: R.soluk }}>{M.basamak[a.basamak]}</span>
                {a.basamak > 0 && !a.korumali && <button type="button" onClick={() => void indir(a.alan)} style={{ border: `1px solid ${R.cizgi}`, background: '#fff', borderRadius: 8, fontSize: 11, padding: '1px 8px', cursor: 'pointer' }}>{M.asagi}</button>}
              </div>
              {a.sariCumleler.map((c, i) => <div key={i} style={{ background: R.amberAcik, borderRadius: 6, padding: '2px 6px', marginTop: 2 }}>{c}</div>)}
            </div>
          ))}
          <div style={{ fontSize: 11, color: R.soluk }}>{M.korumaliNot}</div>
        </div>
      )}
    </div>
  )
}
