'use client';
/**
 * NOTYA-BLE-02 — Web Share Target landing (Android, Notya installed as PWA).
 * Flow: Eko / Kardia / Butterfly app → Paylaş → Notya → sw.js stores the file in the Cache API → this page
 * reads it, the doctor picks the patient + kind, and it is uploaded with the Bearer token to the vault.
 * Also usable without a share (iPhone / desktop): "Cihazdan gelen dosya" file input on the same page.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth';
import { normalizeHastalar, toolsShell, toolsCard, toolsInput, type HastaOption } from '@/lib/doktor/toolsUi';
import { trIcerir } from '@/lib/utils/turkceArama';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const DOSYA_TURLERI: [string, string][] = [['steteskop', 'Steteskop kaydı'], ['ekg', 'EKG'], ['usg', 'Ultrason görüntüsü'], ['diger', 'Diğer cihaz çıktısı']];

function turTahmin(mime: string): string {
  if (mime.startsWith('audio/')) return 'steteskop';
  if (mime === 'application/pdf') return 'ekg'; // Eko/Kardia raporları PDF gelir; doktor değiştirebilir
  if (mime.startsWith('image/')) return 'usg';
  return 'diger';
}

export default function CihazPaylasPage() {
  const router = useRouter();
  const [dosya, setDosya] = useState<File | null>(null);
  const [kaynak, setKaynak] = useState<'share-target' | 'dosya-import'>('dosya-import');
  const [hastalar, setHastalar] = useState<HastaOption[]>([]);
  const [ara, setAra] = useState('');
  const [hastaId, setHastaId] = useState('');
  const [tur, setTur] = useState('steteskop');
  const [cihazAd, setCihazAd] = useState('');
  const [durum, setDurum] = useState<'hazir' | 'yukluyor' | 'tamam' | 'hata'>('hazir');
  const [mesaj, setMesaj] = useState('');

  useEffect(() => {
    (async () => {
      const token = await ensureDoctorAccessToken();
      if (!token) { router.replace(`${DOKTOR_GIRIS}?next=${encodeURIComponent('/cihaz/paylas')}`); return; }
      // Paylaşılan dosya (sw.js) — varsa
      try {
        if ('caches' in window) {
          const cache = await caches.open('notya-cihaz-paylas');
          const r = await cache.match('/cihaz/paylas/dosya');
          if (r) {
            const blob = await r.blob();
            const ad = decodeURIComponent(r.headers.get('x-dosya-adi') || 'paylasilan');
            const f = new File([blob], ad, { type: r.headers.get('content-type') || blob.type });
            setDosya(f); setKaynak('share-target'); setTur(turTahmin(f.type));
            const metin = decodeURIComponent(r.headers.get('x-metin') || r.headers.get('x-baslik') || '');
            if (/eko|littmann/i.test(metin)) setCihazAd('Eko'); else if (/kardia/i.test(metin)) setCihazAd('KardiaMobile');
            await cache.delete('/cihaz/paylas/dosya');
          }
        }
      } catch { /* paylaşım yoksa sorun değil */ }
      const r = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (r.ok) setHastalar(normalizeHastalar(await r.json()));
    })();
  }, [router]);

  const filtre = useMemo(() => {
    // NOTYA-ARAMA-TR-01: ortak Türkçe katlama (I/ı/İ/i tek kovada)
    const q = ara.trim();
    const l = q ? hastalar.filter((h) => trIcerir(h.label, q)) : hastalar;
    return l.slice(0, 12);
  }, [hastalar, ara]);

  const yukle = async () => {
    if (!dosya || !hastaId) return;
    setDurum('yukluyor'); setMesaj('');
    const token = await ensureDoctorAccessToken();
    if (!token) { setDurum('hata'); setMesaj('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
    const fd = new FormData();
    fd.append('dosya', dosya); fd.append('patientId', hastaId); fd.append('tur', tur); fd.append('cihazAd', cihazAd); fd.append('transport', kaynak);
    const r = await fetch('/api/doktor/cihaz-olcum/dosya', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setDurum('hata'); setMesaj(j.error || 'Dosya yüklenemedi'); return; }
    setDurum('tamam'); setMesaj('Hasta dosyasına (Belgeler) eklendi.');
  };

  const secili = hastalar.find((h) => h.id === hastaId);

  return (
    <div style={toolsShell}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 12px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: CHROME_RENK.ink, margin: '8px 0 4px' }}>🎧 Cihazdan gelen dosya</h1>
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 14 }}>
          Steteskop kaydı, EKG raporu veya ultrason görüntüsünü hastanın dosyasına ekleyin. Android'de cihaz uygulamasının Paylaş menüsünden Notya'yı seçtiğinizde dosya buraya düşer.
        </div>

        <div style={{ ...toolsCard, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 }}>1 · Dosya</div>
          {dosya ? (
            <div style={{ fontSize: 13, color: CHROME_RENK.ink }}>
              {dosya.name} <span style={{ color: CHROME_RENK.muted }}>· {(dosya.size / 1024 / 1024).toFixed(2)} MB · {dosya.type || 'tür bilinmiyor'}{kaynak === 'share-target' ? ' · paylaşımla geldi' : ''}</span>
              {dosya.type.startsWith('audio/') && <audio controls src={URL.createObjectURL(dosya)} style={{ display: 'block', width: '100%', marginTop: 6 }} />}
              <div style={{ marginTop: 6 }}><button type="button" onClick={() => { setDosya(null); setKaynak('dosya-import'); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: CHROME_RENK.muted, borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>Başka dosya</button></div>
            </div>
          ) : (
            <input type="file" accept="audio/*,application/pdf,image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setDosya(f); if (f) setTur(turTahmin(f.type)); }} style={{ fontSize: 13, color: CHROME_RENK.muted }} />
          )}
          <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 6 }}>En çok 4 MB. Uzun steteskop kayıtlarını cihaz uygulamasında kısaltın.</div>
        </div>

        <div style={{ ...toolsCard, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 }}>2 · Hasta</div>
          {secili ? (
            <div style={{ fontSize: 13, color: CHROME_RENK.ink }}>{secili.label} <button type="button" onClick={() => setHastaId('')} style={{ marginLeft: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: CHROME_RENK.muted, borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>Değiştir</button></div>
          ) : (
            <>
              <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Hasta adı yazın" style={toolsInput} autoFocus />
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filtre.map((h) => (
                  <button key={h.id} type="button" onClick={() => setHastaId(h.id)} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: CHROME_RENK.ink, borderRadius: 8, padding: '8px 10px', fontSize: 13, cursor: 'pointer' }}>{h.label}</button>
                ))}
                {!filtre.length && <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{hastalar.length ? 'Eşleşen hasta yok' : 'Hastalar yükleniyor…'}</div>}
              </div>
            </>
          )}
        </div>

        <div style={{ ...toolsCard, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 }}>3 · Ne bu?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={tur} onChange={(e) => setTur(e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
              {DOSYA_TURLERI.map(([k, ad]) => <option key={k} value={k} style={{ color: '#000' }}>{ad}</option>)}
            </select>
            <input value={cihazAd} onChange={(e) => setCihazAd(e.target.value)} placeholder="Cihaz (örn. Eko CORE 500)" style={{ ...toolsInput, width: 220 }} />
          </div>
        </div>

        <button type="button" onClick={yukle} disabled={!dosya || !hastaId || durum === 'yukluyor' || durum === 'tamam'} style={{ width: '100%', background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: !dosya || !hastaId || durum !== 'hazir' ? 0.55 : 1 }}>
          {durum === 'yukluyor' ? 'Yükleniyor…' : durum === 'tamam' ? 'Eklendi ✓' : 'Hasta dosyasına ekle'}
        </button>
        {mesaj && <div style={{ marginTop: 8, fontSize: 13, color: durum === 'hata' ? '#F87171' : '#0F9B8E' }}>{mesaj}</div>}
        {durum === 'tamam' && hastaId && (
          <div style={{ marginTop: 10 }}><a href={`/dashboard/doktor/hastalar/${hastaId}`} style={{ color: '#0F9B8E', fontSize: 13 }}>Hasta dosyasını aç →</a></div>
        )}
      </div>
    </div>
  );
}
