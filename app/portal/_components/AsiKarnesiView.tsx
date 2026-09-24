'use client'
/**
 * ASI-KARNESI-01 — Sağlığım › Aşı Karnesi (hasta / veli telefonu).
 *
 * Dr. Gökhan Mamur: "dijital aşı karnesi olmalı ebeveynin cep telefonundan ulaşabileceği". İçerik lib/asi/karneBelgesi.ts
 * modelinden — PDF (lib/asi/karnePdf.tsx) ve yazdırma çıktısı (bu ekran + ASI_KARNESI_YAZDIRMA_CSS) aynı içerik.
 *
 * TAM OLARAK ÜÇ EYLEM (Kaan, 2026-09-19):
 *  1. PDF indir — dosya kullanıcının cihazına iner.
 *  2. Paylaş — YALNIZ cihazın kendi paylaşım sayfası (Web Share API, dosyayla). Destek yoksa düğme GÖSTERİLMEZ, yerine
 *     açık ipucu: "PDF'i indirip kendi e-postanızdan … gönderebilirsiniz." Notya e-posta GÖNDERMEZ, adres SORMAZ,
 *     saklamaz (sağlık verisini Notya altyapısından geçirmek gereksiz KVKK sorumluluğu — karar ledger'da).
 *  3. Yazdır — tarayıcının yazdırma diyaloğu; @media print kabuğu/düğmeleri gizler, beyaz zemin + siyah metin basar.
 *
 * KLİNİK YORUM YOK: yalnız kayıtlı aşı · doz · tarih · lot / uygulama yeri (kayıtlıysa) · kaynak ve hekimin girdiği
 * sonraki doz tarihi.
 * e-Nabız uyarısı ZORUNLU ve tam boyutta — gizlenmez, küçültülmez, çıktıda da yer alır.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { PortalAsiKarnesi } from '@/lib/portal/types'
import {
  ASI_KARNESI_BASLIK, ASI_KARNESI_YAZDIRMA_CSS, asiKarnesiDosyaAdi, dozMetni, HASTA_KAYNAK_ETIKETI, KAYNAK_ACIKLAMASI,
  KAYNAK_SIRASI, PAYLAS_IPUCU, tarihMetni, yasMetni,
} from '@/lib/asi/karneBelgesi'
import { lotYerTemizle, LOT_AZAMI, YER_AZAMI } from '@/lib/asi/asiLotYeri'
import { trTarih, type AsiKaynakTuru } from '@/lib/asi/karneOkuma'
import { dosyaPaylasimiVar } from '@/lib/asi/karnePaylasim'
import { EmptyState, SectionHeader, SoftPanel } from './ui'

const ALT_BASLIK = 'Doktorunuzun muayenehanesinde kayıtlı aşılarınız. PDF olarak indirebilir, paylaşabilir ya da yazdırabilirsiniz.'

const ROZET_RENK: Record<AsiKaynakTuru, { bg: string; fg: string; bd: string }> = {
  karne: { bg: 'var(--sg-accent-soft)', fg: 'var(--sg-accent-ink)', bd: 'rgba(10,122,138,0.35)' },
  klinik: { bg: 'rgba(26,138,99,0.1)', fg: 'var(--sg-ok)', bd: 'rgba(26,138,99,0.35)' },
  beyan: { bg: 'var(--sg-surface)', fg: 'var(--sg-muted)', bd: 'var(--sg-line)' },
}

function Rozet({ tur }: { tur: AsiKaynakTuru }) {
  const r = ROZET_RENK[tur]
  return (
    <span className="asi-karnesi-rozet" style={{ display: 'inline-block', background: r.bg, color: r.fg, border: `1px solid ${r.bd}`, borderRadius: 999, padding: '3px 10px', fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>
      {HASTA_KAYNAK_ETIKETI[tur]}
    </span>
  )
}

function Eylemler({ pdfUrl, dosyaAdi }: { pdfUrl: string | null; dosyaAdi: string }) {
  const [paylasim, setPaylasim] = useState<'bekliyor' | 'var' | 'yok'>('bekliyor')
  const [pdf, setPdf] = useState<File | null>(null)
  const [mesaj, setMesaj] = useState('')

  useEffect(() => {
    if (!pdfUrl || !dosyaPaylasimiVar(dosyaAdi)) { setPaylasim('yok'); return }
    // iOS Safari share()'i yalnız dokunuşun hemen ardından kabul eder — PDF önceden hazırlanır, dokunuşta bekleme olmaz.
    let iptal = false
    fetch(pdfUrl, { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => { if (!iptal) { setPdf(new File([b], dosyaAdi, { type: 'application/pdf' })); setPaylasim('var') } })
      .catch(() => { if (!iptal) setPaylasim('yok') })
    return () => { iptal = true }
  }, [pdfUrl, dosyaAdi])

  async function paylas() {
    if (!pdf) return
    setMesaj('')
    try {
      await navigator.share({ files: [pdf], title: ASI_KARNESI_BASLIK })
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') setMesaj(`Paylaşım sayfası açılamadı. ${PAYLAS_IPUCU}`)
    }
  }

  return (
    <div data-yazdirma-gizle="" className="asi-karnesi-eylemler" style={{ margin: '0 20px 16px' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {pdfUrl ? (
          <a className="sg-chip-btn is-active" href={pdfUrl} download={dosyaAdi} data-eylem="pdf">PDF indir</a>
        ) : (
          <span className="sg-chip-btn" aria-disabled="true" style={{ opacity: 0.6 }}>PDF indir (örnekte kapalı)</span>
        )}
        {paylasim === 'var' && <button type="button" className="sg-chip-btn" onClick={paylas} data-eylem="paylas">Paylaş</button>}
        <button type="button" className="sg-chip-btn" onClick={() => window.print()} data-eylem="yazdir">Yazdır</button>
      </div>
      {paylasim === 'yok' && <p className="sg-goz-meta" style={{ margin: '8px 2px 0' }}>{PAYLAS_IPUCU}</p>}
      {mesaj && <p role="status" className="sg-goz-meta" style={{ margin: '8px 2px 0' }}>{mesaj}</p>}
    </div>
  )
}

export function AsiKarnesiView({ karne, basePath, pdfUrl }: { karne: PortalAsiKarnesi | null; basePath: string; pdfUrl: string | null }) {
  if (!karne) {
    return (
      <div className="sg-fade">
        <SectionHeader title={ASI_KARNESI_BASLIK} subtitle={ALT_BASLIK} />
        <EmptyState art="gecmis" title="Henüz kayıtlı aşı yok" body="Doktorunuz aşı kaydı girdiğinde burada görünür." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  const [ilk, ...diger] = karne.siradakiler
  const kaynaklar = KAYNAK_SIRASI.filter((k) => karne.yapilanlar.some((a) => a.kaynak === k))

  return (
    <div className="sg-fade asi-karnesi" lang="tr">
      <style>{ASI_KARNESI_YAZDIRMA_CSS}</style>
      <SectionHeader title={ASI_KARNESI_BASLIK} subtitle={ALT_BASLIK} />
      <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px 12px' }}>← Özet</Link>
      <Eylemler pdfUrl={pdfUrl} dosyaAdi={asiKarnesiDosyaAdi(karne)} />

      {/* ZORUNLU — küçültülmez, gizlenmez; ekranda ve çıktıda görünür. */}
      <div role="note" className="asi-karnesi-uyari" data-e-nabiz="" style={{ margin: '0 20px 14px', padding: '14px 16px', borderRadius: 14, background: 'var(--sg-sun-soft)', border: '1.5px solid var(--sg-sun)', color: 'var(--sg-sun-ink)' }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{karne.uyari.baslik}</div>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>{karne.uyari.metin}</div>
      </div>

      <SoftPanel className="sg-goz-panel asi-karnesi-kimlik">
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px 16px', margin: 0 }}>
          {([['Ad Soyad', karne.hasta.adSoyad], ['Doğum tarihi', karne.hasta.dogumTarihi ? trTarih(karne.hasta.dogumTarihi) : null], ['Hekim', karne.hekim.ad], ['Klinik', karne.hekim.klinik], ['Oluşturulma', trTarih(karne.uretimTarihi)]] as const)
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <dt className="sg-goz-meta" style={{ fontSize: 12.5 }}>{k}</dt>
                <dd style={{ margin: 0, fontWeight: 700, fontSize: 15.5, overflowWrap: 'anywhere' }}>{v}</dd>
              </div>
            ))}
        </dl>
      </SoftPanel>

      <SoftPanel className="sg-goz-panel asi-karnesi-siradaki">
        <div className="sg-goz-baslik"><h2>Sıradaki aşı</h2></div>
        {ilk ? (
          <>
            <div className="sg-goz-tarih">{trTarih(ilk.tarih)}</div>
            <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 2 }}>{ilk.ad}</div>
            {diger.length > 0 && (
              <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
                {diger.map((d) => <li key={`${d.ad}${d.tarih}`} className="sg-goz-meta" style={{ fontSize: 14 }}>{d.ad} · {trTarih(d.tarih)}</li>)}
              </ul>
            )}
            <div className="sg-goz-meta" style={{ marginTop: 8 }}>Tarihi doktorunuz kaydetti. Randevu için muayenehanenizle görüşebilirsiniz.</div>
          </>
        ) : (
          <div className="sg-goz-meta" style={{ fontSize: 14.5 }}>Doktorunuzun kaydettiği bir sonraki aşı tarihi yok.</div>
        )}
      </SoftPanel>

      <SoftPanel className="sg-goz-panel">
        <div className="sg-goz-baslik"><h2>Yapılan aşılar ({karne.yapilanlar.length})</h2></div>
        {karne.yapilanlar.length === 0 ? (
          <div className="sg-goz-meta">Kayıtlı aşı yok.</div>
        ) : (
          <ol className="asi-karnesi-liste" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {karne.yapilanlar.map((a, i) => (
              <li key={i} className="asi-karnesi-satir" data-kaynak={a.kaynak} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sg-line)', borderLeft: `4px solid ${ROZET_RENK[a.kaynak].bd}`, display: 'grid', gap: 6, minHeight: 44 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5, overflowWrap: 'anywhere' }}>{a.ad}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5 }}>{a.doz ? `${dozMetni(a.doz)} · ` : ''}{tarihMetni(a.tarih)}{yasMetni(karne.hasta.dogumTarihi, a.tarih) ? ` · ${yasMetni(karne.hasta.dogumTarihi, a.tarih)}` : ''}</span>
                  <Rozet tur={a.kaynak} />
                </div>
                {(lotYerTemizle(a.lotNo, LOT_AZAMI) || lotYerTemizle(a.uygulamaYeri, YER_AZAMI)) && (
                  <div className="sg-goz-meta" data-lot-yer="" style={{ fontSize: 13.5 }}>
                    {[
                      lotYerTemizle(a.lotNo, LOT_AZAMI) ? `Lot: ${lotYerTemizle(a.lotNo, LOT_AZAMI)}` : '',
                      lotYerTemizle(a.uygulamaYeri, YER_AZAMI) ? `Uygulama yeri: ${lotYerTemizle(a.uygulamaYeri, YER_AZAMI)}` : '',
                    ].filter(Boolean).join(' · ')}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        {kaynaklar.length > 0 && (
          <div className="sg-goz-meta" style={{ marginTop: 12, display: 'grid', gap: 4 }}>
            {kaynaklar.map((k) => <div key={k}><strong>{HASTA_KAYNAK_ETIKETI[k]}:</strong> {KAYNAK_ACIKLAMASI[k]}</div>)}
          </div>
        )}
      </SoftPanel>
    </div>
  )
}
