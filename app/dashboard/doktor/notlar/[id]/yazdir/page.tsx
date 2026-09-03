/**
 * NOTYA-SOAP-03 — Yazdır / PDF görünümü.
 * Tarayıcının kendi "PDF olarak kaydet" akışını kullanır (sıfır bağımlılık, mobilde de çalışır).
 * Beyaz, kâğıt-dostu tasarım; kimlik başlığı, S/O/A/P, tanı/ICD, reçete önerisi, alarm
 * bulguları, veli özeti ve ATTESTASYON satırı (yapay zekâ desteği + doktor onayı + düzenleme
 * sayısı) içerir — hukuki iz bütünlüğü için.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

interface NotVeri {
  not: {
    createdAt?: string; approvedAt?: string | null; specialty?: string; basvuruYakinmasi?: string;
    subjektif?: string; objektif?: string; degerlendirme?: string; plan?: string; tani?: string;
    ilaclar?: { ad?: string; doz?: string; kullanim?: string; sure?: string }[];
    receteOnerisi?: { etkenMadde?: string; ticariOrnek?: string; doz?: string; kullanim?: string; sure?: string; not?: string; sgkListesinde?: boolean }[];
    icdKodlari?: { code?: string; description_tr?: string; description?: string; is_primary?: boolean }[];
    kritikBulgular?: string[]; alarmBulgulari?: string[];
    vitaller?: { kilo?: number | null; boy?: number | null; ates?: number | null; nabiz?: number | null; spo2?: number | null; tansiyon?: string | null } | null;
    hastaOzeti?: string; takipSuresi?: string;
  };
  hasta: { ad: string; dogum: string; yas: string; cinsiyet: string; tc: string };
  doktor: { ad: string };
  duzenlemeSayisi: number;
}

function trTarih(iso?: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) } catch { return '' }
}

export default function NotYazdir() {
  const params = useParams<{ id: string }>();
  const [veri, setVeri] = useState<NotVeri | null>(null);
  const [hata, setHata] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/notes/${params.id}`, { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Not yüklenemedi.');
        setVeri(d);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Not yüklenemedi.'); }
    })();
  }, [params.id]);

  if (hata) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>{hata}</div>;
  if (!veri) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#666' }}>Not hazırlanıyor…</div>;

  const { not, hasta, doktor, duzenlemeSayisi } = veri;
  const v = not.vitaller;
  const vitalParcalar = [
    v?.kilo != null ? `Kilo: ${v.kilo} kg` : '',
    v?.boy != null ? `Boy: ${v.boy} cm` : '',
    v?.ates != null ? `Ateş: ${v.ates} °C` : '',
    v?.nabiz != null ? `Nabız: ${v.nabiz}/dk` : '',
    v?.spo2 != null ? `SpO2: %${v.spo2}` : '',
    v?.tansiyon ? `TA: ${v.tansiyon}` : '',
  ].filter(Boolean);

  return (
    <div style={{ background: 'white', color: '#111', minHeight: '100vh', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <style>{`
        @media print { .yazdirma-gizle { display: none !important; } body { -webkit-print-color-adjust: exact; } }
        .not-bolum { margin-bottom: 14px; }
        .not-etiket { font: 700 11px/1.4 system-ui; letter-spacing: 0.06em; color: #0B6B62; text-transform: uppercase; margin-bottom: 3px; }
        .not-metin { font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; }
      `}</style>

      <div className="yazdirma-gizle" style={{ background: '#0A1628', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700 }}>Muayene Notu — Yazdır / PDF</span>
        <button type="button" onClick={() => window.print()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '8px 18px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🖨️ Yazdır / PDF kaydet</button>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px 40px' }}>
        <div style={{ borderBottom: '2px solid #111', paddingBottom: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>MUAYENE NOTU</div>
            <div style={{ font: '12px system-ui', color: '#444', textTransform: 'capitalize' }}>{not.specialty} · {trTarih(not.createdAt)} (TRT)</div>
          </div>
          <div style={{ font: '12px system-ui', color: '#444' }}>Dr. {doktor.ad}</div>
        </div>

        <table style={{ width: '100%', font: '12.5px system-ui', borderCollapse: 'collapse', marginBottom: 14 }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 0', width: '50%' }}><strong>Hasta:</strong> {hasta.ad || '—'}</td>
              <td style={{ padding: '3px 0' }}><strong>TC Kimlik:</strong> {hasta.tc || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 0' }}><strong>Doğum:</strong> {hasta.dogum || '—'}{hasta.yas ? ` (${hasta.yas})` : ''}</td>
              <td style={{ padding: '3px 0' }}><strong>Cinsiyet:</strong> {hasta.cinsiyet || '—'}</td>
            </tr>
            {vitalParcalar.length > 0 && (
              <tr><td colSpan={2} style={{ padding: '3px 0' }}><strong>Vitaller:</strong> {vitalParcalar.join(' · ')}</td></tr>
            )}
          </tbody>
        </table>

        {not.basvuruYakinmasi && (
          <div className="not-bolum"><div className="not-etiket">Başvuru Yakınması</div><div className="not-metin" style={{ fontStyle: 'italic' }}>&ldquo;{not.basvuruYakinmasi}&rdquo;</div></div>
        )}
        {not.subjektif && <div className="not-bolum"><div className="not-etiket">S — Subjektif</div><div className="not-metin">{not.subjektif}</div></div>}
        {not.objektif && <div className="not-bolum"><div className="not-etiket">O — Objektif</div><div className="not-metin">{not.objektif}</div></div>}
        {not.degerlendirme && <div className="not-bolum"><div className="not-etiket">A — Değerlendirme</div><div className="not-metin">{not.degerlendirme}</div></div>}
        {Array.isArray(not.icdKodlari) && not.icdKodlari.length > 0 && (
          <div className="not-bolum"><div className="not-etiket">Tanı / ICD-10</div>
            <div className="not-metin">{not.icdKodlari.map((k) => `${k.code} — ${k.description_tr || k.description || ''}${k.is_primary ? ' (birincil)' : ''}`).join('; ')}</div>
          </div>
        )}
        {not.plan && <div className="not-bolum"><div className="not-etiket">P — Plan</div><div className="not-metin">{not.plan}</div></div>}
        {Array.isArray(not.receteOnerisi) && not.receteOnerisi.length > 0 && (
          <div className="not-bolum"><div className="not-etiket">İlaç Önerileri (reçete doktor tarafından yazılır)</div>
            <div className="not-metin">{not.receteOnerisi.map((r, i) => `${i + 1}. ${[r.ticariOrnek, r.etkenMadde ? `(${r.etkenMadde})` : '', r.doz, r.kullanim, r.sure].filter(Boolean).join(' — ')}${r.sgkListesinde ? ' [SGK]' : ''}${r.not ? ` — Not: ${r.not}` : ''}`).join('\n')}</div>
          </div>
        )}
        {Array.isArray(not.alarmBulgulari) && not.alarmBulgulari.length > 0 && (
          <div className="not-bolum"><div className="not-etiket">Alarm Bulguları</div><div className="not-metin">{not.alarmBulgulari.map((a) => `• ${a}`).join('\n')}</div></div>
        )}
        {Array.isArray(not.kritikBulgular) && not.kritikBulgular.length > 0 && (
          <div className="not-bolum"><div className="not-etiket">Kritik Bulgular</div><div className="not-metin">{not.kritikBulgular.map((a) => `• ${a}`).join('\n')}</div></div>
        )}
        {not.hastaOzeti && (
          <div className="not-bolum" style={{ background: '#F5F5F0', border: '1px solid #DDD', borderRadius: 6, padding: '10px 12px' }}>
            <div className="not-etiket">Hasta / Veli Özeti (sade dil)</div><div className="not-metin">{not.hastaOzeti}</div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #999', marginTop: 22, paddingTop: 10, font: '11px system-ui', color: '#555', lineHeight: 1.6 }}>
          Bu not, muayene kaydından yapay zekâ (Notya — Ayşe) desteğiyle oluşturulmuştur.
          {not.approvedAt
            ? ` Dr. ${doktor.ad} tarafından incelenmiş${duzenlemeSayisi > 0 ? `, ${duzenlemeSayisi} alanda düzenlenmiş` : ''} ve ${trTarih(not.approvedAt)} (TRT) tarihinde onaylanmıştır.`
            : ' Henüz doktor onayından geçmemiştir — TASLAK.'}
          {' '}Nihai klinik karar ve sorumluluk hekime aittir. Düzenleme geçmişi sistemde saklanır (KVKK).
          <div style={{ marginTop: 26, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #333', width: 220, paddingTop: 4 }}>Dr. {doktor.ad} — İmza / Kaşe</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
