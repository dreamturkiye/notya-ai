'use client'
/**
 * HASTA-PORTALI-GUNLUK — Sağlığım › Bugün, the daily health home (Kaan, 2026-11-24). Shared presentational view:
 * every word comes from `s`, every action from `eylemler`, every bridge link from `kopru` (gorunum-paritesi-ulke).
 * Order follows the branş config: measurement-led practices show quick-add before doses, adherence-led ones the
 * reverse. Designed for the patient who measures twice a day and takes five medicines: the next action is always one
 * big tap away.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { GunlukDurum, OlcumKarti } from '@/lib/saglikEvi/ozet'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { kisaTarih, onceMetni } from '@/lib/saglikEvi/sozler'
import { degerMetni } from '@/lib/saglikEvi/olcumler'
import { trDakika } from '@/lib/saglikEvi/zaman'
import type { GunlukEylemleri } from './eylemler'
import { Kadran } from './Kadran'
import { Kivilcim } from './Kivilcim'
import { RozetSvg } from './Rozet'
import { OlcumGirisi } from './OlcumGirisi'
import { DozListesi } from './DozListesi'
import { UyariKarti } from './UyariKarti'
import { OnayKarti } from './OnayKarti'
import { RozetAcilisi } from './RozetAcilisi'

export interface BugunKoprusu {
  randevu: string | null
  randevuHref: string
  mesajSayisi: number
  mesajHref: string
  sonZiyaret: { baslik: string; tarih: string; href: string } | null
  sonucSayisi: number
  sonucHref: string
  karneHref: string
  gunlukHref: string
  dozHref: string
  tercihHref: string
  kvkkHref: string
}

const Ikon = ({ d }: { d: string }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>

function HizliKutu({ k, s, ac }: { k: OlcumKarti; s: SaglikEviSozleri; ac: () => void }) {
  const tamam = k.gunlukHedef > 0 && k.bugunSayi >= k.gunlukHedef
  return (
    <button type="button" className={`sge-hizli${tamam ? ' sge-hizli--tamam' : ''}`} onClick={ac} aria-label={`${k.ad} ekle`}>
      <span className="sge-hizli-ad">{k.ad}</span>
      {k.tip === 'su' ? (
        <span className="sge-hizli-deger">{k.bugunSayi}<small>/ {k.gunlukHedef || 8} {k.birim}</small></span>
      ) : k.son ? (
        <span className="sge-hizli-deger">{degerMetni({ tip: k.tip, deger: k.son.deger, deger2: k.son.deger2 })}<small>{k.birim}</small></span>
      ) : (
        <span className="sge-hizli-deger" style={{ fontSize: 18, color: 'var(--sg-muted)' }}>{s.hizliIlk}</span>
      )}
      <span className="sge-hizli-alt">
        <span>{k.son && k.tip !== 'su' ? onceMetni(Date.now() - Date.parse(k.son.olcumAt)) : s.hizliGunluk(k.bugunSayi, k.gunlukHedef)}</span>
        {k.gunlukHedef > 0 && k.gunlukHedef <= 4 ? <span className="sge-hizli-noktalar" aria-hidden>{Array.from({ length: k.gunlukHedef }, (_, i) => <i key={i} className={i < k.bugunSayi ? 'dolu' : ''} />)}</span> : null}
      </span>
      <span className="sge-hizli-arti" aria-hidden>+</span>
    </button>
  )
}

export function BugunGorunumu({ s, durum, eylemler, kopru, hastaAdi }: { s: SaglikEviSozleri; durum: GunlukDurum; eylemler: GunlukEylemleri; kopru: BugunKoprusu; hastaAdi: string | null }) {
  const [giris, setGiris] = useState<OlcumKarti | null>(null)
  const [soru, setSoru] = useState('')
  const [onaySonra, setOnaySonra] = useState(true)
  const [mesgul, setMesgul] = useState(false)
  useEffect(() => { try { setOnaySonra(Date.now() - Number(localStorage.getItem('sg-onay-sonra') || 0) < 7 * 86_400_000) } catch { setOnaySonra(false) } }, [])

  const simdiDk = trDakika(Date.now())
  const ad = hastaAdi ? hastaAdi.split(' ')[0] : null
  const h = durum.halkalar
  const toplam = h.ilac.toplam + h.olcum.toplam
  const yapilan = h.ilac.yapilan + h.olcum.yapilan
  const yeniRozet = durum.rozetler.find((r) => r.yeni)
  const acikUyarilar = durum.uyarilar.filter((u) => !u.hastaGorduAt)
  const siradaki = durum.siradaki
  const sonrakiRozet = useMemo(() => durum.rozetler.filter((r) => !r.kazanildi).sort((a, b) => b.deger / b.hedef - a.deger / a.hedef)[0], [durum.rozetler])
  const kazanilan = durum.rozetler.filter((r) => r.kazanildi)

  const hizli = durum.olcumKartlari.length ? (
    <section className="sge-bolum" aria-labelledby="sge-hizli-b">
      <div className="sge-bolum-bas"><h2 id="sge-hizli-b" className="sge-bolum-baslik">{s.hizliBaslik}</h2><Link href={kopru.gunlukHref} className="sge-bolum-git">{s.hizliHepsi}</Link></div>
      <div className="sge-hizli-izgara">
        {durum.olcumKartlari.map((k) => <HizliKutu key={k.tip} k={k} s={s} ac={() => (k.tip === 'su' ? void eylemler.olcumEkle({ tip: 'su', deger: 1 }) : setGiris(k))} />)}
      </div>
      {durum.ldl ? <p className="sge-not" style={{ marginTop: 10 }}>{s.ldl(durum.ldl.deger, durum.ldl.hedef, kisaTarih(durum.ldl.tarih))}</p> : null}
    </section>
  ) : null

  const dozlar = (
    <section className="sge-bolum" aria-labelledby="sge-doz-b">
      <div className="sge-bolum-bas"><h2 id="sge-doz-b" className="sge-bolum-baslik">{s.dozBaslik}</h2><Link href={kopru.dozHref} className="sge-bolum-git">{s.dozHepsi}</Link></div>
      <div className="sge-kart"><DozListesi s={s} durum={durum} eylemler={eylemler} /></div>
    </section>
  )

  return (
    <div className="sge">
      <header className="sge-ust">
        <div>
          <h1 className="sge-selam">{s.selam(simdiDk)}{ad ? `, ${ad}` : ''}</h1>
          <p className="sge-tarih">{s.tarih(durum.simdi)}</p>
        </div>
        <Link href={kopru.karneHref} className="sge-seri" aria-label={s.seriAria(durum.seri.seri, durum.seri.kalkan)}>
          <svg width="22" height="26" viewBox="0 0 24 28" aria-hidden><path d="M12 27c-5.5 0-9-3.8-9-8.6C3 12 9 10 8.4 2.5c4.8 2.7 9.6 7.6 9.6 13.1 1.4-1.1 2.2-2.8 2.4-4.6 1.6 1.9 2.6 4.4 2.6 6.9C23 23.1 18.4 27 12 27z" fill={durum.seri.bugunAktif ? '#c46a4a' : '#d8cfc4'} /><path d="M12 27c-2.4 0-4-1.7-4-4 0-3 3-4 3-7 2.4 1.3 5 3.7 5 6.7 0 2.4-1.7 4.3-4 4.3z" fill={durum.seri.bugunAktif ? '#f2b49a' : '#efe9e1'} /></svg>
          <b>{durum.seri.seri}</b> <small>{s.seriEtiket(durum.seri.seri)}</small>
          {durum.seri.kalkan ? <svg width="16" height="18" viewBox="0 0 24 26" aria-hidden><path d="M12 2l9 3.4c0 8-3.4 14-9 18-5.6-4-9-10-9-18z" fill="#2f4334" /></svg> : null}
        </Link>
      </header>

      {!durum.tercihler.paylasimOnayi && !onaySonra ? (
        <OnayKarti s={s} kvkkHref={kopru.kvkkHref} onayla={async () => { await eylemler.tercih({ paylasimOnayi: true }) }} sonra={() => { try { localStorage.setItem('sg-onay-sonra', String(Date.now())) } catch { /* yok */ } setOnaySonra(true) }} />
      ) : null}

      <div className="sge-kadran-blok">
        <Kadran
          aria={s.kadranAria}
          isaretler={durum.kadran}
          simdiDakika={simdiDk}
          sessiz={[Number(durum.tercihler.sessizBas.slice(0, 2)) * 60 + Number(durum.tercihler.sessizBas.slice(3)), Number(durum.tercihler.sessizBit.slice(0, 2)) * 60 + Number(durum.tercihler.sessizBit.slice(3))]}
          halkalar={[
            { oran: h.ilac.toplam ? h.ilac.yapilan / h.ilac.toplam : null, renk: '#0f9b8e', etiket: s.halkaIlac },
            { oran: h.olcum.toplam ? h.olcum.yapilan / h.olcum.toplam : null, renk: '#b4832f', etiket: s.halkaOlcum },
            { oran: h.hedef.yuzde == null ? null : h.hedef.yuzde / 100, renk: '#2f4334', etiket: s.halkaHedef },
          ]}
          merkezSayi={String(yapilan)}
          merkezPay={toplam ? String(toplam) : undefined}
          merkezEtiket={s.merkezEtiket(toplam - yapilan)}
        />
        <div className="sge-halka-anahtar">
          <span><i style={{ background: '#0f9b8e' }} />{s.halkaIlac} <b>{h.ilac.yapilan}/{h.ilac.toplam}</b></span>
          {h.olcum.toplam ? <span><i style={{ background: '#b4832f' }} />{s.halkaOlcum} <b>{h.olcum.yapilan}/{h.olcum.toplam}</b></span> : null}
          <span><i style={{ background: '#2f4334' }} />{s.halkaHedef} <b>{h.hedef.yuzde == null ? s.hedefYok : `%${h.hedef.yuzde}`}</b></span>
        </div>
      </div>

      {siradaki ? (
        <div className="sge-simdi" role="region" aria-label={s.dozBaslik}>
          <div>
            <div className="sge-simdi-saat">{siradaki.saat}</div>
            <p className="sge-simdi-ad">{siradaki.adlar.join(' · ')}</p>
          </div>
          <button type="button" className="sge-btn-aldim" disabled={mesgul} onClick={async () => { setMesgul(true); try { await eylemler.doz(siradaki.planIds, siradaki.at, 'alindi') } finally { setMesgul(false) } }}>{s.simdiAldim}</button>
          <div className="sge-simdi-alt">
            <button type="button" disabled={mesgul} onClick={() => eylemler.doz(siradaki.planIds, siradaki.at, 'ertelendi')}>{s.simdiErtele}</button>
            <button type="button" disabled={mesgul} onClick={() => eylemler.doz(siradaki.planIds, siradaki.at, 'atlandi')}>{s.simdiAtladim}</button>
          </div>
        </div>
      ) : durum.bugunDozlar.length ? (
        <div className="sge-simdi sge-simdi--tamam" role="status">
          <div><div className="sge-simdi-saat" style={{ fontSize: 24 }}>{s.simdiHepsiTamam}</div><p className="sge-simdi-ad">{s.simdiHepsiTamamAlt}</p></div>
        </div>
      ) : null}

      {acikUyarilar.length ? (
        <section aria-label={s.uyariBaslik}>
          {acikUyarilar.map((u) => <UyariKarti key={u.id} s={s} duzey={u.duzey} metin={u.hastaMetni} mesajHref={kopru.mesajHref} okudum={() => eylemler.uyariGoruldu([u.id])} />)}
        </section>
      ) : null}

      {durum.vurgu === 'olcum' ? <>{hizli}{dozlar}</> : <>{dozlar}{hizli}</>}

      {durum.egilimler.length ? (
        <section className="sge-bolum" aria-labelledby="sge-egilim-b">
          <div className="sge-bolum-bas"><h2 id="sge-egilim-b" className="sge-bolum-baslik">{s.egilimBaslik}</h2></div>
          <div className="sge-egilim-izgara">
            {durum.egilimler.slice(0, 4).map((e) => {
              const kb = e.anahtar === 'kb'
              const ort = e.hafta.ort == null ? '—' : kb ? `${Math.round(e.hafta.ort)}/${Math.round(e.hafta.ort2 ?? 0)}` : (Math.round(e.hafta.ort * 10) / 10).toLocaleString('tr-TR')
              const onc = e.onceki.ort == null ? null : kb ? `${Math.round(e.onceki.ort)}/${Math.round(e.onceki.ort2 ?? 0)}` : (Math.round(e.onceki.ort * 10) / 10).toLocaleString('tr-TR')
              return (
                <div key={e.anahtar} className="sge-kart sge-egilim">
                  <div className="sge-egilim-bas"><span className="sge-egilim-ad">{e.etiket}</span>{e.yon ? <span className={`sge-egilim-yon sge-egilim-yon--${e.yon}`}>{s.egilimYon[e.yon]}</span> : null}</div>
                  <div className="sge-egilim-deger">{ort}<small>{e.birim}</small></div>
                  <Kivilcim aria={e.etiket} seri={e.gunluk.map((g) => g.ort)} seri2={kb ? e.gunluk.map((g) => g.ort2) : undefined} hedefMin={kb ? null : e.hedefMin} hedefMax={e.hedefMax} />
                  <div className="sge-egilim-alt"><span>{s.haftaOrt}</span><span>{onc ? s.onceki(onc) : e.hedefMetni || ''}</span></div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="sge-bolum" aria-labelledby="sge-karne-b">
        <div className="sge-bolum-bas"><h2 id="sge-karne-b" className="sge-bolum-baslik">{s.karneBaslik}</h2><Link href={kopru.karneHref} className="sge-bolum-git">{s.karneGit}</Link></div>
        <div className="sge-kart">
          <div className="sge-rozet-serit">
            {[...kazanilan.slice(-4).reverse(), ...(sonrakiRozet ? [sonrakiRozet] : [])].map((r) => (
              <Link key={r.id} href={kopru.karneHref} className={`sge-rozet${r.kazanildi ? '' : ' sge-rozet--kilitli'}`}>
                <RozetSvg rozet={r} kilitli={!r.kazanildi} ilerleme={r.deger / r.hedef} />
                <div className="sge-rozet-ad">{r.ad}</div>
                {!r.kazanildi ? <div className="sge-rozet-alt">{s.rozetIlerleme(r.deger, r.hedef)}</div> : null}
              </Link>
            ))}
          </div>
          {sonrakiRozet ? <p className="sge-not" style={{ margin: '4px 0 0' }}>{s.rozetSonraki(sonrakiRozet.ad, sonrakiRozet.kosul)}</p> : null}
        </div>
      </section>

      <section className="sge-bolum" aria-labelledby="sge-kopru-b">
        <div className="sge-bolum-bas"><h2 id="sge-kopru-b" className="sge-bolum-baslik">{s.kopruBaslik}</h2></div>
        <div className="sge-kopru">
          <Link href={kopru.randevuHref} className="sge-kopru-oge"><span className="sge-kopru-ikon"><Ikon d="M7 3v3M17 3v3M4 8h16M5 5h14v15H5z" /></span><span><span className="sge-kopru-baslik">{s.randevu}</span><span className="sge-kopru-alt" style={{ display: 'block' }}>{kopru.randevu || s.randevuYok}</span></span></Link>
          <Link href={kopru.mesajHref} className={`sge-kopru-oge${kopru.mesajSayisi ? ' sge-kopru-oge--vurgu' : ''}`}><span className="sge-kopru-ikon"><Ikon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></span><span><span className="sge-kopru-baslik">{s.mesajlar}</span><span className="sge-kopru-alt" style={{ display: 'block' }}>{kopru.mesajSayisi ? s.mesajYeni(kopru.mesajSayisi) : s.mesajYok}</span></span></Link>
          <Link href={kopru.sonZiyaret?.href || kopru.randevuHref} className="sge-kopru-oge"><span className="sge-kopru-ikon"><Ikon d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" /></span><span><span className="sge-kopru-baslik">{s.sonZiyaret}</span><span className="sge-kopru-alt" style={{ display: 'block' }}>{kopru.sonZiyaret ? `${kopru.sonZiyaret.tarih} · ${kopru.sonZiyaret.baslik}` : s.ziyaretYok}</span></span></Link>
          <Link href={kopru.sonucHref} className="sge-kopru-oge"><span className="sge-kopru-ikon"><Ikon d="M9 3v6L4 18a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 18l-5-9V3M8 3h8M7 14h10" /></span><span><span className="sge-kopru-baslik">{s.sonuclar}</span><span className="sge-kopru-alt" style={{ display: 'block' }}>{s.sonucSayisi(kopru.sonucSayisi)}</span></span></Link>
        </div>
        <div className="sge-kart" style={{ marginTop: 12 }}>
          <div className="sge-kopru-baslik">{s.soruBaslik}</div>
          <form className="sge-soru-form" onSubmit={async (e) => { e.preventDefault(); const m = soru.trim(); if (!m) return; const r = await eylemler.soru(m); if (r.ok) setSoru('') }}>
            <input value={soru} onChange={(e) => setSoru(e.target.value)} placeholder={s.soruYer} maxLength={500} aria-label={s.soruBaslik} />
            <button type="submit" className="sge-btn sge-btn--ana">{s.soruEkle}</button>
          </form>
          {durum.sorular.length ? (
            <ul className="sge-soru-liste">{durum.sorular.map((q) => <li key={q.id}><span>{q.metin}</span><button type="button" className="sge-baglanti" onClick={() => eylemler.soruSil(q.id)}>{s.soruSil}</button></li>)}</ul>
          ) : null}
          <p className="sge-not" style={{ margin: '8px 0 0' }}>{s.soruNot}</p>
        </div>
        <p className="sge-not" style={{ marginTop: 14 }}>{s.acilDegil} <Link href={kopru.tercihHref} className="sge-bolum-git">{s.tercihlerBaslik}</Link></p>
      </section>

      {giris ? <OlcumGirisi kart={giris} s={s} eylemler={eylemler} kapat={() => setGiris(null)} /> : null}
      {yeniRozet ? <RozetAcilisi s={s} rozet={yeniRozet} tamam={() => eylemler.rozetGoruldu()} /> : null}
    </div>
  )
}
