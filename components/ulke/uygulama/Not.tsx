'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — /visit?not=<id>: the note of a visit.
 *
 * The model wrote a DRAFT in the doctor's note language. The doctor reads it, edits it, and approves it — only then
 * is it in the patient's file. One click asks for the same note in the other language (Uzbek ↔ Russian): it arrives
 * as a SECOND draft beside the first, and the doctor approves whichever one they choose. An approved note is shown
 * as text and offers nothing that could change it; the server refuses a change as well.
 *
 * When the recording was heard with low confidence, a plain notice asks the doctor to check the note carefully.
 *
 * NOTYA-ULKE-PORTAL-01 — under an APPROVED note, where the country has the patient portal: the summary for the
 * patient and the doctor's decision to share it (./PortalOzeti.tsx). Nothing about the note itself changes.
 *
 * NOTYA-ULKE-INTAKE-01 — beside a DRAFT, where the country has the intake form: the patient's submitted answers,
 * read-only, under the line that says whose words they are (./HastaFormuKarti.tsx). They are not part of the note.
 *
 * NOTYA-UZ-BRANSLAR-01 — ROLE FIELDS. A note written with a role's template has that role's fields under the four
 * sections. LEAK RULE on the screen: a field is drawn only when BOTH the server lists its key for this note AND the
 * pack's template for this visit owns it (../klinik/notSablonlari.ts → uzSablonAlanlari) — a key of another role is
 * not drawn even if it arrives. The label is the pack's, in the account's form; the key is never shown.
 */
import { ReferansAramalari } from './ReferansKarti'
import React, { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Bilgi, Hata, Secim, tarihYaz, saatYaz, YOL, type Uygulama } from './Kabuk'
import { tamAd } from './Hastalar'
import { KonusmaBildirimleri, konusmaDiliAdi, sablonAdi, type MuayeneDetayi } from './Muayene'
import { asistanAdi } from './Asistan'
import { dilAdi, temelDil, metninDili, sablonAlanlari, alanTanimi, alanAdi, bolumAdi, NOT_BOLUMLERI, sablonMetni, type UygulamaMetni, type NotBolumu } from '@/lib/ulke/arayuz'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { DosyaEk } from './DosyaEk'
import GeriLink from '@/components/navigasyon/GeriLink'
import { NotUstCubugu, NotBaslikKuyrugu, NotPil, NotAnaDugme, NotDuzeni, NotAlani, NotYazi, NotOkunurKutu, NOT_ETIKET } from '@/components/doktor/NotDuzenGorunumu'
import { MuayeneEkleri } from './MuayeneEkleri'
import { PortalOzetKarti } from './PortalOzeti'
import { HastaFormuKarti } from './HastaFormuKarti'
import { SablonSecici, useSablonlar } from './Sablonlarim'
import { EklerNotKarti } from './Ekler'
import { bloklariAktar } from '@/core/belgeler/notaBlok'
import { sonaEkle } from '@/lib/ulke/sablon/sabitler'
import type { DilKodu } from '@/lib/ulke/tipler'

export type NotIcerigi = { s: string; o: string; a: string; p: string; /** Role fields: key → text. */ alanlar?: Record<string, string> }
export type NotDetayi = {
  notId: string; seansId: string; onayli: boolean; onayTarihi: string | null
  dil: DilKodu; icerik: NotIcerigi
  ikinci: { dil: DilKodu; icerik: NotIcerigi } | null
  yenidenYazilabilir: DilKodu | null
  /** Field keys the server allows for this note, in order. */
  alanAnahtarlari?: readonly string[]
  muayene: MuayeneDetayi
  /** Addendum on an approved note. Absent on a draft. */
  ekMetin?: string
}
export type NotIslemi = 'kaydediliyor' | 'cevriliyor' | 'onaylaniyor' | null
/** What the last action answered: a code of the note API, or one of the two good outcomes. */
export type NotBildirimi = 'KAYDEDILDI' | 'ONAYLANDI' | 'KAYDEDILEMEDI' | 'ONAYLANAMADI' | 'YENIDEN_YAZILAMADI' | 'ONAYLI' | 'BOS' | 'BAGLANTI' | null

const BOLUMLER = NOT_BOLUMLERI

/**
 * The fields this note shows, per section: what the server lists AND the visit's template owns. Both, or nothing.
 */
