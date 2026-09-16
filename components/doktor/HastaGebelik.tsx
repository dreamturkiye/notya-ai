'use client';
/**
 * NOTYA-KHD-01 + clinic-fit — visit-first Kadın Sağlığı & Gebelik.
 * Live gebelik_* CRUD is truth; chapter engines consume recorded izlemler.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { JinekolojiSpine } from '@/specialties/kadin-dogum/ui/JinekolojiSpine'
import { BugunkuJineMuayene } from '@/specialties/kadin-dogum/ui/BugunkuJineMuayene'
import { TrTarihAlan } from '@/specialties/kadin-dogum/ui/TrTarihAlan'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import HastaKdChapter from '@/components/doktor/HastaKdChapter';
import { oncekiGebelikDurumMetni, oncekiGebelikEtiketTuru, oncekiGebelikleriFiltrele } from '@/lib/clinical/gebelikDurum';
import StickyGebeStrip from '@/specialties/kadin-dogum/ui/StickyGebeStrip';
import AktifIsler from '@/specialties/kadin-dogum/ui/AktifIsler';
import IzlemChecklist from '@/specialties/kadin-dogum/ui/IzlemChecklist';
import { KlinikTakvim, DualTakvimAccordion } from '@/specialties/kadin-dogum/ui/KlinikTakvim';
import RiskFormu from '@/specialties/kadin-dogum/ui/RiskFormu';
import VtePaneli from '@/specialties/kadin-dogum/ui/VtePaneli';
import DestekAsiPaneli from '@/specialties/kadin-dogum/ui/DestekAsiPaneli';
import LabPaneli from '@/specialties/kadin-dogum/ui/LabPaneli';
import KararKartlari from '@/specialties/kadin-dogum/ui/KararKartlari';
import SevkCta from '@/specialties/kadin-dogum/ui/SevkCta';
import TehlikeIsaretleri from '@/specialties/kadin-dogum/ui/TehlikeIsaretleri';
import InfertiliteStub from '@/specialties/kadin-dogum/ui/InfertiliteStub';
import DualUyarilar from '@/specialties/kadin-dogum/ui/DualUyarilar';
import NstStrip from '@/specialties/kadin-dogum/ui/NstStrip';
import { kutu, giris, etiketS, btn, DURUM_RENK, DURUM_ETIKET } from '@/specialties/kadin-dogum/ui/clinic-styles';
import {
  aktifIzlemPenceresi,
  buildIzlemCalendar,
  completedSbIzlemNos,
  markVisitsDone,
} from '@/specialties/kadin-dogum/engines/izlem-calendar';
import {
  chapterCalendar,
  chapterDoneIds,
  chapterWindows,
  colpoFromGoruntuleme,
  payloadFromGebelikApi,
  type LiveGebelikVeri,
} from '@/lib/specialties/kadin-dogum-live';
import {
  dualClinicWarnings,
  eksikLabKalemleri,
  mapIdc,
  mapPlurality,
  nstShouldMount,
  sevkFromClinic,
  type ChecklistState,
  type DestekAsiPanel,
  type LabPanel,
} from '@/specialties/kadin-dogum/engines/clinic-fit';
import { gdmKarti, gbsKarti, peKarti, rhKarti } from '@/specialties/kadin-dogum/protocols/karar-kartlari';
import { tehlikeDanismanlikMetni } from '@/specialties/kadin-dogum/protocols/tehlike';

type Uyari = { seviye: 'kritik' | 'dikkat' | 'bilgi'; metin: string };
type Pencere = { no: number; etiket: string; haftaBas: number; haftaSon: number; maddeler: string[]; durum: 'tamamlandi' | 'zamani' | 'gecikmis' | 'ileride' };
type Izlem = { id: string; tarih: string; hafta: number; kilo: number | null; tansiyon_sistolik: number | null; tansiyon_diastolik: number | null; fundus_yuksekligi: number | null; fetal_kalp_atimi: number | null; proteinuri: string | null; usg: Record<string, string | number> | null; not_metni: string | null; checklist?: ChecklistState | null; ogtt?: unknown; gbs_kultur?: string | null };
type Gebelik = {
  id: string; sat: string | null; tdt: string; tdt_kaynak: string; gravida: number | null; para: number | null; abortus: number | null; yasayan: number | null;
  olu_dogum?: number | null; ektopik?: number | null; cogul_gebelik_tipi?: string | null; risk_sinifi?: string | null;
  risk_formu?: { maddeler?: string[] } | null; vte_formu?: { maddeler?: string[] } | null;
  destek_asi?: DestekAsiPanel | null; lab_panel?: LabPanel | null; nst_kayitlari?: unknown;
  indirekt_coombs?: unknown; anti_d_uygulamalari?: unknown;
  kan_grubu: string | null; rh_negatif: boolean; durum: string; dogum_tarihi: string | null; dogum_sekli: string | null;
};
type Veri = {
  gebelik: Gebelik | null;
  izlemler: Izlem[]; gecmis: Array<{ id: string; sat?: string | null; tdt: string; durum: string; dogum_tarihi: string | null; dogum_sekli: string | null }>;
  yas: { hafta: number; gun: number; trimester: number; metin: string; toplamGun: number } | null;
  takvim: Pencere[]; uyarilar: Uyari[]; kiloHedefi: { alt: number; ust: number; etiket: string } | null; gebelikOncesiVki: number | null;
  biyometri?: Array<{ izlemId: string; hafta: number; hc: Bio | null; bpd: Bio | null; ac: Bio | null; fl: Bio | null; efw: number | null; efwGirilen?: number | null; efwKaynak?: 'hadlock' | 'girilen' | null }>;
  lohusa?: { dogumSonrasiGun: number; izlemler: LohusaIzlem[]; takvim: Array<{ no: number; etiket: string; gunBas: number; gunSon: number; maddeler: string[]; durum: 'tamamlandi' | 'zamani' | 'gecikmis' | 'ileride' }> } | null;
  genetikTaramalar?: Array<{ id: string; tur: string; tarih: string; hafta: number | null; veri: Record<string, string | number | null>; ntDegerlendirme?: { bayrak: boolean; not: string } | null }>;
  ileriAnneYasi?: boolean | null;
  kadinSagligi?: Record<string, string | number | null> | null;
  sonrakiRandevu?: { id: string; baslangic: string; bitis: string } | null;
  goruntulemeler?: Array<{ id: string; dosya_url?: string | null; vucut_bolgesi?: string | null; rapor_metni?: string | null; modalite?: string | null; goruntuleme_tarihi?: string | null }>;
  onerilenSonrakiTarih?: string | null;
};
type Bio = { deger: number; p50: number; persentil: number; z: number; durum: 'dusuk' | 'normal' | 'yuksek' };
type LohusaIzlem = { id: string; tarih: string; dogum_sonrasi_gun: number; tansiyon_sistolik: number | null; tansiyon_diastolik: number | null; kanama: string | null; emzirme: string | null; duygu_durumu: string | null; epds_puan: number | null };
type Mod = 'klinik' | 'jinekoloji' | 'lohusa' | 'infertilite';

const RENK = { kritik: '#EF4444', dikkat: '#F59E0B', bilgi: '#38BDF8' } as const;

function trTarih(iso: string | null | undefined) { return iso ? new Date(iso).toLocaleDateString('tr-TR') : '—'; }

function yerelIsoTarih() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function HastaGebelik({ patientId }: { patientId: string }) {
  const [veri, setVeri] = useState<Veri | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [baslatAcik, setBaslatAcik] = useState(false);
  const [izlemAcik, setIzlemAcik] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [g, setG] = useState<Record<string, string>>({});
  const [l, setL] = useState<Record<string, string>>({});
  const [lohusaAcik, setLohusaAcik] = useState(false);
  const [n, setN] = useState<Record<string, string>>({});
  const [genetikTurAcik, setGenetikTurAcik] = useState<'' | 'ikili' | 'uclu-dortlu' | 'nipt' | 'invazif'>('');
  const [mod, setMod] = useState<Mod>('klinik');
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [riskMaddeler, setRiskMaddeler] = useState<string[]>([]);
  const [vteMaddeler, setVteMaddeler] = useState<string[]>([]);
  const [destekAsi, setDestekAsi] = useState<DestekAsiPanel>({});
  const [labPanel, setLabPanel] = useState<LabPanel>({});
  const [randevuOneri, setRandevuOneri] = useState<string | null>(null);
  const [randevuSaat, setRandevuSaat] = useState('10:00');
  const [nstForm, setNstForm] = useState({ tarih: yerelIsoTarih(), category: 'I', sure: '20', toco: false });

  const yukle = useCallback(async () => {
    setYukleniyor(true); setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/gebelik?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Yüklenemedi');
      setVeri(d);
      const geb = d.gebelik as Gebelik | null;
      setRiskMaddeler(geb?.risk_formu?.maddeler || []);
      setVteMaddeler(geb?.vte_formu?.maddeler || []);
      setDestekAsi(geb?.destek_asi || {});
      setLabPanel(geb?.lab_panel || {});
      if (d.lohusa) setMod('lohusa');
      else if (!geb) setMod('jinekoloji');
    } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); } finally { setYukleniyor(false); }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);

  const post = async (body: Record<string, unknown>) => {
    const t = await ensureDoctorAccessToken();
    const r = await fetch('/api/doktor/gebelik', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ patientId, ...body }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'İşlem başarısız');
    return d;
  };
  const sayi = (v?: string) => (v && v.trim() !== '' ? Number(v.replace(',', '.')) : null);

  const baslat = async () => {
    setMesaj(''); setHata('');
    try {
      await post({
        action: 'baslat', sat: f.sat || null, tdt: f.tdt || null,
        gravida: sayi(f.gravida), para: sayi(f.para), abortus: sayi(f.abortus), yasayan: sayi(f.yasayan),
        oluDogum: sayi(f.oluDogum), ektopik: sayi(f.ektopik),
        cogulGebelikTipi: f.cogul || null,
        oncekiSezaryenSayisi: sayi(f.csSayisi), oncekiSezaryenKesiTipi: f.csKesi || null,
        gebelikOncesiKilo: sayi(f.gebelikOncesiKilo), boy: sayi(f.boy), kanGrubu: f.kanGrubu || null, rhNegatif: f.rh === 'negatif',
      });
      setBaslatAcik(false); setF({}); setMod('klinik'); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const izlemKaydet = async (muayeneFormunaEkle: boolean) => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      const usg: Record<string, string | number> = {};
      for (const k of ['crl', 'bpd', 'hc', 'ac', 'fl', 'efw', 'amnion', 'plasenta', 'prezentasyon']) if (g[k]) usg[k] = g[k];
      const d = await post({
        action: 'izlem', gebelikId: veri.gebelik.id, tarih: g.tarih || undefined,
        kilo: sayi(g.kilo), tansiyonSistolik: sayi(g.ts), tansiyonDiastolik: sayi(g.td),
        fundusYuksekligi: sayi(g.fundus), fetalKalpAtimi: sayi(g.fka), proteinuri: g.proteinuri || null,
        usg: Object.keys(usg).length ? usg : null, notMetni: g.not || null, muayeneFormunaEkle,
        checklist, gbsKultur: g.gbs || null,
      });
      if (muayeneFormunaEkle) setMesaj(d.notEkleme?.eklendi ? 'İzlem kaydedildi ve bugünkü muayene formuna eklendi.' : `İzlem kaydedildi. ${d.notEkleme?.sebep || ''}`);
      else setMesaj('İzlem kaydedildi.');
      setRandevuOneri(d.onerilenSonrakiTarih || veri.onerilenSonrakiTarih || null);
      setIzlemAcik(false); setG({}); setChecklist({}); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const lohusaKaydet = async (muayeneFormunaEkle: boolean) => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      const d = await post({ action: 'lohusa-izlem', gebelikId: veri.gebelik.id, tarih: l.tarih || undefined, tansiyonSistolik: sayi(l.ts), tansiyonDiastolik: sayi(l.td), ates: sayi(l.ates), kanama: l.kanama || null, uterusInvolusyon: l.uterus || null, perineInsizyon: l.perine || null, emzirme: l.emzirme || null, duyguDurumu: l.duygu || null, epdsPuan: sayi(l.epds), notMetni: l.not || null, muayeneFormunaEkle });
      setMesaj(muayeneFormunaEkle ? (d.notEkleme?.eklendi ? 'Lohusa izlemi kaydedildi ve bugünkü muayene formuna eklendi.' : `Lohusa izlemi kaydedildi. ${d.notEkleme?.sebep || ''}`) : 'Lohusa izlemi kaydedildi.');
      setLohusaAcik(false); setL({}); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const genetikKaydet = async (tur: 'ikili' | 'uclu-dortlu' | 'nipt' | 'invazif', muayeneFormunaEkle: boolean) => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      let veriObj: Record<string, string | number | null> = {};
      if (tur === 'ikili') veriObj = { ntMm: n.ntMm ? Number(n.ntMm) : null, papA: n.papA || null, freeBhcg: n.freeBhcg || null, kombineRisk: n.kombineRisk || null, riskKategorisi: n.riskKategorisi || null };
      if (tur === 'uclu-dortlu') veriObj = { afp: n.afp || null, hcg: n.hcg2 || null, estriol: n.estriol || null, inhibinA: n.inhibinA || null, kombineRisk: n.kombineRisk2 || null, riskKategorisi: n.riskKategorisi2 || null };
      if (tur === 'nipt') veriObj = { durum: n.niptDurum || 'istendi', t21: n.t21 || null, t18: n.t18 || null, t13: n.t13 || null, cinsiyetKromozomu: n.cinsiyetK || null, fetalFraksiyon: n.fetalFraksiyon || null };
      if (tur === 'invazif') veriObj = { tur: n.invazifTur || 'amniyosentez', endikasyon: n.endikasyon || '', sonuc: n.invazifSonuc || null, karyotip: n.karyotip || null };
      const d = await post({ action: 'genetik-tarama', gebelikId: veri.gebelik.id, tur, hafta: n.hafta2 ? Number(n.hafta2) : (veri.yas?.hafta ?? null), veri: veriObj, muayeneFormunaEkle });
      setMesaj(muayeneFormunaEkle ? (d.notEkleme?.eklendi ? 'Kaydedildi ve bugünkü muayene formuna eklendi.' : `Kaydedildi. ${d.notEkleme?.sebep || ''}`) : 'Kaydedildi.');
      setGenetikTurAcik(''); setN({}); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const [dogumAcik, setDogumAcik] = useState(false);
  const [d, setD] = useState<Record<string, string>>({ dogumTarihi: new Date().toISOString().slice(0, 10), dogumSekli: 'NSD', yenidoganOlustur: 'evet' });

  const dogumKaydet = async () => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      const r = await post({
        action: 'sonlandir', gebelikId: veri.gebelik.id, durum: 'tamamlandi',
        dogumTarihi: d.dogumTarihi, dogumSekli: d.dogumSekli, dogumNotu: d.dogumNotu || null,
        yenidoganOlustur: d.yenidoganOlustur === 'evet',
        yenidoganAdi: d.yenidoganAdi || null, yenidoganCinsiyet: d.yenidoganCinsiyet || null,
        apgar1: sayi(d.apgar1), apgar5: sayi(d.apgar5),
        yenidoganKiloGram: sayi(d.yenidoganKilo), yenidoganBoyCm: sayi(d.yenidoganBoy), yenidoganBasCevresiCm: sayi(d.yenidoganBasCevresi),
      });
      setMesaj(r.yenidoganPatientId ? 'Doğum kaydedildi — bebek için pediatri kaydı açıldı.' : 'Doğum kaydedildi.');
      setDogumAcik(false); setMod('lohusa'); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };
  const sonlandir = async (durum: 'tamamlandi' | 'sonlandi') => {
    if (!veri?.gebelik) return;
    if (durum === 'tamamlandi') { setDogumAcik(true); return; }
    try { await post({ action: 'sonlandir', gebelikId: veri.gebelik.id, durum }); yukle(); } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const klinikKaydet = async (patch: Record<string, unknown>, ok = 'Kaydedildi.') => {
    if (!veri?.gebelik) return;
    setMesaj(''); setHata('');
    try {
      await post({ action: 'klinik', gebelikId: veri.gebelik.id, ...patch });
      setMesaj(ok); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Kaydedilemedi'); }
  };

  const randevuOlustur = async () => {
    const tarih = randevuOneri || veri?.onerilenSonrakiTarih;
    if (!tarih) return;
    setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      const baslangic = `${tarih}T${randevuSaat}:00`;
      const [hh, mm] = randevuSaat.split(':').map(Number);
      const bitisD = new Date(`${tarih}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
      bitisD.setMinutes(bitisD.getMinutes() + 20);
      const bitis = `${tarih}T${String(bitisD.getHours()).padStart(2, '0')}:${String(bitisD.getMinutes()).padStart(2, '0')}:00`;
      const r = await fetch('/api/doktor/randevular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ patientId, baslangic, bitis, tur: 'muayene', notlar: 'Gebelik izlemi' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Randevu oluşturulamadı');
      setMesaj('Randevu oluşturuldu.'); setRandevuOneri(null); yukle();
    } catch (e) { setHata(e instanceof Error ? e.message : 'Randevu oluşturulamadı'); }
  };

  const nstKaydet = async () => {
    if (!veri?.gebelik) return;
    const mevcut = Array.isArray(veri.gebelik.nst_kayitlari) ? veri.gebelik.nst_kayitlari as object[] : [];
    await klinikKaydet({
      nstKayitlari: [...mevcut, {
        id: `nst-${Date.now()}`,
        tarih: nstForm.tarih,
        recordedAt: nstForm.tarih,
        category: nstForm.category,
        durationMin: Number(nstForm.sure) || 20,
        toco: nstForm.toco,
        coreTraceId: `nst-${Date.now()}`,
      }],
    }, 'NST kaydedildi.');
  };

  const kopyalaTehlike = async () => {
    const metin = tehlikeDanismanlikMetni();
    try { await navigator.clipboard.writeText(metin); setMesaj('Tehlike işaretleri kopyalandı.'); } catch { setMesaj(metin); }
  };

  if (yukleniyor) return <div style={{ padding: 20, color: '#8FA0B5', fontSize: 13 }}>Yükleniyor…</div>;

  const onceki = veri ? oncekiGebelikleriFiltrele(veri.gecmis, veri.gebelik) : [];
  const alan = (key: string, label: string, state: Record<string, string>, set: React.Dispatch<React.SetStateAction<Record<string, string>>>, tip = 'text', ph = '') => (
    tip === 'date' ? (
      <TrTarihAlan
        name={key}
        label={label}
        value={state[key] || ''}
        onChange={(iso) => set((prev) => ({ ...prev, [key]: iso }))}
      />
    ) : (
    <label style={{ display: 'block' }}>
      <span style={etiketS}>{label}</span>
      <input type={tip} name={key} value={state[key] || ''} placeholder={ph} onChange={(e) => { const v = e.target.value; set((prev) => ({ ...prev, [key]: v })); }} style={giris} />
    </label>
    )
  );

  const liveVeri: LiveGebelikVeri | null = veri ? {
    gebelik: veri.gebelik,
    yas: veri.yas,
    lohusa: veri.lohusa,
    izlemler: veri.izlemler,
    genetikTaramalar: veri.genetikTaramalar,
    goruntulemeler: veri.goruntulemeler,
  } : null;
  const payload = liveVeri && veri?.gebelik ? payloadFromGebelikApi(patientId, liveVeri) : null;
  const completedWeeks = (veri?.izlemler || []).map((i) => i.hafta);
  const sbDone = completedSbIzlemNos(completedWeeks);
  const pencere = aktifIzlemPenceresi(veri?.yas?.hafta ?? 10, sbDone);
  const doneIds = liveVeri ? chapterDoneIds(liveVeri) : [];
  const windows = veri?.yas ? chapterWindows(veri.yas.hafta, veri.yas.gun, doneIds) : [];
  const visits = payload
    ? chapterCalendar(payload, Math.min(veri?.yas?.hafta ?? 10, 16), completedWeeks, (veri?.lohusa?.izlemler || []).map((x) => x.dogum_sonrasi_gun))
    : markVisitsDone(buildIzlemCalendar({ risk_class: 'dusuk', booking_ga_weeks: 10, episode_status: 'gebe' }), { completedWeeks });
  const rhLabel = veri?.gebelik ? (veri.gebelik.kan_grubu ? `${veri.gebelik.kan_grubu} Rh(${veri.gebelik.rh_negatif ? '−' : '+'})` : `Rh(${veri.gebelik.rh_negatif ? '−' : '+'})`) : '—';
  const sonrakiMetin = veri?.sonrakiRandevu
    ? trTarih(veri.sonrakiRandevu.baslangic)
    : veri?.onerilenSonrakiTarih
      ? `önerilen ${trTarih(veri.onerilenSonrakiTarih)}`
      : '—';
  const sonIzlem = veri?.izlemler?.length ? veri.izlemler[veri.izlemler.length - 1] : null;
  const gaHafta = veri?.yas?.hafta ?? 0;
  const kartlar = veri?.gebelik ? [
    gdmKarti({ ogtt_positive: Boolean(veri.gebelik.lab_panel?.ogtt?.sonuc || sonIzlem?.ogtt) }),
    peKarti({
      sbp: sonIzlem?.tansiyon_sistolik ?? 0,
      dbp: sonIzlem?.tansiyon_diastolik ?? 0,
      proteinuria: Boolean(sonIzlem?.proteinuri && /(\+|pozitif)/i.test(sonIzlem.proteinuri)),
    }),
    rhKarti({ rh: veri.gebelik.rh_negatif ? 'D-' : 'D+', idc: mapIdc(veri.gebelik.indirekt_coombs), ga_weeks: gaHafta }),
    gbsKarti({ ga_weeks: gaHafta, kultur: (sonIzlem?.gbs_kultur as 'pozitif' | 'negatif' | 'bekleniyor' | null) ?? null }),
  ] : [];
  const plurality = mapPlurality(veri?.gebelik?.cogul_gebelik_tipi);
  const sevk = veri?.gebelik ? sevkFromClinic({
    risk: (veri.gebelik.risk_sinifi === 'orta' || veri.gebelik.risk_sinifi === 'yuksek') ? veri.gebelik.risk_sinifi : 'dusuk',
    riskMaddeler,
    plurality: plurality.plurality,
    chorionicity: plurality.chorionicity,
  }) : { sevk: false, reason: [] as string[] };
  const dual = veri?.gebelik && veri.yas ? dualClinicWarnings({
    gaWeeks: veri.yas.hafta,
    completedSb: sbDone,
    risk: (veri.gebelik.risk_sinifi === 'orta' || veri.gebelik.risk_sinifi === 'yuksek') ? veri.gebelik.risk_sinifi : 'dusuk',
    sbp: sonIzlem?.tansiyon_sistolik,
    dbp: sonIzlem?.tansiyon_diastolik,
    proteinuria: Boolean(sonIzlem?.proteinuri && /(\+|pozitif)/i.test(sonIzlem.proteinuri)),
    ogttPositive: Boolean(veri.gebelik.lab_panel?.ogtt?.sonuc),
    rh: veri.gebelik.rh_negatif ? 'D-' : 'D+',
    idc: mapIdc(veri.gebelik.indirekt_coombs),
    gbsKultur: sonIzlem?.gbs_kultur,
  }) : [];
  const nstList = Array.isArray(veri?.gebelik?.nst_kayitlari) ? veri!.gebelik!.nst_kayitlari as Array<{ category?: string; durationMin?: number; recordedAt?: string; tarih?: string; toco?: boolean; id?: string; coreTraceId?: string }> : [];
  const showNst = nstShouldMount({
    gaWeeks: veri?.yas?.hafta ?? null,
    risk: (veri?.gebelik?.risk_sinifi === 'yuksek' ? 'yuksek' : 'dusuk'),
    nstCount: nstList.length,
  });
  const jineLmp = veri?.kadinSagligi?.son_adet_tarihi ? String(veri.kadinSagligi.son_adet_tarihi) : null;
  const goruntuUrl = Object.fromEntries((veri?.goruntulemeler || []).filter((x) => x.dosya_url).map((x) => [x.id, x.dosya_url as string]));
  const etkinMod: Mod = mod;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: '#8FA0B5' }}>
        Gebelik Takibi — ACOG pratik gold + DÖBYR 2026 yasal asgari (4 izlem). Hafta/tarih/uyarı hesapları deterministik; nihai karar hekimindir. ACOG ile DÖBYR çelişirse iki sütun gösterilir.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} data-kd="mod-toggle">
        {([
          ['klinik', 'Klinik (gebe)'],
          ['jinekoloji', 'Jinekoloji'],
          ['lohusa', 'Lohusa'],
          ['infertilite', 'İnfertilite'],
        ] as const).map(([id, et]) => (
          <button
            key={id}
            type="button"
            style={btn(etkinMod === id)}
            onClick={() => setMod(id)}
            disabled={id === 'lohusa' && !veri?.lohusa && id !== etkinMod}
          >
            {et}
          </button>
        ))}
      </div>
      {hata && <div style={{ color: '#F87171', fontSize: 13 }}>{hata}</div>}
      {mesaj && <div style={{ color: '#22C55E', fontSize: 13 }}>{mesaj}</div>}

      {!veri?.gebelik && (
        <div style={kutu} data-kd="empty-start">
          <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 6 }}>Aktif gebelik kaydı yok</div>
          <p style={{ fontSize: 13, color: '#8FA0B5' }}>Jinekoloji kaydı aşağıda. Gebelik başlatınca izlem yüzeyi açılır.</p>
          {!baslatAcik ? <button type="button" style={btn(true)} onClick={() => setBaslatAcik(true)}>+ Gebelik Takibi Başlat</button> : (
            <form onSubmit={(e) => { e.preventDefault(); baslat(); }} style={{ display: 'grid', gap: 10, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {alan('sat', 'Son adet tarihi (SAT)', f, setF, 'date')}
                {alan('tdt', 'Tahmini doğum tarihi (USG ile — isteğe bağlı)', f, setF, 'date')}
                {alan('gravida', 'Gravida', f, setF, 'number')}{alan('para', 'Para', f, setF, 'number')}
                {alan('abortus', 'Abortus', f, setF, 'number')}{alan('yasayan', 'Yaşayan', f, setF, 'number')}
                {alan('oluDogum', 'Ölü doğum (D)', f, setF, 'number')}{alan('ektopik', 'Ektopik (E)', f, setF, 'number')}
                <label style={{ display: 'block' }}><span style={etiketS}>Çoğul</span>
                  <select value={f.cogul || ''} onChange={(e) => setF((prev) => ({ ...prev, cogul: e.target.value }))} style={giris}>
                    <option value="">Tekil</option>
                    <option value="dikoryonik">İkiz — dikoryonik</option>
                    <option value="monokoryonik-diamniyotik">İkiz — monokoryonik diamniyotik</option>
                    <option value="monokoryonik-monoamniyotik">İkiz — monokoryonik monoamniyotik</option>
                  </select>
                </label>
                {alan('gebelikOncesiKilo', 'Gebelik öncesi kilo (kg)', f, setF, 'number')}{alan('boy', 'Boy (cm)', f, setF, 'number')}
                {alan('kanGrubu', 'Kan grubu', f, setF, 'text', 'A, B, AB, 0')}
                <label style={{ display: 'block' }}><span style={etiketS}>Rh</span>
                  <select value={f.rh || ''} onChange={(e) => { const v = e.target.value; setF((prev) => ({ ...prev, rh: v })); }} style={giris}><option value="">—</option><option value="pozitif">Rh (+)</option><option value="negatif">Rh (−)</option></select></label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}><button type="submit" style={btn(true)}>Kaydet</button><button type="button" style={btn()} onClick={() => setBaslatAcik(false)}>Vazgeç</button></div>
            </form>
          )}
        </div>
      )}

      {veri?.gebelik && etkinMod !== 'jinekoloji' && etkinMod !== 'infertilite' && (
        <StickyGebeStrip
          mod={etkinMod === 'lohusa' ? 'lohusa' : 'gebe'}
          haftaMetin={veri.lohusa ? `Lohusa · ${veri.lohusa.dogumSonrasiGun}. gün` : (veri.yas?.metin || 'Hafta hesaplanamadı')}
          tdt={trTarih(veri.gebelik.tdt)}
          risk={veri.gebelik.risk_sinifi || 'dusuk'}
          rh={rhLabel}
          sonrakiRandevu={sonrakiMetin}
          tehlikeOzeti={tehlikeDanismanlikMetni()}
          onTehlikeKopyala={kopyalaTehlike}
          onBugunkuIzlem={() => {
            if (etkinMod === 'lohusa') {
              setL((prev) => ({ ...prev, tarih: prev.tarih || yerelIsoTarih() }));
              setLohusaAcik(true);
            } else {
              setG((prev) => ({ ...prev, tarih: prev.tarih || yerelIsoTarih() }));
              setIzlemAcik(true);
            }
          }}
          dobyrBadge={`${sbDone.length}/4`}
        />
      )}

      {etkinMod === 'jinekoloji' && (
        <>
          <BugunkuJineMuayene
            patientId={patientId}
            onKlinikMod={() => setMod('klinik')}
            colpoImages={colpoFromGoruntuleme(veri?.goruntulemeler)}
            goruntuUrl={goruntuUrl}
          />
          <details style={kutu} data-kd="jine-moduller">
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#EDF1F7' }}>Modül kartları (isteğe bağlı) — CYBH, PCOS, AUB, serviks, HRT…</summary>
            <div style={{ marginTop: 10 }}>
              <JinekolojiSpine patientId={patientId} ofisModulleri />
            </div>
          </details>
          <details style={kutu} data-kd="jine-ketem">
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#EDF1F7' }}>Kadın sağlığı / KETEM paneli</summary>
            <div style={{ marginTop: 10 }}>
              <KadinSagligiPaneli patientId={patientId} />
            </div>
          </details>
          {liveVeri && (
            <HastaKdChapter
              patientId={patientId}
              veri={liveVeri}
              jineLmp={jineLmp}
              sonServiks={veri?.kadinSagligi?.son_serviks_tarama ? String(veri.kadinSagligi.son_serviks_tarama) : null}
              sonServiksSonuc={veri?.kadinSagligi?.son_serviks_sonuc ? String(veri.kadinSagligi.son_serviks_sonuc) : null}
              kontrasepsiyon={veri?.kadinSagligi?.kontrasepsiyon_yontemi ? String(veri.kadinSagligi.kontrasepsiyon_yontemi) : null}
              goruntuUrl={goruntuUrl}
              showJine
            />
          )}
        </>
      )}

      {etkinMod === 'infertilite' && <InfertiliteStub />}

      {veri?.gebelik && etkinMod === 'klinik' && (
        <>
          <AktifIsler
            gecikmisIzlem={veri.takvim.filter((p) => p.durum === 'gecikmis')}
            acikPencereler={windows.filter((w) => w.status === 'open' || w.status === 'overdue')}
            eksikLab={eksikLabKalemleri(labPanel, veri.gebelik.kan_grubu)}
          />

          {izlemAcik && (
            <div style={kutu} data-kd="izlem-form">
              <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 10 }}>Yeni İzlem</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {alan('tarih', 'Tarih', g, setG, 'date')}{alan('kilo', 'Kilo (kg)', g, setG, 'number')}
                {alan('ts', 'TA sistolik', g, setG, 'number')}{alan('td', 'TA diastolik', g, setG, 'number')}
                {alan('fundus', 'Fundus yüksekliği (cm)', g, setG, 'number')}{alan('fka', 'Fetal kalp atımı (/dk)', g, setG, 'number')}
                <label style={{ display: 'block' }}><span style={etiketS}>İdrar proteinüri</span>
                  <select value={g.proteinuri || ''} onChange={(e) => { const v = e.target.value; setG((prev) => ({ ...prev, proteinuri: v })); }} style={giris}><option value="">—</option><option>Negatif</option><option>Eser</option><option>+</option><option>++</option><option>+++</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>GBS kültürü</span>
                  <select value={g.gbs || ''} onChange={(e) => setG((prev) => ({ ...prev, gbs: e.target.value }))} style={giris}>
                    <option value="">—</option><option value="negatif">Negatif</option><option value="pozitif">Pozitif</option><option value="bekleniyor">Bekleniyor</option>
                  </select>
                </label>
              </div>
              <IzlemChecklist izlemNo={pencere.izlem_no} maddeler={pencere.checklist} state={checklist} onChange={setChecklist} />
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B5', margin: '14px 0 6px' }}>USG (isteğe bağlı — ölçümler kaydedilir; persentil yorumu hekimindir)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                {alan('crl', 'CRL (mm)', g, setG)}{alan('bpd', 'BPD (mm)', g, setG)}{alan('hc', 'HC (mm)', g, setG)}{alan('ac', 'AC (mm)', g, setG)}{alan('fl', 'FL (mm)', g, setG)}{alan('efw', 'EFW (g)', g, setG)}
                {alan('amnion', 'Amnion (AFI/normal)', g, setG)}{alan('plasenta', 'Plasenta', g, setG)}{alan('prezentasyon', 'Prezentasyon', g, setG, 'text', 'Sefalik / Makat')}
              </div>
              <label style={{ display: 'block', marginTop: 10 }}><span style={etiketS}>Not</span><textarea value={g.not || ''} onChange={(e) => { const v = e.target.value; setG((prev) => ({ ...prev, not: v })); }} style={{ ...giris, minHeight: 60 }} /></label>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button type="button" style={btn()} onClick={() => izlemKaydet(false)}>Sadece Kaydet</button>
                <button type="button" style={btn(true)} onClick={() => izlemKaydet(true)}>Kaydet ve Bugünkü Muayene Formuna Ekle</button>
                <button type="button" style={btn()} onClick={() => setIzlemAcik(false)}>Vazgeç</button>
              </div>
            </div>
          )}

          {(randevuOneri || (veri.onerilenSonrakiTarih && !veri.sonrakiRandevu)) && (
            <div style={kutu} data-kd="randevu-onerisi">
              <div style={{ fontWeight: 700, color: '#EDF1F7' }}>Sonraki randevu</div>
              {veri.sonrakiRandevu ? (
                <p style={{ fontSize: 13, color: '#C9D4E3' }}>Kayıtlı randevu: {trTarih(veri.sonrakiRandevu.baslangic)}</p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: '#C9D4E3' }}>Önerilen sonraki tarih: {trTarih(randevuOneri || veri.onerilenSonrakiTarih)}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="time" value={randevuSaat} onChange={(e) => setRandevuSaat(e.target.value)} style={{ ...giris, width: 120 }} />
                    <button type="button" style={btn(true)} onClick={randevuOlustur}>Randevu oluştur</button>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={btn()} onClick={() => sonlandir('tamamlandi')}>Doğum Gerçekleşti</button>
            <a href={`/dashboard/doktor/hastalar/${patientId}/gebelik/yazdir`} style={{ ...btn(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>🖨️ Gebe İzlem Kartı</a>
          </div>

          {dogumAcik && (
            <div style={kutu}>
              <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 4 }}>Doğum Kaydı</div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>Canlı doğum bilgisi + isterseniz bebek için pediatri kaydı otomatik açılır (aşı/büyüme takibi hazır bekler).</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {alan('dogumTarihi', 'Doğum tarihi', d, setD, 'date')}
                <label style={{ display: 'block' }}><span style={etiketS}>Doğum şekli</span><select value={d.dogumSekli || 'NSD'} onChange={(e) => setD({ ...d, dogumSekli: e.target.value })} style={giris}><option value="NSD">NSD (normal)</option><option value="Sezaryen">Sezaryen</option></select></label>
                {alan('apgar1', 'APGAR (1 dk)', d, setD, 'number')}{alan('apgar5', 'APGAR (5 dk)', d, setD, 'number')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 6px' }}>
                <input type="checkbox" id="yenidoganOlustur" checked={d.yenidoganOlustur === 'evet'} onChange={(e) => setD({ ...d, yenidoganOlustur: e.target.checked ? 'evet' : 'hayir' })} />
                <label htmlFor="yenidoganOlustur" style={{ fontSize: 13, color: '#EDF1F7' }}>Bebek için pediatri kaydı oluştur</label>
              </div>
              {d.yenidoganOlustur === 'evet' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {alan('yenidoganAdi', 'Bebeğin adı (isterseniz sonra girin)', d, setD)}
                  <label style={{ display: 'block' }}><span style={etiketS}>Cinsiyet</span><select value={d.yenidoganCinsiyet || ''} onChange={(e) => setD({ ...d, yenidoganCinsiyet: e.target.value })} style={giris}><option value="">—</option><option value="male">Erkek</option><option value="female">Kız</option></select></label>
                  {alan('yenidoganKilo', 'Doğum kilosu (g)', d, setD, 'number')}{alan('yenidoganBoy', 'Doğum boyu (cm)', d, setD, 'number')}{alan('yenidoganBasCevresi', 'Baş çevresi (cm)', d, setD, 'number')}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" style={btn(true)} onClick={dogumKaydet}>Kaydet</button>
                <button type="button" style={btn()} onClick={() => setDogumAcik(false)}>Vazgeç</button>
              </div>
            </div>
          )}

          <DualUyarilar uyarilar={dual} />
          {veri.uyarilar.length > 0 && (
            <div style={{ display: 'grid', gap: 6 }}>
              {veri.uyarilar.map((u, i) => (
                <div key={i} style={{ borderLeft: `3px solid ${RENK[u.seviye]}`, background: RENK[u.seviye] + '12', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#EDF1F7' }}>{u.metin}</div>
              ))}
            </div>
          )}

          <KlinikTakvim visits={visits} sbYapildi={sbDone.length} />
          <DualTakvimAccordion visits={visits} />

          <KararKartlari kartlar={kartlar} />
          <SevkCta
            sevk={sevk.sevk}
            nedenler={sevk.reason}
            onSevkOlustur={async (notMetni) => {
              await post({ action: 'sevk', hedef: 'perinatoloji', notMetni })
              setMesaj('Sevk notu kaydedildi.')
            }}
          />

          <div style={kutu} data-kd="nst-panel">
            <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 8 }}>NST kaydı</div>
            {showNst ? (
              <p style={{ fontSize: 12.5, color: '#FDE68A', margin: '0 0 8px' }}>
                NST izlemi endike (28. hafta, yüksek risk veya kayıt var).
              </p>
            ) : (
              <p style={{ fontSize: 12.5, color: '#8FA0B5', margin: '0 0 8px' }}>
                NST henüz rutin endike değil (28. hafta veya yüksek risk). Kayıt yine de eklenebilir.
              </p>
            )}
            {nstList[0] && payload?.nst_studies?.[0] && <NstStrip nst={payload.nst_studies[0]} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 8 }}>
              <TrTarihAlan label="Tarih" value={nstForm.tarih} onChange={(iso) => setNstForm({ ...nstForm, tarih: iso })} />
              <label><span style={etiketS}>Kategori</span>
                <select value={nstForm.category} onChange={(e) => setNstForm({ ...nstForm, category: e.target.value })} style={giris}>
                  <option value="I">Kategori I</option><option value="II">Kategori II</option><option value="III">Kategori III</option>
                </select>
              </label>
              <label><span style={etiketS}>Süre (dk)</span><input type="number" value={nstForm.sure} onChange={(e) => setNstForm({ ...nstForm, sure: e.target.value })} style={giris} /></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, color: '#C9D4E3', fontSize: 13 }}>
                <input type="checkbox" checked={nstForm.toco} onChange={(e) => setNstForm({ ...nstForm, toco: e.target.checked })} /> Toko
              </label>
            </div>
            <button type="button" style={{ ...btn(true), marginTop: 10 }} onClick={nstKaydet}>NST kaydet</button>
          </div>

          <RiskFormu maddeler={riskMaddeler} onChange={setRiskMaddeler} onKaydet={() => klinikKaydet({ riskFormu: { maddeler: riskMaddeler } }, 'Risk formu kaydedildi.')} />
          <VtePaneli maddeler={vteMaddeler} onChange={setVteMaddeler} onKaydet={() => klinikKaydet({ vteFormu: { maddeler: vteMaddeler } }, 'VTE formu kaydedildi.')} />
          <DestekAsiPaneli state={destekAsi} onChange={setDestekAsi} onKaydet={() => klinikKaydet({ destekAsi }, 'Destek ve aşı kaydedildi.')} />
          <LabPaneli state={labPanel} onChange={setLabPanel} onKaydet={() => klinikKaydet({ labPanel }, 'Laboratuvar kaydedildi.')} />
          <TehlikeIsaretleri onKopyala={() => setMesaj('Tehlike işaretleri kopyalandı.')} />

          {veri.izlemler.length > 0 && (
            <div style={kutu}>
              <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 8 }}>İzlem Geçmişi</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: '#C9D4E3' }}>
                  <thead><tr style={{ color: '#8FA0B5', textAlign: 'left' }}><th style={{ padding: 6 }}>Tarih</th><th>Hafta</th><th>Kilo</th><th>TA</th><th>Fundus</th><th>FKA</th><th>Prot.</th><th>USG</th></tr></thead>
                  <tbody>
                    {[...veri.izlemler].reverse().map((i) => (
                      <tr key={i.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: 6 }}>{trTarih(i.tarih)}</td><td>{i.hafta}</td><td>{i.kilo ?? '—'}</td>
                        <td>{i.tansiyon_sistolik && i.tansiyon_diastolik ? `${i.tansiyon_sistolik}/${i.tansiyon_diastolik}` : '—'}</td>
                        <td>{i.fundus_yuksekligi ?? '—'}</td><td>{i.fetal_kalp_atimi ?? '—'}</td><td>{i.proteinuri ?? '—'}</td>
                        <td style={{ color: '#8FA0B5' }}>{(() => {
                          const b = veri.biyometri?.find((x) => x.izlemId === i.id);
                          if (!b) return i.usg ? Object.entries(i.usg).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' · ') : '—';
                          const r = (ad: string, x: Bio | null) => x ? <span key={ad} style={{ color: x.durum === 'normal' ? '#C9D4E3' : '#F59E0B', marginRight: 8 }}>{ad} {x.deger} <b>p{x.persentil}</b></span> : null;
                          return <>{r('HC', b.hc)}{r('BPD', b.bpd)}{r('AC', b.ac)}{r('FL', b.fl)}{b.efw ? (
                            <span style={{ color: '#2DD4BF' }} title={b.efwKaynak === 'hadlock' ? 'Hadlock 1985 (HC-AC-FL)' : undefined}>
                              EFW {b.efw} g{b.efwKaynak === 'hadlock' ? ` (Hadlock${b.efwGirilen && b.efwGirilen !== b.efw ? `; girilen ${b.efwGirilen} g` : ''})` : ''}
                            </span>
                          ) : null}</>;
                        })()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={kutu}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, color: '#EDF1F7' }}>Genetik / Kromozomal Tarama</div>
              {veri.ileriAnneYasi && <span style={{ fontSize: 11.5, color: '#F59E0B', fontWeight: 700 }}>İleri anne yaşı (≥35)</span>}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>
              Bu bölüm yalnız laboratuvarın/sertifikalı yazılımın (FMF/Astraia vb.) bildirdiği sonucu kaydeder — <b>risk oranını burada hesaplamıyoruz</b>. NT için yalnız mutlak bir eşik (≥3.5mm) bayrak kaldırır; kombine risk her zaman sertifikalı yazılımınızdan gelir.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {(['ikili', 'uclu-dortlu', 'nipt', 'invazif'] as const).map((t) => (
                <button key={t} type="button" style={btn(genetikTurAcik === t)} onClick={() => setGenetikTurAcik(genetikTurAcik === t ? '' : t)}>
                  {{ ikili: '+ İkili Test', 'uclu-dortlu': '+ Üçlü/Dörtlü Test', nipt: '+ NIPT', invazif: '+ İnvaziv Test' }[t]}
                </button>
              ))}
            </div>
            {genetikTurAcik === 'ikili' && (
              <div style={{ display: 'grid', gap: 10, marginBottom: 10, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {alan('ntMm', 'NT (mm)', n, setN, 'number')}{alan('papA', 'PAPP-A (MoM)', n, setN)}{alan('freeBhcg', 'Serbest β-hCG (MoM)', n, setN)}
                  {alan('kombineRisk', 'Kombine risk (laboratuvar sonucu, ör. 1/1250)', n, setN)}
                  <label style={{ display: 'block' }}><span style={etiketS}>Risk kategorisi (laboratuvarın bildirdiği)</span><select value={n.riskKategorisi || ''} onChange={(e) => setN({ ...n, riskKategorisi: e.target.value })} style={giris}><option value="">—</option><option value="dusuk">Düşük</option><option value="orta">Orta</option><option value="yuksek">Yüksek</option></select></label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn()} onClick={() => genetikKaydet('ikili', false)}>Kaydet</button><button type="button" style={btn(true)} onClick={() => genetikKaydet('ikili', true)}>Kaydet ve Forma Ekle</button></div>
              </div>
            )}
            {genetikTurAcik === 'uclu-dortlu' && (
              <div style={{ display: 'grid', gap: 10, marginBottom: 10, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {alan('afp', 'AFP (MoM)', n, setN)}{alan('hcg2', 'hCG (MoM)', n, setN)}{alan('estriol', 'Estriol (MoM)', n, setN)}{alan('inhibinA', 'İnhibin A (MoM, dörtlü)', n, setN)}
                  {alan('kombineRisk2', 'Kombine risk (laboratuvar sonucu)', n, setN)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn()} onClick={() => genetikKaydet('uclu-dortlu', false)}>Kaydet</button><button type="button" style={btn(true)} onClick={() => genetikKaydet('uclu-dortlu', true)}>Kaydet ve Forma Ekle</button></div>
              </div>
            )}
            {genetikTurAcik === 'nipt' && (
              <div style={{ display: 'grid', gap: 10, marginBottom: 10, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  <label style={{ display: 'block' }}><span style={etiketS}>Durum</span><select value={n.niptDurum || ''} onChange={(e) => setN({ ...n, niptDurum: e.target.value })} style={giris}><option value="istendi">İstendi</option><option value="sonuclandi">Sonuçlandı</option><option value="basarisiz-tekrar">Başarısız / tekrar gerekti</option></select></label>
                  {(['t21', 't18', 't13'] as const).map((k) => (
                    <label key={k} style={{ display: 'block' }}><span style={etiketS}>{k.toUpperCase()}</span><select value={n[k] || ''} onChange={(e) => setN({ ...n, [k]: e.target.value })} style={giris}><option value="">—</option><option value="dusuk-risk">Düşük risk</option><option value="yuksek-risk">Yüksek risk</option></select></label>
                  ))}
                  {alan('cinsiyetK', 'Cinsiyet kromozomu (istenirse)', n, setN)}{alan('fetalFraksiyon', 'Fetal fraksiyon (%)', n, setN)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn()} onClick={() => genetikKaydet('nipt', false)}>Kaydet</button><button type="button" style={btn(true)} onClick={() => genetikKaydet('nipt', true)}>Kaydet ve Forma Ekle</button></div>
              </div>
            )}
            {genetikTurAcik === 'invazif' && (
              <div style={{ display: 'grid', gap: 10, marginBottom: 10, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  <label style={{ display: 'block' }}><span style={etiketS}>Tür</span><select value={n.invazifTur || 'amniyosentez'} onChange={(e) => setN({ ...n, invazifTur: e.target.value })} style={giris}><option value="cvs">CVS (koryon villus örneklemesi)</option><option value="amniyosentez">Amniyosentez</option></select></label>
                  {alan('endikasyon', 'Endikasyon', n, setN)}{alan('invazifSonuc', 'Sonuç', n, setN)}{alan('karyotip', 'Karyotip', n, setN)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn()} onClick={() => genetikKaydet('invazif', false)}>Kaydet</button><button type="button" style={btn(true)} onClick={() => genetikKaydet('invazif', true)}>Kaydet ve Forma Ekle</button></div>
              </div>
            )}
            {veri.genetikTaramalar && veri.genetikTaramalar.length > 0 && (
              <div style={{ display: 'grid', gap: 6 }}>
                {[...veri.genetikTaramalar].reverse().map((gRow) => (
                  <div key={gRow.id} style={{ fontSize: 12.5, color: '#C9D4E3', borderLeft: gRow.ntDegerlendirme?.bayrak ? '3px solid #F59E0B' : '3px solid rgba(255,255,255,0.1)', padding: '6px 10px', background: gRow.ntDegerlendirme?.bayrak ? '#F59E0B10' : 'transparent', borderRadius: 6 }}>
                    <b style={{ color: '#EDF1F7' }}>{{ ikili: 'İkili Test', 'uclu-dortlu': 'Üçlü/Dörtlü Test', nipt: 'NIPT', invazif: 'İnvaziv Test', 'risk-sorgu': 'Risk Sorgusu' }[gRow.tur] || gRow.tur}</b>
                    {' · '}{trTarih(gRow.tarih)}{gRow.hafta ? ` · ${gRow.hafta}. hafta` : ''}
                    {' — '}{Object.entries(gRow.veri).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    {gRow.ntDegerlendirme && <div style={{ color: gRow.ntDegerlendirme.bayrak ? '#F59E0B' : '#64748B', marginTop: 2 }}>{gRow.ntDegerlendirme.not}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {liveVeri && (
            <HastaKdChapter
              patientId={patientId}
              veri={liveVeri}
              jineLmp={jineLmp}
              goruntuUrl={goruntuUrl}
            />
          )}
        </>
      )}

      {veri?.gebelik && etkinMod === 'lohusa' && (
        <>
          {lohusaAcik && (
            <div style={kutu}>
              <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 10 }}>Yeni Lohusa İzlemi</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {alan('tarih', 'Tarih', l, setL, 'date')}{alan('ts', 'TA sistolik', l, setL, 'number')}{alan('td', 'TA diastolik', l, setL, 'number')}{alan('ates', 'Ateş (°C)', l, setL, 'number')}
                <label style={{ display: 'block' }}><span style={etiketS}>Kanama (loşi)</span><select value={l.kanama || ''} onChange={(e) => setL({ ...l, kanama: e.target.value })} style={giris}><option value="">—</option><option>Normal</option><option>Fazla</option><option>Kötü kokulu</option><option>Kesildi</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>Uterus involüsyonu</span><select value={l.uterus || ''} onChange={(e) => setL({ ...l, uterus: e.target.value })} style={giris}><option value="">—</option><option>Uygun</option><option>Gecikmiş</option><option>Hassas</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>Perine / insizyon</span><select value={l.perine || ''} onChange={(e) => setL({ ...l, perine: e.target.value })} style={giris}><option value="">—</option><option>İyileşiyor</option><option>Enfeksiyon şüphesi</option><option>Ayrışma</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>Emzirme</span><select value={l.emzirme || ''} onChange={(e) => setL({ ...l, emzirme: e.target.value })} style={giris}><option value="">—</option><option>Tam emziriyor</option><option>Kısmen</option><option>Emzirmiyor</option><option>Meme sorunu var</option></select></label>
                <label style={{ display: 'block' }}><span style={etiketS}>Duygu durumu</span><select value={l.duygu || ''} onChange={(e) => setL({ ...l, duygu: e.target.value })} style={giris}><option value="">—</option><option>İyi</option><option>Hüzünlü (baby blues)</option><option>Depresif belirtiler</option></select></label>
                {alan('epds', 'EPDS puanı (isteğe bağlı)', l, setL, 'number')}
              </div>
              <label style={{ display: 'block', marginTop: 10 }}><span style={etiketS}>Not</span><textarea value={l.not || ''} onChange={(e) => setL({ ...l, not: e.target.value })} style={{ ...giris, minHeight: 60 }} /></label>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button type="button" style={btn()} onClick={() => lohusaKaydet(false)}>Sadece Kaydet</button>
                <button type="button" style={btn(true)} onClick={() => lohusaKaydet(true)}>Kaydet ve Bugünkü Muayene Formuna Ekle</button>
                <button type="button" style={btn()} onClick={() => setLohusaAcik(false)}>Vazgeç</button>
              </div>
            </div>
          )}
          <div style={kutu}>
            <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 4 }}>Lohusa izlem takvimi (DSBYR + hastane/ASM)</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Doğum Sonu Bakım Yönetim Rehberi — ilk 24 saat hastane, sonrası 42. güne kadar. EPDS, emzirme ve postpartum kontrasepsiyon bu izlemde.</div>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {(veri.lohusa?.takvim || []).map((p) => (
                <details key={p.no} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 12px' }}>
                  <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: '#EDF1F7' }}>
                    <span><b>{p.etiket}</b></span>
                    <span style={{ color: DURUM_RENK[p.durum], fontWeight: 700, fontSize: 12 }}>{DURUM_ETIKET[p.durum]}</span>
                  </summary>
                  <ul style={{ margin: '8px 0 4px', paddingLeft: 18, color: '#C9D4E3', fontSize: 12.5, lineHeight: 1.6 }}>{p.maddeler.map((m, i) => <li key={i}>{m}</li>)}</ul>
                </details>
              ))}
            </div>
            {visits.filter((v) => v.layer === 'lohusa').length > 0 && (
              <ul style={{ fontSize: 12.5, color: '#C9D4E3' }}>
                {visits.filter((v) => v.layer === 'lohusa').map((v, i) => (
                  <li key={i} style={{ color: v.done ? '#86EFAC' : undefined }}>
                    {v.kind === 'lohusa_hastane' ? 'Hastane' : 'ASM'} · PP {v.ga_or_pp_day}. gün{v.done ? ' · Yapıldı' : ''} · {v.checklist.join(', ')}
                  </li>
                ))}
              </ul>
            )}
            {veri.lohusa && veri.lohusa.izlemler.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: '#C9D4E3', marginTop: 12 }}>
                <thead><tr style={{ color: '#8FA0B5', textAlign: 'left' }}><th style={{ padding: 6 }}>Tarih</th><th>Gün</th><th>TA</th><th>Loşi</th><th>Emzirme</th><th>Duygu</th><th>EPDS</th></tr></thead>
                <tbody>{[...veri.lohusa.izlemler].reverse().map((x) => (
                  <tr key={x.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}><td style={{ padding: 6 }}>{trTarih(x.tarih)}</td><td>{x.dogum_sonrasi_gun}</td><td>{x.tansiyon_sistolik && x.tansiyon_diastolik ? `${x.tansiyon_sistolik}/${x.tansiyon_diastolik}` : '—'}</td><td>{x.kanama ?? '—'}</td><td>{x.emzirme ?? '—'}</td><td>{x.duygu_durumu ?? '—'}</td><td>{x.epds_puan ?? '—'}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
          {liveVeri && <HastaKdChapter patientId={patientId} veri={liveVeri} goruntuUrl={goruntuUrl} />}
        </>
      )}

      {etkinMod !== 'jinekoloji' && <KadinSagligiPaneli patientId={patientId} />}

      {veri && (
        <div style={kutu}>
          <div style={{ fontWeight: 700, color: '#EDF1F7', marginBottom: 8 }}>Önceki Gebelikler</div>
          {onceki.length === 0 ? (
            <div style={{ fontSize: 13, color: '#8FA0B5' }}>Yok</div>
          ) : onceki.map((p) => {
            const tur = oncekiGebelikEtiketTuru(p.durum);
            const durumYazi = tur === 'dogum'
              ? `Doğum ${trTarih(p.dogum_tarihi)}${p.dogum_sekli ? ` (${p.dogum_sekli})` : ''}`
              : oncekiGebelikDurumMetni(p.durum);
            return (
              <div key={p.id} style={{ fontSize: 13, color: '#C9D4E3', padding: '4px 0' }}>TDT {trTarih(p.tdt)} · {durumYazi}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** NOTYA-KHD-03 — KETEM tarama durumu, kontrasepsiyon, menstrüel/menopoz. */
