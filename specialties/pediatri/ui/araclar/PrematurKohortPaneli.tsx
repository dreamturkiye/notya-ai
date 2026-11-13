'use client';
/**
 * PREMATURE-MODUL — Araçlar › Prematüre kohort paneli. /api/doktor/pediatri/prematur/kohort — yalnız hekimin KENDİ prematüre
 * (< 37 hf) ya da ≤ 1500 g bebekleri. Geciken / yaklaşan takip kalemleri; salt okunur (hasta mesajı ya da görev üretmez).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { tarihGoster } from '../../engines/girdi';
import type { PrematurKohortSatiri } from '../../engines/prematurKohort';
import { pediStil, Istatistik, Rozet, TaslakNotu } from './PediAracKabugu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { kutu, etiket, kucuk, ghost } = pediStil;
const DURUM: Record<string, { ad: string; ton: 'kirmizi' | 'uyari' | 'bilgi' | 'notr' }> = {
  gecikti: { ad: 'gecikti', ton: 'kirmizi' }, 'zamani-geldi': { ad: 'zamanı geldi', ton: 'uyari' }, yaklasiyor: { ad: 'yaklaşıyor', ton: 'bilgi' }, 'kayit-eksik': { ad: 'kayıt eksik', ton: 'uyari' },
};

export default function PrematurKohortPaneli() {
  const [v, setV] = useState<{ satirlar: PrematurKohortSatiri[]; bilinmeyenSayisi: number; toplamBebek: number; protokol: { ad: string; surum: string } } | null>(null);
  const [hata, setHata] = useState('');
  const [sadeceGecikmis, setSadeceGecikmis] = useState(false);

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/pediatri/prematur/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setV(j); else setHata(j.error || 'Kohort yüklenemedi');
    } catch { setHata('Kohort yüklenemedi — bağlantıyı kontrol edin.'); }
  }, []);
  useEffect(() => { yukle(); }, [yukle]);

  const gorunen = (v?.satirlar || []).filter((s) => !sadeceGecikmis || s.gecikti);
  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Prematüre kohortu</div>
        <div style={{ ...kucuk, fontSize: 14 }}>{v ? `${v.satirlar.length} prematüre / ≤ 1500 g bebek · ${v.protokol.ad} protokolü (${v.protokol.surum}) · yalnız sizin kayıtlarınız` : hata || 'Yükleniyor…'}</div>
        {v && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <Istatistik deger={v.satirlar.length} etiket="kohortta" />
            <Istatistik ton={v.satirlar.some((s) => s.gecikti) ? 'kirmizi' : 'notr'} deger={v.satirlar.filter((s) => s.gecikti).length} etiket="geciken kalemi olan" />
            <Istatistik ton="uyari" deger={v.satirlar.filter((s) => s.ozet.zamaniGeldi > 0).length} etiket="zamanı gelen" />
          </div>
        )}
        {hata && <div style={{ ...pediStil.hata, marginTop: 8 }}>{hata} <button type="button" onClick={yukle} style={ghost}>Tekrar dene</button></div>}
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', minHeight: 44, marginTop: 10, cursor: 'pointer', fontSize: 14 }}>
          <input type="checkbox" style={{ width: 20, height: 20 }} checked={sadeceGecikmis} onChange={(e) => setSadeceGecikmis(e.target.checked)} /> Yalnız geciken kalemi olanlar
        </label>
      </div>
      <div style={{ ...kutu, padding: 0, overflow: 'hidden' }}>
        {gorunen.map((s, i) => (
          <div key={s.patientId} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '12px 14px', background: i % 2 ? '#F6F0E4' : '#FFFFFF', borderTop: i ? `1px solid ${CHROME_RENK.border}` : 'none' }}>
            <a href={hastaDosyaHref(s.patientId, 'prematur')} style={{ color: CHROME_RENK.ink, minWidth: 150, fontWeight: 700, fontSize: 16, textDecoration: 'none', overflowWrap: 'anywhere' }}>{s.ad}</a>
            <span style={{ ...kucuk, flex: '1 1 220px' }}>{s.gestasyon} hf{s.dogumKiloGr ? ` · ${s.dogumKiloGr} g` : ''} · doğum {tarihGoster(s.dogumIso)} · {s.kronolojikAy} aylık{s.duzeltilmisYas ? ` (düzeltilmiş ${s.duzeltilmisYas})` : ''}</span>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 260px' }}>
              {s.siradaki ? <><Rozet ton={DURUM[s.siradaki.durum]?.ton || 'notr'}>{DURUM[s.siradaki.durum]?.ad || s.siradaki.durum}</Rozet><span style={{ fontSize: 13 }}>{s.siradaki.baslik}: {s.siradaki.etiket}{s.siradaki.hedef ? ` (${tarihGoster(s.siradaki.hedef)})` : ''}</span></> : <span style={kucuk}>açık kalem yok</span>}
            </span>
            {s.veriEksik.length > 0 && <span style={{ ...kucuk, flex: '1 1 100%' }}>Eksik: {s.veriEksik.join(', ')}</span>}
            <a href={hastaDosyaHref(s.patientId, 'prematur')} style={ghost}>Planı aç</a>
          </div>
        ))}
        {v && !gorunen.length && <div style={{ padding: '28px 18px', textAlign: 'center', ...kucuk, fontSize: 14 }}>{v.satirlar.length ? 'Geciken kalemi olan bebek yok.' : 'Kohortta bebek yok. Prematüre bebekler bebek kartındaki (kadın doğum taburcu paketi) ya da elle girilen gestasyon haftasından bulunur.'}</div>}
      </div>
      {v && v.bilinmeyenSayisi > 0 && <div style={{ ...pediStil.uyari, marginBottom: 14 }}>{v.bilinmeyenSayisi} bebekte gestasyon haftası ve doğum ağırlığı kayıtlı değil; plan kurulamadığı için kohortta görünmüyor. Hasta dosyası › Prematüre planı ya da Araçlar › Prematüre takip planı üzerinden girin.</div>}
      <TaslakNotu>Karar desteğidir: liste, doktorun onayladığı takip kalemlerinin durumunu gösterir; hasta mesajı, görev ya da sipariş üretmez.</TaslakNotu>
    </>
  );
}
