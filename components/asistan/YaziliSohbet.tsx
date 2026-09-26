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
import HafifMarkdown from '@/components/asistan/HafifMarkdown';
import { asistanYanitiCoz } from '@/lib/asistan/yanitCoz';
import { EylemKarti, EylemToplu, type EylemHasta, type EylemOneriGorunumu } from '@/components/core/EylemKarti';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

// NOTYA-EYLEM: cards ride ON the assistant message. This surface has no patientId on the client —
// the patient is resolved server-side from free text — so both the proposal ids and the header name
// come back from the route; the client never picks a patient for a write.
interface Yonlendirme { metin: string; etiket: string | null; yol: string | null }
interface Mesaj { rol: 'doktor' | 'asistan'; icerik: string; oneriler?: EylemOneriGorunumu[]; hasta?: EylemHasta; yonlendirme?: Yonlendirme | null }

interface TanimaSonucu { isFinal: boolean; 0: { transcript: string } }
interface TanimaOlayi { resultIndex: number; results: { length: number; [i: number]: TanimaSonucu } }
interface Tanima {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: TanimaOlayi) => void) | null; onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
}

export default function YaziliSohbet({ personaId, specialty, personaAdi = 'Ayşe', oturumId: disOturumId, onOturumId }: {
  personaId?: string; specialty?: string; personaAdi?: string
  /** NOTYA-TEK-BEYIN: sayfanın ortak asistan oturumu (sesli görüşmeyle aynı konuşma). */
  oturumId?: string | null; onOturumId?: (id: string) => void
}) {
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [dinliyor, setDinliyor] = useState(false);
  const [oturumId, setOturumId] = useState<string | null>(disOturumId ?? null);
  useEffect(() => { if (disOturumId) setOturumId(disOturumId); }, [disOturumId]);
  const [aktifHasta, setAktifHasta] = useState<string | null>(null);
  const tanimaRef = useRef<Tanima | null>(null);
  const altRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { try { tanimaRef.current?.stop(); } catch { /* sessiz */ } }, []);

  // NOTYA-GUN-01: panel açılınca Ayşe ilk sözü söyler — günün durumu (randevu, onaysız not, mesaj).
  // Sohbet geçmişine 'asistan' baloncuğu olarak girer; sunucuya gönderilmez (prompt zaten biliyor).
  useEffect(() => {
    if (!acik || mesajlar.length > 0) return;
    let iptal = false;
    (async () => {
      try {
        const token = await ensureDoctorAccessToken();
        // NOTYA-ASISTAN-AKICI-01: önce geçmiş — sohbet, panel her açılışında sıfırdan başlamasın. Geçmiş varsa karşılama tekrarlanmaz.
        try {
          const gr = await fetch('/api/asistan/gecmis', { headers: { Authorization: `Bearer ${token}` } });
          if (gr.ok) {
            const gj = await gr.json();
            const eski = (gj?.mesajlar || []) as { rol: 'doktor' | 'asistan'; metin: string }[];
            if (eski.length && !iptal) { setMesajlar((m) => (m.length === 0 ? eski.map((e) => ({ rol: e.rol, icerik: e.metin })) : m)); return; }
          }
        } catch { /* geçmiş kritik değil */ }
        const r = await fetch('/api/doktor/hafiza', { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const j = await r.json();
        const metin = j?.gun?.metin as string | undefined;
        if (metin && !iptal) setMesajlar((m) => (m.length === 0 ? [{ rol: 'asistan', icerik: metin }] : m));
      } catch { /* açılış kritik değil */ }
    })();
    return () => { iptal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acik]);

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
      if (!r.ok) throw new Error(d.error || `${personaAdi} yanıt veremedi.`);
      const veri = d.data && typeof d.data === 'object' ? d.data : d;
      // The route answers in data.speech (F3: the panel read response/message and showed "Yanıt alınamadı." for every answer).
      // Parsed once more as a guard so a JSON-shaped text can never reach the bubble.
      const cevap = asistanYanitiCoz(String(veri.speech || veri.response || veri.message || veri.cevap || '')).speech;
      if (veri.asistanSessionId) {
        setOturumId(String(veri.asistanSessionId));
        onOturumId?.(String(veri.asistanSessionId));
      }
      if (veri.aktifHasta) setAktifHasta(String(veri.aktifHasta));
      // NOTYA-EYLEM-24: Ayşe bir şeyi bu yoldan yapmıyorsa (reçete, tanı, hasta açma) cümlesi
      // baloncukta; ilgili ekranın bağlantısı burada, baloncuğun altında tek satır.
      setMesajlar([...yeni, { rol: 'asistan', icerik: cevap || 'Yanıt alınamadı.', oneriler: (veri.eylemOnerileri as EylemOneriGorunumu[]) || [], hasta: (veri.eylemHastasi as EylemHasta) || undefined, yonlendirme: (veri.eylemYonlendirme as Yonlendirme) || null }]);
    } catch (e) {
      setMesajlar([...yeni, { rol: 'asistan', icerik: e instanceof Error ? e.message : `${personaAdi} yanıt veremedi.` }]);
    } finally {
      setBekliyor(false);
      setTimeout(() => altRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }

  // NOTYA-YENI-GORUNUM-03 (Kaan, 2026-09-24): this panel was still fully dark-navy (#0D1C33 +
  // white-based translucent fills) -- the redesign never reached it, since it lives outside
  // app/dashboard/doktor and app/doktor-tools (the original audit's scope). Recolored to the same
  // light mint/teal "Ayşe" treatment used in HastaKonsult.tsx for visual consistency between the
  // two Ayşe chat surfaces.
  return (
    <div style={{ maxWidth: 560, margin: '18px auto 30px', padding: '0 16px', flexShrink: 0 }}>
      {!acik ? (
        <button
          type="button"
          onClick={() => setAcik(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', textAlign: 'center', lineHeight: 1.4, background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0F9B8E', borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          💬 Yazılı sohbet — sesli sorun, {personaAdi} yazsın <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>(hasta dosyası bilinciyle)</span>
        </button>
      ) : (
        <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: CHROME_RENK.ink }}>💬 Yazılı sohbet{aktifHasta ? <span style={{ fontWeight: 400, fontSize: 12, color: '#0F9B8E' }}> · aktif hasta: {aktifHasta}</span> : ''}</span>
            <span role="button" tabIndex={0} onClick={() => setAcik(false)} onKeyDown={(e) => { if (e.key === 'Enter') setAcik(false); }} style={{ fontSize: 12, color: CHROME_RENK.muted, cursor: 'pointer' }}>Kapat ✕</span>
          </div>
          {mesajlar.length === 0 && (
            <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, lineHeight: 1.6, marginBottom: 10 }}>
              Hastanın adını söylemeniz yeterli: &ldquo;Mehmet Yılmaz kaç kez geldi?&rdquo;, &ldquo;son hastamın ilaçları neydi?&rdquo; — {personaAdi} dosyadan cevaplar, ilaç etkileşimlerinde kendiliğinden uyarır.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', marginBottom: 10 }}>
            {mesajlar.map((m, i) => (
              <div key={i} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'stretch', maxWidth: m.rol === 'doktor' ? '90%' : '100%', minWidth: 0 }}>
                <div style={{ display: 'inline-block', maxWidth: '100%', background: m.rol === 'doktor' ? '#0F9B8E' : '#FFFFFF', border: m.rol === 'doktor' ? 'none' : `1px solid ${CHROME_RENK.border}`, color: m.rol === 'doktor' ? '#fff' : CHROME_RENK.ink, borderRadius: 12, padding: '8px 12px', fontSize: 13.5, lineHeight: 1.55, whiteSpace: m.rol === 'doktor' ? 'pre-wrap' : 'normal', overflowWrap: 'anywhere' }}>{m.rol === 'asistan' ? <HafifMarkdown metin={m.icerik} /> : m.icerik}</div>
                {m.oneriler?.length && m.hasta ? (
                  m.oneriler.length > 1 ? <EylemToplu oneriler={m.oneriler} hasta={m.hasta} /> : <EylemKarti oneri={m.oneriler[0]} hasta={m.hasta} />
                ) : null}
                {m.yonlendirme?.yol && m.yonlendirme.etiket ? (
                  <div style={{ marginTop: 6 }}>
                    <a href={m.yonlendirme.yol} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: '#0F9B8E', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                      {m.yonlendirme.etiket} ›
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
            {bekliyor && <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{personaAdi} dosyaya bakıyor…</div>}
            <div ref={altRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); gonder(); }} style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={mikrofon}
              title={dinliyor ? 'Dinlemeyi durdur' : 'Sesle sorun'}
              style={{ width: 42, flexShrink: 0, background: dinliyor ? '#EF4444' : '#FFFFFF', border: `1px solid ${dinliyor ? '#EF4444' : CHROME_RENK.border}`, color: dinliyor ? 'white' : CHROME_RENK.ink, borderRadius: 10, fontSize: 16, cursor: 'pointer' }}
            >
              {dinliyor ? '⏹' : '🎤'}
            </button>
            <input
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              placeholder={dinliyor ? 'Dinliyorum…' : 'Sorunuzu yazın ya da 🎤 ile söyleyin'}
              style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 10, padding: '10px 12px', fontSize: 14 }}
            />
            <button type="submit" disabled={bekliyor || !girdi.trim()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: bekliyor || !girdi.trim() ? 0.5 : 1 }}>Sor</button>
          </form>
        </div>
      )}
    </div>
  );
}
