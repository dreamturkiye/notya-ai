'use client';
import { EylemKarti, EylemToplu, type EylemHasta, type EylemOneriGorunumu } from '@/components/core/EylemKarti';
import HafifMarkdown from '@/components/asistan/HafifMarkdown';

export const dynamic = 'force-dynamic';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CihazdanAl, CihazDosyasi } from '@/components/core/CihazdanAl';
import {
  getAccessToken, getAccessTokenAsync,
  toolsShell,
  toolsCard,
  toolsErrorBox,
} from '@/lib/doktor/toolsUi';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import { ilacKontroluGerekliMi, ilacKontrolSonucu } from '@/lib/doktor/receteAktarim';
import IlacUyumKarti, { planaGoreIlacOnerisiOnbellekli, type IlacUyumDurumu } from '@/components/doktor/IlacUyumKarti';
import {
  onaySonrasiHedef, onaylananNotYolu, hastaDosyasiYolu,
  ONAYLANAN_NOTU_AC, HASTA_LISTESINE_DON, ANA_SAYFAYA_DON,
  HASTA_LISTESI_YOLU, DOKTOR_ANA_SAYFA_YOLU,
} from '@/lib/doktor/onaySonrasiYol';
import type { BransKapsami } from '@/lib/specialties/kapsam';
import { istemciKapsami } from '@/lib/specialties/kapsamIstemci';
import { bransEtiketi } from '@/lib/doktor/bransAdlari';
import YasamsalBulgularFormu from '@/components/doktor/YasamsalBulgularFormu';
import { satirBasiNumarala } from '@/lib/doktor/satirBasiNumarala';
import MuayeneEkleri from '@/components/doktor/MuayeneEkleri';
import {
  NOT_YENIDEN_DEGERLENDIR_DEBOUNCE_MS,
  NOT_YENIDEN_DEGERLENDIR_ISTEK,
} from '@/lib/doktor/notYenidenDegerlendir';

interface IlacOner { ad?: string; doz?: string; kullanim?: string; sure?: string }
interface IcdOner { code?: string; description_tr?: string; description?: string; is_primary?: boolean }
interface ReceteOner { etkenMadde?: string; ticariOrnek?: string; doz?: string; kullanim?: string; sure?: string; not?: string; sgkListesinde?: boolean }
interface Vitaller { kilo?: number | null; boy?: number | null; ates?: number | null; nabiz?: number | null; spo2?: number | null; tansiyon?: string | null }
interface Taslak { subjektif: string; objektif: string; degerlendirme: string; plan: string }
interface Eylem { tur?: string; tarih?: string; saat?: string; kim?: string; aciklama?: string; durum?: 'oneri' | 'eklendi' | 'hata' }
interface KMesaj { rol: 'doktor' | 'asistan'; icerik: string }

interface PendingNote {
  id: string;
  maskedPatient: string;
  patientId: string | null;
  sessionId: string | null;
  specialty: string;
  date: string;
  subjektif: string;
  objektif: string;
  degerlendirme: string;
  plan: string;
  tani: string;
  ilaclar: IlacOner[];
  icdKodlari: IcdOner[];
  kritikBulgular: string[];
  hastaOzeti: string;
  basvuruYakinmasi: string;
  vitaller: Vitaller | null;
  buyumePersentilleri?: { kilo?: string; boy?: string; basCevresi?: string; vki?: string; vkiSinif?: string } | null;
  receteOnerisi: ReceteOner[];
  alarmBulgulari: string[];
  aiDegerlendirme: string;
  /** BRANS-ALAN-SIZMASI: sunucu hesaplar — ölçüm alanları + hasta/veli hitabı (yoksa baseline, "hasta") */
  bransKapsami: BransKapsami;
}

function normalizeNotes(payload: unknown): PendingNote[] {
  if (!Array.isArray(payload)) return [];

  return payload.map((item, idx) => {
    const n = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      id: String(n.id ?? idx),
      maskedPatient: String(n.maskedPatient ?? 'Hasta'),
      patientId: n.patientId ? String(n.patientId) : null,
      sessionId: n.sessionId ? String(n.sessionId) : null,
      specialty: String(n.specialty ?? 'Genel'),
      date: String(n.date ?? ''),
      subjektif: satirBasiNumarala(String(n.subjektif ?? '')),
      objektif: satirBasiNumarala(String(n.objektif ?? '')),
      degerlendirme: satirBasiNumarala(String(n.degerlendirme ?? '')),
      plan: satirBasiNumarala(String(n.plan ?? '')),
      tani: String(n.tani ?? ''),
      ilaclar: Array.isArray(n.ilaclar) ? (n.ilaclar as IlacOner[]) : [],
      icdKodlari: Array.isArray(n.icdKodlari) ? (n.icdKodlari as IcdOner[]) : [],
      kritikBulgular: Array.isArray(n.kritikBulgular) ? (n.kritikBulgular as string[]).map(String) : [],
      hastaOzeti: String(n.hastaOzeti ?? ''),
      basvuruYakinmasi: String(n.basvuruYakinmasi ?? ''),
      vitaller: (n.vitaller && typeof n.vitaller === 'object') ? (n.vitaller as Vitaller) : null,
      buyumePersentilleri: (n.buyumePersentilleri && typeof n.buyumePersentilleri === 'object') ? (n.buyumePersentilleri as PendingNote['buyumePersentilleri']) : null,
      receteOnerisi: Array.isArray(n.receteOnerisi) ? (n.receteOnerisi as ReceteOner[]) : [],
      alarmBulgulari: Array.isArray(n.alarmBulgulari) ? (n.alarmBulgulari as string[]).map(String) : [],
      aiDegerlendirme: String(n.aiDegerlendirme ?? ''),
      bransKapsami: istemciKapsami(n.bransKapsami as BransKapsami | undefined),
    };
  });
}

