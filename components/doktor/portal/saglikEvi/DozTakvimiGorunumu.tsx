'use client'
/**
 * HASTA-PORTALI-GUNLUK — Sağlığım › Doz Takvimi: adherence rings (7 / 30 days), today's doses, the week grid, the
 * medicine list with editable times, and "Kendi ilacımı ekle" (shown to the doctor as patient-added). The patient never
 * edits the doctor's dose text.
 */
import { useState } from 'react'
import type { GunlukDurum } from '@/lib/saglikEvi/ozet'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import type { GunlukEylemleri } from './eylemler'
import { DozListesi } from './DozListesi'

function Halka({ yuzde, etiket }: { yuzde: number | null; etiket: string }) {
  const r = 34, c = 2 * Math.PI * r
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label={`${etiket}: ${yuzde == null ? '—' : `%${yuzde}`}`}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#0f9b8e" strokeOpacity="0.14" strokeWidth="10" />
        <circle className="sge-halka-yay" cx="48" cy="48" r={r} fill="none" stroke="#0f9b8e" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - (yuzde ?? 0) / 100)} transform="rotate(-90 48 48)" />
        <text x="48" y="53" textAnchor="middle" fontFamily="var(--sg-font-display)" fontSize="22" fill="var(--sg-ink)">{yuzde == null ? '—' : `%${yuzde}`}</text>
      </svg>
      <div className="sge-not" style={{ fontWeight: 600 }}>{etiket}</div>
    </div>
  )
}

