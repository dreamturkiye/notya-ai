'use client'
/**
 * HASTA-PORTALI-GUNLUK — Sağlığım › Bildirimler ve gizlilik: web push on this device, reminders, quiet hours, big type,
 * high contrast, KVKK consent (give / withdraw), download and delete my entries.
 * HASTA-MODULLERI: "Takip ettiklerim" — the patient's active modules. Doctor / file-derived ones are locked ("Hekiminiz
 * takip ediyor", never a diagnosis name); branş-default ones can be switched off; optional ones (kilo, nabız, su, bel)
 * can be added. The resolver (lib/saglikEvi/moduller.ts) enforces the same rules on the server.
 */
import { useState } from 'react'
import type { GunlukDurum } from '@/lib/saglikEvi/ozet'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { kisaTarih } from '@/lib/saglikEvi/sozler'
import type { GunlukEylemleri } from './eylemler'
import { metrikRengi } from '@/lib/saglikEvi/evVerisiGorunum'
import type { ModulAnahtari } from '@/lib/saglikEvi/moduller'

const LDL_RENK = '#8a6d3b'
function ModulNokta({ anahtar }: { anahtar: ModulAnahtari }) {
  const r = anahtar === 'ldl' ? LDL_RENK : metrikRengi(anahtar)
  return <span className="sge-modul-nokta" style={{ background: `${r}1a` }} aria-hidden><i style={{ background: r }} /></span>
}
function Kilit({ etiket }: { etiket: string }) {
  return (
    <span className="sge-kilit" aria-label={etiket}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect x="2" y="5.2" width="8" height="5.6" rx="1.4" fill="currentColor" /><path d="M3.9 5.4V4a2.1 2.1 0 0 1 4.2 0v1.4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
      Hekim
    </span>
  )
}

function Dugme({ acik, degistir, etiket }: { acik: boolean; degistir: (v: boolean) => void; etiket: string }) {
  return <button type="button" role="switch" aria-checked={acik} aria-label={etiket} className="sge-dugme" onClick={() => degistir(!acik)} />
}

