'use client';
/**
 * NOTYA-NOT-01 — Muayene notu sayfası: tam not, düzenlenebilir, yeniden onaylanabilir.
 *
 * Kaan/Gökhan (2026-09-10): Muayene Geçmişi'nde bir vizite tıklayınca notun TAMAMI görünmeli,
 * orada yine düzeltilebilmeli ve yeniden onaylanabilmeli — sadece Yazdır/PDF değil.
 * Tek sayfa, İnceleme kartıyla aynı alanlar ve aynı onay ucu (/api/notes/[id]/approve):
 * düzenlemeler öğrenme loguna girer, ilaçlar dosya+portala işlenir (aynı ilaç aynı doz → tekrar açılmaz).
 */
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

interface NotVeri {
  not: { id: string; createdAt: string; approvedAt: string | null; specialty: string; basvuruYakinmasi: string; subjektif: string; objektif: string; degerlendirme: string; plan: string; alarmBulgulari: string[]; vitaller: Record<string, unknown> | null; hastaOzeti: string; icdKodlari: { code?: string; description?: string }[] };
  hasta: { ad: string };
  doktor: { ad: string };
  duzenlemeSayisi: number;
}

const VITAL = [['tansiyon', 'Tansiyon', 'mmHg'], ['nabiz', 'Nabız', '/dk'], ['spo2', 'SpO₂', '%'], ['ates', 'Ateş', '°C'], ['kilo', 'Kilo', 'kg'], ['boy', 'Boy', 'cm']] as const;
const BOLUM = [['subjektif', 'Anamnez — Şikayet · Şikayetin Hikayesi · Özgeçmiş · Soygeçmiş'], ['objektif', 'Fizik Muayene / Bulgular'], ['degerlendirme', 'Değerlendirme — Ön Tanı / Ayırıcı Tanı'], ['plan', 'Tedavi · Tetkik · Kontrol']] as const;

