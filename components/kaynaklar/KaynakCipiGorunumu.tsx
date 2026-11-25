/**
 * TR-PROTOKOL-KUTUPHANESI — presentational source chips: "Belge · yıl/sürüm · bölüm" + the official link. Pure render (no data
 * import), so it is unit-tested on the server and the registry stays out of every first-load bundle (KaynakCipleri loads it).
 */
import React from 'react'
import { CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import type { KaynakCipi } from '@/lib/kaynaklar/protokolKutuphanesi/cip'

const cipStil: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%', boxSizing: 'border-box',
  fontSize: 12, lineHeight: 1.35, color: R.pine, background: 'rgba(47,67,52,0.06)', border: `1px solid rgba(47,67,52,0.16)`,
  borderRadius: 999, padding: '3px 10px', textDecoration: 'none', overflowWrap: 'anywhere',
}

export function KaynakCipiGorunumu({ c }: { c: KaynakCipi }) {
  const parcalar = [c.etiket, c.surum, c.bolum].filter(Boolean) as string[]
  const baslik = `${parcalar.join(' · ')} — son kontrol ${c.sonDogrulama}${c.url ? '' : ' · resmî bağlantı bulunamadı'}`
  const icerik = (
    <>
      <span aria-hidden="true">§</span>
      <span>
        <strong style={{ fontWeight: 600 }}>{c.etiket}</strong>
        {' · '}
        <span style={c.durum === 'guncel' ? undefined : { color: R.warn }}>{c.surum}</span>
        {c.bolum ? <> · {c.bolum}</> : null}
      </span>
    </>
  )
  return c.url ? (
    <a href={c.url} target="_blank" rel="noopener noreferrer" style={cipStil} title={baslik} data-kaynak-cipi={c.belgeId}>{icerik}</a>
  ) : (
    <span style={cipStil} title={baslik} data-kaynak-cipi={c.belgeId}>{icerik}</span>
  )
}

export function KaynakCipListesi({ cipler }: { cipler: KaynakCipi[] }) {
  if (!cipler.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }} aria-label="Kaynaklar">
      {cipler.map((c) => <KaynakCipiGorunumu key={c.belgeId} c={c} />)}
    </div>
  )
}
