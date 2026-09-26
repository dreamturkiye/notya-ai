'use client';

/**
 * NOTYA-ASISTAN-YUZEN-01 (Kaan, 2026-09-26) — doktor asistanla çalışırken başka sayfaya geçince oturum
 * kapanmaz; /asistan dışında sağ altta bu panel görünür. Küçük balon (persona baş harfi + mikrofon durumu)
 * ↔ genişletilmiş panel (son mesajlar, yazı girişi, mikrofon durumu). "Asistana dön" → /asistan (next/link),
 * "Kapat" → oturumu bitirir ve durumu temizler. Oturum AsistanOturumContext'te; bu bileşen yalnız görünüm.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HafifMarkdown from '@/components/asistan/HafifMarkdown';
import { EylemKarti, EylemToplu, type EylemHasta, type EylemOneriGorunumu } from '@/components/core/EylemKarti';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import { formatColleagueTabLabel } from '@/lib/colleagueAddress';
import { useAsistanOturum, type Yonlendirme } from '@/components/asistan/AsistanOturumContext';
import { mikrofonEtiketi, yuzenPanelGorunur } from '@/lib/asistan/yuzenPanel';

interface Satir { sira: number; doktor: boolean; metin: string; oneriler?: EylemOneriGorunumu[]; hasta?: EylemHasta; yonlendirme?: Yonlendirme | null }

const SON_MESAJ = 8;

export default function AsistanYuzenPanel() {
  const pathname = usePathname();
  const o = useAsistanOturum();
  const [acik, setAcik] = useState(false);
  const altRef = useRef<HTMLDivElement>(null);

  const gorunur = yuzenPanelGorunur({
    sesDurumu: o.status,
    sesMesajiVar: o.messages.length > 0,
    yaziliAcik: o.yazili.acik,
    yaziliDoktorMesajiVar: o.yazili.mesajlar.some((m) => m.rol === 'doktor'),
    pathname,
  });

  // Sesli ve yazılı mesajlar tek zaman çizgisinde (sira), en yeniler altta.
  const satirlar = useMemo<Satir[]>(() => {
    const ses: Satir[] = o.messages.map((m) => ({ sira: m.sira, doktor: m.role === 'user', metin: m.text }));
    const yazili: Satir[] = o.yazili.mesajlar.map((m) => ({ sira: m.sira, doktor: m.rol === 'doktor', metin: m.icerik, oneriler: m.oneriler, hasta: m.hasta, yonlendirme: m.yonlendirme }));
    return [...ses, ...yazili].sort((a, b) => a.sira - b.sira).slice(-SON_MESAJ);
  }, [o.messages, o.yazili.mesajlar]);

  useEffect(() => {
    if (!acik) return;
    const t = setTimeout(() => altRef.current?.scrollIntoView({ block: 'end' }), 40);
    return () => clearTimeout(t);
  }, [acik, satirlar.length, o.yazili.bekliyor, o.sesKarti]);

  if (!gorunur) return null;

  const { persona, status } = o;
  const etiket = mikrofonEtiketi(status, o.yazili.dinliyor);
  const nokta = status === 'speaking' ? persona.color
    : status === 'listening' || o.yazili.dinliyor ? '#22C55E'
    : status === 'connecting' ? '#B4832F'
    : status === 'error' ? CHROME_RENK.warn
    : CHROME_RENK.muted;
  const basHarf = persona.shortName.slice(0, 1).toUpperCase();
  const girdi = o.yazili.girdi;

  return (
    <div
      className="notya-alt-yuzer notya-asistan-yuzen"
      style={{
        position: 'fixed', right: 12, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', zIndex: 45,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
        fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink, maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <style>{`@media print { .notya-asistan-yuzen { display: none !important; } }`}</style>
      {acik ? (
        <div
          role="dialog"
          aria-label={`${formatColleagueTabLabel(persona.name)} — asistan paneli`}
          style={{
            width: 360, maxWidth: 'calc(100vw - 24px)', maxHeight: 'min(70dvh, 540px)', boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column', background: CHROME_RENK.paper,
            border: `1px solid ${CHROME_RENK.border}`, borderRadius: 18, boxShadow: '0 14px 36px rgba(58,44,34,0.22)', overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: `1px solid ${CHROME_RENK.border}`, background: '#faf6ee', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: persona.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{basHarf}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatColleagueTabLabel(persona.name)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: CHROME_RENK.muted }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: nokta, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{etiket}{o.yazili.aktifHasta ? ` · aktif hasta: ${o.yazili.aktifHasta}` : ''}</span>
              </div>
            </div>
            <button type="button" onClick={() => setAcik(false)} aria-label="Paneli küçült" title="Küçült"
              style={{ width: 44, height: 44, border: 'none', background: 'transparent', color: CHROME_RENK.muted, fontSize: 22, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>–</button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {satirlar.length === 0 && (
              <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, lineHeight: 1.5 }}>Görüşme sürüyor — sorunuzu yazabilirsiniz.</div>
            )}
            {satirlar.map((s) => (
              <div key={s.sira} style={{ alignSelf: s.doktor ? 'flex-end' : 'stretch', maxWidth: s.doktor ? '88%' : '100%', minWidth: 0 }}>
                <div style={{ display: 'inline-block', maxWidth: '100%', boxSizing: 'border-box', background: s.doktor ? '#0F9B8E' : '#FFFFFF', border: s.doktor ? 'none' : `1px solid ${CHROME_RENK.border}`, color: s.doktor ? '#fff' : CHROME_RENK.ink, borderRadius: 12, padding: '7px 11px', fontSize: 13, lineHeight: 1.5, whiteSpace: s.doktor ? 'pre-wrap' : 'normal', overflowWrap: 'anywhere' }}>
                  {s.doktor ? s.metin : <HafifMarkdown metin={s.metin} />}
                </div>
                {s.oneriler?.length && s.hasta ? (
                  s.oneriler.length > 1 ? <EylemToplu oneriler={s.oneriler} hasta={s.hasta} /> : <EylemKarti oneri={s.oneriler[0]} hasta={s.hasta} />
                ) : null}
                {s.yonlendirme?.yol && s.yonlendirme.etiket ? (
                  <Link href={s.yonlendirme.yol} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: '#0F9B8E', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                    {s.yonlendirme.etiket} ›
                  </Link>
                ) : null}
              </div>
            ))}
            {o.yazili.bekliyor && <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{persona.shortName} dosyaya bakıyor…</div>}
            {o.sesKarti && (
              <EylemKarti oneri={o.sesKarti.oneri} hasta={o.sesKarti.hasta} onSonuc={o.sesKartiniKapat} />
            )}
            {o.errorMsg && (
              <div style={{ fontSize: 12.5, color: CHROME_RENK.warn, background: '#FBEAE3', border: `1px solid ${CHROME_RENK.warn}70`, padding: '8px 10px', borderRadius: 10, lineHeight: 1.45 }}>{o.errorMsg}</div>
            )}
            {o.sureUzatmaGoster && (
              <button type="button" onClick={() => o.sureUzat(30)} style={{ alignSelf: 'flex-start', minHeight: 44, background: '#B4832F', border: 'none', color: '#fff', borderRadius: 10, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+30 dakika uzat</button>
            )}
            <div ref={altRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void o.yaziliGonder(); }} style={{ display: 'flex', gap: 6, padding: '8px 12px', borderTop: `1px solid ${CHROME_RENK.border}`, flexShrink: 0 }}>
            <input
              value={girdi}
              onChange={(e) => o.setYaziliGirdi(e.target.value)}
              placeholder={`${persona.shortName} için yazın`}
              aria-label="Asistana mesaj"
              style={{ flex: 1, minWidth: 0, minHeight: 44, boxSizing: 'border-box', background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 10, padding: '0 12px', fontSize: 16 }}
            />
            <button type="submit" disabled={o.yazili.bekliyor || !girdi.trim()}
              style={{ minHeight: 44, background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '0 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: o.yazili.bekliyor || !girdi.trim() ? 0.5 : 1, flexShrink: 0 }}>Gönder</button>
          </form>

          <div style={{ display: 'flex', gap: 8, padding: '0 12px 12px', flexShrink: 0 }}>
            <Link href="/asistan" style={{ flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: CHROME_RENK.pine, color: '#FAF8F4', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>
              Asistana dön
            </Link>
            <button type="button" onClick={() => { setAcik(false); void o.oturumuKapat(); }}
              style={{ flex: 1, minHeight: 44, borderRadius: 10, background: 'transparent', border: `1px solid ${CHROME_RENK.warn}66`, color: CHROME_RENK.warn, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
              Kapat
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAcik(true)}
          aria-label={`${formatColleagueTabLabel(persona.name)} — asistan panelini aç (${etiket})`}
          title={`${formatColleagueTabLabel(persona.name)} · ${etiket}`}
          style={{
            position: 'relative', width: 58, height: 58, borderRadius: '50%', border: `3px solid ${CHROME_RENK.paper}`,
            background: persona.color, color: '#fff', fontSize: 22, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 8px 24px rgba(58,44,34,0.28), 0 0 0 2px ${nokta}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', padding: 0,
          }}
        >
          {basHarf}
          <span aria-hidden style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: '50%', background: CHROME_RENK.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(58,44,34,0.25)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={nokta} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="21" x2="12" y2="17" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