export function notAlanlari(not: Pick<NotDetayi, 'alanAnahtarlari' | 'muayene'>): Record<NotBolumu, string[]> {
  const v = not.muayene
  const sablonun = new Set(sablonAlanlari(v.sablon, { dogumTarihi: v.hasta?.dogumTarihi, muayeneTarihi: v.baslangic.slice(0, 10) }))
  const cikti: Record<NotBolumu, string[]> = { s: [], o: [], a: [], p: [] }
  for (const k of new Set(not.alanAnahtarlari ?? [])) { const t = sablonun.has(k) ? alanTanimi(k) : null; if (t) cikti[t.bolum].push(k) }
  return cikti
}
/** A language of notes, named in the screen's language (the script is not named: both Uzbek forms are "Uzbek"). */
export const notDiliAdi = (m: UygulamaMetni, dil: string): string => dilAdi(m, temelDil(dil))

function bildirimMetni(m: UygulamaMetni, b: NotBildirimi): { iyi: string | null; kotu: string | null } {
  const n = m.not
  if (b === 'KAYDEDILDI') return { iyi: n.kaydedildi, kotu: null }
  if (b === 'ONAYLANDI') return { iyi: n.onaylandi, kotu: null }
  const kotu: Record<string, string> = { KAYDEDILEMEDI: n.kaydedilemedi, ONAYLANAMADI: n.onaylanamadi, YENIDEN_YAZILAMADI: n.cevrilemedi, ONAYLI: n.zatenOnayli, BOS: n.bosNot, BAGLANTI: m.kabuk.baglanti }
  return { iyi: null, kotu: b ? kotu[b] ?? m.kabuk.hata : null }
}

