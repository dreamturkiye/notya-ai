'use client';
/**
 * NOTYA-BELGE-01 — /dashboard/doktor/hastalar/[id]/belgeler/[belgeId]
 * Media + "Asistana raporla" + taslak rapor + Motorlar chips + resmi tanı kilidi + Onayla (→ SOAP Objektif)
 * + Plan düzenle → Muayeneyi onayla (revizyon). Disclaimer strip always visible (locked).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DoktorGeriLink from '@/components/doktor/DoktorGeriLink';
import DocumentViewer from '@/components/doktor/DocumentViewer';
import { getAccessTokenAsync, toolsShell, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { MODALITE_TR, type Modalite } from '@/core/belgeler/ontoloji';
import { bransKurali, tierBMotorlari, SES_MODALITELERI } from '@/core/belgeler/router';
import { gorseliKimliksizlestir, sesiHazirla, type DeIdGorsel } from '@/core/belgeler/deid';
import { tierBCalistir, tarayiciYetenek } from '@/core/belgeler/tarayiciMotor';
import { dicomMi, dicomCoz } from '@/core/belgeler/dicom';
import '@/core/belgeler/motorlar/txrv'; // NOTYA-BELGE-02: registers the browser CXR engine
import { UYARI_SERIDI } from '@/core/belgeler/yazar';
import type { BelgeRaporu, MotorCiktisi } from '@/core/belgeler/types';
import { belgeLabMi, belgeRontgenMi } from '@/lib/doktor/belgeTur';
import { hastaBelgelerHref, hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import type { HastaDosyaSekmeId } from '@/lib/doktor/hastaDosyaSekmeleri';

type Doc = { id: string; fileName: string; fileType: string; fileSize: number; category: string | null; createdAt: string };
type Analiz = { id: string; durum: string; sonuc: BelgeRaporu | null; fusion: { fused: { kod: string; label_tr: string; p: number; sources: string[]; karsi: string[] }[]; capPct: number; acilNedenler: string[]; duzeltmeler: string[] } | null; motor_ciktilari: MotorCiktisi[]; hekim_tanisi: { ad: string; icd10?: string | null }[]; hekim_ozet: string | null; note_id: string | null; onaylandi_at: string | null; olusturuldu: string; modality_final: string };

const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#2f4334', marginBottom: 4 };
const btn: React.CSSProperties = { background: '#2f4334', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8b7d70', border: '1px solid rgba(58,44,34,0.16)' };
const bantRenk: Record<string, string> = { 'yüksek': '#2f4334', 'orta': '#B4832F', 'düşük': '#8b7d70' };

export default function BelgeAnalizPage() {
  const { id: patientId, belgeId } = useParams<{ id: string; belgeId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [analiz, setAnaliz] = useState<Analiz | null>(null);
  const [bransKey, setBransKey] = useState('genel');
  const [modalite, setModalite] = useState<Modalite | ''>('');
  const [klinikNot, setKlinikNot] = useState('');
  const [fundusGoz, setFundusGoz] = useState<'sag' | 'sol' | 'iki' | ''>('');
  const [tekAlanFundus, setTekAlanFundus] = useState(true);
  const [kimlikYok, setKimlikYok] = useState(false);
  const [durum, setDurum] = useState<'hazir' | 'hazirlaniyor' | 'motorlar' | 'yaziyor' | 'onayliyor' | 'hata'>('hazir');
  const [mesaj, setMesaj] = useState('');
  const [onayMesaj, setOnayMesaj] = useState('');
  const [taniTaslak, setTaniTaslak] = useState('');
  const [ozetTaslak, setOzetTaslak] = useState('');
  const [plan, setPlan] = useState('');
  const [planAcik, setPlanAcik] = useState(false);
  const [uyusmazlik, setUyusmazlik] = useState<string | null>(null);
  // GOZ-EXCEPTIONAL-01: göz dual-sign köprüsü (yalnız bransKurali.goruntuOkumaKoprusu — göz)
  const [kopruGoz, setKopruGoz] = useState<'sag' | 'sol' | ''>('');
  const [kopruMesaj, setKopruMesaj] = useState('');

  const kural = bransKurali(bransKey);
  const personaAd = kural.persona === 'ayse' ? 'Ayşe' : kural.persona === 'mehmet' ? 'Mehmet' : kural.persona === 'elif' ? 'Elif' : 'Asistan';
  const yetenek = useMemo(() => (typeof window !== 'undefined' ? tarayiciYetenek() : null), []);
  const sesMi = SES_MODALITELERI.includes((modalite || 'serbest') as Modalite);
  const pdfMi = doc?.fileType === 'application/pdf';
  const rapor = analiz?.sonuc || null;

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync();
    const [dr, ar] = await Promise.all([
      fetch(`/api/doktor/documents?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      fetch(`/api/doktor/belgeler/analiz?documentId=${encodeURIComponent(belgeId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
    ]);
    if (dr.ok) { const j = await dr.json(); const list: Doc[] = j.documents || j.docs || j || []; setDoc(Array.isArray(list) ? list.find((d) => d.id === belgeId) || null : null); }
    if (ar.ok) { const j = await ar.json(); setAnaliz(j.analiz || null); setBransKey(j.bransKey || 'genel'); if (j.analiz?.hekim_tanisi?.length) setTaniTaslak(j.analiz.hekim_tanisi.map((t: { ad: string; icd10?: string | null }) => t.icd10 ? `${t.ad} (${t.icd10})` : t.ad).join('\n')); setOzetTaslak(j.analiz?.hekim_ozet || j.analiz?.sonuc?.ozet || ''); }
  }, [patientId, belgeId]);
  useEffect(() => { yukle(); }, [yukle]);

  // Lab PDFs belong on /lab (table extract + Ayşe/Elif report) — not the imaging draft path.
  useEffect(() => {
    if (!doc || searchParams?.get('goruntu') === '1') return;
    if (belgeLabMi(doc)) {
      const gt = searchParams?.get('geriTab');
      const q = gt ? `?geriTab=${encodeURIComponent(gt)}` : '';
      router.replace(`/dashboard/doktor/hastalar/${patientId}/belgeler/${belgeId}/lab${q}`);
    }
  }, [doc, patientId, belgeId, router, searchParams]);

  // default modality: query (Deri tab deep-link) then file type / category
  useEffect(() => {
    if (modalite) return;
    const q = searchParams?.get('modalityFinal') || searchParams?.get('dermModality') || '';
    if (q && (kural.modaliteler as string[]).includes(q)) {
      setModalite(q as Modalite);
      return;
    }
    if (!doc) return;
    if (doc.fileType.startsWith('audio/')) setModalite(kural.modaliteler.includes('ses_kalp') && doc.category === 'cihaz-kaydi' ? 'ses_kalp' : kural.modaliteler.includes('ses_akciger') ? 'ses_akciger' : 'ses_kalp');
    else if (belgeRontgenMi(doc) && kural.modaliteler.includes('cxr')) setModalite('cxr');
    else if (doc.fileType === 'application/pdf') setModalite('pdf_rapor');
    else setModalite(kural.modaliteler.find((m) => !m.startsWith('ses') && m !== 'pdf_rapor') || 'serbest');
  }, [doc, kural, modalite, searchParams]);

  const raporla = async () => {
    if (!doc || !modalite) return;
    if (!pdfMi && !kimlikYok) { setMesaj('Göndermeden önce görüntüde hasta adı / TC / tarih bulunmadığını onaylayın (KVKK).'); return; }
    setMesaj(''); setUyusmazlik(null); setDurum('hazirlaniyor');
    const token = await getAccessTokenAsync();
    try {
      let deid: DeIdGorsel | null = null; let sesMetrikleri: Record<string, number | string> | null = null; let tierB: MotorCiktisi[] = [];
      if (!pdfMi) {
        const r = await fetch(`/api/doktor/documents/${doc.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) throw new Error('Belge indirilemedi');
        let blob: Blob = await r.blob();
        let dicomNotu = '';
        if (dicomMi(blob, doc.fileName)) { // NOTYA-BELGE-04: DICOM → windowed grayscale canvas (tags never leave the device)
          const d = await dicomCoz(blob); dicomNotu = d.not;
          blob = await new Promise<Blob>((res, rej) => d.canvas.toBlob((b) => (b ? res(b) : rej(new Error('DICOM dönüştürülemedi'))), 'image/png'));
        }
        if (dicomNotu) setMesaj(dicomNotu);
        if (sesMi) {
          const s = await sesiHazirla(blob); deid = s.spektrogram; sesMetrikleri = { ...s.metrikler, ...(s.kaliteDusuk ? { kalite_notu: s.neden || '' } : {}) };
        } else {
          deid = await gorseliKimliksizlestir(blob);
        }
        setDurum('motorlar');
        const istenen = tierBMotorlari(bransKey, modalite as Modalite);
        if (istenen.length && !sesMi) { try { tierB = await tierBCalistir(istenen, modalite as Modalite, { bitmap: await createImageBitmap(blob) }); } catch { tierB = []; } }
      }
      setDurum('yaziyor');
      const fitzQ = searchParams?.get('fitzpatrick');
      const gozNot =
        (modalite === 'fundus' || modalite === 'oct') && fundusGoz
          ? `Göz: ${fundusGoz === 'sag' ? 'OD (sağ)' : fundusGoz === 'sol' ? 'OS (sol)' : 'OU (iki göz)'}.`
          : '';
      const klinikBirlesik = [gozNot, klinikNot].filter(Boolean).join(' ').trim();
      const r = await fetch('/api/doktor/belgeler/analiz', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: doc.id, modalityFinal: modalite, klinikNot: klinikBirlesik || undefined, deid: deid ? { mime: deid.mime, base64: deid.base64, hash: deid.hash } : null, sesMetrikleri, tierB, fitzpatrickBilinmiyor: !fitzQ, tekAlanFundus: modalite === 'fundus' ? tekAlanFundus : undefined }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Taslak üretilemedi');
      if (j.uyusmazlik) setUyusmazlik(`Asistan görüntüyü "${j.analiz?.sonuc?.modalite}" olarak gördü; siz "${j.secilenModalite}" seçtiniz. Modaliteyi kontrol edip yeniden raporlayın veya taslağı bu haliyle değerlendirin.`);
      setDurum('hazir'); setMesaj(''); await yukle();
    } catch (e) { setDurum('hata'); setMesaj(e instanceof Error ? e.message : 'Hata'); }
  };

  const gozeAktar = async () => {
    if (!analiz || !kopruGoz) return;
    setKopruMesaj('');
    const token = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/goz', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ adim: 'goruntu_okuma', eylem: 'belge_taslak', patientId, analizId: analiz.id, goz: kopruGoz, tekAlan: analiz.modality_final === 'fundus' ? tekAlanFundus : undefined }) });
    const j = await r.json().catch(() => ({}));
    setKopruMesaj(r.ok ? 'Taslak gönderildi — uzman onayı bekliyor.' : j.error || 'Aktarılamadı');
  };

  const taniListesi = (metin: string) =>
    metin.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = s.match(/^(.*?)\s*\(([A-Z]\d{2}(?:\.\d{1,2})?)\)\s*$/);
      return m ? { ad: m[1].trim(), icd10: m[2] } : { ad: s, icd10: null as string | null };
    });

  const kaydet = async (alan: 'ozet' | 'hekim_tanisi') => {
    if (!analiz?.id) {
      const yok = 'Taslak rapor henüz yok.';
      setOnayMesaj(yok); setMesaj(yok); return false;
    }
    const sonraki = alan === 'ozet' ? ozetTaslak : taniListesi(taniTaslak);
    if (alan === 'hekim_tanisi' && !(sonraki as { ad: string }[]).length) {
      setOnayMesaj('Resmi tanı boş — öneriden seçin veya yazın.');
      setMesaj('Resmi tanı boş.');
      return false;
    }
    try {
      const token = await getAccessTokenAsync();
      if (!token) throw new Error('Oturum bulunamadı — yeniden giriş yapın.');
      const r = await fetch('/api/doktor/belgeler/analiz', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId: analiz.id, alan, sonraki }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Kaydedilemedi');
      const msg = alan === 'ozet' ? 'Özet kaydedildi.' : 'Resmi tanı kilitlendi.';
      setMesaj(msg);
      if (alan === 'hekim_tanisi') setOnayMesaj(msg);
      await yukle();
      return true;
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Kaydedilemedi';
      setMesaj(err);
      if (alan === 'hekim_tanisi') setOnayMesaj(err);
      return false;
    }
  };

  const onayla = async (adim: 'onayla' | 'muayene_onayla') => {
    if (!analiz) return;
    setOnayMesaj('');
    setDurum('onayliyor');
    try {
      // One click: sync textarea → hekim_tanisi, then append to Objektif (was disabled-looking teal with no click when only local draft existed).
      if (adim === 'onayla') {
        const yerel = taniListesi(taniTaslak);
        if (!yerel.length && !analiz.hekim_tanisi?.length) {
          setOnayMesaj('Önce resmi tanı yazın veya "Resmi tanıya al"a basın.');
          setMesaj('Resmi tanı gerekli.');
          setDurum('hazir');
          return;
        }
        if (yerel.length) {
          const ok = await kaydet('hekim_tanisi');
          if (!ok) { setDurum('hazir'); return; }
        }
      }
      const token = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/belgeler/analiz/onayla', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ analizId: analiz.id, adim, plan: adim === 'muayene_onayla' ? plan : undefined }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = j.error || 'Onaylanamadı';
        setOnayMesaj(err);
        setMesaj(err);
        setDurum('hazir');
        return;
      }
      const okMsg = adim === 'onayla' ? 'Rapor muayenenin Objektif bölümüne eklendi.' : 'Muayene onaylandı; plan revizyonu kaydedildi.';
      setMesaj(okMsg);
      setOnayMesaj(okMsg);
      setPlanAcik(false);
      await yukle();
      if (j.noteId) {
        router.push(`/dashboard/doktor/notlar/${j.noteId}`);
        return;
      }
      setDurum('hazir');
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Onaylanamadı';
      setOnayMesaj(err);
      setMesaj(err);
      setDurum('hazir');
    }
  };

  const taniOnerisiEkle = (ad: string, icd10?: string | null) => setTaniTaslak((t) => (t ? t + '\n' : '') + (icd10 ? `${ad} (${icd10})` : ad));
  const taniHazir = !!(taniTaslak.trim() || analiz?.hekim_tanisi?.length);
  const onayKapali = !taniHazir || analiz?.durum === 'kalite_dusuk' || analiz?.durum === 'onaylandi' || analiz?.durum === 'muayene_onaylandi' || durum === 'onayliyor';
  // Specialty deep-links (Deri/Göz) return to that chapter; default vault path → Belgeler.
  const geriTab = (searchParams?.get('geriTab') || (searchParams?.get('dermModality') ? 'deri' : null)) as HastaDosyaSekmeId | null;
  const geriHref = geriTab ? hastaDosyaHref(patientId, geriTab) : hastaBelgelerHref(patientId);
  const geriLabel = geriTab === 'deri' ? '← Deri' : geriTab === 'goz' ? '← Göz' : geriTab === 'gebelik' ? '← Gebelik' : geriTab === 'dahiliye' ? '← Dahiliye' : geriTab === 'goruntuleme' ? '← Görüntüler' : '← Belgeler';

  return (
    <div style={toolsShell}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 12px' }}>
        <div style={{ background: '#FBF3DE', border: '1px solid rgba(180,131,47,0.35)', color: '#B4832F', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{UYARI_SERIDI}</div>
        <div className="notya-grid-yigin" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14 }}>
          {/* LEFT: controls first (above fold), then media */}
          <div>
            <div style={{ ...toolsCard, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#3b2e24' }}>{doc?.fileName || 'Belge'}</div>
                <DoktorGeriLink href={geriHref}>{geriLabel}</DoktorGeriLink>
              </div>
              <div style={etiket}>{personaAd} ile değerlendir · {kural.ad}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={modalite} onChange={(e) => setModalite(e.target.value as Modalite)} style={{ ...toolsInput, width: 'auto' }}>
                  {kural.modaliteler.map((m) => <option key={m} value={m} style={{ color: '#000' }}>{MODALITE_TR[m]}</option>)}
                  <option value="serbest" style={{ color: '#000' }}>Serbest görüntü (yalnızca tarif)</option>
                </select>
                {(modalite === 'fundus' || modalite === 'oct') && (
                  <select value={fundusGoz} onChange={(e) => setFundusGoz(e.target.value as typeof fundusGoz)} style={{ ...toolsInput, width: 'auto' }} aria-label="Göz">
                    <option value="" style={{ color: '#000' }}>Göz seçin</option>
                    <option value="sag" style={{ color: '#000' }}>OD (sağ)</option>
                    <option value="sol" style={{ color: '#000' }}>OS (sol)</option>
                    <option value="iki" style={{ color: '#000' }}>OU (iki göz — tercihen ayrı foto)</option>
                  </select>
                )}
                <input value={klinikNot} onChange={(e) => setKlinikNot(e.target.value)} placeholder={modalite === 'fundus' ? 'Klinik not: dilate mi, DM/HT…' : 'Klinik not (isteğe bağlı): 3 gündür ateş, öksürük'} style={{ ...toolsInput, flex: 1, minWidth: 220 }} />
              </div>
              {modalite === 'fundus' && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8, fontSize: 12, color: '#8b7d70', cursor: 'pointer' }}>
                  <input type="checkbox" checked={tekAlanFundus} onChange={(e) => setTekAlanFundus(e.target.checked)} />
                  <span>Tek alan fundus fotoğrafı (güven üst sınırı %70 — TR poliklinik standardı: OD ve OS ayrı yükleyin).</span>
                </label>
              )}
              {!pdfMi && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8, fontSize: 12, color: '#8b7d70', cursor: 'pointer' }}>
                  <input type="checkbox" checked={kimlikYok} onChange={(e) => setKimlikYok(e.target.checked)} />
                  <span>Görüntüde hasta adı, TC, doğum tarihi gibi kimlik bilgisi yok. (Fotoğraf üst verisi cihazınızda temizlenir; yalnız kimliksiz kopya gönderilir.)</span>
                </label>
              )}
              {yetenek && <div style={{ fontSize: 11, color: '#8b7d70', marginTop: 6 }}>{yetenek.not} Tarayıcı motorları: {tierBMotorlari(bransKey, (modalite || 'serbest') as Modalite).join(', ') || 'bu modalite için yok (yalnız asistan)'}.</div>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={raporla} disabled={durum !== 'hazir' && durum !== 'hata' || !modalite} style={{ ...btn, opacity: durum === 'hazir' || durum === 'hata' ? 1 : 0.6 }}>
                  {durum === 'hazirlaniyor' ? 'Kimliksizleştiriliyor…' : durum === 'motorlar' ? 'Motorlar çalışıyor…' : durum === 'yaziyor' ? `${personaAd} yazıyor…` : analiz ? 'Yeniden raporla' : modalite === 'cxr' || String(modalite).startsWith('xr_') ? `${personaAd} ile röntgeni değerlendir` : `${personaAd} ile değerlendir`}
                </button>
                {doc && belgeLabMi(doc) && (
                  <a href={`/dashboard/doktor/hastalar/${patientId}/belgeler/${belgeId}/lab${geriTab ? `?geriTab=${geriTab}` : ''}`} style={{ fontSize: 12, fontWeight: 700, color: '#B4832F' }}>Laboratuvarı değerlendir →</a>
                )}
                {mesaj && <span style={{ fontSize: 12, color: durum === 'hata' ? '#a45b3e' : '#2f4334' }}>{mesaj}</span>}
              </div>
            </div>
            <div style={{ ...toolsCard, marginBottom: 12, overflow: 'hidden', maxHeight: '55vh' }}>
              {doc && <DocumentViewer documentId={doc.id} fileName={doc.fileName} fileType={doc.fileType} />}
            </div>
          </div>

          {/* RIGHT: report */}
          <div>
            {!rapor && <div style={{ ...toolsCard, color: '#8b7d70', fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: '#3b2e24', marginBottom: 6 }}>Henüz taslak yok</div>
              Solda modaliteyi seçin (röntgen için <b>Röntgen (akciğer grafisi)</b>) ve <b>{personaAd} ile değerlendir</b>e basın. Lab PDF ise <b>Laboratuvarı değerlendir</b> yolunu kullanın.
            </div>}
            {rapor && analiz && (
              <>
                {analiz.durum === 'kalite_dusuk' && <div style={{ ...toolsCard, borderColor: 'rgba(164,91,62,0.4)', color: '#a45b3e', fontSize: 13, marginBottom: 10 }}>Kalite düşük — tanı önerisi üretilmedi. {rapor.sinirlar[0] || ''}</div>}
                {uyusmazlik && <div style={{ ...toolsCard, borderColor: 'rgba(180,131,47,0.4)', color: '#B4832F', fontSize: 13, marginBottom: 10 }}>{uyusmazlik}</div>}
                {rapor.acil_bayrak && <div style={{ ...toolsCard, background: '#FBEAE3', borderColor: 'rgba(164,91,62,0.5)', color: '#a45b3e', fontSize: 13, fontWeight: 800, marginBottom: 10 }}>⚠ ACİL BAYRAK — {analiz.fusion?.acilNedenler?.join(', ') || 'kırmızı bayrak bulgu'}</div>}

                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Özet <span style={{ fontWeight: 400, color: '#8b7d70' }}>· {rapor.modalite} · kalite {rapor.kalite} · düzenlenebilir</span></div>
                  <textarea value={ozetTaslak} onChange={(e) => setOzetTaslak(e.target.value)} rows={5} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} disabled={analiz.durum === 'muayene_onaylandi'} />
                  <div style={{ marginTop: 6 }}><button type="button" onClick={() => kaydet('ozet')} style={btnGhost} disabled={analiz.durum === 'muayene_onaylandi'}>Özeti kaydet</button></div>
                </div>

                {rapor.bulgular.length > 0 && (
                  <div style={{ ...toolsCard, marginBottom: 10 }}>
                    <div style={etiket}>Bulgular</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#3b2e24' }}>{rapor.bulgular.map((b, i) => <li key={i}>{b}</li>)}</ul>
                  </div>
                )}

                <div style={{ ...toolsCard, marginBottom: 10 }}>
                  <div style={etiket}>Olası tanılar <span style={{ fontWeight: 400, color: '#8b7d70' }}>· güven üst sınırı %{analiz.fusion?.capPct ?? 70}</span></div>
                  {rapor.tanilar.length === 0 && <div style={{ fontSize: 12, color: '#8b7d70' }}>Tanı önerisi yok.</div>}
                  {rapor.tanilar.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderTop: i ? '1px solid #F6F0E4' : 'none' }}>
                      <div style={{ minWidth: 64, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: bantRenk[t.guven_bant] }}>%{t.guven_pct}</div><div style={{ fontSize: 10, color: bantRenk[t.guven_bant] }}>{t.guven_bant}</div></div>
                      <div style={{ flex: 1, fontSize: 13, color: '#3b2e24' }}>
                        <div style={{ fontWeight: 700 }}>{t.ad} {t.icd10 && <span style={{ color: '#8b7d70', fontWeight: 400 }}>({t.icd10})</span>}</div>
                        {t.destek.length > 0 && <div style={{ fontSize: 11, color: '#2f4334' }}>destek: {t.destek.join(', ')}</div>}
                        {t.karsi.length > 0 && <div style={{ fontSize: 11, color: '#a45b3e' }}>karşı: {t.karsi.join(', ')}</div>}
                      </div>
                      <button type="button" onClick={() => taniOnerisiEkle(t.ad, t.icd10)} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }} disabled={analiz.durum === 'muayene_onaylandi'}>Resmi tanıya al</button>
                    </div>
                  ))}
                </div>

                <div style={{ ...toolsCard, marginBottom: 10, position: 'sticky', bottom: 12, zIndex: 30, boxShadow: '0 -8px 24px rgba(0,0,0,0.45)' }}>
                  <div style={etiket}>Resmi tanı (hekim) <span style={{ fontWeight: 400, color: '#8b7d70' }}>· her satır bir tanı; ICD-10 parantez içinde</span></div>
                  <textarea value={taniTaslak} onChange={(e) => { setTaniTaslak(e.target.value); setOnayMesaj(''); }} rows={3} placeholder="Örn. Pnömoni (J18.9)" style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} disabled={analiz.durum === 'muayene_onaylandi'} />
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" onClick={() => void kaydet('hekim_tanisi')} style={btnGhost} disabled={analiz.durum === 'muayene_onaylandi' || durum === 'onayliyor'}>Resmi tanıyı kilitle</button>
                    <button
                      type="button"
                      onClick={() => void onayla('onayla')}
                      style={{ ...btn, opacity: onayKapali ? 0.45 : 1, cursor: onayKapali ? 'not-allowed' : 'pointer', flex: '1 1 200px' }}
                      disabled={onayKapali}
                      title={taniHazir ? 'Tanıyı kaydeder ve son muayenenin Objektif bölümüne yazar' : 'Önce resmi tanı yazın veya öneriden seçin'}
                    >
                      {durum === 'onayliyor' ? 'Muayeneye ekleniyor…' : 'Onayla → Muayene Objektif'}
                    </button>
                    {(analiz.durum === 'onaylandi') && <button type="button" onClick={() => setPlanAcik(!planAcik)} style={btnGhost}>Plan düzenle</button>}
                  </div>
                  {onayMesaj && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: /eklendi|kilitlendi|onaylandı/i.test(onayMesaj) ? '#2f4334' : '#a45b3e' }}>{onayMesaj}</div>}
                  {!taniHazir && analiz.durum !== 'onaylandi' && analiz.durum !== 'muayene_onaylandi' && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#B4832F' }}>Onaylamak için yukarıdan “Resmi tanıya al” veya tanı yazın — tek tıkla hem kilitlenir hem Objektif’e eklenir.</div>
                  )}
                  {planAcik && analiz.durum === 'onaylandi' && (
                    <div style={{ marginTop: 8 }}>
                      <div style={etiket}>Plan (ilaç / doz / konsült)</div>
                      <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={4} placeholder="Mevcut planı korumak için boş bırakın; değişiklik için tam planı yazın." style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} />
                      <div style={{ marginTop: 6 }}><button type="button" onClick={() => void onayla('muayene_onayla')} style={btn} disabled={durum === 'onayliyor'}>{durum === 'onayliyor' ? 'Kaydediliyor…' : 'Muayeneyi onayla'}</button></div>
                    </div>
                  )}
                  {analiz.durum === 'muayene_onaylandi' && <div style={{ marginTop: 6, fontSize: 12, color: '#2f4334' }}>Muayene onaylandı — rapor kilitli. {analiz.note_id && <a href={`/dashboard/doktor/notlar/${analiz.note_id}`} style={{ color: '#2f4334' }}>Notu aç →</a>}</div>}
                  {analiz.durum === 'onaylandi' && analiz.note_id && <div style={{ marginTop: 6, fontSize: 12, color: '#2f4334' }}>Objektif&apos;e eklendi. <a href={`/dashboard/doktor/notlar/${analiz.note_id}`} style={{ color: '#2f4334' }}>Notu aç →</a> · <a href={hastaBelgelerHref(patientId)} style={{ color: '#2f4334' }}>← Belgeler</a></div>}
                </div>

                {kural.goruntuOkumaKoprusu && ['fundus', 'oct', 'dis_goz'].includes(analiz.modality_final) && analiz.durum !== 'kalite_dusuk' && (
                  <div style={{ ...toolsCard, marginBottom: 10, fontSize: 13, color: '#3b2e24' }}>
                    <div style={etiket}>Göz görüntü okumasına aktar <span style={{ fontWeight: 400, color: '#8b7d70' }}>· dual-sign taslak — uzman onayı Göz › Görüntü&apos;de</span></div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <select value={kopruGoz} onChange={(e) => setKopruGoz(e.target.value as 'sag' | 'sol' | '')} style={{ ...toolsInput, width: 'auto' }} aria-label="Aktarılacak göz">
                        <option value="" style={{ color: '#000' }}>Göz seçin (zorunlu)</option>
                        <option value="sag" style={{ color: '#000' }}>OD (sağ)</option>
                        <option value="sol" style={{ color: '#000' }}>OS (sol)</option>
                      </select>
                      <button type="button" onClick={() => void gozeAktar()} disabled={!kopruGoz} style={{ ...btnGhost, opacity: kopruGoz ? 1 : 0.5 }}>Taslak olarak gönder</button>
                      {kopruMesaj && <span style={{ fontSize: 12, color: /gönderildi/.test(kopruMesaj) ? '#2f4334' : '#a45b3e' }}>{kopruMesaj} {/gönderildi/.test(kopruMesaj) && <a href={hastaDosyaHref(patientId, 'goz')} style={{ color: '#2f4334' }}>Göz sekmesini aç →</a>}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#8b7d70', marginTop: 6 }}>Tek alan fundus güven üst sınırı %70. DR evresi aktarılmaz — evre DR kartında hekim kilidi.</div>
                  </div>
                )}
                {rapor.oneri && <div style={{ ...toolsCard, marginBottom: 10, fontSize: 13, color: '#3b2e24' }}><div style={etiket}>Öneri</div>{rapor.oneri}</div>}
                {rapor.sinirlar.length > 0 && <div style={{ ...toolsCard, marginBottom: 10, fontSize: 12, color: '#8b7d70' }}><div style={etiket}>Sınırlar</div><ul style={{ margin: 0, paddingLeft: 18 }}>{rapor.sinirlar.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}

                <div style={{ ...toolsCard, fontSize: 12 }}>
                  <div style={etiket}>Motorlar</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(analiz.motor_ciktilari || []).map((m, i) => (
                      <span key={i} style={{ border: `1px solid ${m.hata ? 'rgba(164,91,62,0.5)' : m.dogrulanmis ? 'rgba(47,67,52,0.5)' : 'rgba(58,44,34,0.16)'}`, borderRadius: 999, padding: '3px 9px', color: m.hata ? '#a45b3e' : '#3b2e24' }} title={m.hata || (m.dogrulanmis ? 'doğrulanmış motor' : 'genel değerlendirme')}>
                        {m.motor} · {m.tier}{m.dogrulanmis ? ' ✓' : ''}{m.hata ? ' ✗' : ''}
                      </span>
                    ))}
                  </div>
                  {analiz.fusion?.fused?.length ? (
                    <div style={{ marginTop: 8, color: '#8b7d70' }}>
                      {analiz.fusion.fused.map((f) => <div key={f.kod}>{f.label_tr} <span style={{ color: '#3b2e24' }}>p={f.p}</span> · destek {f.sources.join(', ') || '—'}{f.karsi.length ? ` · karşı ${f.karsi.join(', ')}` : ''}</div>)}
                    </div>
                  ) : null}
                  {analiz.fusion?.duzeltmeler?.length ? <div style={{ marginTop: 6, color: '#8b7d70' }}>Sistem düzeltmeleri: {analiz.fusion.duzeltmeler.join('; ')}</div> : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
