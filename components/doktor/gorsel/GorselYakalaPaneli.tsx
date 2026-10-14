'use client';

/**
 * GORSEL-YAKALAMA-01 — universal (chapter-agnostic) inline capture widget.
 *
 * This is the ONLY piece step 2 of the brief asks to be reusable: open the camera (or pick a file)
 * right where the doctor is, downscale a photo the proven way (components/doktor/AsiKarnesiOkuma.tsx —
 * long edge ≤ 2400px JPEG), or attach a PDF, and upload it tagged to the current visit via
 * POST /api/doktor/goruntuleme/yukle. Photo only, no video (scoped). No clinical fields live here —
 * no lesion cards, no body map, no PASI/EASI, no fundus fields, no otoscopy vocabulary: every chapter
 * that wants capture mounts THIS component with its own modality list and label, then does its own
 * chapter-specific follow-up (attach-to-lesion, AI-assist call, …) with the uploaded row this returns.
 */
import { useRef, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import {
  GORSEL_YAKALAMA_FOTO_KENAR_AZAMI,
  GORSEL_YAKALAMA_PDF_AZAMI_BAYT,
  gorselYakalamaTuru,
} from '@/lib/doktor/gorselYakalama';

export interface GorselYakalamaSonucu {
  id: string;
  patient_id: string;
  modalite: string;
  vucut_bolgesi: string | null;
  dosya_url: string;
  goruntuleme_tarihi: string | null;
  visit_id: string | null;
}

export interface ModaliteSecenegi { value: string; label: string }

/** Mirrors AsiKarnesiOkuma.tsx's karneDosyasiHazirla — same proven downscale, generalized for reuse. */
async function gorselFotoKucult(dosya: File): Promise<File> {
  if (!dosya.type.startsWith('image/')) return dosya;
  if (dosya.size < 1_200_000 && ['image/jpeg', 'image/png', 'image/webp'].includes(dosya.type)) return dosya;
  try {
    const bmp = await createImageBitmap(dosya);
    const oran = Math.min(1, GORSEL_YAKALAMA_FOTO_KENAR_AZAMI / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * oran);
    canvas.height = Math.round(bmp.height * oran);
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.9));
    if (!blob) return dosya;
    return new File([blob], (dosya.name || 'yakalama').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return dosya; // HEIC vb. tarayıcıda çözülemedi — sunucu kendi hata mesajını verir
  }
}

const girdi: React.CSSProperties = { width: '100%', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.16)', color: '#3b2e24', borderRadius: 8, padding: '8px 10px', fontSize: 13.5, minHeight: 38 };
const ikincilDugme: React.CSSProperties = { background: '#F6F0E4', color: CHROME_RENK.muted, border: '1px solid rgba(58,44,34,0.16)', borderRadius: 8, padding: '9px 13px', fontSize: 13, cursor: 'pointer', minHeight: 40 };
const birincilDugme: React.CSSProperties = { background: '#0F9B8E', color: 'white', border: 'none', borderRadius: 8, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 };

