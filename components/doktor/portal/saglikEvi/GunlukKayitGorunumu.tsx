'use client'
/** HASTA-PORTALI-GUNLUK — Sağlığım › Günlük Kayıt: quick-add tiles, larger trend charts, the latest entries (deletable). */
import { useState } from 'react'
import type { GunlukDurum, OlcumKarti } from '@/lib/saglikEvi/ozet'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { kisaTarih, saatMetni } from '@/lib/saglikEvi/sozler'
import { BAGLAM_ADI, degerMetni, OLCUM_TANIMLARI } from '@/lib/saglikEvi/olcumler'
import type { GunlukEylemleri } from './eylemler'
import { OlcumGirisi } from './OlcumGirisi'
import { Kivilcim } from './Kivilcim'

export function GunlukKayitGorunumu({ s, durum, eylemler }: { s: SaglikEviSozleri; durum: GunlukDurum; eylemler: GunlukEylemleri }) {
  const [giris, setGiris] = useState<OlcumKarti | null>(null)
  return (
    <div className="sge">
      <header className="sge-ust" style={{ alignItems: 'flex-start' }}>
        <div><h1 className="sge-selam">{s.gunlukBaslik}</h1><p className="sge-tarih">{s.gunlukAlt}</p></div>
      </header>
      {durum.olcumKartlari.length ? (
        <div className="sge-hizli-izgara" style={{ marginTop: 10 }}>
          {durum.olcumKartlari.map((k) => (
            <button key={k.tip} type="button" className="sge-hizli" onClick={() => (k.tip === 'su' ? void eylemler.olcumEkle({ tip: 'su', deger: 1 }) : setGiris(k))}>
              <span className="sge-hizli-ad">{k.ad}</span>
              <span className="sge-hizli-deger">{k.tip === 'su' ? k.bugunSayi : k.son ? degerMetni({ tip: k.tip, deger: k.son.deger, deger2: k.son.deger2 }) : '—'}<small>{k.birim}</small></span>
              <span className="sge-hizli-alt"><span>{k.hedef || s.hizliGunluk(k.bugunSayi, k.gunlukHedef)}</span></span>
              <span className="sge-hizli-arti" aria-hidden>+</span>
            </button>
          ))}
        </div>
      ) : <p className="sge-not">{s.olcumYok}</p>}

      {durum.egilimler.length ? (
        <section className="sge-bolum">
          <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.egilimBaslik}</h2></div>
          <div className="sge-egilim-izgara">
            {durum.egilimler.map((e) => (
              <div key={e.anahtar} className="sge-kart sge-egilim">
                <div className="sge-egilim-bas"><span className="sge-egilim-ad">{e.etiket}</span>{e.yon ? <span className={`sge-egilim-yon sge-egilim-yon--${e.yon}`}>{s.egilimYon[e.yon]}</span> : null}</div>
                <Kivilcim aria={e.etiket} yukseklik={84} seri={e.gunluk.map((g) => g.ort)} seri2={e.anahtar === 'kb' ? e.gunluk.map((g) => g.ort2) : undefined} hedefMin={e.anahtar === 'kb' ? null : e.hedefMin} hedefMax={e.hedefMax} />
                <div className="sge-egilim-alt"><span>14 gün</span><span>{e.hedefMetni || ''}</span></div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="sge-bolum">
        <div className="sge-bolum-bas"><h2 className="sge-bolum-baslik">{s.sonKayitlar}</h2></div>
        <div className="sge-kart">
          {durum.sonOlcumler.length ? (
            <ul className="sge-satir-liste">
              {durum.sonOlcumler.filter((o) => o.tip !== 'su').slice(0, 25).map((o) => (
                <li key={o.id}>
                  <span>
                    <b style={{ display: 'block' }}>{OLCUM_TANIMLARI[o.tip].ad}{o.baglam ? ` · ${BAGLAM_ADI[o.baglam]}` : ''}</b>
                    <span className="sge-not">{kisaTarih(o.olcumAt)} {saatMetni(o.olcumAt)}{o.kaynak === 'portal_foto' ? ' · fotoğraf' : ''}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="deger">{degerMetni(o)} <small className="sge-not">{OLCUM_TANIMLARI[o.tip].birim}</small></span>
                    <button type="button" className="sge-baglanti" onClick={() => eylemler.olcumSil(o.id)} aria-label={`${OLCUM_TANIMLARI[o.tip].ad} ${degerMetni(o)} ${s.sil}`}>{s.sil}</button>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="sge-not">{s.kayitYok}</p>}
        </div>
      </section>
      {giris ? <OlcumGirisi kart={giris} s={s} eylemler={eylemler} kapat={() => setGiris(null)} /> : null}
    </div>
  )
}
