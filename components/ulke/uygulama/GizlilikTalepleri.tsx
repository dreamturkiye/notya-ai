'use client'

/**
 * AU-BETA-01 — THE DOCTOR'S PRIVACY SCREEN (pack extension `uzanti.gizlilik`): patients' access and correction requests
 * with the days left on the response timer, and the consent records. Initial compliance draft – external legal review later.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Ipucu } from './Ipucu'
import { Bilgi, Cerceve, Hata, Yukleniyor, tarihYaz, useUygulama } from './Kabuk'
import { rolAdi } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { ulkeYolu } from '@/lib/ulke/yol'

type Talep = { id: string; hastaId: string; hastaAdi: string; tur: 'erisim' | 'duzeltme'; durum: 'yeni' | 'islemde' | 'tamamlandi' | 'reddedildi'; alindiAt: string; sonTarih: string; ayrinti: string; yanit: string; kalanGun: number }
type Riza = { id: string; hastaAdi: string; surum: string; kaynak: string; verildiAt: string; geriCekildiAt: string | null }

export default function GizlilikTalepleri() {
  const u = useUygulama('gizlilikTalepleri')
  const g = ulkePaketi().uzanti?.gizlilik
  const [talepler, setTalepler] = useState<Talep[] | null>(null)
  const [rizalar, setRizalar] = useState<Riza[]>([])
  const [yanit, setYanit] = useState<Record<string, string>>({})
  const [hata, setHata] = useState<string | null>(null)
  const { api, hesap } = u
  const yukle = useCallback(async () => {
    const r = await api('/api/ulke/gizlilik')
    if (r.ok) { setTalepler(r.j.talepler as Talep[]); setRizalar(r.j.rizalar as Riza[]) } else setTalepler([])
  }, [api])
  useEffect(() => { if (hesap && g) void yukle() }, [hesap, g, yukle])
  if (!u.hesap || !g) return <Yukleniyor m={u.m} dil={u.dil} />
  const d = g.doktor
  async function guncelle(id: string, durum: string) {
    setHata(null)
    const r = await api('/api/ulke/gizlilik', { method: 'PATCH', govde: { id, durum, yanit: yanit[id] ?? '' } })
    if (r.ok) await yukle(); else setHata(d.kayitHatasi)
  }
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} unvan={rolAdi(u.hesap.rol, u.dil) ?? undefined} aktif="gizlilikTalepleri" cikis={u.cikis}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><h1 className="uza-h1">{d.baslik}</h1><Ipucu m={u.m} bolum="gizlilik" /></span>
      <p className="uza-aciklama">{d.aciklama}</p>
      {g.taslakEtiketi ? <p className="uza-ipucu" data-alan="taslak-etiketi">{g.taslakEtiketi}</p> : null}
      <Hata>{hata}</Hata>
      <section className="uza-kart" data-alan="talep-liste">
        {talepler === null ? <p className="uza-bos">…</p> : talepler.length === 0 ? <p className="uza-bos">{d.bos}</p> : (
          <ul className="uza-liste">{talepler.map((t) => {
            const acik = t.durum === 'yeni' || t.durum === 'islemde'
            return (
              <li key={t.id} data-talep={t.id} data-gecikmis={acik && t.kalanGun < 0 ? 'evet' : 'hayir'}>
                <div className="uza-satir">
                  <span className="uza-liste-ad">{t.hastaAdi} · {t.tur === 'erisim' ? g.talep.erisim : g.talep.duzeltme}
                    <span className="uza-liste-alt">{g.talep.durumlar[t.durum]} · {d.alinan}: {tarihYaz(t.alindiAt.slice(0, 10))} · {d.sonTarih}: {tarihYaz(t.sonTarih)}
                      {acik ? ` · ${t.kalanGun >= 0 ? yerine(d.kalanGun, t.kalanGun) : yerine(d.gecikmisGun, -t.kalanGun)}` : ''}</span>
                    {t.ayrinti ? <span className="uza-liste-alt">{t.ayrinti}</span> : null}
                    {t.yanit ? <span className="uza-liste-alt">{t.yanit}</span> : null}
                  </span>
                </div>
                {t.tur === 'erisim' && t.hastaId ? (
                  <p className="uza-ipucu" data-alan="disa-aktar"><a className="uza-baglanti" href={ulkeYolu(`/api/ulke/gizlilik/disa-aktar?hastaId=${encodeURIComponent(t.hastaId)}`)} download>{d.disaAktar}</a><br />{d.disaAktarIpucu}</p>
                ) : null}
                {acik ? (
                  <div className="uza-form">
                    <label className="uza-etiket" htmlFor={`y-${t.id}`}>{d.yanit}</label>
                    <textarea id={`y-${t.id}`} className="uza-girdi" rows={2} maxLength={4000} value={yanit[t.id] ?? ''} onChange={(e) => setYanit({ ...yanit, [t.id]: e.target.value })} />
                    <p className="uza-ipucu">{d.yanitIpucu}</p>
                    <div className="uza-eylemler">
                      {t.durum === 'yeni' ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => void guncelle(t.id, 'islemde')}>{d.islemde}</button> : null}
                      <button type="button" className="uza-dugme uza-dugme-kucuk" onClick={() => void guncelle(t.id, 'tamamlandi')}>{d.tamamla}</button>
                      <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => void guncelle(t.id, 'reddedildi')}>{d.reddet}</button>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}</ul>
        )}
      </section>
      <section className="uza-kart" data-alan="riza-liste">
        <h2 className="uza-h2">{d.rizaBaslik}</h2>
        {rizalar.length === 0 ? <p className="uza-bos">{d.rizaBos}</p> : (
          <ul className="uza-liste">{rizalar.map((r) => <li key={r.id}><div className="uza-satir"><span className="uza-liste-ad">{r.hastaAdi}<span className="uza-liste-alt">{r.surum} · {r.kaynak} · {tarihYaz(r.verildiAt.slice(0, 10))}{r.geriCekildiAt ? ` · ${d.rizaGeri} ${tarihYaz(r.geriCekildiAt.slice(0, 10))}` : ''}</span></span></div></li>)}</ul>
        )}
      </section>
      <Bilgi>{null}</Bilgi>
    </Cerceve>
  )
}