export function TercihlerGorunumu({ s, durum, eylemler, gorunum, gorunumAyarla }: { s: SaglikEviSozleri; durum: GunlukDurum; eylemler: GunlukEylemleri; gorunum: { buyuk: boolean; kontrast: boolean }; gorunumAyarla: (g: { buyuk: boolean; kontrast: boolean }) => void }) {
  const t = durum.tercihler
  const [mesaj, setMesaj] = useState<string | null>(null)
  const [silOnay, setSilOnay] = useState(false)
  const p = eylemler.push
  const m = durum.moduller
  const eklenen = new Set(t.moduller?.eklenen || [])
  const modul = async (anahtar: ModulAnahtari, acik: boolean) => { const r = await eylemler.tercih({ modul: { anahtar, acik } }); setMesaj(r.ok ? null : r.hata) }
  return (
    <div className="sge">
      <header className="sge-ust" style={{ alignItems: 'flex-start' }}>
        <div><h1 className="sge-selam">{s.tercihlerBaslik}</h1><p className="sge-tarih">{s.tercihlerAlt}</p></div>
      </header>

      {m ? (
        <section className="sge-bolum" aria-labelledby="sge-modul-baslik">
          <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik" id="sge-modul-baslik">{s.modulBaslik}</h2></div>
          <div className="sge-kart">
            <p className="sge-not" style={{ marginTop: 0 }}>{s.modulAlt}</p>
            {m.aktif.map((x) => (
              <div key={x.anahtar} className="sge-anahtar sge-modul">
                <ModulNokta anahtar={x.anahtar} />
                <div className="sge-anahtar-metin"><b>{s.modulAd[x.anahtar]}</b><span>{x.hekimTakip ? (x.gunlukHedef > 0 ? s.modulHekimHedef(x.gunlukHedef) : s.modulHekim) : eklenen.has(x.anahtar as never) ? s.modulSizin : s.modulVarsayilan}</span></div>
                {x.hekimTakip || !x.hastaKapatabilir ? <Kilit etiket={s.modulHekim} /> : <Dugme acik etiket={s.modulAd[x.anahtar]} degistir={(v) => modul(x.anahtar, v)} />}
              </div>
            ))}
            {m.hastaKapatti.map((a) => (
              <div key={a} className="sge-anahtar sge-modul">
                <ModulNokta anahtar={a} />
                <div className="sge-anahtar-metin"><b>{s.modulAd[a]}</b><span>{s.modulKapali}</span></div>
                <Dugme acik={false} etiket={s.modulAd[a]} degistir={(v) => modul(a, v)} />
              </div>
            ))}
            {m.eklenebilir.length ? (
              <>
                <div className="sge-modul-ara">{s.modulEkleBaslik}<span>{s.modulEkleAlt}</span></div>
                {m.eklenebilir.map((a) => (
                  <div key={a} className="sge-anahtar sge-modul">
                    <ModulNokta anahtar={a} />
                    <div className="sge-anahtar-metin"><b>{s.modulAd[a]}</b></div>
                    <Dugme acik={false} etiket={s.modulAd[a]} degistir={(v) => modul(a, v)} />
                  </div>
                ))}
              </>
            ) : null}
            <p className="sge-not" style={{ marginBottom: 0 }}>{s.modulNot}</p>
          </div>
        </section>
      ) : null}

      <section className="sge-bolum"><div className="sge-kart">
        <div className="sge-anahtar">
          <div className="sge-anahtar-metin"><b>{s.bildirimBaslik}</b><span>{p.durum === 'acik' ? s.bildirimAcik : p.durum === 'desteklenmiyor' ? s.bildirimDesteklenmiyor : p.durum === 'reddedildi' ? s.bildirimReddedildi : s.bildirimKapali}</span><span>{s.bildirimNot}</span></div>
          {p.durum === 'acik' ? <button type="button" className="sge-btn" onClick={() => p.kapat()}>{s.bildirimKapat}</button> : p.durum === 'kapali' || p.durum === 'yok' ? <button type="button" className="sge-btn sge-btn--ana" onClick={async () => { const r = await p.ac(); setMesaj(r.ok ? null : r.hata) }}>{s.bildirimAc}</button> : null}
        </div>
        <div className="sge-anahtar">
          <div className="sge-anahtar-metin"><b>{s.hatirlatma}</b><span>{s.hatirlatmaAlt}</span></div>
          <Dugme acik={t.hatirlatmaAcik} etiket={s.hatirlatma} degistir={(v) => eylemler.tercih({ hatirlatmaAcik: v })} />
        </div>
        <div className="sge-anahtar">
          <div className="sge-anahtar-metin"><b>{s.sessizSaat}</b><span>{s.sessizSaatAlt}</span></div>
          <div className="sge-saat-satir" style={{ marginTop: 0, flexWrap: 'nowrap', alignItems: 'center' }}>
            <input type="time" value={t.sessizBas} aria-label={`${s.sessizSaat} başlangıç`} onChange={(e) => e.target.value && eylemler.tercih({ sessizBas: e.target.value })} />
            <span aria-hidden>–</span>
            <input type="time" value={t.sessizBit} aria-label={`${s.sessizSaat} bitiş`} onChange={(e) => e.target.value && eylemler.tercih({ sessizBit: e.target.value })} />
          </div>
        </div>
        {mesaj ? <p className="sge-hata" role="alert">{mesaj}</p> : null}
      </div></section>

      <section className="sge-bolum"><div className="sge-kart">
        <div className="sge-anahtar"><div className="sge-anahtar-metin"><b>{s.buyukYazi}</b><span>{s.buyukYaziAlt}</span></div><Dugme acik={gorunum.buyuk} etiket={s.buyukYazi} degistir={(v) => gorunumAyarla({ ...gorunum, buyuk: v })} /></div>
        <div className="sge-anahtar"><div className="sge-anahtar-metin"><b>{s.yuksekKontrast}</b><span>{s.yuksekKontrastAlt}</span></div><Dugme acik={gorunum.kontrast} etiket={s.yuksekKontrast} degistir={(v) => gorunumAyarla({ ...gorunum, kontrast: v })} /></div>
      </div></section>

      <section className="sge-bolum">
        <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.paylasimBaslik}</h2></div>
        <div className="sge-kart">
          <p style={{ margin: '0 0 12px', lineHeight: 1.55 }}>{t.paylasimOnayi ? s.paylasimAcik(t.onayAt ? kisaTarih(t.onayAt) : '—') : s.paylasimKapali}</p>
          {t.paylasimOnayi
            ? <button type="button" className="sge-btn" onClick={() => eylemler.tercih({ paylasimOnayi: false })}>{s.paylasimGeriCek}</button>
            : <><p className="sge-not" style={{ marginTop: 0 }}>{s.onayMetni}</p><button type="button" className="sge-btn sge-btn--ana" onClick={() => eylemler.tercih({ paylasimOnayi: true })}>{s.paylasimVer}</button></>}
        </div>
      </section>

      <section className="sge-bolum">
        <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.verilerim}</h2></div>
        <div className="sge-kart" style={{ display: 'grid', gap: 10 }}>
          {eylemler.indirJson ? <a className="sge-btn" href={eylemler.indirJson} download>{s.indirJson}</a> : <button type="button" className="sge-btn" disabled>{s.indirJson}</button>}
          {eylemler.indirCsv ? <a className="sge-btn" href={eylemler.indirCsv} download>{s.indirCsv}</a> : <button type="button" className="sge-btn" disabled>{s.indirCsv}</button>}
          {!silOnay ? <button type="button" className="sge-btn sge-btn--tehlike" onClick={() => setSilOnay(true)}>{s.sil1}</button> : (
            <div role="alertdialog" aria-label={s.sil1}>
              <p style={{ margin: '4px 0 10px', lineHeight: 1.5 }}>{s.silOnay}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="sge-btn sge-btn--tehlike" onClick={async () => { const r = await eylemler.veriSil(); setMesaj(r.ok ? s.silindi : r.hata); setSilOnay(false) }}>{s.silEvet}</button>
                <button type="button" className="sge-btn" onClick={() => setSilOnay(false)}>{s.vazgec}</button>
              </div>
            </div>
          )}
          {mesaj ? <p className="sge-not" role="status">{mesaj}</p> : null}
        </div>
        <p className="sge-not" style={{ marginTop: 14 }}>{s.acilDegil}</p>
      </section>
    </div>
  )
}
