/**
 * NOTYA-KADEME-01 — Yazılı Ayşe (temel kademe yüzeyi).
 * Doktor MİKROFONLA konuşur (tarayıcı STT — ücretsiz), Ayşe YAZILI cevap verir:
 * ElevenLabs jetonu hiç yanmaz. Arkada /api/asistan/chat çalışır — yani hasta dosyası
 * bilinci, "son hastam" çözümleme, ilaç etkileşim uyarısı ve aksiyonlar TAMAMEN aktif.
 * Halka açılışta kademe planı: temel = bu yüzey; orta/pro = ElevenLabs sesli 1:1
 * (seans limitli). Kademe zorlaması abonelik lansmanında eklenecek — yetenek bugün herkese açık.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

interface Mesaj { rol: 'doktor' | 'asistan'; icerik: string }

interface TanimaSonucu { isFinal: boolean; 0: { transcript: string } }
interface TanimaOlayi { resultIndex: number; results: { length: number; [i: number]: TanimaSonucu } }
interface Tanima {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: TanimaOlayi) => void) | null; onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
}

export default function YaziliSohbet({ personaId, specialty }: { personaId?: string; specialty?: string }) {
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [dinliyor, setDinliyor] = useState(false);
  const [oturumId, setOturumId] = useState<string | null>(null);
  const [aktifHasta, setAktifHasta] = useState<string | null>(null);
  const tanimaRef = useRef<Tanima | null>(null);
  const altRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { try { tanimaRef.current?.stop(); } catch { /* sessiz */ } }, []);

  function mikrofon() {
    if (dinliyor) { try { tanimaRef.current?.stop(); } catch { /* sessiz */ } setDinliyor(false); return; }
    const w = window as unknown as { webkitSpeechRecognition?: new () => Tanima; SpeechRecognition?: new () => Tanima };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { setGirdi('(Bu tarayıcı sesli girişi desteklemiyor — yazarak sorun.)'); return; }
    const t = new Ctor();
    t.lang = 'tr-TR';
    t.continuous = true;
    t.interimResults = true;
    t.onresult = (e) => {
      let son = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) son += e.results[i][0].transcript;
      }
      if (son) setGirdi((g) => (g ? g + ' ' : '') + son.trim());
    };
    t.onend = () => setDinliyor(false);
    t.onerror = () => setDinliyor(false);
    tanimaRef.current = t;
    t.start();
    setDinliyor(true);
  }

  async function gonder() {
    const metin = girdi.trim();
    if (!metin || bekliyor) return;
    try { tanimaRef.current?.stop(); } catch { /* sessiz */ }
    setDinliyor(false);
    setGirdi('');
    const yeni: Mesaj[] = [...mesajlar, { rol: 'doktor', icerik: metin }];
    setMesajlar(yeni);
    setBekliyor(true);
    try {
      const token = await ensureDoctorAccessToken();
      const r = await fetch('/api/asistan/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: metin, personaId, specialty, asistanSessionId: oturumId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ayşe yanıt veremedi.');
      const veri = d.data && typeof d.data === 'object' ? d.data : d;
      const cevap = String(veri.response || veri.message || veri.cevap || '');
      if (veri.asistanSessionId) setOturumId(String(veri.asistanSessionId));
      if (veri.aktifHasta) setAktifHasta(String(veri.aktifHasta));
      setMesajlar([...yeni, { rol: 'asistan', icerik: cevap || 'Yanıt alınamadı.' }]);
    } catch (e) {
      setMesajlar([...yeni, { rol: 'asistan', icerik: e instanceof Error ? e.message : 'Ayşe yanıt veremedi.' }]);
    } finally {
      setBekliyor(false);
      setTimeout(() => altRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '18px auto 30px', padding: '0 16px' }}>
      {!acik ? (
        <button
          type="button"
          onClick={() => setAcik(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#C9D4E3', borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          💬 Yazılı sohbet — sesli sorun, Ayşe yazsın <span style={{ fontSize: 11, color: '#5F7189' }}>(hasta dosyası bilinciyle)</span>
        </button>
      ) : (
        <div style={{ background: '#0D1C33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#EDF1F7' }}>💬 Yazılı sohbet{aktifHasta ? <span style={{ fontWeight: 400, fontSize: 12, color: '#2DD4BF' }}> · aktif hasta: {aktifHasta}</span> : ''}</span>
            <span role="button" tabIndex={0} onClick={() => setAcik(false)} onKeyDown={(e) => { if (e.key === 'Enter') setAcik(false); }} style={{ fontSize: 12, color: '#5F7189', cursor: 'pointer' }}>Kapat ✕</span>
          </div>
          {mesajlar.length === 0 && (
            <div style={{ fontSize: 12.5, color: '#8FA0B5', lineHeight: 1.6, marginBottom: 10 }}>
              Hastanın adını söylemeniz yeterli: &ldquo;Mehmet Yılmaz kaç kez geldi?&rdquo;, &ldquo;son hastamın ilaçları neydi?&rdquo; — Ayşe dosyadan cevaplar, ilaç etkileşimlerinde kendiliğinden uyarır.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', marginBottom: 10 }}>
            {mesajlar.map((m, i) => (
              <div key={i} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'flex-start', maxWidth: '90%', background: m.rol === 'doktor' ? '#0F9B8E' : 'rgba(255,255,255,0.06)', color: '#EDF1F7', borderRadius: 12, padding: '8px 12px', fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.icerik}</div>
            ))}
            {bekliyor && <div style={{ fontSize: 12, color: '#5F7189' }}>Ayşe dosyaya bakıyor…</div>}
            <div ref={altRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); gonder(); }} style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={mikrofon}
              title={dinliyor ? 'Dinlemeyi durdur' : 'Sesle sorun'}
              style={{ width: 42, flexShrink: 0, background: dinliyor ? '#EF4444' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: 'white', borderRadius: 10, fontSize: 16, cursor: 'pointer' }}
            >
              {dinliyor ? '⏹' : '🎤'}
            </button>
            <input
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              placeholder={dinliyor ? 'Dinliyorum…' : 'Sorunuzu yazın ya da 🎤 ile söyleyin'}
              style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#EDF1F7', borderRadius: 10, padding: '10px 12px', fontSize: 14 }}
            />
            <button type="submit" disabled={bekliyor || !girdi.trim()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: bekliyor || !girdi.trim() ? 0.5 : 1 }}>Sor</button>
          </form>
        </div>
      )}
    </div>
  );
}
