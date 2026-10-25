'use client'

/**
 * AU-QUICK-02 — PROCEDURE CODES. The same tool shell as every country tool page (AracKabugu); every word is the pack's
 * (uzanti.taniKodlari.metin). Search runs on the server (/api/ulke/islem-kodlari); no code list is in this bundle.
 */
import React, { useState } from 'react'
import { AracKabugu } from './AracKabugu'
import { Cerceve, Hata, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { rolAdi } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { IslemSonucu } from '@/lib/ulke/kayit/islemKaynagi'

export default function IslemKodlari() {
  const u = useUygulama('islemKodlari')
  const t = ulkePaketi().uzanti?.islemKodlari
  const [q, setQ] = useState('')
  const [sonuc, setSonuc] = useState<IslemSonucu[] | null>(null)
  const [hazir, setHazir] = useState<boolean | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState(false)
  if (!u.hesap || !t) return <Yukleniyor m={u.m} dil={u.dil} />
  const d = t.metin
  async function ara(e: React.FormEvent) {
    e.preventDefault()
    setHata(false); setBekliyor(true)
    const r = await u.api(`/api/ulke/islem-kodlari?q=${encodeURIComponent(q.trim())}`)
    setBekliyor(false)
    if (!r.ok) { setHata(true); return }
    setHazir(r.j.hazir === true); setSonuc((r.j.sonuclar as IslemSonucu[]) ?? [])
  }
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} unvan={rolAdi(u.hesap.rol, u.dil) ?? undefined} aktif="islemKodlari" cikis={u.cikis}>
      <AracKabugu kicker={d.arac} geriHref={YOL.araclar} geriEtiket={d.arac} baslik={d.baslik} aciklama={d.aciklama}>
        <form className="uza-kart" onSubmit={ara} role="search" data-alan="islem-ara">
          <label className="uza-etiket" htmlFor="uza-islem-q">{d.araEtiketi}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <input id="uza-islem-q" name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.araOrnek} autoComplete="off" maxLength={64} className="uza-girdi" style={{ flex: '1 1 200px', padding: '0 12px' }} />
            <button type="submit" className="uza-dugme" disabled={bekliyor || q.trim().length < 2} style={{ minHeight: 44, minWidth: 96, padding: '0 18px' }}>{bekliyor ? d.araniyor : d.ara}</button>
          </div>
        </form>
        {hata ? <Hata>{d.hata}</Hata> : null}
        {sonuc !== null && hazir === false ? <p className="uza-bos" role="status" data-alan="islem-veri-yok">{d.veriYok}</p> : null}
        {sonuc !== null && hazir !== false ? (
          sonuc.length === 0 ? <p className="uza-bos" role="status">{d.sonucYok}</p> : (
            <section className="uza-kart" data-alan="islem-sonuc">
              <p className="uza-ipucu" role="status">{yerine(d.sonucSayisi, sonuc.length)}</p>
              <ul className="uza-liste" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sonuc.map((s) => (
                  <li key={s.item} data-kod={s.item} style={{ padding: '10px 0', borderTop: '1px solid rgba(58,44,34,0.08)', overflowWrap: 'anywhere' }}>
                    <strong>{d.mbsEtiketi} {s.item}</strong>{s.aciklama ? <> · {s.aciklama}</> : null}
                    <div className="uza-ipucu" style={{ marginTop: 4 }} data-esleme={s.esleme}>
                      {s.esleme === 'var'
                        ? `${d.achiEtiketi}: ${s.achi.map((x) => (x.surum ? `${x.kod} (${yerine(d.surum, x.surum)})` : x.kod)).join(', ')}`
                        : d.esleme_yok}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        ) : null}
        <p className="uza-ipucu" data-alan="islem-kaynak">{d.kaynakEtiketi}</p>
      </AracKabugu>
    </Cerceve>
  )
}