function snippet(text: unknown, max = 120): string {
  const value = String(text ?? '').trim();
  if (!value) return 'Not içeriği boş';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function IncelemePage() {
  const router = useRouter();
  const [notes, setNotes] = useState<PendingNote[]>([]);
  /* NOTYA-ONAY-DONUS-01: "kuyrukta kaç not kaldı" kararı onay yanıtı döndüğünde verilir —
     o an ekrandaki (render sırasındaki) liste bayat olabilir. Ref her zaman en güncel liste. */
  const notlarRef = useRef<PendingNote[]>([]);
  const notlariYaz = (liste: PendingNote[]) => { notlarRef.current = liste; setNotes(liste); };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  // NOTYA-ONAY-DONUS-01: kuyrukta sıra işlenirken onaylanan notu gözden kaçırmayalım —
  // sayfa değişmediği durumda onaylanan nota giden bağlantı burada tutulur.
  const [sonOnaylanan, setSonOnaylanan] = useState<{ id: string; hasta: string; patientId: string | null } | null>(null);
  const [acikId, setAcikId] = useState('');
  const [taslak, setTaslak] = useState<Taslak>({ subjektif: '', objektif: '', degerlendirme: '', plan: '' });
  // Kaan/Gökhan (2026-09-10): başlık (hasta, branş, tarih) dışında her şey düzenlenebilir
  const [basvuruTaslak, setBasvuruTaslak] = useState('');
  const [vitalTaslak, setVitalTaslak] = useState<Record<string, string>>({});
  const [alarmTaslak, setAlarmTaslak] = useState('');   // satır başına bir madde
  const [ozetTaslak, setOzetTaslak] = useState('');
  const [uyum, setUyum] = useState<{ id: string; durum: IlacUyumDurumu } | null>(null);
  const [ilacTaslak, setIlacTaslak] = useState('');   // "Ad — doz — kullanım — süre", satır başına bir ilaç
  const [icdTaslak, setIcdTaslak] = useState<IcdOner[]>([]);
  const [receteTaslak, setReceteTaslak] = useState<ReceteOner[]>([]);
  const [aiDegTaslak, setAiDegTaslak] = useState('');
  const [kMesajlar, setKMesajlar] = useState<KMesaj[]>([]);
  const [kGirdi, setKGirdi] = useState('');
  const [kBekliyor, setKBekliyor] = useState(false);
  const [eylemler, setEylemler] = useState<Eylem[]>([]);
  // NOTYA-EYLEM: Ayşe'nin bu notta hazırladığı dosya kayıtları (aşı, ilaç, ölçüm…) ve kart başlığı
  // için hasta adı. Öneriler sunucudan gelir; istemci hiçbir zaman kendi başına hasta seçmez.
  const [eylemOnerileri, setEylemOnerileri] = useState<EylemOneriGorunumu[]>([]);
  const [eylemHastasi, setEylemHastasi] = useState<EylemHasta | null>(null);
  const atlaOtomatikRef = useRef(true);
  const kBekliyorRef = useRef(false);
  // NOTYA-RECETE-05: açık notun ilk Plan metni — Onayla'da 'Plan düzenlendi mi' karşılaştırması için.
  const ilkPlanRef = useRef<string | null>(null);

  function ilacMetniniCoz(metin: string): { ad: string; doz: string; kullanim: string; sure: string }[] {
    return metin.split('\n').map((satir) => satir.trim()).filter(Boolean).map((satir) => {
      const p = satir.split(' — ').map((x) => x.trim())
      return { ad: p[0] || '', doz: p[1] || '', kullanim: p[2] || '', sure: p[3] || '' }
    }).filter((i) => i.ad)
  }

  const notuAc = (note: PendingNote) => {
    atlaOtomatikRef.current = true;
    setAcikId(note.id);
    ilkPlanRef.current = note.plan;
    setTaslak({ subjektif: note.subjektif, objektif: note.objektif, degerlendirme: note.degerlendirme, plan: note.plan });
    setBasvuruTaslak(note.basvuruYakinmasi || '');
    setAlarmTaslak((note.alarmBulgulari || []).join('\n'));
    setOzetTaslak(note.hastaOzeti || '');
    setIlacTaslak((note.ilaclar || []).map((il) => [il.ad, il.doz, il.kullanim, il.sure].filter(Boolean).join(' — ')).join('\n'));
    setIcdTaslak(note.icdKodlari || []);
    setReceteTaslak(note.receteOnerisi || []);
    setAiDegTaslak(note.aiDegerlendirme || '');
    setVitalTaslak(Object.fromEntries(Object.entries((note.vitaller || {}) as Record<string, unknown>).map(([k, v]) => [k, v == null ? '' : String(v)])));
    setKMesajlar([]);
    setKGirdi('');
    setEylemler([]);
  };

  // NOTYA-KONSULT-03: not üzerinde Ayşe ile konsult + sözle düzenleme.
  // sessiz=true: form yenilemesinde otomatik yeniden değerlendirme — sohbeti doldurmaz.
  const konsultGonder = async (note: PendingNote, override?: string, opts?: { sessiz?: boolean; sabitleSoap?: boolean }) => {
    const soru = (override ?? kGirdi).trim();
    if (!soru || kBekliyorRef.current) return;
    const yeni: KMesaj[] = [...kMesajlar, { rol: 'doktor', icerik: soru }];
    if (!opts?.sessiz) {
      setKMesajlar(yeni);
      setKGirdi('');
    }
    kBekliyorRef.current = true;
    setKBekliyor(true);
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch('/api/doktor/not-konsult', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id, taslak: { ...taslak, basvuruYakinmasi: basvuruTaslak, vitaller: vitalTaslak, alarmBulgulari: alarmTaslak.split('\n').map((x) => x.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean), hastaOzeti: ozetTaslak, ilaclar: ilacMetniniCoz(ilacTaslak), icdKodlari: icdTaslak, receteOnerisi: receteTaslak, aiDegerlendirme: aiDegTaslak }, mesajlar: yeni }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ayşe yanıt veremedi.');
      if (!opts?.sessiz) setKMesajlar([...yeni, { rol: 'asistan', icerik: String(d.cevap || '') }]);
      else if (d.cevap) setKMesajlar((prev) => [...prev, { rol: 'asistan', icerik: `↻ ${String(d.cevap)}` }]);
      const dz = (d.duzenlemeler || {}) as Record<string, unknown>;
      atlaOtomatikRef.current = true;
      if (!opts?.sabitleSoap) {
        const g: Taslak = { ...taslak };
        (['subjektif', 'objektif', 'degerlendirme', 'plan'] as const).forEach((a) => {
          if (typeof dz[a] === 'string' && (dz[a] as string).trim()) g[a] = dz[a] as string;
        });
        setTaslak(g);
        if (typeof dz.basvuruYakinmasi === 'string') setBasvuruTaslak(dz.basvuruYakinmasi as string);
        if (dz.vitaller && typeof dz.vitaller === 'object' && !Array.isArray(dz.vitaller)) setVitalTaslak((v) => ({ ...v, ...Object.fromEntries(Object.entries(dz.vitaller as Record<string, unknown>).map(([k, x]) => [k, String(x ?? '')])) }));
      }
      if (Array.isArray(dz.alarmBulgulari)) setAlarmTaslak((dz.alarmBulgulari as unknown[]).map(String).join('\n'));
      if (typeof dz.hastaOzeti === 'string') setOzetTaslak(dz.hastaOzeti as string);
      if (Array.isArray(dz.ilaclar)) setIlacTaslak((dz.ilaclar as unknown[]).map((it) => { const o = it as Record<string, unknown>; return [o.ad, o.doz, o.kullanim, o.sure].filter(Boolean).join(' — ') }).join('\n'));
      if (Array.isArray(dz.icdKodlari)) setIcdTaslak((dz.icdKodlari as unknown[]).map((it) => { const o = it as Record<string, unknown>; return { code: String(o.code || ''), description_tr: String(o.description_tr || o.description || ''), is_primary: !!o.is_primary } }).filter((k) => k.code));
      if (Array.isArray(dz.receteOnerisi)) setReceteTaslak((dz.receteOnerisi as unknown[]).map((it) => { const o = it as Record<string, unknown>; return { ticariOrnek: String(o.ticariOrnek || ''), etkenMadde: String(o.etkenMadde || ''), doz: String(o.doz || ''), kullanim: String(o.kullanim || ''), sure: String(o.sure || ''), sgkListesinde: !!o.sgkListesinde, not: String(o.not || '') } }).filter((r) => r.ticariOrnek));
      if (typeof dz.aiDegerlendirme === 'string' && dz.aiDegerlendirme.trim()) setAiDegTaslak(dz.aiDegerlendirme as string);
      if (Array.isArray(d.eylemler) && d.eylemler.length) {
        setEylemler((prev) => [...prev, ...(d.eylemler as Eylem[]).map((e) => ({ ...e, durum: 'oneri' as const }))]);
      }
      if (Array.isArray(d.eylemOnerileri) && d.eylemOnerileri.length) {
        setEylemOnerileri((prev) => [...prev, ...(d.eylemOnerileri as EylemOneriGorunumu[])]);
        if (d.eylemHastasi) setEylemHastasi(d.eylemHastasi as EylemHasta);
      }
    } catch (e) {
      if (!opts?.sessiz) setKMesajlar([...yeni, { rol: 'asistan', icerik: e instanceof Error ? e.message : 'Ayşe yanıt veremedi.' }]);
    } finally {
      kBekliyorRef.current = false;
      setKBekliyor(false);
    }
  };

  const eylemOnayla = async (note: PendingNote, idx: number) => {
    const e = eylemler[idx];
    if (!e || e.durum !== 'oneri') return;
    if (!note.patientId) {
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'hata' } : x)));
      return;
    }
    try {
      const token = await getAccessTokenAsync();
      const saat = e.saat || '10:00';
      const baslangic = new Date(`${e.tarih}T${saat}:00+03:00`);
      const sureDk = e.tur === 'takip_aramasi' ? 15 : 20;
      const bitis = new Date(baslangic.getTime() + sureDk * 60000);
      const tur = e.tur === 'takip_aramasi' ? 'diger' : 'kontrol';
      const notlar = e.tur === 'takip_aramasi'
        ? `📞 Takip araması (${e.kim === 'sekreter' ? 'sekreter/hemşire arayacak' : 'doktor arayacak'})${e.aciklama ? `: ${e.aciklama}` : ''} — arama notunu buraya yazın.`
        : `Kontrol muayenesi${e.aciklama ? `: ${e.aciklama}` : ''}`;
      const res = await fetch('/api/doktor/randevular', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: note.patientId, baslangic: baslangic.toISOString(), bitis: bitis.toISOString(), tur, notlar }),
      });
      if (!res.ok) throw new Error();
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'eklendi' } : x)));
    } catch {
      setEylemler((prev) => prev.map((x, i) => (i === idx ? { ...x, durum: 'hata' } : x)));
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const token = await getAccessTokenAsync();
        if (!token) {
          if (!cancelled) {
            setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
            notlariYaz([]);
          }
          return;
        }

        const res = await fetch('/api/notes?pending=true', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok) {
          const message =
            data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
              ? (data as { error: string }).error
              : 'Bekleyen notlar alınamadı.';
          setError(message);
          notlariYaz([]);
          return;
        }

        notlariYaz(normalizeNotes(data));
      } catch {
        if (!cancelled) {
          setError('Bekleyen notlar alınamadı. Bağlantınızı kontrol edin.');
          notlariYaz([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Formda klinik yenileme → Ayşe notu yeniden okur (tüm branşlar)
  useEffect(() => {
    if (!acikId) return;
    if (atlaOtomatikRef.current) {
      atlaOtomatikRef.current = false;
      return;
    }
    if (kBekliyorRef.current) return;
    const note = notlarRef.current.find((n) => n.id === acikId);
    if (!note) return;
    const t = setTimeout(() => {
      void konsultGonder(note, NOT_YENIDEN_DEGERLENDIR_ISTEK, { sessiz: true, sabitleSoap: true });
    }, NOT_YENIDEN_DEGERLENDIR_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basvuruTaslak, vitalTaslak, taslak.subjektif, taslak.objektif, taslak.degerlendirme, taslak.plan, acikId]);

  /**
   * NOTYA-ONAY-DONUS-01 (Gökhan, 2026-09-17, canlı): onay notu listeden siliyor, başka hiçbir
   * şey yapmıyordu. Kuyrukta tek not varsa hekim "Bekleyen not yok" yazan boş bir sayfada
   * kalıyor, az önce onayladığı nota da hastanın dosyasına da dönemiyordu.
   * Artık: kuyruk boşaldıysa notun kesinleşmiş haline gidilir (hasta dosyasından açılan sayfa);
   * kuyrukta iş varsa akış bölünmez ama onaylanan nota giden bağlantı ekranda kalır.
   */
  // NOTYA-RECETE-05: açık notta Plan düzenlenince Ayşe İlaçlar listesini arka planda önceden okur (önbellekli).
  useEffect(() => {
    if (!acikId || ilkPlanRef.current === null) return;
    const plan = (taslak.plan || '').trim();
    if (!plan || plan === String(ilkPlanRef.current).trim()) return;
    const zamanlayici = setTimeout(() => {
      void (async () => {
        try {
          await planaGoreIlacOnerisiOnbellekli(await getAccessTokenAsync(), acikId, taslak.plan, { ...taslak, basvuruYakinmasi: basvuruTaslak, vitaller: vitalTaslak, hastaOzeti: ozetTaslak, ilaclar: ilacMetniniCoz(ilacTaslak), icdKodlari: icdTaslak, receteOnerisi: receteTaslak, aiDegerlendirme: aiDegTaslak });
        } catch { /* Onayla'da yeniden denenir */ }
      })();
    }, 2500);
    return () => clearTimeout(zamanlayici);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taslak.plan, acikId]);

  const approve = async (id: string, ilacOnayli?: string) => {
    setError('');
    // NOTYA-RECETE-04 (Kaan, 2026-09-25): açık notta Plan ile İlaçlar listesi ayrışmışsa önce uyum kartı.
    if (acikId === id && ilacOnayli === undefined) {
      const mevcut = ilacMetniniCoz(ilacTaslak);
      const kontrol = ilacKontroluGerekliMi(taslak.plan, ilkPlanRef.current, mevcut);
      if (kontrol.gerekli) {
        setUyum({ id, durum: { tur: 'kontrol' } });
        const oneri = await planaGoreIlacOnerisiOnbellekli(await getAccessTokenAsync(), id, taslak.plan, { ...taslak, basvuruYakinmasi: basvuruTaslak, vitaller: vitalTaslak, hastaOzeti: ozetTaslak, ilaclar: mevcut, icdKodlari: icdTaslak, receteOnerisi: receteTaslak, aiDegerlendirme: aiDegTaslak }).catch(() => null);
        const sonuc = ilacKontrolSonucu(kontrol.tutarsiz, mevcut, oneri);
        if (sonuc === 'uyari') { setUyum({ id, durum: { tur: 'uyari', mevcut } }); return; }
        if (sonuc === 'oneri' && oneri) { setUyum({ id, durum: { tur: 'oneri', mevcut, oneri } }); return; }
        setUyum(null);
      }
    }
    const ilacMetni = ilacOnayli ?? ilacTaslak;
    if (ilacOnayli !== undefined) { setIlacTaslak(ilacOnayli); setUyum(null); }
    setBusyId(id);
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch(`/api/notes/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(acikId === id ? { duzenlemeler: { ...taslak, basvuruYakinmasi: basvuruTaslak, vitaller: vitalTaslak, alarmBulgulari: alarmTaslak.split('\n').map((x) => x.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean), hastaOzeti: ozetTaslak, ilaclar: ilacMetniniCoz(ilacMetni), icdKodlari: icdTaslak, receteOnerisi: receteTaslak, aiDegerlendirme: aiDegTaslak } } : {}),
      });

      if (!res.ok) {
        setError('Not onaylanamadı. Lütfen tekrar deneyin.');
        return;
      }

      const onaylanan = notlarRef.current.find((n) => n.id === id) || null;
      const kalan = notlarRef.current.filter((n) => n.id !== id);
      notlariYaz(kalan);
      if (acikId === id) setAcikId('');
      setSonOnaylanan({ id, hasta: onaylanan?.maskedPatient || '', patientId: onaylanan?.patientId ?? null });

      const hedef = onaySonrasiHedef(id, kalan.length);
      if (hedef.tur === 'not') router.push(hedef.yol);
    } catch {
      setError('Not onaylanamadı. Bağlantınızı kontrol edin.');
    } finally {
      setBusyId('');
    }
  };

  const reject = (id: string) => {
    setError('');
    notlariYaz(notlarRef.current.filter((n) => n.id !== id));
  };

  const btnStyle = (bg: string, disabled: boolean): React.CSSProperties => ({
    background: disabled ? '#D8D0BE' : bg,
    color: disabled ? CHROME_RENK.muted : '#FAF8F4',
    padding: '8px 14px',
    borderRadius: 9,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={toolsShell}>
      {uyum ? (
        <IlacUyumKarti durum={uyum.durum} onGuncelleOnayla={(m) => { void approve(uyum.id, m) }} onMevcutlaOnayla={() => { void approve(uyum.id, ilacTaslak) }} onVazgec={() => setUyum(null)} />
      ) : null}
      <div style={{ maxWidth: 1000 }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Doktor</div>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: 0, color: '#2e251d', letterSpacing: '-0.02em' }}>İnceleme Kuyruğu</h1>
        <p style={{ color: CHROME_RENK.muted, fontSize: 14, margin: '6px 0 20px' }}>
          Onay bekleyen klinik notları inceleyin
        </p>

        {error && <div style={{ ...toolsErrorBox, marginTop: 0, marginBottom: 16 }}>{error}</div>}

        {/* NOTYA-ONAY-DONUS-01: kuyrukta iş varken sayfa değişmez — onaylanan not yine de
            erişilebilir kalsın (hekim onayladığı notu gözden kaybetmesin). */}
        {sonOnaylanan && notes.length > 0 && (
          <div style={{ ...toolsCard, marginTop: 0, marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, border: '1px solid rgba(46,110,78,0.4)' }}>
            <span style={{ color: '#2E6E4E', fontSize: 13, fontWeight: 600 }}>✓ Not onaylandı{sonOnaylanan.hasta ? ` — ${sonOnaylanan.hasta}` : ''}</span>
            <a href={onaylananNotYolu(sonOnaylanan.id)} style={{ color: CHROME_RENK.pine, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>{ONAYLANAN_NOTU_AC}</a>
            <a href={hastaDosyasiYolu(sonOnaylanan.patientId, 'muayene')} style={{ color: CHROME_RENK.muted, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>Muayene Geçmişi →</a>
          </div>
        )}

        {loading ? (
          <div style={{ ...toolsCard, textAlign: 'center', color: CHROME_RENK.muted }}>Yükleniyor...</div>
        ) : notes.length === 0 ? (
          /* NOTYA-ONAY-DONUS-01: "Bekleyen not yok" tek başına çıkmazdı — hekimin buradan
             gidecek yeri yoktu. Boş kuyruk artık her zaman çıkış yolu gösterir; son onaylanan
             not varsa önce ona döner. */
          <div style={{ ...toolsCard, textAlign: 'center', color: CHROME_RENK.muted }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: CHROME_RENK.ink }}>Bekleyen not yok</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              {sonOnaylanan ? 'Son not onaylandı — kuyruk boşaldı.' : 'Onay bekleyen klinik not kalmadı.'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 14 }}>
              {sonOnaylanan && (
                <a href={onaylananNotYolu(sonOnaylanan.id)} style={{ color: CHROME_RENK.pine, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>{ONAYLANAN_NOTU_AC}</a>
              )}
              {sonOnaylanan?.patientId && (
                <a href={hastaDosyasiYolu(sonOnaylanan.patientId)} style={{ color: CHROME_RENK.pine, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>Hasta Dosyası →</a>
              )}
              <a href={HASTA_LISTESI_YOLU} style={{ color: CHROME_RENK.muted, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>{HASTA_LISTESINE_DON}</a>
              <a href={DOKTOR_ANA_SAYFA_YOLU} style={{ color: CHROME_RENK.muted, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 36 }}>{ANA_SAYFAYA_DON}</a>
            </div>
          </div>
        ) : (
          notes.map((note) => {
            const busy = busyId === note.id;
            return (
              <div key={note.id} style={{ ...toolsCard, marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: CHROME_RENK.ink, minWidth: 0 }}>
                    {[note.maskedPatient, bransEtiketi(note.specialty), note.date].filter(Boolean).join(' • ')}
                    {acikId === note.id && kBekliyor ? <span style={{ color: '#B4832F', fontWeight: 500 }}> · Ayşe notu yeniden okuyor…</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => approve(note.id)} disabled={busy} style={btnStyle('#3F7D4A', busy)}>
                      {busy ? 'Onaylanıyor...' : 'Onayla'}
                    </button>
                    <button onClick={() => reject(note.id)} disabled={busy} style={btnStyle('#a45b3e', busy)}>
                      Reddet
                    </button>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => (acikId === note.id ? setAcikId('') : notuAc(note))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) (acikId === note.id ? setAcikId('') : notuAc(note)); }}
                  style={{ marginTop: 12, color: CHROME_RENK.muted, fontSize: 13, lineHeight: 1.55, cursor: 'pointer' }}
                >
                  {acikId === note.id ? (
                    /* Kaan (2026-09-10): Ayşe kutusunda Enter notu daraltıyordu — klavye olayı kartın başlığına yükselmesin */
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
                      {/* NOTYA-SOAP-02: tam not incelemesi — doktor DÜZENLEYEREK onaylar; düzenlemeler Ayşe'nin öğrenme verisidir */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 3 }}>Başvuru Yakınması <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>· düzenlenebilir</span></div>
                        <input value={basvuruTaslak} onChange={(e) => setBasvuruTaslak(e.target.value)} placeholder="Hastanın geliş nedeni"
                          style={{ width: '100%', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.14)', borderRadius: 8, color: CHROME_RENK.ink, fontSize: 13, padding: '8px 10px', fontStyle: 'italic', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine }}>Yaşamsal Bulgular <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>· düzenlenebilir</span></span>
                          {/* NOTYA-BLE-01/02 (Kaan 2026-09-15): Bluetooth cihazdan ölçüm + cihaz uygulamasından dosya — core, tüm branşlar */}
                          <CihazdanAl hastaId={note.patientId} notId={note.id} onOlcum={(v) => setVitalTaslak({ ...vitalTaslak, ...v })} />
                          <CihazDosyasi hastaId={note.patientId} notId={note.id} />
                        </div>
                        <MuayeneEkleri hastaId={note.patientId} visitId={note.sessionId} kompakt />
                        {/* BRANS-ALAN-SIZMASI (Kaan 2026-09-17): alanlar notun branş profilinden — baş çevresi yalnız pediatrik bağlamda (KD formunda çıkıyordu) */}
                        <YasamsalBulgularFormu
                          olcumler={note.bransKapsami.olcumler}
                          degerler={vitalTaslak}
                          onDegis={(k, v) => setVitalTaslak({ ...vitalTaslak, [k]: v })}
                          persentiller={note.buyumePersentilleri}
                          eriskinVkiGoster={!note.bransKapsami.pediatrik}
                        />
                      </div>
                      {(['subjektif', 'objektif', 'degerlendirme', 'plan'] as const).map((alan) => (
                        <div key={alan} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 3 }}>
                            {alan === 'subjektif' ? 'Anamnez — Şikayet · Şikayetin Hikayesi · Özgeçmiş · Soygeçmiş' : alan === 'objektif' ? 'Fizik Muayene (+ Laboratuvar / Görüntüleme)' : alan === 'degerlendirme' ? 'Tanı' : 'Tedavi'}
                            <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}> · düzenlenebilir</span>
                          </div>
                          <textarea
                            value={taslak[alan]}
                            onChange={(e) => setTaslak({ ...taslak, [alan]: e.target.value })}
                            rows={Math.min(8, Math.max(2, Math.ceil(taslak[alan].length / 90)))}
                            style={{ width: '100%', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.14)', borderRadius: 8, color: CHROME_RENK.ink, fontSize: 13, lineHeight: 1.5, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Tanı / ICD-10 önerileri <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(onayınıza tabi — otomatik yazılmaz)</span></span>
                          {/* Kaan (2026-09-14): "tanı değişince ICD-10 ve öneriler de değişmeli, AI tüm notu yeniden değerlendirmeli" */}
                          <button type="button" disabled={kBekliyor} onClick={() => konsultGonder(note, NOT_YENIDEN_DEGERLENDIR_ISTEK)} style={{ background: 'transparent', border: '1px solid rgba(180,131,47,0.4)', color: '#B4832F', borderRadius: 999, padding: '2px 10px', fontSize: 11, cursor: kBekliyor ? 'default' : 'pointer', opacity: kBekliyor ? 0.5 : 1 }}>🔄 Notu AI ile yeniden değerlendir</button>
                        </div>
                        {icdTaslak.length > 0 ? (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {icdTaslak.map((k, i2) => (
                              <span key={i2} style={{ fontSize: 12, fontWeight: k.is_primary ? 700 : 500, padding: '4px 10px', borderRadius: 999, background: '#E4F3F1', color: CHROME_RENK.pine, border: k.is_primary ? `1px solid ${CHROME_RENK.pine}` : '1px solid transparent' }}>
                                {k.code} · {k.description_tr || k.description || ''}
                              </span>
                            ))}
                          </div>
                        ) : <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>ICD-10 önerisi yok</div>}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 3 }}>İlaçlar <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(her satır bir ilaç: Ad — doz — kullanım — süre · düzenlenebilir)</span></div>
                        <textarea value={ilacTaslak} onChange={(e) => setIlacTaslak(e.target.value)} rows={Math.max(2, ilacTaslak.split('\n').length)}
                          placeholder="Örn. D vitamini — 600 ünite/gün — Günde 1 kez oral — Devam"
                          style={{ width: '100%', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.14)', borderRadius: 8, color: CHROME_RENK.ink, fontSize: 13, lineHeight: 1.55, padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                      {aiDegTaslak.trim() && (
                        <div style={{ marginBottom: 10, background: '#FBF3DE', border: '1px solid rgba(180,131,47,0.35)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#B4832F', marginBottom: 5 }}>Ayşe'nin değerlendirmesi <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(öneridir — nota ve hastaya yansımaz, yalnız size)</span></div>
                          <div style={{ fontSize: 13, color: CHROME_RENK.ink }}><HafifMarkdown metin={aiDegTaslak} /></div>
                        </div>
                      )}
                      {receteTaslak.length > 0 && (
                        <div style={{ marginBottom: 10, background: '#E4F3F1', border: '1px solid rgba(47,67,52,0.35)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 5 }}>Ayşe'nin reçete önerisi <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(öneridir — reçeteyi doktor yazar)</span></div>
                          {receteTaslak.map((r, i2) => (
                            <div key={i2} style={{ fontSize: 13, color: CHROME_RENK.ink, marginBottom: 3 }}>
                              • {[r.ticariOrnek, r.etkenMadde ? `(${r.etkenMadde})` : '', r.doz, r.kullanim, r.sure].filter(Boolean).join(' — ')}
                              {r.sgkListesinde && <span style={{ marginLeft: 6, fontSize: 11, color: '#2E6E4E' }}>SGK ✓</span>}
                              {r.not && <div style={{ fontSize: 12, color: '#B4832F', marginLeft: 12 }}>⚠ {r.not}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 3 }}>Evde dikkat edilmesi gerekenler <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>({note.bransKapsami.hitap.evdeDikkatHedefi} anlatılacak · her satır bir madde · düzenlenebilir)</span></div>
                        <textarea value={alarmTaslak} onChange={(e) => setAlarmTaslak(e.target.value)} rows={Math.max(3, alarmTaslak.split('\n').length)}
                          placeholder="Her satıra bir uyarı yazın"
                          style={{ width: '100%', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.14)', borderRadius: 8, color: CHROME_RENK.ink, fontSize: 13, lineHeight: 1.55, padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                      {note.kritikBulgular.length > 0 && (
                        <div style={{ marginBottom: 10, background: '#FBF3DE', border: '1px solid rgba(180,131,47,0.35)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#B4832F', marginBottom: 3 }}>Dikkate almayı düşünür müsünüz? <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(öneridir — nota ve hastaya yansımaz)</span></div>
                          {note.kritikBulgular.map((kb, i2) => <div key={i2} style={{ fontSize: 13, color: '#7A5B1E' }}>• {kb}</div>)}
                        </div>
                      )}
                      <div style={{ background: '#F6F0E4', border: '1px dashed rgba(58,44,34,0.16)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* BRANS-ALAN-SIZMASI: "veli" yalnız pediatrik bağlamda — KD/dahiliye/göz/derm notunda "Hasta özeti" */}
                          <span>{note.bransKapsami.hitap.ozetEtiketi} <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>· portala gider · düzenlenebilir</span></span>
                          <button type="button" disabled={kBekliyor} onClick={() => konsultGonder(note, note.bransKapsami.hitap.ozetYenileIstegi)} style={{ background: 'transparent', border: '1px solid rgba(47,67,52,0.4)', color: CHROME_RENK.pine, borderRadius: 999, padding: '2px 10px', fontSize: 11, cursor: kBekliyor ? 'default' : 'pointer', opacity: kBekliyor ? 0.5 : 1 }}>↻ Notuma göre yenile</button>
                        </div>
                        <textarea value={ozetTaslak} onChange={(e) => setOzetTaslak(e.target.value)} rows={Math.max(3, Math.ceil(ozetTaslak.length / 110))}
                          placeholder={note.bransKapsami.hitap.ozetYerTutucu}
                          style={{ width: '100%', background: 'transparent', border: '1px solid rgba(58,44,34,0.1)', borderRadius: 6, color: CHROME_RENK.ink, fontSize: 13, lineHeight: 1.55, padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                      {/* NOTYA-KONSULT-03: Ayşe ile not üzerinde konsult, sözle düzenleme, tek-dokunuş takip eylemleri */}
                      <div style={{ marginTop: 12, borderTop: '1px solid rgba(58,44,34,0.08)', paddingTop: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 6 }}>🩺 Ayşe ile bu notu konuşun <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>— soru sorun ya da “planı kısalt” gibi düzenleme isteyin</span></div>
                        {kMesajlar.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
                            {kMesajlar.map((m, i2) => (
                              <div key={i2} style={{ alignSelf: m.rol === 'doktor' ? 'flex-end' : 'flex-start', maxWidth: '92%', background: m.rol === 'doktor' ? CHROME_RENK.pine : '#F6F0E4', color: m.rol === 'doktor' ? '#FAF8F4' : CHROME_RENK.ink, borderRadius: 10, padding: '7px 10px', fontSize: 13, lineHeight: 1.5, whiteSpace: m.rol === 'doktor' ? 'pre-wrap' : 'normal' }}>{m.rol === 'asistan' ? <HafifMarkdown metin={m.icerik} /> : m.icerik}</div>
                            ))}
                            {kBekliyor && <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>Ayşe düşünüyor…</div>}
                          </div>
                        )}
                        {eylemler.map((e, i2) => (
                          <div key={i2} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: e.durum === 'eklendi' ? '#E4F3EA' : '#E4F3F1', border: `1px solid ${e.durum === 'eklendi' ? 'rgba(46,110,78,0.4)' : 'rgba(47,67,52,0.4)'}`, borderRadius: 9, padding: '7px 10px', marginBottom: 6, fontSize: 12, color: CHROME_RENK.ink }}>
                            <span>{e.tur === 'takip_aramasi' ? '📞' : '📅'} {e.tur === 'takip_aramasi' ? `Takip araması (${e.kim === 'sekreter' ? 'sekreter/hemşire' : 'doktor'})` : 'Kontrol randevusu'} — {e.tarih} {e.saat || '10:00'}</span>
                            {e.durum === 'oneri' && <button type="button" onClick={() => eylemOnayla(note, i2)} style={{ background: CHROME_RENK.pine, border: 'none', color: 'white', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Takvime ekle</button>}
                            {e.durum === 'eklendi' && <span style={{ color: '#2E6E4E', fontWeight: 700 }}>✓ Takvime eklendi</span>}
                            {e.durum === 'hata' && <span style={{ color: '#7A3D28' }}>Eklenemedi — takvimden elle ekleyin</span>}
                          </div>
                        ))}
                        {eylemOnerileri.length > 0 && eylemHastasi ? (
                          eylemOnerileri.length > 1
                            ? <EylemToplu oneriler={eylemOnerileri} hasta={eylemHastasi} tokenAl={getAccessTokenAsync} />
                            : <EylemKarti oneri={eylemOnerileri[0]} hasta={eylemHastasi} tokenAl={getAccessTokenAsync} />
                        ) : null}
                        <form onSubmit={(ev) => { ev.preventDefault(); konsultGonder(note); }} style={{ display: 'flex', gap: 6 }}>
                          <input value={kGirdi} onChange={(ev) => setKGirdi(ev.target.value)} placeholder="Örn. prognoz? / kontrolü 5 gün sonraya planla / planı kısalt" style={{ flex: 1, background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.14)', color: CHROME_RENK.ink, borderRadius: 9, padding: '8px 10px', fontSize: 13, minWidth: 0 }} />
                          <button type="submit" disabled={kBekliyor || !kGirdi.trim()} style={{ background: CHROME_RENK.pine, border: 'none', color: 'white', borderRadius: 9, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: kBekliyor || !kGirdi.trim() ? 0.5 : 1 }}>Sor</button>
                        </form>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span role="button" tabIndex={0} onClick={() => setAcikId('')} onKeyDown={(e) => { if (e.key === 'Enter') setAcikId(''); }} style={{ fontSize: 12, color: CHROME_RENK.pine, cursor: 'pointer' }}>Daralt ▴</span>
                        <span role="button" tabIndex={0} onClick={() => window.open(`/dashboard/doktor/notlar/${note.id}/yazdir`, '_blank')} onKeyDown={(e) => { if (e.key === 'Enter') window.open(`/dashboard/doktor/notlar/${note.id}/yazdir`, '_blank'); }} style={{ fontSize: 12, color: CHROME_RENK.muted, cursor: 'pointer' }}>🖨️ Yazdır / PDF</span>
                        {note.ilaclar.length > 0 && (
                          <span role="button" tabIndex={0} onClick={() => window.open(`/dashboard/doktor/notlar/${note.id}/recete`, '_blank')} onKeyDown={(e) => { if (e.key === 'Enter') window.open(`/dashboard/doktor/notlar/${note.id}/recete`, '_blank'); }} style={{ fontSize: 12, color: CHROME_RENK.pine, cursor: 'pointer', fontWeight: 600 }}>🧾 Reçete ({note.ilaclar.length} ilaç)</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {snippet(note.subjektif)}
                      <span style={{ color: CHROME_RENK.pine, marginLeft: 8 }}>Notu incele ▾</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