export function NotGorunumu({ m, not, aktifDil, setAktifDil, icerik, setIcerik, islem, bildirim, kaydet, yenidenYaz, onayla, sablonEki }: {
  m: UygulamaMetni; not: NotDetayi; aktifDil: DilKodu; setAktifDil: (d: DilKodu) => void
  icerik: NotIcerigi; setIcerik: (i: NotIcerigi) => void; islem: NotIslemi; bildirim: NotBildirimi
  kaydet: () => void; yenidenYaz: () => void; onayla: () => void
  /** NOTYA-ULKE-MESAJ-01: under each section of a DRAFT, the doctor's own templates for that section, where the country has them. */
  sablonEki?: (bolum: NotBolumu, mesgul: boolean) => ReactNode
}) {
  const n = m.not
  const v = not.muayene
  const dil = konusmaDiliAdi(m, v.konusma)
  const mesgul = islem !== null
  const { iyi, kotu } = bildirimMetni(m, bildirim)
  const taslaklar = not.ikinci ? [not.dil, not.ikinci.dil] : [not.dil]
  const ekranDili = metninDili(m)
  const alanlar = notAlanlari(not)
  const bolumBasligi = (b: NotBolumu) => bolumAdi(v.sablon, b, ekranDili) ?? n[b]
  const geriYol = v.hasta ? `${YOL.hasta}?id=${v.hasta.id}` : YOL.bugun
  const adi = v.hasta ? tamAd(v.hasta) : m.bugun.hastasiz
  // Türkiye's note page (components/doktor/NotDuzenGorunumu.tsx): the sticky bar with the back link, name, status pill and
  // actions; then ONE column of labelled boxes. Every sentence below is the catalogue's.
  return (
    <>
      <NotUstCubugu
        geri={<GeriLink href={geriYol}>{'←'} {n.dosyayaDon}</GeriLink>}
        baslik={<><span data-alan="hasta-ad">{adi}</span> <NotBaslikKuyrugu>· {n.baslik} · {sablonAdi(m, v.sablon)} · {tarihYaz(v.baslangic)} {saatYaz(v.baslangic)}</NotBaslikKuyrugu></>}
        onayli={not.onayli}
        rozet={<span data-durum={not.onayli ? 'onayli' : 'taslak'}>{not.onayli ? m.durum.onayli : m.durum.taslak}</span>}
        eylemler={not.onayli ? null : (
          <>
            {not.yenidenYazilabilir ? (
              <NotPil disabled={mesgul} onClick={yenidenYaz} veri={{ 'data-eylem': 'yeniden-yaz' }}>
                {islem === 'cevriliyor' ? n.cevriliyor : n.cevir[temelDil(not.yenidenYazilabilir)] ?? ''}
              </NotPil>
            ) : null}
            <NotPil disabled={mesgul} onClick={kaydet} veri={{ 'data-eylem': 'kaydet' }}>{n.kaydet}</NotPil>
            <NotAnaDugme tur="submit" disabled={mesgul} veri={{ form: 'uza-not-form', 'data-eylem': 'onayla' }}>{islem === 'onaylaniyor' ? n.onaylaniyor : n.onayla}</NotAnaDugme>
          </>
        )}
      />

      <NotDuzeni>
        <div>
          <dl className="uza-bilgiler" style={{ marginTop: 0 }}>
            <dt>{m.muayene.sablon}</dt><dd>{sablonAdi(m, v.sablon)}</dd>
            {dil ? <><dt>{m.muayene.taninanDil}</dt><dd>{dil}</dd></> : null}
            <dt>{n.notDili}</dt><dd>{notDiliAdi(m, not.onayli ? not.dil : aktifDil)}</dd>
            {/* NOTYA-UZ-BRANSLAR-01: the assistant of the template the visit was recorded with — not of whatever role the account has today. */}
            {not.onayli ? null : <><dt>{m.asistan.qoralama}</dt><dd data-alan="asistan-ad">{asistanAdi(m, v.sablon)}</dd></>}
            {not.onayli && not.onayTarihi ? <><dt>{m.durum.onayli}</dt><dd>{tarihYaz(not.onayTarihi)} {saatYaz(not.onayTarihi)}</dd></> : null}
            {n.rizaKaydi && v.rizaAt ? <><dt>{n.rizaKaydi}</dt><dd data-alan="riza-kaydi">{tarihYaz(v.rizaAt)} {saatYaz(v.rizaAt)}{v.rizaSurumu ? ` · ${v.rizaSurumu}` : ''}</dd></> : null}
          </dl>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Low confidence of the recording: the doctor is asked, in plain words, to check the note carefully. */}
            <KonusmaBildirimleri m={m} k={v.konusma} />
            {not.onayli ? (n.onayliKaynak ? <p className="uza-ipucu" data-bildirim="yapay-zeka-onayli">{n.onayliKaynak}</p> : null) : <p className="uza-ipucu" data-bildirim="yapay-zeka">{n.uyari}</p>}
          </div>
        </div>

        {not.onayli ? (
          <div data-alan="not" style={{ display: 'grid', gap: 16 }}>
            {BOLUMLER.map((b) => (
              <NotAlani key={b} etiket={bolumBasligi(b)}>
                <NotOkunurKutu data-bolum={b}>{not.icerik[b]}</NotOkunurKutu>
                {alanlar[b].filter((k) => (not.icerik.alanlar?.[k] ?? '').trim()).map((k) => (
                  <div key={k} data-alan-anahtar={k} style={{ marginTop: 10 }}>
                    <div style={NOT_ETIKET}>{alanAdi(k, ekranDili)}</div>
                    <NotOkunurKutu>{not.icerik.alanlar?.[k]}</NotOkunurKutu>
                  </div>
                ))}
              </NotAlani>
            ))}
          </div>
        ) : (
          <form id="uza-not-form" data-alan="not" style={{ display: 'grid', gap: 16 }} onSubmit={(e) => { e.preventDefault(); onayla() }}>
            {taslaklar.length > 1 ? (
              <div>
                <Secim etiket={n.notDili} ad="taslak-dili" deger={aktifDil} sec={setAktifDil} secenekler={taslaklar.map((d) => ({ deger: d, ad: notDiliAdi(m, d) }))} />
                {aktifDil !== not.dil ? <p className="uza-ipucu" data-bildirim="ikinci-taslak">{n.ikinciTaslak}</p> : null}
              </div>
            ) : null}
            {BOLUMLER.map((b) => (
              <NotAlani key={b} etiket={<label htmlFor={`uza-not-${b}`}>{bolumBasligi(b)}</label>}>
                <NotYazi id={`uza-not-${b}`} name={b} lang={aktifDil} rows={Math.max(4, Math.min(18, Math.ceil((icerik[b] || '').length / 95)))} value={icerik[b]} onChange={(e) => setIcerik({ ...icerik, [b]: e.target.value })} disabled={mesgul} />
                {sablonEki ? sablonEki(b, mesgul) : null}
                {alanlar[b].map((k) => (
                  <div key={k} data-alan-anahtar={k} style={{ marginTop: 10 }}>
                    <div style={NOT_ETIKET}><label htmlFor={`uza-alan-${k}`}>{alanAdi(k, ekranDili)}</label></div>
                    <NotYazi id={`uza-alan-${k}`} name={`alan-${k}`} rows={2} lang={aktifDil} value={icerik.alanlar?.[k] ?? ''} onChange={(e) => setIcerik({ ...icerik, alanlar: { ...(icerik.alanlar ?? {}), [k]: e.target.value } })} disabled={mesgul} />
                  </div>
                ))}
              </NotAlani>
            ))}
          </form>
        )}

        <Hata>{kotu}</Hata>
        <Bilgi>{iyi}</Bilgi>

        <details className="uza-transkript" style={{ marginTop: 0 }}>
          <summary>{n.transkript}</summary>
          <p data-alan="transkript">{v.metin}</p>
        </details>
      </NotDuzeni>
    </>
  )
}