export default function GorselYakalaPaneli({
  patientId,
  visitId,
  modaliteSecenekleri,
  varsayilanModalite,
  bolgeEtiketi,
  bolgeGerekli = false,
  pdfIzinli = true,
  onYuklendi,
}: {
  patientId: string;
  /** Nullable visitId: the inline capture widget tags the upload with the muayenenin sessionId; without
   * one (e.g. opened from the generic archive) the upload still works, just unlinked to a visit. */
  visitId: string | null;
  modaliteSecenekleri: ModaliteSecenegi[];
  varsayilanModalite: string;
  /** e.g. "Bölge" (derm), "Görünüm notu" (plastik) — purely a free-text label, no clinical vocabulary here. */
  bolgeEtiketi?: string;
  bolgeGerekli?: boolean;
  /** PDF attach at the same inline point — same visit-linkage, same ownership rules as a photo. */
  pdfIzinli?: boolean;
  onYuklendi: (sonuc: GorselYakalamaSonucu, tur: 'foto' | 'pdf') => void;
}) {
  const kameraRef = useRef<HTMLInputElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [modalite, setModalite] = useState(varsayilanModalite);
  const [bolge, setBolge] = useState('');
  const [asama, setAsama] = useState<'bos' | 'yukleniyor' | 'tamam' | 'hata'>('bos');
  const [hata, setHata] = useState('');

  async function dosyaYukle(secilen: File) {
    setHata('');
    if (bolgeGerekli && !bolge.trim()) {
      setHata(`${bolgeEtiketi || 'Bölge'} gerekli.`);
      return;
    }
    const tur = gorselYakalamaTuru(secilen.type);
    if (!tur) {
      setHata('Desteklenmeyen dosya türü — yalnız fotoğraf veya PDF.');
      return;
    }
    if (tur === 'pdf' && secilen.size > GORSEL_YAKALAMA_PDF_AZAMI_BAYT) {
      setHata(`PDF ${Math.round(GORSEL_YAKALAMA_PDF_AZAMI_BAYT / 1024 / 1024)} MB sınırını aşıyor.`);
      return;
    }
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      setAsama('yukleniyor');
      const dosya = tur === 'foto' ? await gorselFotoKucult(secilen) : secilen;
      const fd = new FormData();
      fd.append('file', dosya);
      fd.append('hastaId', patientId);
      fd.append('modalite', modalite);
      if (bolge.trim()) fd.append('vucut_bolgesi', bolge.trim());
      if (visitId) fd.append('visitId', visitId);
      const r = await fetch('/api/doktor/goruntuleme/yukle', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.goruntuleme?.id) {
        setHata(j.error || 'Yüklenemedi.');
        setAsama('hata');
        return;
      }
      setAsama('tamam');
      onYuklendi(j.goruntuleme as GorselYakalamaSonucu, tur);
    } catch {
      setHata('Yüklenemedi.');
      setAsama('hata');
    }
  }

  function secildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = '';
    if (dosya) void dosyaYukle(dosya);
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input ref={kameraRef} type="file" accept="image/*" capture="environment" onChange={secildi} style={{ display: 'none' }} data-gorsel-yakalama-kamera="" />
      <input ref={dosyaRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={secildi} style={{ display: 'none' }} data-gorsel-yakalama-dosya="" />
      {pdfIzinli && <input ref={pdfRef} type="file" accept="application/pdf" onChange={secildi} style={{ display: 'none' }} data-gorsel-yakalama-pdf="" />}

      {modaliteSecenekleri.length > 1 && (
        <select aria-label="Görüntü türü" value={modalite} onChange={(e) => setModalite(e.target.value)} style={girdi}>
          {modaliteSecenekleri.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      )}
      {bolgeEtiketi !== undefined && (
        <input
          aria-label={bolgeEtiketi || 'Bölge'}
          value={bolge}
          onChange={(e) => setBolge(e.target.value)}
          placeholder={bolgeEtiketi || 'Bölge'}
          style={girdi}
        />
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => kameraRef.current?.click()} disabled={asama === 'yukleniyor'} style={birincilDugme}>📷 Fotoğraf çek</button>
        <button type="button" onClick={() => dosyaRef.current?.click()} disabled={asama === 'yukleniyor'} style={ikincilDugme}>Fotoğraf seç</button>
        {pdfIzinli && <button type="button" onClick={() => pdfRef.current?.click()} disabled={asama === 'yukleniyor'} style={ikincilDugme}>📄 PDF ekle</button>}
      </div>

      {asama === 'yukleniyor' && <div style={{ fontSize: 12.5, color: CHROME_RENK.muted }}>Yükleniyor…</div>}
      {asama === 'tamam' && <div style={{ fontSize: 12.5, color: '#2E6E4E' }}>Eklendi{visitId ? ' — bu muayeneye bağlandı.' : '.'}</div>}
      {hata && <div role="alert" style={{ fontSize: 12.5, color: CHROME_RENK.warn }}>{hata}</div>}
      {!visitId && <div style={{ fontSize: 11, color: CHROME_RENK.muted }}>Not: bu ekranda bir muayene bağlamı bulunamadı — kayıt hastanın genel görüntüleme arşivine eklenir.</div>}
    </div>
  );
}
