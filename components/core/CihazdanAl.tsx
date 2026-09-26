'use client';
/**
 * NOTYA-BLE-01/02 — Cihaz Köprüsü UI (core, specialty-agnostic; all 30 branşlar + klinik inherit).
 * One button, one label, everywhere: "📶 Cihazdan al". No device-management screen.
 *
 *  <CihazdanAl>   — Web Bluetooth spot measurement (ateş, tansiyon, nabız, SpO₂, kilo, glukoz) → confirm card →
 *                   parent's vitals editor. Doctor still approves the note as before ("not onayı = ölçüm onayı").
 *  <CihazDosyasi> — vendor-app file (Eko/Littmann steteskop sesi, Kardia/Eko EKG PDF, USG görüntüsü) →
 *                   encrypted vault + audit row.
 *
 * Platform truth: Web Bluetooth = Chrome/Edge on Android, Windows, macOS. iPhone/iPad Safari: no native support —
 * the free iOSWebBLE Safari extension (or Bluefy browser) supplies navigator.bluetooth; bleYetenek() says so plainly.
 * requestDevice() only fires from a tap — this button IS the tap.
 */
import React, { useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { bleYetenek, bluetoothOlcumAl } from '@/core/bluetooth/webBluetooth';
import type { NotyaOlcum } from '@/core/bluetooth/types';
import { DosyaSecDugmesi } from './DosyaSecDugmesi';

const ETIKET: Record<string, string> = { ates: 'Ateş', tansiyon: 'Tansiyon', nabiz: 'Nabız', spo2: 'SpO₂', kilo: 'Kilo', glukoz: 'Glukoz' };

const btn: React.CSSProperties = { background: 'rgba(15,155,142,0.14)', border: '1px solid rgba(15,155,142,0.45)', color: '#2DD4BF', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const kart: React.CSSProperties = { marginTop: 8, background: 'rgba(15,155,142,0.08)', border: '1px solid rgba(15,155,142,0.35)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#EDF1F7' };
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5' };

function cihazAdi(o: NotyaOlcum): string {
  const c = o.cihaz;
  return [c.uretici, c.model].filter(Boolean).join(' ') || c.ad || 'Bluetooth cihaz';
}

export function CihazdanAl({ hastaId, notId, onOlcum }: { hastaId: string | null; notId?: string | null; onOlcum: (vitaller: Record<string, string>) => void }) {
  const [durum, setDurum] = useState<'bos' | 'bekliyor' | 'onay' | 'hata'>('bos');
  const [olcumler, setOlcumler] = useState<NotyaOlcum[]>([]);
  const [mesaj, setMesaj] = useState('');
  const [transport, setTransport] = useState<'webbluetooth' | 'ioswebble'>('webbluetooth');

  const baslat = async () => {
    const y = bleYetenek();
    if (!y.destekli) { setMesaj(y.mesaj); setDurum('hata'); return; }
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setTransport(ios ? 'ioswebble' : 'webbluetooth');
    setDurum('bekliyor'); setMesaj('');
    try {
      const oturum = await bluetoothOlcumAl();
      setOlcumler(oturum.olcumler); setDurum('onay');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Cihaza bağlanılamadı.';
      // Kullanıcı seçiciyi kapattı → sessizce geri dön; gerçek hata → göster ve uyumsuzluk raporu düş
      if (/cancel|User cancelled|chooser/i.test(m)) { setDurum('bos'); return; }
      setMesaj(m); setDurum('hata');
      if (/profil|bulunamadı/i.test(m) && hastaId) {
        const token = await ensureDoctorAccessToken();
        if (token) fetch('/api/doktor/cihaz-olcum', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ hastaId, uyumsuz: { hata: m } }) }).catch(() => {});
      }
    }
  };

  const ekle = async () => {
    const vitaller: Record<string, string> = {};
    for (const o of olcumler) vitaller[o.tur] = o.deger;
    onOlcum(vitaller);
    setDurum('bos');
    if (!hastaId) return;
    const token = await ensureDoctorAccessToken();
    if (!token) return;
    // Audit row (device make/model/serial + raw bytes). Failure here never blocks the doctor.
    fetch('/api/doktor/cihaz-olcum', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ hastaId, notId: notId || null, transport, olcumler }) }).catch(() => {});
  };

  return (
    <span style={{ display: 'inline-block' }}>
      <button type="button" onClick={baslat} disabled={durum === 'bekliyor'} style={{ ...btn, opacity: durum === 'bekliyor' ? 0.6 : 1 }} title="Bluetooth cihazdan ölçüm al">
        📶 {durum === 'bekliyor' ? 'Cihaz bekleniyor…' : 'Cihazdan al'}
      </button>
      {durum === 'bekliyor' && <div style={{ ...kucuk, marginTop: 4 }}>Cihazı seçin, sonra ölçümü cihazda yapın — değer buraya düşecek (60 sn).</div>}
      {durum === 'hata' && (
        <div style={{ ...kart, borderColor: 'rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.06)' }}>
          <div>{mesaj}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
            <button type="button" onClick={baslat} style={btn}>Tekrar dene</button>
            <button type="button" onClick={() => setDurum('bos')} style={{ ...btn, background: 'transparent', color: '#8FA0B5', borderColor: 'rgba(255,255,255,0.15)' }}>Kapat</button>
          </div>
        </div>
      )}
      {durum === 'onay' && olcumler.length > 0 && (
        <div style={kart}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
            {olcumler.map((o, i) => (
              <span key={i}><span style={{ fontSize: 22, fontWeight: 800 }}>{o.deger}</span> <span style={kucuk}>{o.birim} · {ETIKET[o.tur] || o.tur}</span></span>
            ))}
          </div>
          <div style={{ ...kucuk, marginTop: 4 }}>
            {cihazAdi(olcumler[0])}
            {olcumler[0].cihaz.seriNo ? ` · Seri no ${olcumler[0].cihaz.seriNo}` : ''}
            {olcumler[0].olcumZamani ? ` · cihaz saati ${new Date(olcumler[0].olcumZamani).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" onClick={ekle} style={{ ...btn, background: '#0F9B8E', color: '#fff' }}>{notId ? 'Nota ekle' : 'Ekle'}</button>
            <button type="button" onClick={() => setDurum('bos')} style={{ ...btn, background: 'transparent', color: '#8FA0B5', borderColor: 'rgba(255,255,255,0.15)' }}>Vazgeç</button>
          </div>
        </div>
      )}
    </span>
  );
}

const DOSYA_TURLERI: [string, string][] = [['steteskop', 'Steteskop kaydı'], ['ekg', 'EKG'], ['usg', 'Ultrason görüntüsü'], ['diger', 'Diğer cihaz çıktısı']];

/** Vendor-app file → vault. Eko/Kardia/Butterfly/Clarius all end at "share a file"; this is where it lands. */
export function CihazDosyasi({ hastaId, notId, onYuklendi }: { hastaId: string | null; notId?: string | null; onYuklendi?: (belge: { id: string; fileName: string }) => void }) {
  const [acik, setAcik] = useState(false);
  const [tur, setTur] = useState('steteskop');
  const [cihazAd, setCihazAd] = useState('');
  const [dosya, setDosya] = useState<File | null>(null);
  const [durum, setDurum] = useState<'bos' | 'yukluyor' | 'tamam' | 'hata'>('bos');
  const [mesaj, setMesaj] = useState('');

  const yukle = async () => {
    if (!dosya || !hastaId) return;
    setDurum('yukluyor'); setMesaj('');
    const token = await ensureDoctorAccessToken();
    if (!token) { setMesaj('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); setDurum('hata'); return; }
    const fd = new FormData();
    fd.append('dosya', dosya); fd.append('patientId', hastaId); if (notId) fd.append('notId', notId);
    fd.append('tur', tur); fd.append('cihazAd', cihazAd); fd.append('transport', 'dosya-import');
    const r = await fetch('/api/doktor/cihaz-olcum/dosya', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMesaj(j.error || 'Dosya yüklenemedi'); setDurum('hata'); return; }
    setDurum('tamam'); setMesaj(`${dosya.name} hasta dosyasına (Belgeler) eklendi.`); setDosya(null);
    onYuklendi?.({ id: j.document?.id, fileName: j.document?.fileName });
  };

  return (
    <span style={{ display: 'inline-block' }}>
      <button type="button" onClick={() => setAcik(!acik)} style={btn} title="Steteskop / EKG / USG dosyasını cihaz uygulamasından ekle">🎧 Cihazdan gelen dosya</button>
      {acik && (
        <div style={kart}>
          <div style={{ ...kucuk, marginBottom: 6 }}>Eko, Littmann, Kardia, Butterfly gibi uygulamalardan dışa aktardığınız dosya (ses, PDF, görüntü — en çok 4 MB). Android'de doğrudan uygulamanın Paylaş menüsünden Notya'yı seçebilirsiniz.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={tur} onChange={(e) => setTur(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#EDF1F7', fontSize: 12, padding: '5px 8px' }}>
              {DOSYA_TURLERI.map(([k, ad]) => <option key={k} value={k} style={{ color: '#000' }}>{ad}</option>)}
            </select>
            <input value={cihazAd} onChange={(e) => setCihazAd(e.target.value)} placeholder="Cihaz (örn. Eko CORE 500)" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#EDF1F7', fontSize: 12, padding: '5px 8px', width: 180 }} />
            <DosyaSecDugmesi dosya={dosya} onSec={setDosya} accept="audio/*,application/pdf,image/*" style={{ fontSize: 12, color: '#8FA0B5' }} />
            <button type="button" onClick={yukle} disabled={!dosya || !hastaId || durum === 'yukluyor'} style={{ ...btn, background: '#0F9B8E', color: '#fff', opacity: !dosya || durum === 'yukluyor' ? 0.5 : 1 }}>{durum === 'yukluyor' ? 'Yükleniyor…' : 'Ekle'}</button>
          </div>
          {mesaj && <div style={{ ...kucuk, marginTop: 6, color: durum === 'hata' ? '#F87171' : '#2DD4BF' }}>{mesaj}</div>}
        </div>
      )}
    </span>
  );
}