export function Not({ u, notId }: { u: Uygulama; notId: string }) {
  const [not, setNot] = useState<NotDetayi | null>(null)
  const [yuk, setYuk] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const [aktifDil, setAktifDil] = useState<DilKodu>(() => ulkePaketi().varsayilanDil)
  // The text on the screen, per draft language: what the doctor has typed is kept while they look at the other draft.
  const [metinler, setMetinler] = useState<Partial<Record<DilKodu, NotIcerigi>>>({})
  const [islem, setIslem] = useState<NotIslemi>(null)
  const [bildirim, setBildirim] = useState<NotBildirimi>(null)
  const { hesap, api } = u

  const yukle = useCallback(async (gecilecekDil?: DilKodu): Promise<void> => {
    const r = await api(`/api/ulke/not?id=${encodeURIComponent(notId)}`)
    if (!r.ok || !r.j.not) { setYuk(r.status === 404 ? 'yok' : 'hata'); return }
    const n = r.j.not as NotDetayi
    setNot(n)
    setMetinler((eski) => ({ [n.dil]: eski[n.dil] ?? n.icerik, ...(n.ikinci ? { [n.ikinci.dil]: eski[n.ikinci.dil] ?? n.ikinci.icerik } : {}) }))
    setAktifDil((eski) => gecilecekDil ?? (eski === n.dil || eski === n.ikinci?.dil ? eski : n.dil))
    setYuk('tamam')
  }, [api, notId])

  useEffect(() => { if (hesap) yukle().catch(() => setYuk('hata')) }, [hesap, yukle])
  // NOTYA-ULKE-MESAJ-01: the doctor's own templates for a note — read once, and only while the note is a draft.
  const sablonlar = useSablonlar(api, Boolean(hesap) && ozellikAcik('hekimSablonlari') && not !== null && !not.onayli, 'not')

  if (yuk !== 'tamam' || !not) {
    return (
      <section className="uza-kart">
        {yuk === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{yuk === 'yok' ? u.m.not.bulunamadi : u.m.kabuk.hata}</Hata>}
        {yuk === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.bugun}>{u.m.kabuk.geri}</a></p>}
      </section>
    )
  }

  const icerik = metinler[aktifDil] ?? (aktifDil === not.dil ? not.icerik : not.ikinci?.icerik ?? not.icerik)
  // A note that has fields always sends them (an empty object clears them); a note without fields sends none.
  const govde = (dil: DilKodu) => { const i = metinler[dil] ?? not.icerik; return { notId, dil, s: i.s, o: i.o, a: i.a, p: i.p, ...((not.alanAnahtarlari ?? []).length ? { alanlar: i.alanlar ?? {} } : {}) } }
  const kodu = (j: Record<string, unknown>, yedek: NotBildirimi): NotBildirimi => (j.code === 'ONAYLI' ? 'ONAYLI' : j.code === 'BOS' ? 'BOS' : yedek)

  async function kaydet() {
    setIslem('kaydediliyor'); setBildirim(null)
    try {
      const r = await api('/api/ulke/not', { method: 'PATCH', govde: govde(aktifDil) })
      setBildirim(r.ok ? 'KAYDEDILDI' : kodu(r.j, 'KAYDEDILEMEDI'))
      if (r.j.code === 'ONAYLI') await yukle()
    } catch { setBildirim('BAGLANTI') }
    setIslem(null)
  }

  async function yenidenYaz() {
    if (!not) return
    setIslem('cevriliyor'); setBildirim(null)
    try {
      // The rewrite is made from the note as the doctor has it on the screen: save it first.
      const k = await api('/api/ulke/not', { method: 'PATCH', govde: govde(not.dil) })
      if (!k.ok) { setBildirim(kodu(k.j, 'KAYDEDILEMEDI')); setIslem(null); return }
      const r = await api('/api/ulke/not/yeniden-yaz', { method: 'POST', govde: { notId } })
      if (r.ok && typeof r.j.dil === 'string') await yukle(r.j.dil as DilKodu)
      else setBildirim(kodu(r.j, 'YENIDEN_YAZILAMADI'))
    } catch { setBildirim('BAGLANTI') }
    setIslem(null)
  }

  async function onayla() {
    setIslem('onaylaniyor'); setBildirim(null)
    try {
      const r = await api('/api/ulke/not/onayla', { method: 'POST', govde: govde(aktifDil) })
      if (r.ok) { await yukle(); setBildirim('ONAYLANDI') } else {
        setBildirim(kodu(r.j, 'ONAYLANAMADI'))
        if (r.j.code === 'ONAYLI') await yukle()
      }
    } catch { setBildirim('BAGLANTI') }
    setIslem(null)
  }

  return (
    <>
      <NotGorunumu m={u.m} not={not} aktifDil={aktifDil} setAktifDil={(d) => { setAktifDil(d); setBildirim(null) }} icerik={icerik}
        setIcerik={(i) => { setMetinler((eski) => ({ ...eski, [aktifDil]: i })); setBildirim(null) }} islem={islem} bildirim={bildirim} kaydet={kaydet} yenidenYaz={yenidenYaz} onayla={onayla}
        sablonEki={ozellikAcik('hekimSablonlari') ? (b, mesgul) => <SablonSecici x={sablonMetni(u.dil)} sablonlar={sablonlar} hedef={b} mesgul={mesgul} ekle={(t) => { setMetinler((eski) => ({ ...eski, [aktifDil]: { ...icerik, [b]: sonaEkle(icerik[b], t) } })); setBildirim(null) }} /> : undefined} />
      {/* NOTYA-ULKE-EKLER-01: documents added after the note was written — read, and merged into the Examination section of
          this DRAFT in one write. What the server saved is merged into the text still being edited, so the doctor's own
          unsaved changes survive (blocks already on the screen are left alone). An approved note offers nothing. */}
      {!not.onayli && ozellikAcik('goruntuDegerlendirme') ? (
        <EklerNotKarti m={u.m} api={api} notId={not.notId} seansId={not.seansId} hastaAdi={not.muayene.hasta ? tamAd(not.muayene.hasta) : ''}
          onEklendi={(o) => setMetinler((eski) => { const t = eski[not.dil] ?? not.icerik; return { ...eski, [not.dil]: { ...t, o: bloklariAktar(o, t.o) } } })} />
      ) : null}
      {/* NOTYA-ULKE-PORTAL-01: only an APPROVED note of a patient can have a summary for that patient; the server decides again. */}
      {/* NOTYA-ULKE-INTAKE-01: beside a DRAFT, what the patient wrote before the visit — for the doctor to read while the note is
          still theirs to change. Read-only, marked as the patient's own words; it was never given to the model. */}
      {!not.onayli && not.muayene.hasta && ozellikAcik('hastaPortali') && ozellikAcik('hastaFormu') ? <HastaFormuKarti u={u} hastaId={not.muayene.hasta.id} mod="muayene" /> : null}
      {not.onayli && not.muayene.hasta && ozellikAcik('hastaPortali') ? <PortalOzetKarti key={`${not.notId}-${not.onayTarihi ?? ''}`} u={u} notId={not.notId} /> : null}
      {/* MUAYENE-EKLERI-07: files attached to this visit (a lab PDF, a scanned referral, a photographed document). */}
      {ozellikAcik('muayeneEkleri') ? <MuayeneEkleri m={u.m} seansId={not.seansId} api={api} /> : null}
      <DosyaEk m={u.m} not={not} api={api} yenile={() => yukle()} />
      {/* AU-BETA-01: the official medicines-schedule lookup beside the note, where the pack brings one. */}
      <ReferansAramalari />
    </>
  )
}
