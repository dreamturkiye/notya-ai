'use client'

/**
 * NOTYA-ULKE-ARACLAR-01 — KEEPING A TOOL'S RESULT ON A PATIENT, on the doctor's screens (migration 139).
 *
 *   a tool's screen      opened FROM A PATIENT'S FILE: "keep in this patient's file", with a follow-up day the
 *                        doctor may enter. Opened without a patient, the tool keeps nothing and says how to.
 *   the patient's file   the results that were kept, newest first, each with its summary; the way to the tools
 *                        for this patient
 *   the follow-up list   (the tile `takip-paneli`) every kept result with a follow-up day that is not done yet,
 *                        earliest first, overdue ones marked; the doctor marks one as done
 *
 * A TOOL KEEPS NOTHING BY ITSELF: only the button does. The browser sends the form as it was typed; THE SERVER
 * WORKS THE RESULT OUT AGAIN and keeps its own (lib/ulke/araclar/kayit.ts). THE FOLLOW-UP DAY IS THE DOCTOR'S: the
 * field starts empty and the application proposes no day. NOTHING IS SENT TO ANYBODY.
 *
 * Every sentence is the pack's (araclarMetni), in the account's form. The server answers with codes.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, tarihYaz, YOL, type Api, type Uygulama } from './Kabuk'
import { araclarYolu, birimOrtami, paketAraci, yazici } from './aracOrtak'
import { arayuz, araclarMetni, type AraclarMetni, type GirdiMetni } from '@/lib/ulke/arayuz'
import { GIRDI_GECERSIZ } from '@/lib/ulke/arayuz/zamanGirdisi'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import type { HamGirdi } from '@/lib/ulke/araclar/girdi'
import { ARAC_KAYDI_API, type AracKaydi, type TakipSatiri } from '@/lib/ulke/araclar/kayitTipleri'
import { aracOzeti, bicimli } from '@/lib/ulke/araclar/paket'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'
import { TarihGirisi } from '../girdi/TarihGirisi'

/**
 * The patient a tool was opened for. `dogumTarihi` and `cinsiyet` are what a tool's patient gate reads
 * (NOTYA-ULKE-OZEL-01, lib/ulke/araclar/hastaKapisi.ts): '' = not recorded, which never passes a limit.
 */
export type AracHastasi = { id: string; ad: string; dogumTarihi?: string; cinsiyet?: string }
export type KayitDurumu = 'yok' | 'bekliyor' | 'tamam' | 'eksik' | 'takip' | 'hata'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The name of a tool in the pack's words, whatever the account's role is now; the pack's "no longer here" otherwise. */
const aracAdi = (icerik: UlkeAraclari, a: AraclarMetni, anahtar: string, dil: DilKodu): string => {
  const x = paketAraci(icerik, anahtar)
  return (x && bicimli(x.paket.metin.ad, dil)) || a.kayit.aracYok
}

// ───────────────────────── on a tool's screen ─────────────────────────

/**
 * The patient named in the address (`?hasta=`), read once. 'yok' = the address names none; 'bulunamadi' = it names
 * one this account does not have (another doctor's answers exactly the same).
 */
export function useAracHastasi(api: Api, hazir: boolean, hastaId: string | null | undefined): { durum: 'yok' | 'yukleniyor' | 'bulunamadi' | 'tamam'; hasta: AracHastasi | null } {
  const [s, setS] = useState<{ durum: 'yukleniyor' | 'bulunamadi' | 'tamam'; hasta: AracHastasi | null }>({ durum: 'yukleniyor', hasta: null })
  useEffect(() => {
    if (!hazir || !hastaId) return
    if (!UUID.test(hastaId)) { setS({ durum: 'bulunamadi', hasta: null }); return }
    let iptal = false
    api(`/api/ulke/hasta?id=${encodeURIComponent(hastaId)}`)
      .then((r) => { if (!iptal) setS(r.ok && r.j.hasta ? { durum: 'tamam', hasta: { id: r.j.hasta.id, ad: [r.j.hasta.ad, r.j.hasta.otaIsmi].filter(Boolean).join(' '), dogumTarihi: typeof r.j.hasta.dogumTarihi === 'string' ? r.j.hasta.dogumTarihi : '', cinsiyet: typeof r.j.hasta.cinsiyet === 'string' ? r.j.hasta.cinsiyet : '' } } : { durum: 'bulunamadi', hasta: null }) })
      .catch(() => { if (!iptal) setS({ durum: 'bulunamadi', hasta: null }) })
    return () => { iptal = true }
  }, [api, hazir, hastaId])
  return hastaId ? s : { durum: 'yok', hasta: null }
}

