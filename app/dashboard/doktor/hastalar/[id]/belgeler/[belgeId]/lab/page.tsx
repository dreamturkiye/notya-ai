'use client';
/**
 * NOTYA-LAB-01 — /dashboard/doktor/hastalar/[id]/belgeler/[belgeId]/lab
 * Split view: original file (left) · editable extracted table + report (right).
 * Stages: Lab yükle → EXTRACT (tablo, düzenlenebilir, doğrulanacak hücreler işaretli) → Tabloyu onayla → Asistana raporla
 * → özet / yeni bozulanlar / düzelenler / kronik / olası tanılar → resmi tanı (hekim) → Onayla ve son muayeneye ekle
 * → Plan → Muayeneyi onayla. Strip always. Critical banner "Hekim şimdi baksın" (no auto-112).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { hastaBelgelerHref, hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import type { HastaDosyaSekmeId } from '@/lib/doktor/hastaDosyaSekmeleri';
import { useParams, useSearchParams } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import DoktorGeriLink from '@/components/doktor/DoktorGeriLink';
import DocumentViewer from '@/components/doktor/DocumentViewer';
import { getAccessTokenAsync, toolsShell, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { UYARI_SERIDI } from '@/core/belgeler/yazar';
import { REF_ACIKLAMA } from '@/specialties/dahiliye/engines/dahiliye';

type Doc = { id: string; fileName: string; fileType: string };
type Satir = { id: string; numune_tarihi?: string | null; raw_name: string; canonical_key: string | null; value_num: number | null; value_text: string | null; unit: string | null; ref_low: number | null; ref_high: number | null; flag: string; kritik: boolean; kritik_neden: string | null; prior_value: number | null; prior_date: string | null; delta_pct: number | null; trend: string; dogrulanacak: boolean; dogrulama_notu: string | null; doctor_corrected: boolean; page: number | null };
type Panel = { id: string; lab_adi: string | null; numune_tarihi: string | null; kaynaklar: string[]; kalite: string; kimlik_uyari: { eslesme: boolean | null; ipucu: string | null } | null; tablo_onayli: boolean; durum: string; panel_type?: string | null; sample_no?: string | null };
type LabR = { ozet: string; kritik: string[]; yeni_bozulanlar: string[]; duzelenler: string[]; kronik: string[]; tanilar: { ad: string; icd10: string | null; guven_pct: number; guven_bant: string; destek: string[] }[]; klinik_iliski: string; oneri: string; recete_ipucu: string | null; sinirlar: string[]; acil_bayrak: boolean; kaynak?: { tanilar: Dip[]; oneri: Dip[] } };
type Dip = { ref: string; not: string };
type Analiz = { id: string; durum: string; sonuc: { lab?: LabR; ozet: string; acil_bayrak: boolean; sinirlar: string[] } | null; fusion: { capPct?: number; duzeltmeler?: string[] } | null; hekim_tanisi: { ad: string; icd10?: string | null }[]; hekim_ozet: string | null; note_id: string | null };

const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 4 };
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' };
const flagRenk: Record<string, string> = { H: '#F87171', L: '#60A5FA', critical: '#EF4444', normal: '#2DD4BF', unknown: '#64748B', sinir: '#FBBF24', pozitif_suphe: '#F87171', yetersiz_ornek: '#FB923C', tekrar: '#FB923C' };
const trendTr: Record<string, string> = { rising: '↗ yükseliyor', falling: '↘ düşüyor', stable: '→ stabil', new_abn: '● yeni bozulan', new_normal: '○ normale döndü', unit_mismatch: '⚠ birim uyuşmuyor', no_prior: '— ilk' };
const KaynakDip = ({ d, acik }: { d?: Dip[] | null; acik: boolean }) => (!acik || !d?.length ? null : <div style={{ fontSize: 11, color: '#8FA0B5', marginTop: 4, borderLeft: '2px solid rgba(45,212,191,0.4)', paddingLeft: 6 }}>{d.map((x, i) => <div key={i}><b>{x.ref}</b> — {x.not} <span style={{ opacity: 0.7 }}>({(REF_ACIKLAMA as Record<string, string>)[x.ref] || x.ref})</span></div>)}</div>);
const hücre: React.CSSProperties = { padding: '4px 6px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'top' };
const girdi: React.CSSProperties = { width: '100%', background: 'transparent', border: '1px solid transparent', color: '#EDF1F7', fontSize: 12, padding: '2px 4px', borderRadius: 4 };

export default function LabPage() {
  const { id: patientId, belgeId } = useParams<{ id: string; belgeId: string }>();
  const searchParams = useSearchParams();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [satirlar, setSatirlar] = useState<Satir[]>([]);
  const [analiz, setAnaliz] = useState<Analiz | null>(null);
  const [kanonik, setKanonik] = useState<Record<string, string>>({});
  const [durum, setDurum] = useState<'hazir' | 'cikariyor' | 'raporluyor' | 'kaydediyor'>('hazir');
  const [mesaj, setMesaj] = useState('');
  const [taniTaslak, setTaniTaslak] = useState('');
  const [ozetTaslak, setOzetTaslak] = useState('');
  const [plan, setPlan] = useState('');
  const [planAcik, setPlanAcik] = useState(false);
  const [persona, setPersona] = useState('Asistan');
  const [kaynakAcik, setKaynakAcik] = useState(false);
  const autoCikarRef = useRef(false);

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/belgeler/lab', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Hata');
    return j;
  }, []);

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync();
    const [dr, lr, ar] = await Promise.all([
      fetch(`/api/doktor/documents?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      fetch(`/api/doktor/belgeler/lab?documentId=${encodeURIComponent(belgeId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      fetch(`/api/doktor/belgeler/analiz?documentId=${encodeURIComponent(belgeId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
    ]);
    if (dr.ok) { const j = await dr.json(); const list: Doc[] = j.documents || []; setDoc(list.find((d) => d.id === belgeId) || null); }
    if (lr.ok) { const j = await lr.json(); setPanel(j.panel); setSatirlar(j.satirlar || []); setAnaliz(j.analiz || null); setKanonik(j.kanonik || {}); if (j.analiz?.hekim_tanisi?.length) setTaniTaslak(j.analiz.hekim_tanisi.map((t: { ad: string; icd10?: string | null }) => t.icd10 ? `${t.ad} (${t.icd10})` : t.ad).join('\n')); setOzetTaslak(j.analiz?.hekim_ozet || j.analiz?.sonuc?.ozet || ''); }
    if (ar.ok) { const j = await ar.json(); const b = j.bransKey; setPersona(b === 'pediatri' || b === 'cocuk_cerrahisi' ? 'Ayşe' : b === 'kardiyoloji' ? 'Mehmet' : ['noroloji', 'dahiliye', 'enfeksiyon', 'gogus', 'nefroloji', 'gastroenteroloji', 'endokrinoloji', 'hematoloji', 'onkoloji', 'romatoloji'].includes(b) ? 'Elif' : 'Asistan'); }
  }, [patientId, belgeId]);
  useEffect(() => { yukle(); }, [yukle]);

  const cikar = async () => { setDurum('cikariyor'); setMesaj(''); try { const j = await api({ adim: 'cikar', documentId: belgeId }); setMesaj(`Belge eklendi. Tablo henüz onaylanmadı. ${j.ozet.toplam} satır · ${j.kaynaklar.length === 2 ? 'iki kaynak uzlaştırıldı' : 'tek kaynak'}${j.uyusmazlik ? ` · ${j.uyusmazlik} hücre doğrulanacak` : ''}`); await yukle(); } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); } setDurum('hazir'); };

  // Opening "Laboratuvarı değerlendir" should start extraction — not leave an empty right panel.
  useEffect(() => {
    if (!doc || panel || autoCikarRef.current || durum !== 'hazir') return;
    autoCikarRef.current = true;
    void cikar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on first document load without panel
  }, [doc, panel, durum]);
  const hücreKaydet = async (s: Satir, alan: string, deger: string) => { if (!panel) return; try { await api({ adim: 'satir', panelId: panel.id, satirId: s.id, alan, deger }); await yukle(); } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); } };
  const takmaAd = async (s: Satir, key: string) => { if (!panel || !key) return; try { await api({ adim: 'takma_ad', panelId: panel.id, satirId: s.id, canonical_key: key }); await yukle(); } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); } };
  const tabloOnayla = async () => { if (!panel) return; try { await api({ adim: 'tablo_onayla', panelId: panel.id }); setMesaj('Tablo onaylandı.'); await yukle(); } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); } };
  const kimlikOnayla = async () => { if (!panel) return; try { await api({ adim: 'kimlik_onayla', panelId: panel.id }); await yukle(); } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); } };
  const raporla = async () => { if (!panel) return; setDurum('raporluyor'); setMesaj(`${persona} raporluyor…`); try { await api({ adim: 'raporla', panelId: panel.id }); setMesaj('Taslak rapor hazır. Resmi tanıyı siz kilitlersiniz.'); await yukle(); } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); } setDurum('hazir'); };

  /** One click: approve table + generate Ayşe/Elif draft — was stuck after extract with no report. */
  const onaylaVeDegerlendir = async () => {
    if (!panel || kilitli) return;
    setDurum('raporluyor');
    setMesaj('Tablo onaylanıyor…');
    try {
      if (!panel.tablo_onayli) await api({ adim: 'tablo_onayla', panelId: panel.id });
      setMesaj(`${persona} değerlendiriyor…`);
      await api({ adim: 'raporla', panelId: panel.id });
      setMesaj('Taslak rapor hazır — aşağıda özet ve olası tanılar.');
      await yukle();
    } catch (e) {
      setMesaj(e instanceof Error ? e.message : 'Hata');
    }
    setDurum('hazir');
  };

  const kaydet = async (alan: 'ozet' | 'hekim_tanisi') => {
    if (!analiz) return false;
    const token = await getAccessTokenAsync();
    const sonraki = alan === 'ozet' ? ozetTaslak : taniTaslak.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => { const m = s.match(/^(.*?)\s*\(([A-Z]\d{2}(?:\.\d{1,2})?)\)\s*$/); return m ? { ad: m[1].trim(), icd10: m[2] } : { ad: s, icd10: null }; });
    if (alan === 'hekim_tanisi' && !(sonraki as { ad: string }[]).length) { setMesaj('Resmi tanı boş.'); return false; }
    const r = await fetch('/api/doktor/belgeler/analiz', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId: analiz.id, alan, sonraki }) });
    const j = await r.json().catch(() => ({})); setMesaj(r.ok ? (alan === 'ozet' ? 'Özet kaydedildi.' : 'Resmi tanı kilitlendi.') : j.error || 'Kaydedilemedi'); await yukle();
    return r.ok;
  };
  const onayla = async (adim: 'onayla' | 'muayene_onayla') => {
    if (!analiz) return; setDurum('kaydediyor');
    try {
      if (adim === 'onayla') {
        const yerel = taniTaslak.split('\n').map((s) => s.trim()).filter(Boolean);
        if (!yerel.length && !analiz.hekim_tanisi?.length) { setMesaj('Önce resmi tanı yazın veya öneriden seçin.'); setDurum('hazir'); return; }
        if (yerel.length) { const ok = await kaydet('hekim_tanisi'); if (!ok) { setDurum('hazir'); return; } }
      }
      const token = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/belgeler/analiz/onayla', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId: analiz.id, adim, plan: adim === 'muayene_onayla' ? plan : undefined }) });
      const j = await r.json().catch(() => ({})); setDurum('hazir');
      if (!r.ok) { setMesaj(j.error || 'Onaylanamadı'); return; }
      setMesaj(adim === 'onayla' ? 'Son muayenenin Objektif bölümüne eklendi; bu panel artık hastanın onaylı geçmişinde.' : 'Muayene onaylandı; plan revizyonu kaydedildi.'); setPlanAcik(false); await yukle();
      if (j.noteId && typeof window !== 'undefined') window.location.href = `/dashboard/doktor/notlar/${j.noteId}`;
    } catch (e) { setDurum('hazir'); setMesaj(e instanceof Error ? e.message : 'Onaylanamadı'); }
  };

  const lab = analiz?.sonuc?.lab || null;
  const kilitli = analiz?.durum === 'muayene_onaylandi';
  const kritikSatirlar = satirlar.filter((s) => s.kritik);
  const yuksek = satirlar.filter((s) => s.flag === 'H').length, dusuk = satirlar.filter((s) => s.flag === 'L').length;
  const eslesmeyen = satirlar.filter((s) => !s.canonical_key).length;
  const geriTab = (searchParams?.get('geriTab') || null) as HastaDosyaSekmeId | null;
  const geriHref = geriTab ? hastaDosyaHref(patientId, geriTab) : hastaBelgelerHref(patientId);
  const geriLabel = geriTab === 'deri' ? '← Deri' : geriTab === 'goz' ? '← Göz' : geriTab === 'gebelik' ? '← Gebelik' : geriTab === 'dahiliye' ? '← Dahiliye' : '← Belgeler';

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 12px' }}>
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.35)', color: '#FBBF24', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{UYARI_SERIDI}</div>
        {panel?.panel_type === 'enabiz_gecmis' && <div style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.4)', color: '#99F6E4', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 10 }}>e-Nabız geçmiş içe aktarma (yalnız yüklenen PDF — canlı e-Nabız çekimi yok). Her satır kendi basılı tarihini taşır; tarihsiz satır onaylı seriye girmez. Kimlik kontrolü ve Onayla kapısı her lab belgesiyle aynıdır.</div>}
        {panel?.panel_type === 'yenidogan_tarama' && <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.45)', color: '#FDE68A', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Yenidoğan tarama (NTP-{panel.sample_no || '?'}). Tarama pozitif tanı değildir. Konfirmasyon ve klinik değerlendirme gerekir. Notya e-Nabız yerine geçmez.</div>}
        {kritikSatirlar.length > 0 && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.55)', color: '#FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 800, marginBottom: 12 }}>⚠ Hekim şimdi baksın — {kritikSatirlar.map((s) => s.kritik_neden || s.raw_name).join(' · ')}</div>}
        {panel?.kimlik_uyari?.eslesme === false && <div style={{ ...toolsCard, borderColor: 'rgba(239,68,68,0.55)', color: '#FCA5A5', fontSize: 13, marginBottom: 12 }}>{panel.kimlik_uyari.ipucu} Doğru hastada olduğunuzdan eminseniz onaylayın; aksi halde bu belgeyi bu hastaya eklemeyin. <button type="button" onClick={kimlikOnayla} style={{ ...btnGhost, marginLeft: 8, padding: '4px 10px', fontSize: 12 }}>Bu hasta — devam et</button></div>}

        <div className="notya-grid-yigin" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)', gap: 14 }}>
          <div>
            <div style={toolsCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#EDF1F7' }}>{doc?.fileName || 'Laboratuvar belgesi'}</div>
                <DoktorGeriLink href={geriHref}>{geriLabel}</DoktorGeriLink>
              </div>
              {doc && !/csv|excel|spreadsheet/.test(doc.fileType) && <div style={{ marginTop: 8 }}><DocumentViewer documentId={doc.id} fileName={doc.fileName} fileType={doc.fileType} /></div>}
              {doc && /csv|excel|spreadsheet/.test(doc.fileType) && <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 8 }}>Tablo dosyası — satırlar sağda.</div>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={cikar} disabled={durum !== 'hazir' || kilitli} style={{ ...btn, opacity: durum !== 'hazir' ? 0.6 : 1 }}>{durum === 'cikariyor' ? 'Tablo çıkarılıyor…' : panel ? 'Tabloyu yeniden çıkar' : 'Tabloyu çıkar'}</button>
                {panel && <span style={{ fontSize: 11, color: '#64748B' }}>{panel.lab_adi || ''}{panel.numune_tarihi ? ` · numune ${new Date(panel.numune_tarihi).toLocaleDateString('tr-TR')}` : ''} · kaynak: {panel.kaynaklar?.join(' + ') || '—'} · kalite {panel.kalite}</span>}
              </div>
              {mesaj && <div style={{ marginTop: 8, fontSize: 12, color: /Hata|amadı|eşleşmiyor/.test(mesaj) ? '#F87171' : '#2DD4BF' }}>{mesaj}</div>}
            </div>
          </div>

          <div>
            {!panel && <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 13 }}>{durum === 'cikariyor' ? 'Tablo çıkarılıyor…' : 'Laboratuvar tablosu hazırlanıyor. Birkaç saniye içinde burada görünür; gerekirse soldan "Tabloyu çıkar"a basın.'}</div>}
            {panel && (
              <div style={{ ...toolsCard, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                  <div style={etiket}>Tablo <span style={{ fontWeight: 400, color: '#64748B' }}>· {satirlar.length} parametre · {yuksek} yüksek · {dusuk} düşük{kritikSatirlar.length ? ` · ${kritikSatirlar.length} kritik` : ''}{eslesmeyen ? ` · ${eslesmeyen} eşleşmedi` : ''} · hücreye tıklayıp düzeltin</span></div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!analiz && !kilitli && (
                      <button type="button" onClick={() => void onaylaVeDegerlendir()} disabled={durum !== 'hazir'} style={{ ...btn, opacity: durum !== 'hazir' ? 0.6 : 1 }}>
                        {durum === 'raporluyor' ? `${persona} değerlendiriyor…` : panel.tablo_onayli ? `${persona} ile değerlendir` : 'Tabloyu onayla ve değerlendir'}
                      </button>
                    )}
                    {!panel.tablo_onayli && !kilitli && <button type="button" onClick={() => void tabloOnayla()} style={btnGhost}>Yalnız tabloyu onayla</button>}
                    {panel.tablo_onayli && analiz && !kilitli && <button type="button" onClick={() => void raporla()} disabled={durum !== 'hazir'} style={btnGhost}>Yeniden raporla</button>}
                  </div>
                </div>
                {!analiz && (
                  <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.35)', fontSize: 12, color: '#99F6E4', lineHeight: 1.45 }}>
                    Bu adım yalnızca tabloyu çıkarır. Klinik özet için <b>Tabloyu onayla ve değerlendir</b>e basın
                    {eslesmeyen > 0 ? ` · ${eslesmeyen} satır sarı “eşleşmedi” — gerekirse soldan “Tabloyu yeniden çıkar” (İngilizce mock lab eşlemesi güncellendi)` : ''}.
                  </div>
                )}
                <div style={{ overflowX: 'auto', marginTop: 6 }}>
                  <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
                    <thead><tr style={{ color: '#8FA0B5', fontSize: 11 }}>{['Test', 'Sonuç', 'Birim', 'Ref', 'Flag', 'Önceki', 'Δ', 'Trend'].map((h) => <th key={h} style={{ ...hücre, textAlign: 'left', fontWeight: 600 }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {satirlar.map((s) => (
                        <tr key={s.id} style={{ background: s.dogrulanacak ? 'rgba(251,191,36,0.08)' : s.kritik ? 'rgba(239,68,68,0.08)' : 'transparent' }} title={s.dogrulama_notu || undefined}>
                          <td style={hücre}>
                            <input defaultValue={s.raw_name} disabled={kilitli} onBlur={(e) => e.target.value !== s.raw_name && hücreKaydet(s, 'raw_name', e.target.value)} style={{ ...girdi, fontWeight: 600 }} />
                            <div style={{ fontSize: 10, color: s.canonical_key ? '#64748B' : '#FBBF24' }}>
                              {s.canonical_key ? kanonik[s.canonical_key] || s.canonical_key : <span>eşleşmedi · <select defaultValue="" disabled={kilitli} onChange={(e) => takmaAd(s, e.target.value)} style={{ background: 'transparent', color: '#FBBF24', border: 'none', fontSize: 10 }}><option value="">bunu … say</option>{Object.entries(kanonik).map(([k, v]) => <option key={k} value={k} style={{ color: '#000' }}>{v}</option>)}</select></span>}
                              {s.doctor_corrected && ' · hekim düzeltti'}{s.page ? ` · s.${s.page}` : ''}
                            </div>
                            {panel?.panel_type === 'enabiz_gecmis' && <input type="date" title="e-Nabız satır tarihi (basılı) — tarihsiz satır onaylı seriye girmez" defaultValue={s.numune_tarihi || ''} disabled={kilitli} onBlur={(e) => e.target.value && e.target.value !== (s.numune_tarihi || '') && hücreKaydet(s, 'numune_tarihi', e.target.value)} style={{ ...girdi, fontSize: 10, width: 120, color: s.numune_tarihi ? '#8FA0B5' : '#FBBF24' }} />}
                          </td>
                          <td style={hücre}><input defaultValue={s.value_num ?? s.value_text ?? ''} disabled={kilitli} onBlur={(e) => e.target.value !== String(s.value_num ?? s.value_text ?? '') && hücreKaydet(s, 'value', e.target.value)} style={{ ...girdi, fontWeight: 700, color: flagRenk[s.flag] }} /></td>
                          <td style={hücre}><input defaultValue={s.unit || ''} disabled={kilitli} onBlur={(e) => e.target.value !== (s.unit || '') && hücreKaydet(s, 'unit', e.target.value)} style={girdi} /></td>
                          <td style={hücre}><span style={{ display: 'flex', gap: 2 }}><input defaultValue={s.ref_low ?? ''} disabled={kilitli} onBlur={(e) => e.target.value !== String(s.ref_low ?? '') && hücreKaydet(s, 'ref_low', e.target.value)} style={{ ...girdi, width: 44 }} />–<input defaultValue={s.ref_high ?? ''} disabled={kilitli} onBlur={(e) => e.target.value !== String(s.ref_high ?? '') && hücreKaydet(s, 'ref_high', e.target.value)} style={{ ...girdi, width: 44 }} /></span></td>
                          <td style={{ ...hücre, color: flagRenk[s.flag], fontWeight: 800 }}>{s.flag === 'critical' ? 'KRİTİK' : s.flag === 'H' ? '↑ H' : s.flag === 'L' ? '↓ L' : s.flag === 'pozitif_suphe' ? 'şüphe' : s.flag === 'sinir' ? 'sınır' : s.flag === 'yetersiz_ornek' ? 'yetersiz' : s.flag === 'normal' ? 'N' : s.flag === 'tekrar' ? 'tekrar' : '?'}</td>
                          <td style={{ ...hücre, color: '#8FA0B5' }}>{s.prior_value != null ? `${s.prior_value}${s.prior_date ? ` (${new Date(s.prior_date).toLocaleDateString('tr-TR')})` : ''}` : '—'}</td>
                          <td style={{ ...hücre, color: '#EDF1F7' }}>{s.delta_pct != null ? `${s.delta_pct > 0 ? '+' : ''}${s.delta_pct}%` : '—'}</td>
                          <td style={{ ...hücre, color: s.trend === 'new_abn' ? '#F87171' : s.trend === 'new_normal' ? '#2DD4BF' : '#8FA0B5' }}>{trendTr[s.trend] || s.trend}{s.dogrulanacak ? ' · doğrulanacak' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {lab && analiz && (
              <>
                {lab.acil_bayrak && <div style={{ ...toolsCard, background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.5)', color: '#F87171', fontSize: 13, fontWeight: 800, marginBottom: 10 }}>⚠ ACİL BAYRAK — {lab.kritik.join(' · ')}</div>}
                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Özet ({persona}) <span style={{ fontWeight: 400, color: '#64748B' }}>· düzenlenebilir</span></div>
                  <textarea value={ozetTaslak} onChange={(e) => setOzetTaslak(e.target.value)} rows={5} disabled={kilitli} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
                  <div style={{ marginTop: 6 }}><button type="button" onClick={() => kaydet('ozet')} disabled={kilitli} style={btnGhost}>Özeti kaydet</button></div>
                </div>
                {[['Yeni bozulanlar', lab.yeni_bozulanlar, '#F87171'], ['Düzelenler', lab.duzelenler, '#2DD4BF'], ['Kronik sapma', lab.kronik, '#FBBF24']].map(([baslik, liste, renk]) => (liste as string[]).length ? (
                  <div key={String(baslik)} style={{ ...toolsCard, marginBottom: 10 }}><div style={{ ...etiket, color: String(renk) }}>{String(baslik)}</div><ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#EDF1F7' }}>{(liste as string[]).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                ) : null)}
                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}><div style={etiket}>Olası tanılar <span style={{ fontWeight: 400, color: '#64748B' }}>· güven üst sınırı %{analiz.fusion?.capPct ?? 70}</span></div>{lab.kaynak && <button type="button" onClick={() => setKaynakAcik((x) => !x)} style={{ ...btnGhost, padding: '3px 9px', fontSize: 11, color: kaynakAcik ? '#2DD4BF' : '#8FA0B5' }}>Kaynak</button>}</div>
                  {lab.tanilar.length === 0 && <div style={{ fontSize: 12, color: '#64748B' }}>Tanı önerisi yok.</div>}
                  {lab.tanilar.map((t, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div style={{ minWidth: 60, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: t.guven_bant === 'yüksek' ? '#2DD4BF' : t.guven_bant === 'orta' ? '#FBBF24' : '#94A3B8' }}>%{t.guven_pct}</div><div style={{ fontSize: 10, color: '#8FA0B5' }}>{t.guven_bant}</div></div>
                      <div style={{ flex: '1 1 180px', minWidth: 0, fontSize: 13, color: '#EDF1F7' }}><div style={{ fontWeight: 700 }}>{t.ad} {t.icd10 && <span style={{ color: '#8FA0B5', fontWeight: 400 }}>({t.icd10})</span>}</div>{t.destek.length > 0 && <div style={{ fontSize: 11, color: '#2DD4BF' }}>destek: {t.destek.join(', ')}</div>}<KaynakDip d={lab.kaynak?.tanilar[i] ? [lab.kaynak.tanilar[i]] : null} acik={kaynakAcik} /></div>
                      <button type="button" onClick={() => setTaniTaslak((x) => (x ? x + '\n' : '') + (t.icd10 ? `${t.ad} (${t.icd10})` : t.ad))} disabled={kilitli} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }}>Resmi tanıya al</button>
                    </div>
                  ))}
                </div>
                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Resmi tanı (hekim) · klinik ilişki</div>
                  <textarea value={taniTaslak} onChange={(e) => setTaniTaslak(e.target.value)} rows={3} placeholder="Her satır bir tanı; ICD-10 parantez içinde" disabled={kilitli} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
                  {lab.klinik_iliski && <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 6 }}>Asistan: {lab.klinik_iliski}</div>}
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => void kaydet('hekim_tanisi')} disabled={kilitli} style={btnGhost}>Resmi tanıyı kilitle</button>
                    <button type="button" onClick={() => void onayla('onayla')} disabled={(!taniTaslak.trim() && !analiz.hekim_tanisi?.length) || analiz.durum === 'onaylandi' || kilitli || durum !== 'hazir'} style={{ ...btn, opacity: (!taniTaslak.trim() && !analiz.hekim_tanisi?.length) || analiz.durum === 'onaylandi' || kilitli || durum !== 'hazir' ? 0.45 : 1, cursor: (!taniTaslak.trim() && !analiz.hekim_tanisi?.length) ? 'not-allowed' : 'pointer' }} title={taniTaslak.trim() || analiz.hekim_tanisi?.length ? 'Tanıyı kaydeder ve Objektif’e yazar' : 'Önce resmi tanı yazın veya öneriden seçin'}>Onayla ve son muayeneye ekle</button>
                    {analiz.durum === 'onaylandi' && <button type="button" onClick={() => setPlanAcik(!planAcik)} style={btnGhost}>Plan düzenle</button>}
                  </div>
                  {planAcik && analiz.durum === 'onaylandi' && (
                    <div style={{ marginTop: 8 }}>
                      <div style={etiket}>Plan (ilaç / doz / konsült / tekrar tetkik)</div>
                      <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={4} placeholder="Mevcut planı korumak için boş bırakın; değişiklik için tam planı yazın." style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
                      <div style={{ marginTop: 6 }}><button type="button" onClick={() => onayla('muayene_onayla')} style={btn}>Muayeneyi onayla</button></div>
                    </div>
                  )}
                  {analiz.note_id && <div style={{ marginTop: 6, fontSize: 12, color: '#2DD4BF' }}>{kilitli ? 'Muayene onaylandı — kilitli.' : "Objektif'e eklendi."} <a href={`/dashboard/doktor/notlar/${analiz.note_id}`} style={{ color: '#2DD4BF' }}>Notu aç →</a></div>}
                </div>
                {(lab.oneri || lab.recete_ipucu) && <div style={{ ...toolsCard, marginBottom: 10, fontSize: 13, color: '#EDF1F7', whiteSpace: 'pre-wrap' }}><div style={etiket}>Öneri</div>{lab.oneri}{lab.recete_ipucu ? `\nReçete ipucu (yalnız öneri): ${lab.recete_ipucu}` : ''}<KaynakDip d={lab.kaynak?.oneri} acik={kaynakAcik} /></div>}
                {lab.sinirlar.length > 0 && <div style={{ ...toolsCard, fontSize: 12, color: '#8FA0B5' }}><div style={etiket}>Sınırlar</div><ul style={{ margin: 0, paddingLeft: 18 }}>{lab.sinirlar.map((s, i) => <li key={i}>{s}</li>)}</ul>{analiz.fusion?.duzeltmeler?.length ? <div style={{ marginTop: 6, color: '#64748B' }}>Sistem düzeltmeleri: {analiz.fusion.duzeltmeler.join('; ')}</div> : null}</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
