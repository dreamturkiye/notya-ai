'use client'
/**
 * HASTA-PORTALI-GUNLUK — Sağlığım › Sağlık Karnesi: the report card (weekly / monthly) with grade stamps, the day strip,
 * the streak with kalkan days, and the badge collection. Printable (Yazdır / PDF) as a one-page monthly karne the patient
 * can share. Never punishes: the lowest band is "Yolun başında", missing subjects say why.
 */
import { useState } from 'react'
import type { GunlukDurum, GunlukRozet } from '@/lib/saglikEvi/ozet'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { kisaTarih } from '@/lib/saglikEvi/sozler'
import type { GunlukEylemleri } from './eylemler'
import { RozetSvg } from './Rozet'
import { RozetAcilisi } from './RozetAcilisi'

export function KarneGorunumu({ s, durum, eylemler, hastaAdi }: { s: SaglikEviSozleri; durum: GunlukDurum; eylemler: GunlukEylemleri; hastaAdi: string | null }) {
  const [donem, setDonem] = useState<'hafta' | 'ay'>('hafta')
  const [secili, setSecili] = useState<GunlukRozet | null>(null)
  const k = durum.karne[donem]
  const yeni = durum.rozetler.find((r) => r.yeni)
  const sirali = [...durum.rozetler].sort((a, b) => Number(b.kazanildi) - Number(a.kazanildi))
  return (
    <div className="sge">
      <header className="sge-ust sge-yazdir-gizle" style={{ alignItems: 'flex-start' }}>
        <div><h1 className="sge-selam">{s.karneBaslik}</h1><p className="sge-tarih">{s.karneAlt}</p></div>
      </header>

      <article className="sge-karne" style={{ marginTop: 12 }} aria-labelledby="sge-karne-b">
        <div className="sge-karne-bas">
          <div>
            <h2 id="sge-karne-b" className="sge-karne-baslik">{donem === 'hafta' ? s.karneHafta : s.karneAy}</h2>
            <div className="sge-karne-donem">{hastaAdi ? `${hastaAdi} · ` : ''}{kisaTarih(`${k.bas}T12:00:00Z`)} – {kisaTarih(`${k.bit}T12:00:00Z`)}</div>
          </div>
          <div className="sge-sekme sge-yazdir-gizle" role="group" aria-label={s.karneBaslik}>
            <button type="button" aria-pressed={donem === 'hafta'} onClick={() => setDonem('hafta')}>{s.hafta}</button>
            <button type="button" aria-pressed={donem === 'ay'} onClick={() => setDonem('ay')}>{s.ay}</button>
          </div>
        </div>
        {k.dersler.map((d) => (
          <div key={d.anahtar} className="sge-ders">
            <div className="sge-ders-ad">{d.ad}{d.yuzde != null ? <span style={{ fontWeight: 500, color: 'var(--sg-muted)', marginLeft: 8, fontSize: 15 }}>%{d.yuzde}</span> : null}</div>
            <div className="sge-ders-ayrinti">{d.ayrinti}</div>
            {d.not ? <div className={`sge-damga sge-damga--${d.not.puan}`} aria-label={`${d.ad}: ${d.not.ad}`}><b>{d.not.puan}</b><span>{d.not.ad}</span></div> : <div className="sge-damga sge-damga--yok">{s.notYok}</div>}
          </div>
        ))}
        <div className="sge-takvim" aria-hidden>
          {k.gunler.map((g) => (
            <div key={g.gun} className="sge-takvim-gun" style={g.oran == null ? { opacity: 0.4 } : { background: `rgba(15,155,142,${0.12 + 0.75 * g.oran})`, color: g.oran > 0.55 ? '#fff' : 'var(--sg-ink)' }}>{Number(g.gun.slice(8))}</div>
          ))}
        </div>
        <p className="sge-karne-dipnot">{s.karneDipnot}</p>
      </article>
      <div className="sge-yazdir-gizle" style={{ marginTop: 12 }}><button type="button" className="sge-btn" onClick={() => window.print()}>{s.yazdir}</button></div>

      <section className="sge-bolum sge-yazdir-gizle">
        <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.seriBaslik}</h2></div>
        <div className="sge-kart">
          <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5 }}>{s.seriAciklama(durum.seri.seri, durum.seri.enUzun, durum.seri.kalkan)}</p>
          <div className="sge-seri-serit" aria-hidden>{durum.son14.map((g) => <i key={g.gun} className={g.aktif ? 'aktif' : g.kalkan ? 'kalkan' : ''}>{Number(g.gun.slice(8))}</i>)}</div>
        </div>
      </section>

      <section className="sge-bolum">
        <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.rozetlerim}</h2><span className="sge-not">{durum.rozetler.filter((r) => r.kazanildi).length}/{durum.rozetler.length}</span></div>
        <div className="sge-kart">
          <div className="sge-raf">
            {sirali.map((r) => (
              <button key={r.id} type="button" className={`sge-rozet${r.kazanildi ? '' : ' sge-rozet--kilitli'}`} onClick={() => setSecili(secili?.id === r.id ? null : r)} aria-expanded={secili?.id === r.id}>
                <RozetSvg rozet={r} kilitli={!r.kazanildi} ilerleme={r.deger / r.hedef} />
                <div className="sge-rozet-ad">{r.ad}</div>
                <div className="sge-rozet-alt">{r.kazanildi ? (r.kazanildiAt ? s.rozetKazanildi(kisaTarih(r.kazanildiAt)) : '✓') : s.rozetIlerleme(r.deger, r.hedef)}</div>
              </button>
            ))}
          </div>
          {secili ? <p style={{ margin: '12px 2px 0', fontSize: 15, lineHeight: 1.5 }} role="status"><b>{secili.ad}.</b> {secili.kazanildi ? secili.aciklama : secili.kosul}</p> : null}
        </div>
      </section>
      {yeni ? <RozetAcilisi s={s} rozet={yeni} tamam={() => eylemler.rozetGoruldu()} /> : null}
    </div>
  )
}