/** Keeping the result of one tool for one patient: the follow-up day as typed, and what the server answered. */
export function useAracKaydi(api: Api, hastaId: string | null, arac: string) {
  const [takip, setTakip] = useState('')
  const [durum, setDurum] = useState<KayitDurumu>('yok')
  const kaydet = useCallback((ham: HamGirdi) => {
    if (!hastaId) return
    // A follow-up day that is typed and is not a day is never sent as "no follow-up": the field says so, and nothing is kept.
    if (takip === GIRDI_GECERSIZ) { setDurum('takip'); return }
    setDurum('bekliyor')
    api(ARAC_KAYDI_API, { method: 'POST', govde: { hastaId, arac, ham, takipTarihi: takip } })
      .then((r) => setDurum(r.ok ? 'tamam' : r.j.code === 'EKSIK' ? 'eksik' : r.j.code === 'TAKIP' ? 'takip' : 'hata'))
      .catch(() => setDurum('hata'))
  }, [api, hastaId, arac, takip])
  return { takip, durum, kaydet, takipDegistir: (v: string) => { setTakip(v); setDurum('yok') }, degisti: () => setDurum((d) => (d === 'bekliyor' ? d : 'yok')) }
}

/** The part of a tool's screen that keeps its result. `tamam` = the tool has a result now. Pure. */
export function AracKayitKarti({ a, g, hasta, tamam, takip, takipDegistir, kaydet, durum }: {
  a: AraclarMetni
  /** The pack's words for the parts of a date, in the form of the screen. */
  g: GirdiMetni
  hasta: AracHastasi; tamam: boolean
  takip: string; takipDegistir: (v: string) => void; kaydet: () => void; durum: KayitDurumu
}) {
  const k = a.kayit
  return (
    <section className="uza-kart" data-bolum="kayit" data-hasta={hasta.id}>
      <h2 className="uza-h2">{k.baslik}</h2>
      <p className="uza-aciklama">{yerine(k.hastaIcin, hasta.ad)}</p>
      <p className="uza-ipucu">{k.aciklama}</p>
      <div className="uza-form">
        <div className="uza-alan" data-alan="takip-tarihi">
          {/* The kit's own date field, in the pack's order: never the browser's (NOTYA-ULKE-DENETIM-01b). */}
          <TarihGirisi id="uza-arac-takip" etiket={k.takipTarihi} deger={takip} degistir={takipDegistir} m={g} hata={durum === 'takip'} />
          <p className="uza-ipucu">{k.takipIpucu}</p>
        </div>
      </div>
      <div className="uza-eylemler">
        <button type="button" className="uza-dugme" onClick={kaydet} disabled={!tamam || durum === 'bekliyor' || durum === 'tamam'} data-eylem="arac-kaydet">{k.kaydet}</button>
        <a className="uza-dugme uza-dugme-cizgi" href={`${YOL.hasta}?id=${hasta.id}`} data-eylem="dosyaya-git">{k.dosyayaGit}</a>
      </div>
      <Bilgi>{durum === 'tamam' ? k.kaydedildi : null}</Bilgi>
      <Hata>{!tamam || durum === 'eksik' ? k.eksik : durum === 'takip' ? k.takipGecersiz : durum === 'hata' ? k.yapilamadi : null}</Hata>
    </section>
  )
}

// ───────────────────────── on the patient's file ─────────────────────────

/** The kept results of one patient. `kayitlar` null = not loaded (or could not be read): nothing is listed. Pure. */
export function HastaAracKayitlariGorunumu({ a, dil, icerik, hastaId, kayitlar }: { a: AraclarMetni; dil: DilKodu; icerik: UlkeAraclari; hastaId: string; kayitlar: readonly AracKaydi[] | null }) {
  const k = a.kayit
  const o = birimOrtami(icerik), y = yazici(icerik, dil)
  return (
    <section className="uza-kart" data-alan="hasta-arac-kayitlari">
      <h2 className="uza-h2">{k.dosyaBaslik}</h2>
      <p className="uza-aciklama">{k.dosyaAciklama}</p>
      {kayitlar && kayitlar.length ? (
        <ul className="uza-liste">
          {kayitlar.map((x) => {
            const arac = paketAraci(icerik, x.arac)
            const ozet = arac && x.girdiler && x.sonuc ? aracOzeti(arac, x.girdiler, x.sonuc, dil, a, y, o) : ''
            return (
              <li key={x.id} data-kayit={x.id} data-arac={x.arac}>
                <details className="uza-arac-kayit">
                  <summary>
                    <span className="uza-saat">{tarihYaz(x.gun || x.olusturuldu)}</span>
                    <span className="uza-liste-ad">{aracAdi(icerik, a, x.arac, dil)}</span>
                    {x.takipTarihi ? <span className="uza-rozet" data-takip-durum={x.kapandi ? 'kapandi' : 'acik'}>{yerine(x.kapandi ? k.takipKapandi : k.takipGunu, tarihYaz(x.takipTarihi))}</span> : null}
                  </summary>
                  {ozet ? <pre className="uza-arac-ozet">{ozet}</pre> : <p className="uza-ipucu" data-okunamadi>{k.okunamadi}</p>}
                </details>
              </li>
            )
          })}
        </ul>
      ) : kayitlar ? <p className="uza-bos">{k.dosyaBos}</p> : null}
      <div className="uza-eylemler"><a className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" href={araclarYolu(hastaId)} data-eylem="hasta-icin-araclar">{k.araclariAc}</a></div>
    </section>
  )
}