const GUN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export function DozTakvimiGorunumu({ s, durum, eylemler }: { s: SaglikEviSozleri; durum: GunlukDurum; eylemler: GunlukEylemleri }) {
  const [duzenle, setDuzenle] = useState<string | null>(null)
  const [saatler, setSaatler] = useState<string[]>([])
  const [ekle, setEkle] = useState(false)
  const [yeni, setYeni] = useState({ ad: '', doz: '', saat: '09:00', gerektikce: false })
  const [hata, setHata] = useState<string | null>(null)
  const aktif = durum.planlar.filter((p) => p.aktif)
  return (
    <div className="sge">
      <header className="sge-ust" style={{ alignItems: 'flex-start' }}>
        <div><h1 className="sge-selam">{s.dozTakvimiBaslik}</h1><p className="sge-tarih">{s.dozTakvimiAlt}</p></div>
      </header>
      <div className="sge-kart" style={{ display: 'flex', justifyContent: 'space-around', gap: 12, margin: '10px 0 0' }}>
        <Halka yuzde={durum.uyum7.yuzde} etiket={s.uyum7} />
        <Halka yuzde={durum.uyum30.yuzde} etiket={s.uyum30} />
      </div>
      <p className="sge-not">{s.uyumNot}</p>

      <section className="sge-bolum"><div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.dozBaslik}</h2></div><div className="sge-kart"><DozListesi s={s} durum={durum} eylemler={eylemler} /></div></section>

      {durum.hafta.planlar.length ? (
        <section className="sge-bolum">
          <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.haftaBaslik}</h2></div>
          <div className="sge-kart" style={{ overflowX: 'auto' }}>
            <table className="sge-hafta">
              <thead><tr><th scope="col"><span className="sge-gizli">İlaç</span></th>{durum.hafta.gunler.map((g) => <th key={g} scope="col">{GUN[(new Date(`${g}T00:00:00Z`).getUTCDay() + 6) % 7]}<br />{Number(g.slice(8))}</th>)}</tr></thead>
              <tbody>
                {durum.hafta.planlar.map((p) => (
                  <tr key={p.planId}><td>{p.ad}</td>{p.gunler.map((slots, i) => <td key={i}><span className="sge-hucre" aria-label={slots.map((d) => s.durum[d]).join(', ') || '—'}>{slots.map((d, j) => <i key={j} className={d} />)}</span></td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="sge-bolum">
        <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.ilaclarim}</h2></div>
        <div className="sge-kart">
          <ul className="sge-satir-liste">
            {aktif.map((p) => (
              <li key={p.id} style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div>
                    <b>{p.ad}</b>{p.kaynak === 'hasta' ? <span className="sge-etiket sge-etiket--hasta" style={{ marginLeft: 6 }}>{s.hastaEkledi}</span> : null}{p.kritik ? <span className="sge-etiket sge-etiket--kritik" style={{ marginLeft: 6 }}>{s.kritik}</span> : null}
                    <div className="sge-not">{p.doz || ''}{p.gerektikce ? ` · ${s.gerektikceBaslik}` : ` · ${p.saatler.join(', ')}`}</div>
                  </div>
                  {!p.gerektikce && duzenle !== p.id ? <button type="button" className="sge-baglanti" onClick={() => { setDuzenle(p.id); setSaatler(p.saatler) }}>{s.saatleriDuzenle}</button> : null}
                </div>
                {duzenle === p.id ? (
                  <div>
                    <div className="sge-saat-satir">
                      {saatler.map((sa, i) => <input key={i} type="time" value={sa} aria-label={`${p.ad} saat ${i + 1}`} onChange={(e) => setSaatler(saatler.map((x, j) => (j === i ? e.target.value : x)))} />)}
                      {saatler.length < 6 ? <button type="button" className="sge-btn" onClick={() => setSaatler([...saatler, '12:00'])}>{s.saatEkle}</button> : null}
                    </div>
                    {p.kaynak === 'hekim' ? <p className="sge-not">{s.doktorYazdi}</p> : null}
                    <div className="sge-saat-satir">
                      <button type="button" className="sge-btn sge-btn--ana" onClick={async () => { const r = await eylemler.plan({ tur: 'saat', planId: p.id, saatler: saatler.filter(Boolean) }); if (r.ok) setDuzenle(null); else setHata(r.hata) }}>{s.saatKaydet}</button>
                      <button type="button" className="sge-btn" onClick={() => setDuzenle(null)}>{s.vazgec}</button>
                      {p.kaynak === 'hasta' ? <button type="button" className="sge-btn sge-btn--tehlike" onClick={async () => { await eylemler.plan({ tur: 'kaldir', planId: p.id }); setDuzenle(null) }}>{s.kaldir}</button> : null}
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {hata ? <p className="sge-hata" role="alert">{hata}</p> : null}
          {ekle ? (
            <form style={{ marginTop: 12, display: 'grid', gap: 10 }} onSubmit={async (e) => { e.preventDefault(); setHata(null); const r = await eylemler.plan({ tur: 'ekle', ad: yeni.ad, doz: yeni.doz, gerektikce: yeni.gerektikce, saatler: yeni.gerektikce ? [] : [yeni.saat] }); if (r.ok) { setEkle(false); setYeni({ ad: '', doz: '', saat: '09:00', gerektikce: false }) } else setHata(r.hata) }}>
              <p className="sge-not" style={{ margin: 0 }}>{s.kendiIlacimNot}</p>
              <input className="sge-alan" placeholder={s.ilacAdi} aria-label={s.ilacAdi} value={yeni.ad} onChange={(e) => setYeni({ ...yeni, ad: e.target.value })} maxLength={120} required />
              <input className="sge-alan" placeholder={s.dozMetni} aria-label={s.dozMetni} value={yeni.doz} onChange={(e) => setYeni({ ...yeni, doz: e.target.value })} maxLength={120} />
              <div className="sge-saat-satir" style={{ marginTop: 0 }}>
                {!yeni.gerektikce ? <input type="time" value={yeni.saat} aria-label="Saat" onChange={(e) => setYeni({ ...yeni, saat: e.target.value })} /> : null}
                <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 15 }}><input type="checkbox" checked={yeni.gerektikce} onChange={(e) => setYeni({ ...yeni, gerektikce: e.target.checked })} style={{ width: 22, height: 22 }} />{s.gerektikceSecenek}</label>
              </div>
              <div className="sge-saat-satir" style={{ marginTop: 0 }}><button type="submit" className="sge-btn sge-btn--ana">{s.ekle}</button><button type="button" className="sge-btn" onClick={() => setEkle(false)}>{s.vazgec}</button></div>
            </form>
          ) : <button type="button" className="sge-btn" style={{ marginTop: 12 }} onClick={() => setEkle(true)}>+ {s.kendiIlacim}</button>}
        </div>
      </section>
    </div>
  )
}
