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
import DoktorGeriLink from '@/components/doktor/DoktorGeriLink';
import DocumentViewer from '@/components/doktor/DocumentViewer';
import { getAccessTokenAsync, toolsShell, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { UYARI_SERIDI } from '@/core/belgeler/yazar';
import { REF_ACIKLAMA } from '@/specialties/dahiliye/engines/dahiliye';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

type Doc = { id: string; fileName: string; fileType: string };
type Satir = { id: string; numune_tarihi?: string | null; raw_name: string; canonical_key: string | null; value_num: number | null; value_text: string | null; unit: string | null; ref_low: number | null; ref_high: number | null; flag: string; kritik: boolean; kritik_neden: string | null; prior_value: number | null; prior_date: string | null; delta_pct: number | null; trend: string; dogrulanacak: boolean; dogrulama_notu: string | null; doctor_corrected: boolean; page: number | null };
type Panel = { id: string; lab_adi: string | null; numune_tarihi: string | null; kaynaklar: string[]; kalite: string; kimlik_uyari: { eslesme: boolean | null; ipucu: string | null } | null; tablo_onayli: boolean; durum: string; panel_type?: string | null; sample_no?: string | null };
type LabR = { ozet: string; kritik: string[]; yeni_bozulanlar: string[]; duzelenler: string[]; kronik: string[]; tanilar: { ad: string; icd10: string | null; guven_pct: number; guven_bant: string; destek: string[] }[]; klinik_iliski: string; oneri: string; recete_ipucu: string | null; sinirlar: string[]; acil_bayrak: boolean; kaynak?: { tanilar: Dip[]; oneri: Dip[] } };
type Dip = { ref: string; not: string };
type Analiz = { id: string; durum: string; sonuc: { lab?: LabR; ozet: string; acil_bayrak: boolean; sinirlar: string[] } | null; fusion: { capPct?: number; duzeltmeler?: string[] } | null; hekim_tanisi: { ad: string; icd10?: string | null }[]; hekim_ozet: string | null; note_id: string | null };

const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 4 };
const btn: React.CSSProperties = { background: CHROME_RENK.pine, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(58,44,34,0.16)' };
const flagRenk: Record<string, string> = { H: '#a45b3e', L: '#4A5C8A', critical: '#a45b3e', normal: CHROME_RENK.pine, unknown: CHROME_RENK.muted, sinir: '#B4832F', pozitif_suphe: '#a45b3e', yetersiz_ornek: '#B4832F', tekrar: '#B4832F' };
const trendTr: Record<string, string> = { rising: '↗ yükseliyor', falling: '↘ düşüyor', stable: '→ stabil', new_abn: '● yeni bozulan', new_normal: '○ normale döndü', unit_mismatch: '⚠ birim uyuşmuyor', no_prior: '— ilk' };
const KaynakDip = ({ d, acik }: { d?: Dip[] | null; acik: boolean }) => (!acik || !d?.length ? null : <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 4, borderLeft: '2px solid rgba(47,67,52,0.4)', paddingLeft: 6 }}>{d.map((x, i) => <div key={i}><b>{x.ref}</b> — {x.not} <span style={{ opacity: 0.7 }}>({(REF_ACIKLAMA as Record<string, string>)[x.ref] || x.ref})</span></div>)}</div>);
const hücre: React.CSSProperties = { padding: '4px 6px', fontSize: 12, borderBottom: '1px solid #F6F0E4', verticalAlign: 'top' };
const girdi: React.CSSProperties = { width: '100%', background: 'transparent', border: '1px solid transparent', color: CHROME_RENK.ink, fontSize: 12, padding: '2px 4px', borderRadius: 4 };

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
  const [kayitMesaj, setKayitMesaj] = useState('');
  const [kayitDurum, setKayitDurum] = useState<'hazir' | 'kaydediyor'>('hazir');
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
  const kimlikOnayla = async () => { if (!panel) return; try { await api({ adim: 'kimlik_onayla', panelId: panel.id }); setMesaj('Hasta eşleşmesi onaylandı — şimdi tekrar değerlendirebilirsiniz.'); await yukle(); } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); } };
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
    if (!analiz?.id) {
      const yok = 'Taslak rapor henüz yok — önce Tabloyu onayla ve değerlendir.';
      setKayitMesaj(yok); setMesaj(yok); return false;
    }
    const sonraki = alan === 'ozet' ? ozetTaslak : taniTaslak.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => { const m = s.match(/^(.*?)\s*\(([A-Z]\d{2}(?:\.\d{1,2})?)\)\s*$/); return m ? { ad: m[1].trim(), icd10: m[2] } : { ad: s, icd10: null }; });
    if (alan === 'hekim_tanisi' && !(sonraki as { ad: string }[]).length) {
      const bos = 'Resmi tanı boş — öneriden “Resmi tanıya al” veya bir satır yazın (ICD şart değil).';
      setKayitMesaj(bos); setMesaj(bos); return false;
    }
    setKayitDurum('kaydediyor');
    setKayitMesaj(alan === 'ozet' ? 'Özet kaydediliyor…' : 'Tanı kilitleniyor…');
    try {
      const token = await getAccessTokenAsync();
      if (!token) throw new Error('Oturum bulunamadı — yeniden giriş yapın.');
      const r = await fetch('/api/doktor/belgeler/analiz', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId: analiz.id, alan, sonraki }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Kaydedilemedi');
      const okMsg = alan === 'ozet' ? 'Özet kaydedildi.' : 'Resmi tanı kilitlendi.';
      setKayitMesaj(okMsg); setMesaj(okMsg);
      await yukle();
      return true;
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Kaydedilemedi';
      setKayitMesaj(err); setMesaj(err);
      return false;
    } finally {
      setKayitDurum('hazir');
    }
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
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 12px' }}>
        <div style={{ background: '#FBF3DE', border: '1px solid rgba(180,131,47,0.35)', color: '#B4832F', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{UYARI_SERIDI}</div>
        {panel?.panel_type === 'enabiz_gecmis' && <div style={{ background: '#E4F3F1', border: '1px solid rgba(47,67,52,0.4)', color: CHROME_RENK.pine, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 10 }}>e-Nabız geçmiş içe aktarma (yalnız yüklenen PDF — canlı e-Nabız çekimi yok). Her satır kendi basılı tarihini taşır; tarihsiz satır onaylı seriye girmez. Kimlik kontrolü ve Onayla kapısı her lab belgesiyle aynıdır.</div>}
        {panel?.panel_type === 'yenidogan_tarama' && <div style={{ background: '#FBF3DE', border: '1px solid rgba(180,131,47,0.4)', color: '#7A5B1E', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Yenidoğan tarama (NTP-{panel.sample_no || '?'}). Tarama pozitif tanı değildir. Konfirmasyon ve klinik değerlendirme gerekir. Notya e-Nabız yerine geçmez.</div>}
        {kritikSatirlar.length > 0 && <div style={{ background: '#FBEAE3', border: '1px solid rgba(164,91,62,0.5)', color: '#7A3D28', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 800, marginBottom: 12 }}>⚠ Hekim şimdi baksın — {kritikSatirlar.map((s) => s.kritik_neden || s.raw_name).join(' · ')}</div>}
        {panel?.kimlik_uyari?.eslesme === false && <div style={{ ...toolsCard, borderColor: 'rgba(164,91,62,0.5)', color: '#7A3D28', fontSize: 13, marginBottom: 12 }}>{panel.kimlik_uyari.ipucu} Doğru hastada olduğunuzdan eminseniz onaylayın; aksi halde bu belgeyi bu hastaya eklemeyin. <button type="button" onClick={kimlikOnayla} style={{ ...btnGhost, marginLeft: 8, padding: '4px 10px', fontSize: 12 }}>Bu hasta — devam et</button></div>}

        <div className="notya-grid-yigin" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)', gap: 14 }}>
          <div>
            <div style={toolsCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: CHROME_RENK.ink }}>{doc?.fileName || 'Laboratuvar belgesi'}</div>
                <DoktorGeriLink href={geriHref}>{geriLabel}</DoktorGeriLink>
              </div>
              {doc && !/csv|excel|spreadsheet/.test(doc.fileType) && <div style={{ marginTop: 8 }}><DocumentViewer documentId={doc.id} fileName={doc.fileName} fileType={doc.fileType} /></div>}
              {doc && /csv|excel|spreadsheet/.test(doc.fileType) && <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 8 }}>Tablo dosyası — satırlar sağda.</div>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={cikar} disabled={durum !== 'hazir' || kilitli} style={{ ...btn, opacity: durum !== 'hazir' ? 0.6 : 1 }}>{durum === 'cikariyor' ? 'Tablo çıkarılıyor…' : panel ? 'Tabloyu yeniden çıkar' : 'Tabloyu çıkar'}</button>
                {panel && <span style={{ fontSize: 11, color: CHROME_RENK.muted }}>{panel.lab_adi || ''}{panel.numune_tarihi ? ` · numune ${new Date(panel.numune_tarihi).toLocaleDateString('tr-TR')}` : ''} · kaynak: {panel.kaynaklar?.join(' + ') || '—'} · kalite {panel.kalite}</span>}
              </div>
              {mesaj && (
                <div style={{ marginTop: 8, fontSize: 12, color: /Hata|amadı|eşleşmiyor/.test(mesaj) ? '#a45b3e' : CHROME_RENK.pine }}>
                  {mesaj}
                  {/* NOTYA-LAB-KIMLIK-CTA: the identity-mismatch error can surface here (via
                      onaylaVeDegerlendir -> raporla's server-side gate) as well as in the
                      top-of-page banner -- the confirm action must be reachable from wherever
                      the doctor actually hits the wall, not just one of the two spots. */}
                  {/eşleşmiyor/.test(mesaj) && (
                    <button type="button" onClick={() => void kimlikOnayla()} style={{ ...btnGhost, marginLeft: 8, padding: '4px 10px', fontSize: 12 }}>
                      Bu hasta — devam et
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            {!panel && <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 13 }}>{durum === 'cikariyor' ? 'Tablo çıkarılıyor…' : 'Laboratuvar tablosu hazırlanıyor. Birkaç saniye içinde burada görünür; gerekirse soldan "Tabloyu çıkar"a basın.'}</div>}
            {panel && (
              <div style={{ ...toolsCard, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                  <div style={etiket}>Tablo <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>· {satirlar.length} parametre · {yuksek} yüksek · {dusuk} düşük{kritikSatirlar.length ? ` · ${kritikSatirlar.length} kritik` : ''}{eslesmeyen ? ` · ${eslesmeyen} eşleşmedi` : ''} · hücreye tıklayıp düzeltin</span></div>
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
                  <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#E4F3F1', border: '1px solid rgba(47,67,52,0.4)', fontSize: 12, color: CHROME_RENK.pine, lineHeight: 1.45 }}>
                    Bu adım yalnızca tabloyu çıkarır. Klinik özet için <b>Tabloyu onayla ve değerlendir</b>e basın
                    {eslesmeyen > 0 ? ` · ${eslesmeyen} satır sarı “eşleşmedi” — gerekirse soldan “Tabloyu yeniden çıkar” (İngilizce mock lab eşlemesi güncellendi)` : ''}.
                  </div>
                )}
                <div style={{ overflowX: 'auto', marginTop: 6 }}>
                  <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
                    <thead><tr style={{ color: CHROME_RENK.muted, fontSize: 11 }}>{['Test', 'Sonuç', 'Birim', 'Ref', 'Flag', 'Önceki', 'Δ', 'Trend'].map((h) => <th key={h} style={{ ...hücre, textAlign: 'left', fontWeight: 600 }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {satirlar.map((s) => (
                        <tr key={s.id} style={{ background: s.dogrulanacak ? '#FBF3DE' : s.kritik ? '#FBEAE3' : 'transparent' }} title={s.dogrulama_notu || undefined}>
                          <td style={hücre}>
                            <input defaultValue={s.raw_name} disabled={kilitli} onBlur={(e) => e.target.value !== s.raw_name && hücreKaydet(s, 'raw_name', e.target.value)} style={{ ...girdi, fontWeight: 600 }} />
                            <div style={{ fontSize: 10, color: s.canonical_key ? CHROME_RENK.muted : '#B4832F' }}>
                              {s.canonical_key ? kanonik[s.canonical_key] || s.canonical_key : <span>eşleşmedi · <select defaultValue="" disabled={kilitli} onChange={(e) => takmaAd(s, e.target.value)} style={{ background: 'transparent', color: '#B4832F', border: 'none', fontSize: 10 }}><option value="">bunu … say</option>{Object.entries(kanonik).map(([k, v]) => <option key={k} value={k} style={{ color: '#000' }}>{v}</option>)}</select></span>}
                              {s.doctor_corrected && ' · hekim düzeltti'}{s.page ? ` · s.${s.page}` : ''}
                            </div>
                            {panel?.panel_type === 'enabiz_gecmis' && <input type="date" title="e-Nabız satır tarihi (basılı) — tarihsiz satır onaylı seriye girmez" defaultValue={s.numune_tarihi || ''} disabled={kilitli} onBlur={(e) => e.target.value && e.target.value !== (s.numune_tarihi || '') && hücreKaydet(s, 'numune_tarihi', e.target.value)} style={{ ...girdi, fontSize: 10, width: 120, color: s.numune_tarihi ? CHROME_RENK.muted : '#B4832F' }} />}
                          </td>
                          <td style={hücre}><input defaultValue={s.value_num ?? s.value_text ?? ''} disabled={kilitli} onBlur={(e) => e.target.value !== String(s.value_num ?? s.value_text ?? '') && hücreKaydet(s, 'value', e.target.value)} style={{ ...girdi, fontWeight: 700, color: flagRenk[s.flag] }} /></td>
                          <td style={hücre}><input defaultValue={s.unit || ''} disabled={kilitli} onBlur={(e) => e.target.value !== (s.unit || '') && hücreKaydet(s, 'unit', e.target.value)} style={girdi} /></td>
                          <td style={hücre}><span style={{ display: 'flex', gap: 2 }}><input defaultValue={s.ref_low ?? ''} disabled={kilitli} onBlur={(e) => e.target.value !== String(s.ref_low ?? '') && hücreKaydet(s, 'ref_low', e.target.value)} style={{ ...girdi, width: 44 }} />–<input defaultValue={s.ref_high ?? ''} disabled={kilitli} onBlur={(e) => e.target.value !== String(s.ref_high ?? '') && hücreKaydet(s, 'ref_high', e.target.value)} style={{ ...girdi, width: 44 }} /></span></td>
                          <td style={{ ...hücre, color: flagRenk[s.flag], fontWeight: 800 }}>{s.flag === 'critical' ? 'KRİTİK' : s.flag === 'H' ? '↑ H' : s.flag === 'L' ? '↓ L' : s.flag === 'pozitif_suphe' ? 'şüphe' : s.flag === 'sinir' ? 'sınır' : s.flag === 'yetersiz_ornek' ? 'yetersiz' : s.flag === 'normal' ? 'N' : s.flag === 'tekrar' ? 'tekrar' : '?'}</td>
                          <td style={{ ...hücre, color: CHROME_RENK.muted }}>{s.prior_value != null ? `${s.prior_value}${s.prior_date ? ` (${new Date(s.prior_date).toLocaleDateString('tr-TR')})` : ''}` : '—'}</td>
                          <td style={{ ...hücre, color: CHROME_RENK.ink }}>{s.delta_pct != null ? `${s.delta_pct > 0 ? '+' : ''}${s.delta_pct}%` : '—'}</td>
                          <td style={{ ...hücre, color: s.trend === 'new_abn' ? '#a45b3e' : s.trend === 'new_normal' ? CHROME_RENK.pine : CHROME_RENK.muted }}>{trendTr[s.trend] || s.trend}{s.dogrulanacak ? ' · doğrulanacak' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {lab && analiz && (
              <>
                {lab.acil_bayrak && <div style={{ ...toolsCard, background: '#FBEAE3', borderColor: 'rgba(164,91,62,0.5)', color: '#a45b3e', fontSize: 13, fontWeight: 800, marginBottom: 10 }}>⚠ ACİL BAYRAK — {lab.kritik.join(' · ')}</div>}
                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Özet ({persona}) <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>· düzenlenebilir</span></div>
                  <textarea value={ozetTaslak} onChange={(e) => setOzetTaslak(e.target.value)} rows={5} disabled={kilitli} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" onClick={() => void kaydet('ozet')} disabled={kilitli || kayitDurum !== 'hazir'} style={btnGhost}>{kayitDurum === 'kaydediyor' ? 'Kaydediliyor…' : 'Özeti kaydet'}</button>
                    {kayitMesaj && /özet|Özet|oturum|Taslak|Kaydedilemedi|kaydedildi/i.test(kayitMesaj) && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: /kaydedildi/i.test(kayitMesaj) ? CHROME_RENK.pine : /kaydediliyor/i.test(kayitMesaj) ? CHROME_RENK.muted : '#a45b3e' }}>{kayitMesaj}</span>
                    )}
                  </div>
                </div>
                {[['Yeni bozulanlar', lab.yeni_bozulanlar, '#a45b3e'], ['Düzelenler', lab.duzelenler, CHROME_RENK.pine], ['Kronik sapma', lab.kronik, '#B4832F']].map(([baslik, liste, renk]) => (liste as string[]).length ? (
                  <div key={String(baslik)} style={{ ...toolsCard, marginBottom: 10 }}><div style={{ ...etiket, color: String(renk) }}>{String(baslik)}</div><ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: CHROME_RENK.ink }}>{(liste as string[]).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                ) : null)}
                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}><div style={etiket}>Olası tanılar <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>· güven üst sınırı %{analiz.fusion?.capPct ?? 70}</span></div>{lab.kaynak && <button type="button" onClick={() => setKaynakAcik((x) => !x)} style={{ ...btnGhost, padding: '3px 9px', fontSize: 11, color: kaynakAcik ? CHROME_RENK.pine : CHROME_RENK.muted }}>Kaynak</button>}</div>
                  {lab.tanilar.length === 0 && <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>Tanı önerisi yok.</div>}
                  {lab.tanilar.map((t, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderTop: i ? '1px solid #F6F0E4' : 'none' }}>
                      <div style={{ minWidth: 60, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: t.guven_bant === 'yüksek' ? CHROME_RENK.pine : t.guven_bant === 'orta' ? '#B4832F' : CHROME_RENK.muted }}>%{t.guven_pct}</div><div style={{ fontSize: 10, color: CHROME_RENK.muted }}>{t.guven_bant}</div></div>
                      <div style={{ flex: '1 1 180px', minWidth: 0, fontSize: 13, color: CHROME_RENK.ink }}><div style={{ fontWeight: 700 }}>{t.ad} {t.icd10 && <span style={{ color: CHROME_RENK.muted, fontWeight: 400 }}>({t.icd10})</span>}</div>{t.destek.length > 0 && <div style={{ fontSize: 11, color: CHROME_RENK.pine }}>destek: {t.destek.join(', ')}</div>}<KaynakDip d={lab.kaynak?.tanilar[i] ? [lab.kaynak.tanilar[i]] : null} acik={kaynakAcik} /></div>
                      <button type="button" onClick={() => setTaniTaslak((x) => (x ? x + '\n' : '') + (t.icd10 ? `${t.ad} (${t.icd10})` : t.ad))} disabled={kilitli} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }}>Resmi tanıya al</button>
                    </div>
                  ))}
                </div>
                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Resmi tanı (hekim) · klinik ilişki</div>
                  <textarea value={taniTaslak} onChange={(e) => { setTaniTaslak(e.target.value); setKayitMesaj(''); }} rows={3} placeholder="Örn. Yenidoğan tarama negatif — klinik izlem (ICD şart değil)" disabled={kilitli} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
                  {lab.klinik_iliski && <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 6 }}>Asistan: {lab.klinik_iliski}</div>}
                  {lab.tanilar.length === 0 && !taniTaslak.trim() && ozetTaslak.trim() && !kilitli && (
                    <div style={{ marginTop: 6 }}>
                      <button type="button" onClick={() => { setTaniTaslak(ozetTaslak.split('\n').map((s) => s.trim()).filter(Boolean)[0] || ozetTaslak.trim()); setKayitMesaj('Özet satırı resmi tanı kutusuna alındı — Kilitle’ye basın.'); }} style={btnGhost}>Özeti resmi tanıya al</button>
                    </div>
                  )}
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" onClick={() => void kaydet('hekim_tanisi')} disabled={kilitli || kayitDurum !== 'hazir'} style={btnGhost}>{kayitDurum === 'kaydediyor' ? 'Kilitleniyor…' : 'Resmi tanıyı kilitle'}</button>
                    <button type="button" onClick={() => void onayla('onayla')} disabled={(!taniTaslak.trim() && !analiz.hekim_tanisi?.length) || analiz.durum === 'onaylandi' || kilitli || durum !== 'hazir'} style={{ ...btn, opacity: (!taniTaslak.trim() && !analiz.hekim_tanisi?.length) || analiz.durum === 'onaylandi' || kilitli || durum !== 'hazir' ? 0.45 : 1, cursor: (!taniTaslak.trim() && !analiz.hekim_tanisi?.length) ? 'not-allowed' : 'pointer' }} title={taniTaslak.trim() || analiz.hekim_tanisi?.length ? 'Tanıyı kaydeder ve Objektif’e yazar' : 'Önce resmi tanı yazın veya öneriden seçin'}>Onayla ve son muayeneye ekle</button>
                    {analiz.durum === 'onaylandi' && <button type="button" onClick={() => setPlanAcik(!planAcik)} style={btnGhost}>Plan düzenle</button>}
                  </div>
                  {kayitMesaj && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: /kaydedildi|kilitlendi|alındı/i.test(kayitMesaj) ? CHROME_RENK.pine : /kaydediliyor|kilitleniyor/i.test(kayitMesaj) ? CHROME_RENK.muted : '#a45b3e' }}>{kayitMesaj}</div>}
                  {!taniTaslak.trim() && !analiz.hekim_tanisi?.length && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#B4832F' }}>Tarama negatif olsa bile kilit için bir hekim satırı gerekir — “Özeti resmi tanıya al” veya yazın.</div>
                  )}
                  {planAcik && analiz.durum === 'onaylandi' && (
                    <div style={{ marginTop: 8 }}>
                      <div style={etiket}>Plan (ilaç / doz / konsült / tekrar tetkik)</div>
                      <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={4} placeholder="Mevcut planı korumak için boş bırakın; değişiklik için tam planı yazın." style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
                      <div style={{ marginTop: 6 }}><button type="button" onClick={() => onayla('muayene_onayla')} style={btn}>Muayeneyi onayla</button></div>
                    </div>
                  )}
                  {analiz.note_id && <div style={{ marginTop: 6, fontSize: 12, color: CHROME_RENK.pine }}>{kilitli ? 'Muayene onaylandı — kilitli.' : "Objektif'e eklendi."} <a href={`/dashboard/doktor/notlar/${analiz.note_id}`} style={{ color: CHROME_RENK.pine }}>Notu aç →</a></div>}
                </div>
                {(lab.oneri || lab.recete_ipucu) && <div style={{ ...toolsCard, marginBottom: 10, fontSize: 13, color: CHROME_RENK.ink, whiteSpace: 'pre-wrap' }}><div style={etiket}>Öneri</div>{lab.oneri}{lab.recete_ipucu ? `\nReçete ipucu (yalnız öneri): ${lab.recete_ipucu}` : ''}<KaynakDip d={lab.kaynak?.oneri} acik={kaynakAcik} /></div>}
                {lab.sinirlar.length > 0 && <div style={{ ...toolsCard, fontSize: 12, color: CHROME_RENK.muted }}><div style={etiket}>Sınırlar</div><ul style={{ margin: 0, paddingLeft: 18 }}>{lab.sinirlar.map((s, i) => <li key={i}>{s}</li>)}</ul>{analiz.fusion?.duzeltmeler?.length ? <div style={{ marginTop: 6, color: CHROME_RENK.muted }}>Sistem düzeltmeleri: {analiz.fusion.duzeltmeler.join('; ')}</div> : null}</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