/** The card on the patient's file. The file is the file without it: if the list cannot be read, only the way in is drawn. */
export function HastaAracKayitlariKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [kayitlar, setKayitlar] = useState<AracKaydi[] | null>(null)
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    api(`${ARAC_KAYDI_API}?hasta=${encodeURIComponent(hastaId)}`).then((r) => { if (!iptal && r.ok && Array.isArray(r.j.kayitlar)) setKayitlar(r.j.kayitlar) }).catch(() => { /* no list */ })
    return () => { iptal = true }
  }, [hesap, api, hastaId])
  const icerik = arayuz().araclar
  if (!icerik) return null
  return <HastaAracKayitlariGorunumu a={araclarMetni(u.dil)} dil={u.dil} icerik={icerik} hastaId={hastaId} kayitlar={kayitlar} />
}

// ───────────────────────── the follow-up list ─────────────────────────

export type TakipBildirimi = 'kapatildi' | 'yapilamadi' | null

/** The follow-up list. `takipler` null = not loaded yet; `hata` = it could not be read. Pure. */
export function TakipPaneliGorunumu({ a, dil, icerik, takipler, bugun, hata, yukleniyor, bekleyen, bildirim, kapat }: {
  a: AraclarMetni; dil: DilKodu; icerik: UlkeAraclari
  takipler: readonly TakipSatiri[] | null; bugun: string; hata: boolean
  /** The sentence shown while the list is read (the shell's own). */
  yukleniyor: string
  /** The record whose "done" is on its way. */
  bekleyen: string | null; bildirim: TakipBildirimi; kapat: (id: string) => void
}) {
  const t = a.takip
  return (
    <section className="uza-kart" data-bolum="takip-paneli">
      <p className="uza-aciklama" style={{ marginTop: 0 }}>{t.aciklama}</p>
      {hata ? <Hata>{t.okunamadi}</Hata> : !takipler ? <p className="uza-bos" role="status">{yukleniyor}</p> : !takipler.length ? <p className="uza-bos" data-takip="bos">{t.bos}</p> : (
        <ul className="uza-liste">
          {takipler.map((x) => (
            <li key={x.id} data-takip={x.id} data-gecikti={x.gecikti ? 'evet' : undefined}>
              <div className="uza-satir">
                <span className="uza-saat">{tarihYaz(x.takipTarihi)}</span>
                <span className="uza-liste-ad">
                  <a className="uza-baglanti" href={`${YOL.hasta}?id=${x.hastaId}`}>{x.hastaAdi}</a>
                  <span className="uza-liste-alt">{aracAdi(icerik, a, x.arac, dil)}</span>
                </span>
                {x.gecikti ? <span className="uza-rozet" data-takip-durum="gecikti">{t.gecikti}</span> : x.takipTarihi === bugun ? <span className="uza-rozet" data-takip-durum="bugun">{t.bugun}</span> : null}
                <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => kapat(x.id)} disabled={bekleyen === x.id} data-eylem="takip-kapat">{t.kapat}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Bilgi>{bildirim === 'kapatildi' ? t.kapatildi : null}</Bilgi>
      <Hata>{bildirim === 'yapilamadi' ? t.yapilamadi : null}</Hata>
    </section>
  )
}

/** The tile's screen: reads the doctor's own open follow-ups and closes the one the doctor marks. */
export function TakipPaneli({ u, a, icerik }: { u: Uygulama; a: AraclarMetni; icerik: UlkeAraclari }) {
  const [veri, setVeri] = useState<{ takipler: TakipSatiri[]; bugun: string } | null>(null)
  const [hata, setHata] = useState(false)
  const [bekleyen, setBekleyen] = useState<string | null>(null)
  const [bildirim, setBildirim] = useState<TakipBildirimi>(null)
  const { hesap, api } = u
  const oku = useCallback(() => api(ARAC_KAYDI_API).then((r) => { if (r.ok && Array.isArray(r.j.takipler)) { setVeri({ takipler: r.j.takipler, bugun: String(r.j.bugun ?? '') }); setHata(false) } else setHata(true) }).catch(() => setHata(true)), [api])
  useEffect(() => { if (hesap) void oku() }, [hesap, oku])
  const kapat = (id: string) => {
    setBekleyen(id); setBildirim(null)
    api(ARAC_KAYDI_API, { method: 'PATCH', govde: { kayitId: id, islem: 'kapat' } })
      .then((r) => { setBildirim(r.ok ? 'kapatildi' : 'yapilamadi'); return oku() })
      .catch(() => setBildirim('yapilamadi'))
      .finally(() => setBekleyen(null))
  }
  return <TakipPaneliGorunumu a={a} dil={u.dil} icerik={icerik} takipler={veri?.takipler ?? null} bugun={veri?.bugun ?? ''} hata={hata} yukleniyor={u.m.kabuk.yukleniyor} bekleyen={bekleyen} bildirim={bildirim} kapat={kapat} />
}