function trTarih(iso: string | null): string { if (!iso) return ''; return new Date(iso).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const kutu: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#EDF1F7', fontSize: 13.5, lineHeight: 1.6, padding: '10px 12px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 4 };

export default function NotSayfasi() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [veri, setVeri] = useState<NotVeri | null>(null);
  const [hata, setHata] = useState('');
  const [basvuru, setBasvuru] = useState('');
  const [vital, setVital] = useState<Record<string, string>>({});
  const [taslak, setTaslak] = useState<Record<string, string>>({ subjektif: '', objektif: '', degerlendirme: '', plan: '' });
  const [alarm, setAlarm] = useState('');
  const [ozet, setOzet] = useState('');
  const [durum, setDurum] = useState<'bos' | 'kaydediyor' | 'kaydedildi' | 'hata'>('bos');
  const [degisti, setDegisti] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/notes/${params.id}`, { headers: { Authorization: `Bearer ${t}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Not alınamadı');
        setVeri(j);
        setBasvuru(j.not.basvuruYakinmasi || '');
        setVital(Object.fromEntries(Object.entries((j.not.vitaller || {}) as Record<string, unknown>).map(([k, v]) => [k, v == null ? '' : String(v)])));
        setTaslak({ subjektif: j.not.subjektif || '', objektif: j.not.objektif || '', degerlendirme: j.not.degerlendirme || '', plan: j.not.plan || '' });
        setAlarm((j.not.alarmBulgulari || []).join('\n'));
        setOzet(j.not.hastaOzeti || '');
      } catch (e) { setHata(e instanceof Error ? e.message : 'Hata'); }
    })();
  }, [params.id]);

  const isaretle = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDegisti(true); };

  const kaydetVeOnayla = async () => {
    setDurum('kaydediyor');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/notes/${params.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ duzenlemeler: { ...taslak, basvuruYakinmasi: basvuru, vitaller: vital, alarmBulgulari: alarm.split('\n').map((x) => x.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean), hastaOzeti: ozet } }) });
      const j = await r.json();
      if (!r.ok || j.success === false) throw new Error(j.error || 'Onaylanamadı');
      setDurum('kaydedildi'); setDegisti(false);
      setVeri((v) => v ? { ...v, not: { ...v.not, approvedAt: new Date().toISOString() } } : v);
      setTimeout(() => setDurum('bos'), 2500);
    } catch (e) { setDurum('hata'); alert(e instanceof Error ? e.message : 'Onaylanamadı'); setTimeout(() => setDurum('bos'), 2500); }
  };

  if (hata) return <div style={{ padding: 40, color: '#EDF1F7', fontFamily: 'system-ui' }}>{hata}</div>;
  if (!veri) return <div style={{ padding: 40, color: '#8FA0B5', fontFamily: 'system-ui' }}>Not yükleniyor…</div>;
  const { not, hasta } = veri;
  const onayli = !!not.approvedAt;

  return (
    <div style={{ minHeight: '100vh', background: '#0B1628', color: '#EDF1F7', fontFamily: 'system-ui' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#0B1628', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: '#9FB3C8', cursor: 'pointer', fontSize: 14 }}>← Geri</button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{hasta.ad} <span style={{ color: '#8FA0B5', fontWeight: 500 }}>· {not.specialty} · {trTarih(not.createdAt)}</span></div>
          <div style={{ fontSize: 12, color: onayli ? '#22C55E' : '#F59E0B' }}>{onayli ? `Onaylı — ${trTarih(not.approvedAt)}` : 'Onay bekliyor'}{degisti ? ' · kaydedilmemiş değişiklik var' : ''}</div>
        </div>
        <a href={`/dashboard/doktor/notlar/${not.id}/yazdir`} target="_blank" rel="noreferrer" style={{ color: '#C9D4E3', fontSize: 13, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '7px 12px' }}>🖨️ Yazdır / PDF</a>
        <a href={`/dashboard/doktor/notlar/${not.id}/recete`} target="_blank" rel="noreferrer" style={{ color: '#2DD4BF', fontSize: 13, textDecoration: 'none', border: '1px solid rgba(45,212,191,0.35)', borderRadius: 999, padding: '7px 12px' }}>🧾 Reçete</a>
        <button type="button" onClick={kaydetVeOnayla} disabled={durum === 'kaydediyor'} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          {durum === 'kaydediyor' ? 'Kaydediliyor…' : durum === 'kaydedildi' ? '✓ Onaylandı' : onayli ? 'Kaydet ve yeniden onayla' : 'Onayla'}
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '18px 16px 60px', display: 'grid', gap: 16 }}>
        <div>
          <div style={etiket}>Başvuru Yakınması</div>
          <input value={basvuru} onChange={(e) => isaretle(setBasvuru)(e.target.value)} style={{ ...kutu, fontStyle: 'italic' }} />
        </div>
        <div>
          <div style={etiket}>Yaşamsal Bulgular</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {VITAL.map(([k, ad, birim]) => (
              <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#8FA0B5', minWidth: 96 }}>{ad}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input value={vital[k] ?? ''} onChange={(e) => isaretle((v: string) => setVital({ ...vital, [k]: v }))(e.target.value)} placeholder="—" style={{ ...kutu, width: 76, padding: '6px 8px' }} />
                  <span style={{ color: '#64748B' }}>{birim}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        {BOLUM.map(([k, ad]) => (
          <div key={k}>
            <div style={etiket}>{ad}</div>
            <textarea value={taslak[k]} onChange={(e) => isaretle((v: string) => setTaslak({ ...taslak, [k]: v }))(e.target.value)} rows={Math.max(4, Math.min(18, Math.ceil((taslak[k] || '').length / 95)))} style={kutu} />
          </div>
        ))}
        {not.icdKodlari.length > 0 && (
          <div>
            <div style={etiket}>ICD-10</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{not.icdKodlari.map((c, i) => <span key={i} style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '3px 10px' }}>{c.code}{c.description ? ` — ${c.description}` : ''}</span>)}</div>
          </div>
        )}
        <div>
          <div style={etiket}>Evde dikkat edilmesi gerekenler <span style={{ fontWeight: 400, color: '#64748B' }}>(veliye/hastaya · her satır bir madde)</span></div>
          <textarea value={alarm} onChange={(e) => isaretle(setAlarm)(e.target.value)} rows={Math.max(3, alarm.split('\n').length)} style={kutu} />
        </div>
        <div>
          <div style={etiket}>Hasta/veli özeti <span style={{ fontWeight: 400, color: '#64748B' }}>(portala gider)</span></div>
          <textarea value={ozet} onChange={(e) => isaretle(setOzet)(e.target.value)} rows={4} style={kutu} />
        </div>
      </div>
    </div>
  );
}
