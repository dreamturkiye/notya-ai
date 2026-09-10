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
import { anamnezParcala, fizikParcala } from '@/lib/doktor/anamnezBolumleri';
import { htmlBelgeYap, metinBelgeYap, type BelgeGirdisi } from '@/lib/entegrasyon/belgeHtml';
import { YASAMSAL_BULGULAR_BASLIK, yasamsalBulguSatirlari } from '@/lib/clinical/yasamsalBulgular';

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
  doktor: { ad: string; diplomaNo?: string };
  duzenlemeSayisi: number;
}

/** "Dr. Dr. Gökhan" tekrarını önler — ad zaten unvanla başlıyorsa dokunmaz (Gökhan, 2026-09-08). */
function doktorUnvanli(ad: string): string {
  const t = String(ad || '').trim()
  return /^(dr|doç|doc|prof|uzm|op)\.?\s/i.test(t) ? t : `Dr. ${t}`
}

function trTarih(iso?: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) } catch { return '' }
}

export default function NotYazdir() {
  const params = useParams<{ id: string }>();
  const [veri, setVeri] = useState<NotVeri | null>(null);
  const [hata, setHata] = useState('');
  const [kopyalandi, setKopyalandi] = useState(false);
  // NOTYA-MEDULA P1: Medula'ya hazır reçete — kopyala + Ayşe'nin SUT/güvenlik uyarıları
  const [medulaDurum, setMedulaDurum] = useState<'bos' | 'yukleniyor' | 'kopyalandi' | 'hata'>('bos');
  const [medulaUyarilar, setMedulaUyarilar] = useState<string[]>([]);
  const medulaKopyala = async () => {
    setMedulaDurum('yukleniyor');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/medula/recete?noteId=${params.id}`, { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (!r.ok || !j.metin) throw new Error(j.error || 'Reçete hazırlanamadı');
      await navigator.clipboard.writeText(j.metin);
      setMedulaUyarilar([...(j.uyarilar || []), ...(j.eksikler || [])]);
      setMedulaDurum('kopyalandi');
      setTimeout(() => setMedulaDurum('bos'), 4000);
    } catch { setMedulaDurum('hata'); setTimeout(() => setMedulaDurum('bos'), 3000); }
  };

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

  const { not, hasta, doktor } = veri;

  // NOTYA-KOPRU-01: manuel HBYS köprüsü — resmî entegrasyon öncesi başlangıç. Doktor hastane
  // sistemine girişliyken notu yapıştırır (kopyala) ya da HTML belgesini dosya olarak ekler (indir).
  const belgeGirdisi = (): BelgeGirdisi => ({
    kurumAd: 'Notya',
    hastaAd: hasta.ad,
    doktorAd: doktor.ad,
    tarih: not.createdAt || new Date().toISOString(),
    bolumler: [
      ['Başvuru Yakınması', not.basvuruYakinmasi || ''],
      ['Anamnez', not.subjektif || ''],
      ['Fizik Muayene', not.objektif || ''],
      ['Tanı', not.tani || not.degerlendirme || ''],
      ['Tedavi', not.plan || ''],
    ],
  });
  function hbysKopyala() {
    navigator.clipboard.writeText(metinBelgeYap(belgeGirdisi())).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2500);
    }).catch(() => { /* pano erişimi reddedildiyse sessiz */ });
  }
  function htmlIndir() {
    const blob = new Blob([htmlBelgeYap(belgeGirdisi())], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `muayene-notu-${(hasta.ad || 'hasta').replace(/\s+/g, '-').toLocaleLowerCase('tr')}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const v = not.vitaller;
  const vitalParcalar = yasamsalBulguSatirlari(v).map((l) => `${l.label}: ${l.value}`);

  return (
    <div style={{ background: 'white', color: '#111', minHeight: '100vh', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <style>{`
        @media print { .yazdirma-gizle { display: none !important; } body { -webkit-print-color-adjust: exact; } }
        /* NOTYA-PDF-01 (Gökhan): sayfalandırma — başlık sayfa sonunda yetim kalmasın,
           başlık+içerik blokları mümkünse bölünmeden birlikte taşınsın. */
        .not-bolum { margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid; }
        .not-etiket { font: 700 11px/1.4 system-ui; letter-spacing: 0.06em; color: #0B6B62; text-transform: uppercase; margin-bottom: 3px; break-after: avoid; page-break-after: avoid; }
        .not-metin { font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; }
      `}</style>

      <div className="yazdirma-gizle" style={{ background: '#0A1628', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontFamily: 'system-ui', fontSize: 14, fontWeight: 700 }}>Muayene Notu — Yazdır / PDF</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={hbysKopyala} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, padding: '8px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{kopyalandi ? '✓ Kopyalandı' : '📋 HBYS için kopyala'}</button>
          <button type="button" onClick={htmlIndir} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, padding: '8px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>⬇ HTML indir</button>
          <button type="button" onClick={medulaKopyala} disabled={medulaDurum === 'yukleniyor'} style={{ background: 'rgba(45,212,191,0.18)', border: '1px solid rgba(45,212,191,0.45)', color: 'white', borderRadius: 8, padding: '8px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{medulaDurum === 'kopyalandi' ? '✓ Medula için kopyalandı' : medulaDurum === 'yukleniyor' ? 'Hazırlanıyor…' : medulaDurum === 'hata' ? 'Reçete yok' : '📋 Medula için kopyala'}</button>
          <a href={`/dashboard/doktor/notlar/${params.id}/recete`} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, padding: '8px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>🧾 Reçete (kâğıt / MBYS)</a>
          <button type="button" onClick={() => window.print()} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 8, padding: '8px 18px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🖨️ Yazdır / PDF kaydet</button>
        </span>
      </div>
      {medulaUyarilar.length > 0 && (
        <div className="no-print" style={{ maxWidth: 760, margin: '12px auto 0', padding: '10px 14px', background: '#FFF7E6', border: '1px solid #F5C36A', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: '#5C3D00' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Ayşe — Medula'ya girmeden önce:</div>
          {medulaUyarilar.map((u, i) => <div key={i}>• {u}</div>)}
        </div>
      )}

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px 40px' }}>
        <div style={{ borderBottom: '2px solid #111', paddingBottom: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>MUAYENE NOTU</div>
            <div style={{ font: '12px system-ui', color: '#444', textTransform: 'capitalize' }}>{not.specialty} · {trTarih(not.createdAt)} (TRT)</div>
            {/* Akış: Anamnez → Fizik Muayene → Tanı → Tedavi (Dr. Gökhan referansları) */}
          </div>
          <div style={{ font: '12px system-ui', color: '#444' }}>{doktorUnvanli(doktor.ad)}</div>
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
              <tr><td colSpan={2} style={{ padding: '3px 0' }}><strong>{YASAMSAL_BULGULAR_BASLIK}:</strong> {vitalParcalar.join(' · ')}</td></tr>
            )}
          </tbody>
        </table>

        {not.basvuruYakinmasi && (
          <div className="not-bolum"><div className="not-etiket">Başvuru Yakınması</div><div className="not-metin" style={{ fontStyle: 'italic' }}>&ldquo;{not.basvuruYakinmasi}&rdquo;</div></div>
        )}
        {not.subjektif && anamnezParcala(not.subjektif).map((b, bi) => (
          <div key={'anm' + bi} className="not-bolum"><div className="not-etiket">{b.baslik}</div><div className="not-metin">{b.metin}</div></div>
        ))}
        {not.objektif && fizikParcala(not.objektif).map((b, bi) => (
          <div key={'fm' + bi} className="not-bolum"><div className="not-etiket">{b.baslik}</div><div className="not-metin">{b.metin}</div></div>
        ))}
        {not.degerlendirme && <div className="not-bolum"><div className="not-etiket">Tanı</div><div className="not-metin">{not.degerlendirme}</div></div>}
        {Array.isArray(not.icdKodlari) && not.icdKodlari.length > 0 && (
          <div className="not-bolum"><div className="not-etiket">Tanı / ICD-10</div>
            <div className="not-metin">{not.icdKodlari.map((k) => `${k.code} — ${k.description_tr || k.description || ''}${k.is_primary ? ' (birincil)' : ''}`).join('; ')}</div>
          </div>
        )}
        {not.plan && <div className="not-bolum"><div className="not-etiket">Tedavi</div><div className="not-metin">{not.plan}</div></div>}
        {Array.isArray(not.receteOnerisi) && not.receteOnerisi.length > 0 && (
          <div className="not-bolum"><div className="not-etiket">İlaç Önerileri (reçete doktor tarafından yazılır)</div>
            <div className="not-metin">{not.receteOnerisi.map((r, i) => `${i + 1}. ${[r.ticariOrnek, r.etkenMadde ? `(${r.etkenMadde})` : '', r.doz, r.kullanim, r.sure].filter(Boolean).join(' — ')}${r.sgkListesinde ? ' [SGK]' : ''}${r.not ? ` — Not: ${r.not}` : ''}`).join('\n')}</div>
          </div>
        )}
        {Array.isArray(not.alarmBulgulari) && not.alarmBulgulari.length > 0 && (
          <div className="not-bolum"><div className="not-etiket">Evde Dikkat Edilmesi Gerekenler</div><div className="not-metin">{not.alarmBulgulari.map((a) => `• ${a}`).join('\n')}</div></div>
        )}
        {/* NOTYA-AI-AYRIM-02 (Gokhan): kritik_bulgular AI'ın doktora özel önerisidir —
            resmî yazdır çıktısına / dosyaya GİRMEZ. Yalnız İnceleme ekranında doktora gösterilir. */}
        {not.hastaOzeti && (
          <div className="not-bolum" style={{ background: '#F5F5F0', border: '1px solid #DDD', borderRadius: 6, padding: '10px 12px' }}>
            <div className="not-etiket">Hasta / Veli Özeti</div><div className="not-metin">{not.hastaOzeti}</div>
            <div style={{ fontSize: 10.5, color: '#777', marginTop: 6, lineHeight: 1.45 }}>
              Bu özet, muayene sırasında yapılan sözlü bilgilendirmeyi hatırlatmak amacıyla hazırlanmış genel bir bilgilendirmedir; tıbbi rapor, reçete veya kesin tanı belgesi yerine geçmez. Tedavi kararı hekimin muayene bulgularına dayanır; belirtilerde değişiklik olursa hekiminize danışınız.
            </div>
          </div>
        )}

        {/* Kaan (2026-09-10): yapay zekâ/onay ibaresi çıktıdan kaldırıldı — rapor doktorun belgesidir */}
        <div style={{ borderTop: '1px solid #999', marginTop: 22, paddingTop: 10 }}>
          {!not.approvedAt && <div style={{ font: '11px system-ui', color: '#B45309' }}>TASLAK — henüz doktor onayından geçmemiştir.</div>}
          <div style={{ marginTop: 26, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #333', width: 220, paddingTop: 4 }}>{doktorUnvanli(doktor.ad)} — İmza / Kaşe</div>
              <div style={{ font: '11px system-ui', color: '#555', marginTop: 2 }}>Diploma No: {doktor.diplomaNo || '____________'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