function KadinSagligiPaneli({ patientId }: { patientId: string }) {
  const [d, setD] = useState<{ kayit: Record<string, string | number | null> | null; yas: number | null; taramalar: Array<{ id: string; ad: string; yasBas: number; yasSon: number; aralikYil: number; durum: string; sonTarih: string | null; sonrakiTarih: string | null }>; yontemler: Array<{ id: string; ad: string; emzirmeUyumlu: boolean; not: string }>; menopozBasliklari: string[] } | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [acik, setAcik] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const yukle = useCallback(async () => {
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/kadin-sagligi?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json(); if (r.ok) { setD(j); const k = j.kayit || {}; setF(Object.fromEntries(Object.entries(k).map(([a, b]) => [a, b == null ? '' : String(b)]))); }
    } catch { /* panel kritik değil */ }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);
  const kaydet = async () => {
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch('/api/doktor/kadin-sagligi', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ patientId, sonServiksTarama: f.son_serviks_tarama, sonServiksSonuc: f.son_serviks_sonuc, sonMamografi: f.son_mamografi, sonMamografiSonuc: f.son_mamografi_sonuc, sonKolorektal: f.son_kolorektal, kontrasepsiyonYontemi: f.kontrasepsiyon_yontemi, kontrasepsiyonBaslangic: f.kontrasepsiyon_baslangic, menarsYasi: f.menarş_yasi ? Number(f.menarş_yasi) : null, adetDuzeni: f.adet_duzeni, sonAdetTarihi: f.son_adet_tarihi, menopozDurumu: f.menopoz_durumu, menopozYasi: f.menopoz_yasi ? Number(f.menopoz_yasi) : null, notlar: f.notlar }) });
      setMesaj(r.ok ? 'Kaydedildi.' : 'Kaydedilemedi.'); setAcik(false); yukle();
    } catch { setMesaj('Kaydedilemedi.'); }
  };
  if (!d) return null;
  const TR: Record<string, string> = { gerekli: 'Gerekli', guncel: 'Güncel', yakinda: 'Yakında', 'kapsam-disi': 'Yaş dışı' };
  const RK: Record<string, string> = { gerekli: '#EF4444', guncel: '#22C55E', yakinda: '#F59E0B', 'kapsam-disi': '#475569' };
  const inp = (k: string, label: string, tip = 'text') => tip === 'date'
    ? <TrTarihAlan label={label} value={f[k] || ''} onChange={(iso) => setF((prev) => ({ ...prev, [k]: iso }))} />
    : <label style={{ display: 'block' }}><span style={etiketS}>{label}</span><input type={tip} name={k} value={f[k] || ''} onChange={(e) => { const v = e.target.value; setF((prev) => ({ ...prev, [k]: v })); }} style={giris} /></label>;
  return (
    <div style={kutu}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><div style={{ fontWeight: 700, color: '#EDF1F7' }}>Kadın Sağlığı</div><div style={{ fontSize: 12, color: '#64748B' }}>SB Kanser Tarama Standartları (KETEM) · Aile planlaması · Menopoz{d.yas !== null ? ` · ${d.yas} yaş` : ''}</div></div>
        <button type="button" style={btn()} onClick={() => setAcik((v) => !v)}>{acik ? 'Kapat' : 'Düzenle'}</button>
      </div>
      {mesaj && <div style={{ fontSize: 12, color: '#22C55E', marginBottom: 6 }}>{mesaj}</div>}
      <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
        {d.taramalar.map((t) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, borderLeft: `3px solid ${RK[t.durum]}`, padding: '6px 10px', background: RK[t.durum] + '10', borderRadius: 6 }}>
            <span style={{ color: '#EDF1F7' }}>{t.ad} <span style={{ color: '#64748B', fontSize: 11.5 }}>({t.yasBas}-{t.yasSon} yaş, {t.aralikYil} yılda bir)</span></span>
            <span style={{ color: RK[t.durum], fontWeight: 700, whiteSpace: 'nowrap' }}>{TR[t.durum]}{t.sonrakiTarih ? ` · ${new Date(t.sonrakiTarih).toLocaleDateString('tr-TR')}` : ''}</span>
          </div>
        ))}
      </div>
      {!acik && d.kayit && (
        <div style={{ fontSize: 12.5, color: '#9FB3C8' }}>
          {d.kayit.kontrasepsiyon_yontemi ? `Kontrasepsiyon: ${d.kayit.kontrasepsiyon_yontemi}` : 'Kontrasepsiyon: kayıt yok'}{d.kayit.adet_duzeni ? ` · Adet: ${d.kayit.adet_duzeni}` : ''}{d.kayit.menopoz_durumu ? ` · ${d.kayit.menopoz_durumu}` : ''}
        </div>
      )}
      {acik && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {inp('son_serviks_tarama', 'Son HPV/smear', 'date')}{inp('son_serviks_sonuc', 'Sonuç')}
            {inp('son_mamografi', 'Son mamografi', 'date')}{inp('son_mamografi_sonuc', 'Sonuç (BI-RADS)')}
            {inp('son_kolorektal', 'Son GGK', 'date')}
            <label style={{ display: 'block' }}><span style={etiketS}>Kontrasepsiyon yöntemi</span><select value={f.kontrasepsiyon_yontemi || ''} onChange={(e) => setF({ ...f, kontrasepsiyon_yontemi: e.target.value })} style={giris}><option value="">—</option>{d.yontemler.map((y) => <option key={y.id} value={y.ad}>{y.ad}{y.emzirmeUyumlu ? '' : ' (emzirmede ilk 6 ay önerilmez)'}</option>)}</select></label>
            {inp('kontrasepsiyon_baslangic', 'Başlangıç', 'date')}
            {inp('menarş_yasi', 'Menarş yaşı', 'number')}{inp('adet_duzeni', 'Adet düzeni (ör. 28/5, düzensiz)')}{inp('son_adet_tarihi', 'Son adet tarihi', 'date')}
            <label style={{ display: 'block' }}><span style={etiketS}>Menopoz durumu</span><select value={f.menopoz_durumu || ''} onChange={(e) => setF({ ...f, menopoz_durumu: e.target.value })} style={giris}><option value="">—</option><option value="premenopoz">Premenopoz</option><option value="perimenopoz">Perimenopoz</option><option value="postmenopoz">Postmenopoz</option></select></label>
            {inp('menopoz_yasi', 'Menopoz yaşı', 'number')}
          </div>
          <label style={{ display: 'block' }}><span style={etiketS}>Notlar</span><textarea value={f.notlar || ''} onChange={(e) => setF({ ...f, notlar: e.target.value })} style={{ ...giris, minHeight: 56 }} /></label>
          {(f.menopoz_durumu === 'perimenopoz' || f.menopoz_durumu === 'postmenopoz') && (
            <div style={{ fontSize: 12, color: '#8FA0B5' }}><b style={{ color: '#EDF1F7' }}>Menopoz değerlendirme başlıkları:</b><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{d.menopozBasliklari.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
          )}
          <div><button type="button" style={btn(true)} onClick={kaydet}>Kaydet</button></div>
        </div>
      )}
    </div>
  );
}
