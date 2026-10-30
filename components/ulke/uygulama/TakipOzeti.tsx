'use client'

/**
 * AU-GOLD-DEPTH-02 — next clinical-review chip on the doctor's patient file.
 *
 * Pack supplies review tool keys via `uygulama.muayeneMotorlari[rol].araclar` (keys ending
 * in `-review` or known plan studios). Shared UI never hard-codes an AU key (wall D7).
 */
import React, { useCallback, useEffect, useState } from 'react'
import type { Uygulama } from './Kabuk'
import { aracYolu, paketAraci } from './aracOrtak'
import { arayuz } from '@/lib/ulke/arayuz'
import { ARAC_KAYDI_API, type AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'
import { portalIncelemeOzeti } from '@/lib/ulke/portal/incelemeOzeti'
import { ulkePaketi } from '@/lib/ulke/ulke'

function incelemeAnahtarlari(rol: string | null, icerik: ReturnType<typeof arayuz>['araclar']): string[] {
  if (!rol || !icerik) return []
  const motor = ulkePaketi().uygulama?.muayeneMotorlari?.[rol] as { araclar?: readonly string[] } | undefined
  const adaylar = (motor?.araclar ?? []).filter((k) => {
    if (!/-review$|-plan$/.test(k)) return false
    return Boolean(paketAraci(icerik, k))
  })
  return adaylar
}

export function TakipOzetiGorunumu({
  ozet,
  aracAdi,
  hastaId,
  bugun,
}: {
  ozet: { arac: string; seans: string | null; sonraki: string }
  aracAdi: string
  hastaId: string
  bugun: string
}) {
  const gecikti = ozet.sonraki < bugun
  return (
    <section className="uza-kart" data-alan="takip-ozeti" data-gecikti={gecikti ? '1' : '0'}>
      <h2 className="uza-h2">Next clinical review</h2>
      <p className="uza-aciklama" style={{ marginBottom: 8 }}>
        From the latest kept review studio. Nothing is booked or sent.
      </p>
      <dl className="uza-bilgiler">
        <dt>Studio</dt>
        <dd data-alan="takip-arac">{aracAdi}</dd>
        {ozet.seans ? (
          <>
            <dt>Last visit dated</dt>
            <dd data-alan="takip-seans">{ozet.seans}</dd>
          </>
        ) : null}
        <dt>Next review</dt>
        <dd data-alan="takip-sonraki">
          {ozet.sonraki}
          {gecikti ? (
            <span
              className="uza-rozet"
              data-alan="takip-gecikti"
              style={{
                marginLeft: 8,
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'var(--uza-tehlike, #b91c1c)',
                color: '#fff',
              }}
            >
              Overdue
            </span>
          ) : null}
        </dd>
      </dl>
      <p style={{ marginTop: 8 }}>
        <a className="uza-baglanti" href={aracYolu(ozet.arac, hastaId)} data-eylem="takip-ac">
          Open review studio
        </a>
      </p>
    </section>
  )
}

export function TakipOzetiKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [kayitlar, setKayitlar] = useState<AracKaydi[] | null>(null)
  const { hesap, api } = u
  const icerik = arayuz().araclar
  const rol = hesap?.rol ?? null
  const anahtarlar = incelemeAnahtarlari(rol, icerik)
  const acik = anahtarlar.length > 0
  const yukle = useCallback(() => {
    api(`${ARAC_KAYDI_API}?hasta=${encodeURIComponent(hastaId)}`)
      .then((r) => { if (r.ok && Array.isArray(r.j.kayitlar)) setKayitlar(r.j.kayitlar) })
      .catch(() => { /* empty card when list unreadable */ })
  }, [api, hastaId])
  useEffect(() => { if (hesap && acik) yukle() }, [hesap, acik, yukle])
  if (!acik || !kayitlar) return null
  const ozet = portalIncelemeOzeti(kayitlar, anahtarlar)
  if (!ozet) return null
  const arac = paketAraci(icerik!, ozet.arac)
  const bugun = new Date().toISOString().slice(0, 10)
  return (
    <TakipOzetiGorunumu
      ozet={ozet}
      aracAdi={arac?.ad ?? ozet.arac}
      hastaId={hastaId}
      bugun={bugun}
    />
  )
}
