/**
 * NOTYA-ULKE-MESAJ-01 — THE CONVERSATIONS between a doctor and a patient, drawn the same way on both sides: the
 * doctor's card on the patient's file and the patient's own page. A leaf: it imports no screen and no catalogue —
 * every word arrives as a prop, already in the reader's own form — so both the signed-in application and the
 * patient's page (which may import nothing of that application) can use it.
 *
 * Newest conversation first; inside one, oldest message first. A message's text is written as text: nothing in it is
 * read as markup.
 */
import React, { type ReactNode } from 'react'
import type { Mesaj, MesajGondereni, Yazisma } from '@/lib/ulke/mesaj/sabitler'

export type YazismaSozleri = {
  /** The name shown for each writer, as THIS reader sees them ("You", "Doctor" / "Patient"). */
  yazan: Readonly<Record<MesajGondereni, string>>
  /** Heading of a conversation: open, or closed on a day. */
  acik: string
  kapali: (an: string) => string
  /** On a message of the OTHER side this reader has not read yet. */
  yeni: string
  /** Under a message of THIS reader's own: the other side has read it / has not yet. Absent = not shown on this side. */
  okundu?: string
  okunmadi?: string
}

/** The newest moment among the messages shown: what "I have read up to here" is said with. '' = nothing is shown. */
export function sonMesajAni(yazismalar: readonly Yazisma[]): string {
  let son = ''
  for (const y of yazismalar) for (const m of y.mesajlar) if (m.an > son) son = m.an
  return son
}

/** How many messages of the other side this reader has not read. */
export const okunmamisSayisi = (yazismalar: readonly Yazisma[], ben: MesajGondereni): number => yazismalar.reduce((n, y) => n + y.mesajlar.filter((m) => m.gonderen !== ben && !m.okundu).length, 0)

function MesajSatiri({ m, ben, s, zaman }: { m: Mesaj; ben: MesajGondereni; s: YazismaSozleri; zaman: (iso: string) => string }) {
  const benim = m.gonderen === ben
  return (
    <li className="uza-mesaj" data-mesaj={m.id} data-gonderen={m.gonderen} data-benim={benim ? 'evet' : undefined} data-okunmamis={!benim && !m.okundu ? 'evet' : undefined}>
      <p className="uza-mesaj-ust">
        <span className="uza-mesaj-yazan">{s.yazan[m.gonderen]}</span>
        <span className="uza-saat">{zaman(m.an)}</span>
        {!benim && !m.okundu ? <span className="uza-rozet" data-mesaj-durum="yeni">{s.yeni}</span> : null}
      </p>
      <p className="uza-not-metin">{m.metin}</p>
      {benim && s.okundu && s.okunmadi ? <p className="uza-ipucu uza-mesaj-alt" data-okundu={m.okundu ? 'evet' : 'hayir'}>{m.okundu ? s.okundu : s.okunmadi}</p> : null}
    </li>
  )
}

export function YazismaListesi({ yazismalar, ben, s, zaman, alt }: {
  yazismalar: readonly Yazisma[]; ben: MesajGondereni; s: YazismaSozleri
  /** A moment as this reader's country writes it. */
  zaman: (iso: string) => string
  /** What is drawn under one conversation (the doctor's "close"). */
  alt?: (y: Yazisma) => ReactNode
}) {
  return (
    <div className="uza-yazismalar">
      {yazismalar.map((y) => (
        <div key={y.id} className="uza-yazisma" data-yazisma={y.id} data-yazisma-durumu={y.kapandi ? 'kapali' : 'acik'}>
          {(y.kapandi ? s.kapali(y.kapandi) : s.acik) ? <p className="uza-ust-yazi" data-alan="yazisma-durumu">{y.kapandi ? s.kapali(y.kapandi) : s.acik}</p> : null}
          <ul className="uza-mesajlar">{y.mesajlar.map((m) => <MesajSatiri key={m.id} m={m} ben={ben} s={s} zaman={zaman} />)}</ul>
          {alt ? alt(y) : null}
        </div>
      ))}
    </div>
  )
}
