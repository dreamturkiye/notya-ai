'use client';

/**
 * NOTYA-DOSYA-01 — Hasta dosyası, ana sayfayla aynı birinci sınıf görsel dilde:
 * sıcak krem/pine paneller, ince rgba hatlar, pine vurgu, gradient kimlik
 * başlığı (baş harfli avatar + bilgi çipleri), yatay kaydırılabilir hap sekmeler.
 * Ek olarak: "Muayene Geçmişi" sekmesi artık gerçek bir zaman çizelgesi (eski yer tutucu
 * metin yerine) — vizitler, tanı, onay durumu ve tek tıkla Yazdır/PDF.
 */

import React, { useState, useEffect, useCallback } from 'react';
import HastaIlaclar from '@/components/doktor/HastaIlaclar';
import HastaIntake from '@/components/doktor/HastaIntake';
import HastaAsilar from '@/components/doktor/HastaAsilar';
import HastaKonsult from '@/components/doktor/HastaKonsult';
import HastaBuyumeEgrileri from '@/components/doktor/HastaBuyumeEgrileri';
import HastaMchat from '@/components/doktor/HastaMchat';
import HastaGelisimTaramasi from '@/components/doktor/HastaGelisimTaramasi';
import HastaGebelik from '@/components/doktor/HastaGebelik';
import HastaDermatoloji from '@/components/doktor/HastaDermatoloji';
import DahiliyeHome from '@/specialties/dahiliye/ui/DahiliyeHome';
import GozHome from '@/specialties/goz-hastaliklari/ui/GozHome';
import PsikiyatriHome from '@/specialties/psikiyatri/ui/PsikiyatriHome';
import KbbHome from '@/specialties/kulak-burun-bogaz/ui/KbbHome';
import KardioHome from '@/specialties/kardiyoloji/ui/KardioHome';
import GogusHome from '@/specialties/gogus-hastaliklari/ui/GogusHome';
import NorolojiHome from '@/specialties/noroloji/ui/NorolojiHome';
import UrolojiHome from '@/specialties/uroloji/ui/UrolojiHome';
import SporHekimligiHome from '@/specialties/spor-hekimligi/ui/SporHekimligiHome';
import OrtopediHome from '@/specialties/ortopedi/ui/OrtopediHome';
import FtrHome from '@/specialties/fizik-tedavi/ui/FtrHome';
import AileHome from '@/specialties/aile-hekimligi/ui/AileHome';
import EndokrinolojiHome from '@/specialties/endokrinoloji/ui/EndokrinolojiHome';
import RomatolojiHome from '@/specialties/romatoloji/ui/RomatolojiHome';
import EnfeksiyonHome from '@/specialties/enfeksiyon-hastaliklari/ui/EnfeksiyonHome';
import GastroenterolojiHome from '@/specialties/gastroenteroloji/ui/GastroenterolojiHome';
import NefrolojiHome from '@/specialties/nefroloji/ui/NefrolojiHome';
import OnkolojiHome from '@/specialties/onkoloji/ui/OnkolojiHome'
import GogusCerrahiHome from '@/specialties/gogus-cerrahisi/ui/GogusCerrahiHome';
import GenelCerrahiHome from '@/specialties/genel-cerrahi/ui/GenelCerrahiHome';
import PlastikHome from '@/specialties/plastik-cerrahi/ui/PlastikHome'
import BeyinCerrahisiHome from '@/specialties/beyin-cerrahisi/ui/BeyinCerrahisiHome';
import RadyolojiHome from '@/specialties/radyoloji/ui/RadyolojiHome';
import CocukCerrahisiHome from '@/specialties/cocuk-cerrahisi/ui/CocukCerrahisiHome';
import AnesteziHome from '@/specialties/anestezi/ui/AnesteziHome';
import KalpDamarHome from '@/specialties/kalp-damar-cerrahisi/ui/KalpDamarHome';
import AcilTipHome from '@/specialties/acil-tip/ui/AcilTipHome';
import PatientDocumentVault from '@/components/doktor/PatientDocumentVault';
import HastaGoruntuler from '@/components/doktor/HastaGoruntuler';
import HastaKonsultasyonlar from '@/components/doktor/HastaKonsultasyonlar';
import HastaOzetDuzenlenebilir from '@/components/doktor/HastaOzetDuzenlenebilir';
import HastaIletisim from '@/components/doktor/iletisim/HastaIletisim';
import { pediatriHedefBoyBransi } from '@/lib/clinical/hedefBoy';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth';
import { yasHesapla } from '@/lib/doktor/yas';
import type { HastaOzetKayit } from '@/lib/doktor/hastaOzetKayit';
import {
  gebelikSekmesiUygun,
  gebeBayrakMetni,
  hastaDosyaSekmeleri,
  dahiliyeSekmesiBransi,
  psikiyatriSekmesiBransi,
  kbbSekmesiBransi,
  kardiyolojiSekmesiBransi,
  gogusSekmesiBransi,
  norolojiSekmesiBransi,
  urolojiSekmesiBransi,
  sporHekimligiSekmesiBransi,
  ortopediSekmesiBransi,
  fizikTedaviSekmesiBransi,
  aileHekimligiSekmesiBransi,
  endokrinolojiSekmesiBransi,
  romatolojiSekmesiBransi,
  enfeksiyonSekmesiBransi,
  gastroenterolojiSekmesiBransi,
  nefrolojiSekmesiBransi,
  onkolojiSekmesiBransi,
  gogusCerrahisiSekmesiBransi,
  genelCerrahiSekmesiBransi,
  plastikSekmesiBransi,
  beyinCerrahisiSekmesiBransi,
  cocukCerrahisiSekmesiBransi,
  anesteziSekmesiBransi,
  radyolojiSekmesiBransi,
  kalpDamarCerrahisiSekmesiBransi,
  acilTipSekmesiBransi,
  pediatriAracSekmesiUygun,
  muayeneAltiSekmeler,
  type HastaDosyaSekmeId,
  type MuayeneAltiId,
} from '@/lib/doktor/hastaDosyaSekmeleri';
import { cocukHastaMi, pediatrikBaglamMi, veliDiliMi } from '@/lib/specialties/kapsam';
import DoktorGeriLink from '@/components/doktor/DoktorGeriLink';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';

export const dynamic = 'force-dynamic';

interface PatientData {
  id: string
  ad_soyad: string
  dogum_tarihi: string | null
  cinsiyet: string | null
  telefon: string | null
  eposta: string | null
  sehir: string | null
  kan_grubu: string | null
  anne_adi: string | null
  baba_adi: string | null
  kronik_hastaliklar: string[]
  alerjiler: string | null
  surekli_ilaclar: string | null
  sigara_alkol: string | null
  anne_boy_cm?: number | null
  baba_boy_cm?: number | null
}

interface SeansNotu {
  id?: string
  created_at?: string | null
  content_tani?: string | null
  content_subjektif?: string | null
  basvuru_yakinmasi?: string | null
  approved_at?: string | null
}
interface Seans { id: string; created_at: string; notes?: SeansNotu[] | SeansNotu | null }

const panel: React.CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
  boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
};

function basHarfler(ad: string): string {
  return ad.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'H';
}

function trTarih(iso: string): string {
  try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }); } catch { return ''; }
}

export default function HastaProfilPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params?.id as string;
  // NOTYA-RANDEVU-09: randevu takviminden hedefli linkler ?tab=formu / ?tab=asilar ile atlar.
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<HastaDosyaSekmeId>('ozet');
  const [muayeneAlti, setMuayeneAlti] = useState<MuayeneAltiId>('vizitler');
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seanslar, setSeanslar] = useState<Seans[] | null>(null);
  const [seansYukleniyor, setSeansYukleniyor] = useState(false);
  // NOTYA-MUAYENE-ARSIV: yanlışlıkla açılmış ya da notsuz kalmış bir muayeneyi hekimin
  // temizleyebilmesi için -- yumuşak arşivleme, sert silme değil.
  const [arsivleniyor, setArsivleniyor] = useState<string | null>(null);
  // NOTYA-MUAYENE-KALICI-SIL: 2. kademe -- arşivlenmiş muayeneleri görüp kalıcı silebilme.
  const [arsivGorunum, setArsivGorunum] = useState(false);
  const [silinenSeans, setSilinenSeans] = useState<string | null>(null);
  const [pediatriAraci, setPediatriAraci] = useState(false);
  const [dahiliyeAraci, setDahiliyeAraci] = useState(false); // NOTYA-DAH-01: iç hastalıkları / aile / genel dahiliye
  const [gozAraci, setGozAraci] = useState(false); // GOZ-CHAPTER: göz hastalıkları hekimi
  const [deriAraci, setDeriAraci] = useState(false); // CHART-TAB-POLICY: dermatoloji only
  const [psikAraci, setPsikAraci] = useState(false); // PSIK-EXCEPTIONAL-01: yalnız psikiyatri hekimi
  const [kbbAraci, setKbbAraci] = useState(false); // KBB-EXCEPTIONAL-01: yalnız kulak burun boğaz hekimi
  const [kardioAraci, setKardioAraci] = useState(false); // KARDIO-EXCEPTIONAL-01: yalnız kardiyoloji hekimi
  const [gogusAraci, setGogusAraci] = useState(false); // GOGUS-EXCEPTIONAL-01: yalnız göğüs hastalıkları hekimi
  const [noroAraci, setNoroAraci] = useState(false); // NOROLOJI-EXCEPTIONAL-01: yalnız nöroloji hekimi
  const [uroAraci, setUroAraci] = useState(false); // UROLOJI-EXCEPTIONAL-01: yalnız üroloji hekimi
  const [sporAraci, setSporAraci] = useState(false); // SPOR-HEKIMLIGI-EXCEPTIONAL-01: yalnız spor hekimliği
  const [ortoAraci, setOrtoAraci] = useState(false); // ORTOPEDI-EXCEPTIONAL-01: yalnız ortopedi hekimi
  const [ftrAraci, setFtrAraci] = useState(false); // FIZIK-TEDAVI-EXCEPTIONAL-01: yalnız fizik tedavi hekimi
  const [aileAraci, setAileAraci] = useState(false); // AILE-HEKIMLIGI-EXCEPTIONAL-01: yalnız aile hekimliği
  const [endoAraci, setEndoAraci] = useState(false); // ENDOKRINOLOJI-EXCEPTIONAL-01: yalnız endokrinoloji
  const [romaAraci, setRomaAraci] = useState(false); // ROMATOLOJI-EXCEPTIONAL-01: yalnız romatoloji
  const [enfAraci, setEnfAraci] = useState(false); // ENFEKSIYON-EXCEPTIONAL-01
  const [gastroAraci, setGastroAraci] = useState(false); // GASTROENTEROLOJI-EXCEPTIONAL-01: yalnız gastroenteroloji
  const [nefAraci, setNefAraci] = useState(false); // NEFROLOJI-EXCEPTIONAL-01: yalnız nefroloji
  const [onkoAraci, setOnkoAraci] = useState(false); // ONKOLOJI-EXCEPTIONAL-01: yalnız onkoloji
  const [gogusCerrahiAraci, setGogusCerrahiAraci] = useState(false); // GOGUS-CERRAHISI-EXCEPTIONAL-01
  const [gcAraci, setGcAraci] = useState(false); // GENEL-CERRAHI-EXCEPTIONAL-01: yalnız genel-cerrahi
  const [plastikAraci, setPlastikAraci] = useState(false); // PLASTIK-CERRAHI-EXCEPTIONAL-01: yalnız plastik-cerrahi
  const [beyinAraci, setBeyinAraci] = useState(false); // BEYIN-CERRAHISI-EXCEPTIONAL-01: yalnız beyin-cerrahisi
  const [ccAraci, setCcAraci] = useState(false); // COCUK-CERRAHISI-EXCEPTIONAL-01: yalnız cocuk-cerrahisi
  const [anesteziAraci, setAnesteziAraci] = useState(false); // ANESTEZI-EXCEPTIONAL-01: yalnız anestezi
  const [radyoAraci, setRadyoAraci] = useState(false); // RADYOLOJI-EXCEPTIONAL-01: yalnız radyoloji
  const [kdcAraci, setKdcAraci] = useState(false); // KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01
  const [acilAraci, setAcilAraci] = useState(false); // ACIL-TIP-EXCEPTIONAL-01: yalnız acil-tip
  const [doktorBransi, setDoktorBransi] = useState<string | null>(null);

  // BRANS-SIZMASI-KD (Kaan, 2026-09-25): aktif gebelik her branşta başlıkta güvenlik bayrağı olarak görünür.
  const [gebeBayrak, setGebeBayrak] = useState<string | null>(null);
  useEffect(() => {
    const pid = patient?.id;
    if (!pid || patient?.cinsiyet !== 'Kadın') { setGebeBayrak(null); return; }
    let iptal = false;
    void (async () => {
      try {
        const token = await ensureDoctorAccessToken();
        if (!token) return;
        const r = await fetch(`/api/doktor/gebelik?patientId=${pid}&ozet=1`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const j = await r.json();
        if (!iptal) setGebeBayrak(j?.aktif ? gebeBayrakMetni({ sat: j.sat, tdt: j.tdt }) : null);
      } catch { /* bayrak isteğe bağlı */ }
    })();
    return () => { iptal = true; };
  }, [patient?.id, patient?.cinsiyet]);
  const gebelikUygun = patient ? gebelikSekmesiUygun({ cinsiyet: patient.cinsiyet, dogumIso: patient.dogum_tarihi, doktorBransi }) : false;
  const pediatriUygun = patient
    ? pediatriAracSekmesiUygun({ dogumIso: patient.dogum_tarihi, doktorBransi, pediatriDoktoru: pediatriAraci })
    : false;
  const dahiliyeUygun = dahiliyeAraci && !pediatriUygun;
  const tabs = hastaDosyaSekmeleri({ pediatriUygun, gebelikUygun, dahiliyeUygun, gozUygun: gozAraci, deriUygun: deriAraci, psikiyatriUygun: psikAraci, kbbUygun: kbbAraci, kardiyolojiUygun: kardioAraci, gogusUygun: gogusAraci, norolojiUygun: noroAraci, urolojiUygun: uroAraci, ortopediUygun: ortoAraci, fizikTedaviUygun: ftrAraci, aileUygun: aileAraci, sporHekimligiUygun: sporAraci, endokrinolojiUygun: endoAraci, enfeksiyonUygun: enfAraci, gastroenterolojiUygun: gastroAraci, nefrolojiUygun: nefAraci, romatolojiUygun: romaAraci, onkolojiUygun: onkoAraci, gogusCerrahisiUygun: gogusCerrahiAraci, genelCerrahiUygun: gcAraci, plastikUygun: plastikAraci, beyinCerrahisiUygun: beyinAraci, cocukCerrahisiUygun: ccAraci, anesteziUygun: anesteziAraci, kalpDamarCerrahisiUygun: kdcAraci, acilTipUygun: acilAraci, radyolojiUygun: radyoAraci });

  /** Keep ?tab= in the URL so Geri from lab/röntgen returns to Belgeler (not Özet).
   *  Kadın Sağlığı & Gebelik lives under Muayene Geçmişi — deep link ?tab=gebelik still works. */
  const secSekme = useCallback((id: HastaDosyaSekmeId) => {
    if (id === 'gebelik') {
      setActiveTab('muayene');
      setMuayeneAlti('gebelik');
      router.replace(hastaDosyaHref(patientId, 'gebelik'), { scroll: false });
      return;
    }
    setActiveTab(id);
    if (id === 'muayene') setMuayeneAlti('vizitler');
    router.replace(hastaDosyaHref(patientId, id), { scroll: false });
  }, [patientId, router]);

  const secMuayeneAlti = useCallback((id: MuayeneAltiId) => {
    setActiveTab('muayene');
    setMuayeneAlti(id);
    router.replace(hastaDosyaHref(patientId, id === 'gebelik' ? 'gebelik' : 'muayene'), { scroll: false });
  }, [patientId, router]);

  useEffect(() => {
    if (!tabParam) {
      setActiveTab('ozet');
      return;
    }
    const bilinen: HastaDosyaSekmeId[] = [
      'ozet', 'muayene', 'buyume', 'belgeler', 'goruntuleme', 'ilaclar', 'formu', 'asilar',
      'mchat', 'gelisim', 'ayse', 'gebelik', 'deri', 'dahiliye', 'goz',
      'psikiyatri', 'kbb', 'kardiyoloji', 'gogus', 'noroloji', 'uroloji', 'spor-hekimligi', 'ortopedi', 'fizik-tedavi', 'aile', 'endokrinoloji', 'enfeksiyon', 'gastroenteroloji', 'nefroloji', 'romatoloji', 'onkoloji', 'genel-cerrahi', 'plastik', 'beyin', 'gogus-cerrahisi', 'cocuk-cerrahisi', 'konsultasyon',
    ];
    if (!bilinen.includes(tabParam as HastaDosyaSekmeId)) return;
    if (tabParam === 'gebelik') {
      setActiveTab('muayene');
      setMuayeneAlti('gebelik');
      return;
    }
    // Eski ?tab=ayse → Özet + şerit açık (Ayşe artık sekme değil)
    if (tabParam === 'ayse') {
      setActiveTab('ozet');
      return;
    }
    setActiveTab(tabParam as HastaDosyaSekmeId);
    if (tabParam === 'muayene') setMuayeneAlti('vizitler');
  }, [tabParam]);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        // NOTYA-AUTH-01: one convention, with refresh.
        const token = await ensureDoctorAccessToken();
        if (!token) { router.push(DOKTOR_GIRIS); return; }
        const [resp, meRes] = await Promise.all([
          fetch(`/api/doktor/hastalar/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const data = await resp.json();
        if (!resp.ok) { setError(data.error || 'Hasta bilgisi alınamadı'); return; }
        setPatient(data.patient);
        if (meRes.ok) {
          const me = await meRes.json();
          const sp = String(me?.data?.specialty || '');
          setDoktorBransi(sp);
          setPediatriAraci(pediatriHedefBoyBransi(sp));
          setGozAraci(/göz|goz|oftalm/i.test(sp));
          setDeriAraci(/derma|deri ve z/i.test(sp));
          setDahiliyeAraci(dahiliyeSekmesiBransi(sp));
          setPsikAraci(psikiyatriSekmesiBransi(sp));
          setKbbAraci(kbbSekmesiBransi(sp));
          setKardioAraci(kardiyolojiSekmesiBransi(sp));
          setGogusAraci(gogusSekmesiBransi(sp));
          setNoroAraci(norolojiSekmesiBransi(sp));
          setUroAraci(urolojiSekmesiBransi(sp));
          setSporAraci(sporHekimligiSekmesiBransi(sp));
          setOrtoAraci(ortopediSekmesiBransi(sp));
          setFtrAraci(fizikTedaviSekmesiBransi(sp));
          setAileAraci(aileHekimligiSekmesiBransi(sp));
          setEndoAraci(endokrinolojiSekmesiBransi(sp));
          setRomaAraci(romatolojiSekmesiBransi(sp));
          setEnfAraci(enfeksiyonSekmesiBransi(sp));
          setGastroAraci(gastroenterolojiSekmesiBransi(sp));
          setNefAraci(nefrolojiSekmesiBransi(sp));
          setOnkoAraci(onkolojiSekmesiBransi(sp));
          setGogusCerrahiAraci(gogusCerrahisiSekmesiBransi(sp));
          setGcAraci(genelCerrahiSekmesiBransi(sp));
          setPlastikAraci(plastikSekmesiBransi(sp));
          setBeyinAraci(beyinCerrahisiSekmesiBransi(sp));
          setCcAraci(cocukCerrahisiSekmesiBransi(sp));
          setAnesteziAraci(anesteziSekmesiBransi(sp));
          setRadyoAraci(radyolojiSekmesiBransi(sp));
          setKdcAraci(kalpDamarCerrahisiSekmesiBransi(sp));
          setAcilAraci(acilTipSekmesiBransi(sp));
        }
      } catch {
        setError('Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, router]);

  // Muayene Geçmişi: sekme ilk açıldığında tembel yüklenir; arşiv görünümü değiştikce yeniden çeker.
  // NOTYA-ARSIV-01: arşiv listesi YALNIZ Muayene Geçmişi › Arşivlenenler'de; Özet zaman çizelgesi aynı
  // listeyi kullandığı için arşiv görünümü açık kalsa bile Özet'e arşivli muayene düşmez.
  const arsivListesi = arsivGorunum && activeTab === 'muayene';
  const seansYukle = useCallback(async () => {
    setSeansYukleniyor(true);
    try {
      const token = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/hastalar/${patientId}/sessions${arsivListesi ? '?arsiv=1' : ''}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      const liste = Array.isArray(d.sessions) ? d.sessions : Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      setSeanslar(liste);
    } catch {
      setSeanslar([]);
    } finally {
      setSeansYukleniyor(false);
    }
  }, [patientId, arsivListesi]);

  useEffect(() => {
    if (activeTab === 'muayene' || activeTab === 'ozet') seansYukle()
  }, [activeTab, seansYukle])

  // NOTYA-MUAYENE-ARSIV: yumuşak arşivleme -- listeden çıkarır, kaydı silmez.
  const muayeneArsivle = async (sessionId: string) => {
    if (!window.confirm('Bu muayeneyi arşivlemek istediğinize emin misiniz? Kayıt silinmez, yalnızca listeden kaldırılır.')) return;
    setArsivleniyor(sessionId);
    try {
      const token = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/hastalar/${patientId}/sessions/${sessionId}/arsivle`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setSeanslar((prev) => (prev || []).filter((s) => s.id !== sessionId));
    } finally {
      setArsivleniyor(null);
    }
  };

  // NOTYA-ARSIV-01: arşivden çıkar -- muayene ve notu tüm yüzeylerde (pano, İnceleme, Ayşe, portal) yeniden görünür.
  const muayeneArsivdenCikar = async (sessionId: string) => {
    setArsivleniyor(sessionId);
    try {
      const token = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/hastalar/${patientId}/sessions/${sessionId}/arsivden-cikar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setSeanslar((prev) => (prev || []).filter((s) => s.id !== sessionId));
      else window.alert(j.error || 'Arşivden çıkarılamadı');
    } finally {
      setArsivleniyor(null);
    }
  };

  // NOTYA-MUAYENE-KALICI-SIL: 2. kademe -- geri alınamaz, yalnız zaten arşivlenmiş bir muayene için.
  const muayeneKaliciSil = async (sessionId: string) => {
    if (!window.confirm('Bu muayeneyi KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem GERİ ALINAMAZ -- not, bağlı belge değerlendirmeleri ve lab tabloları tamamen silinir.')) return;
    setSilinenSeans(sessionId);
    try {
      const token = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/hastalar/${patientId}/sessions/${sessionId}/kalici-sil`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setSeanslar((prev) => (prev || []).filter((s) => s.id !== sessionId));
      else window.alert(j.error || 'Silinemedi');
    } finally {
      setSilinenSeans(null);
    }
  };

  // Doğum tarihi her yerde Gün.Ay.Yıl + yaş; bebeklerde gün hassasiyeti ("8 ay 3 günlük")
  const dogumGoster = (() => {
    if (!patient?.dogum_tarihi) return null;
    const d = new Date(patient.dogum_tarihi);
    if (isNaN(d.getTime())) return patient.dogum_tarihi;
    const yas = yasHesapla(patient.dogum_tarihi);
    return `${d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Istanbul' })}${yas ? ` (${yas})` : ''}`;
  })();

  const kimlikCipleri = patient
    ? [
        patient.cinsiyet,
        gebeBayrak,
        dogumGoster,
        patient.telefon,
        patient.sehir,
        patient.kan_grubu ? `Kan: ${patient.kan_grubu}` : null,
      ].filter(Boolean) as string[]
    : [];

  const notCek = (s: Seans): SeansNotu | null => {
    if (!s.notes) return null;
    return Array.isArray(s.notes) ? s.notes[0] || null : s.notes;
  };

  // NOTYA-MUAYENE-TARIH-DUZELT (Kaan/Dr. Gökhan, 2026-09-23): Muayene Geçmişi listesi
  // sessions.created_at (satır ne zaman oluşturuldu) gösteriyordu -- geçmişe işlenmiş bir
  // muayene için bu, kaydın DOSYAYA GİRİLDİğİ gün, hastanın GERÇEKTEN GÖRÜLDÜĞÜ gün değil --
  // bu yüzden yazdır/PDF (notes.created_at okur, doğru) ile listedeki tarih birbirini
  // tutmuyordu. Not varsa onun kendi tarihi esas alınır; not yoksa ("Not bulunamadı" hayalet
  // kayıtlar) seansın oluşturulma tarihine düşer -- başka doğru tarih zaten yok.
  const seansTarihi = (s: Seans): string => notCek(s)?.created_at || s.created_at;

  const vaultSpecialtyGeri: 'deri' | 'goz' | 'gebelik' | 'dahiliye' | null = searchParams?.get('dermModality')
    ? 'deri'
    : activeTab === 'deri' || activeTab === 'goz' || activeTab === 'dahiliye'
      ? activeTab
      : (activeTab === 'gebelik' || (activeTab === 'muayene' && muayeneAlti === 'gebelik'))
        ? 'gebelik'
        : null;

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', color: CHROME_RENK.ink, fontFamily: CHROME_FONT.sans }}>
      <style>{`
        .dosya-sekmeler::-webkit-scrollbar { display: none; }
        .dosya-satir:hover { background: #F6F0E4; }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '4px 4px 40px' }}>

        {/* Kimlik başlığı — ana sayfa karşılama paneliyle aynı dil */}
        <div style={{ ...panel, background: 'linear-gradient(135deg, #FAF6EE 0%, #F4EEE3 100%)', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#E4F3F1', border: `1px solid ${CHROME_RENK.pine}73`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: CHROME_RENK.pine, flexShrink: 0 }}>
            {loading ? '·' : basHarfler(patient?.ad_soyad || 'H')}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', color: '#2e251d' }}>{loading ? 'Hasta Dosyası' : patient?.ad_soyad || 'Hasta Dosyası'}</div>
            {kimlikCipleri.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
                {kimlikCipleri.map((c, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: CHROME_RENK.ink, background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 999, padding: '3px 10px' }}>{c}</span>
                ))}
              </div>
            )}
          </div>
          {patient && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push(`/session/new?patientId=${patient.id}`)}
                style={{ padding: '10px 18px', background: CHROME_RENK.pine, color: '#FAF8F4', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                🩺 Muayeneyi Başlat
              </button>
            </div>
          )}
        </div>

        <div style={{ margin: '10px 0 0' }}>
          <DoktorGeriLink href="/dashboard/doktor/hastalar">← Hastalar</DoktorGeriLink>
        </div>

        {/* Hap sekmeler — mobilde yatay kaydırma. NOTYA-SEKME-KAYDIR-01 (Kaan, 2026-09-24): son sekme
            kesik görünüyordu — kaydırılabilir şerit gizli scrollbar'la sessizce kesiliyordu, "devamı
            var" diye hiçbir ipucu yoktu. Sağ kenara soluk bir geçiş eklendi (sabit, tepki vermez —
            tıklamayı engellemez), en sondaki sekmeye kaydırıldığında bile kalması zararsız. */}
        <div style={{ position: 'relative' }}>
          {/* NOTYA-SEKME-SAR-01 (Kaan / Dr. Gökhan, 2026-09-25): the fade still made the last tab look cut, even when
            selected. Tabs now wrap onto a second line, so every tab is always fully visible — no scrolling, no fade. */}
          <div className="dosya-sekmeler" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '16px 0 12px', paddingBottom: 2 }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => secSekme(tab.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  background: activeTab === tab.id ? CHROME_RENK.pine : '#FFFFFF',
                  border: activeTab === tab.id ? `1px solid ${CHROME_RENK.pine}` : `1px solid ${CHROME_RENK.border}`,
                  color: activeTab === tab.id ? '#FAF8F4' : CHROME_RENK.ink,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  borderRadius: 999,
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background .15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ayşe şeridi: sekmeler ↔ içerik (Konuş + Yaz) — Gökhan/Boss 2026-09-20 */}
        {!loading && !error && patient && (
          <HastaKonsult patientId={patientId} baslangicAcik={tabParam === 'ayse'} hastaDogumIso={patient.dogum_tarihi} />
        )}

        {loading && <div style={{ ...panel, padding: 18, color: CHROME_RENK.muted, fontSize: 14 }}>Dosya yükleniyor…</div>}
        {error && <div style={{ ...panel, padding: 18, color: CHROME_RENK.warn, fontSize: 14, borderColor: 'rgba(164,91,62,0.4)' }}>{error}</div>}

        {!loading && !error && patient && activeTab === 'ozet' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <HastaOzetDuzenlenebilir
              patientId={patientId}
              patient={patient}
              dogumGoster={dogumGoster}
              onKaydedildi={(p: HastaOzetKayit) => {
                setPatient((onceki) => (onceki ? { ...onceki, ...p } : onceki))
              }}
            />
            {/* NOTYA-ILETISIM-01: WhatsApp / e-posta consent + last contacts */}
            <HastaIletisim patientId={patientId} />
            <div style={{ ...panel, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${CHROME_RENK.pine}, transparent)` }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: CHROME_RENK.ink }}>Gelişler ve tanılar</div>
              {seansYukleniyor && <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Yükleniyor…</div>}
              {!seansYukleniyor && seanslar !== null && seanslar.length === 0 && (
                <div style={{ fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.45 }}>Henüz muayene yok. İlk vizitten sonra tarihler ve tanılar burada tıklanır.</div>
              )}
              {!seansYukleniyor && (seanslar || []).slice(0, 8).map((s, idx, arr) => {
                const n = notCek(s)
                const tani = String(n?.content_tani || n?.basvuru_yakinmasi || n?.content_subjektif || 'Tanı yazılmamış').trim()
                const ozet = tani.length > 90 ? `${tani.slice(0, 90)}…` : tani
                const ac = () => { if (n?.id) router.push(`/dashboard/doktor/notlar/${n.id}/yazdir`) }
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={ac}
                    disabled={!n?.id}
                    title={n?.id ? 'Bu günün muayene raporunu aç' : 'Not henüz yok'}
                    className="dosya-satir"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: idx < arr.length - 1 ? `1px solid ${CHROME_RENK.border}` : 'none',
                      padding: '10px 4px',
                      cursor: n?.id ? 'pointer' : 'default',
                      color: 'inherit',
                      opacity: n?.id ? 1 : 0.55,
                    }}
                  >
                    <span style={{ display: 'block', fontSize: 12, color: CHROME_RENK.muted, fontWeight: 600 }}>{trTarih(seansTarihi(s))}</span>
                    <span style={{ display: 'block', fontSize: 13.5, color: n?.id ? CHROME_RENK.pine : CHROME_RENK.ink, marginTop: 2, lineHeight: 1.35, textDecoration: n?.id ? 'underline' : 'none', textUnderlineOffset: 3 }}>{ozet}</span>
                  </button>
                )
              })}
              {!seansYukleniyor && (seanslar || []).length > 8 && (
                <button
                  type="button"
                  onClick={() => secSekme('muayene')}
                  style={{ marginTop: 8, background: 'transparent', border: 'none', color: CHROME_RENK.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Tüm muayene geçmişi ›
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'muayene' && (
          <div style={{ ...panel, padding: '10px 20px' }}>
            {gebelikUygun && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0 14px', borderBottom: `1px solid ${CHROME_RENK.border}`, marginBottom: 4 }}>
                {muayeneAltiSekmeler(true).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => secMuayeneAlti(s.id)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 14px',
                      background: muayeneAlti === s.id ? '#E4F3F1' : 'transparent',
                      border: muayeneAlti === s.id ? `1px solid ${CHROME_RENK.pine}` : `1px solid ${CHROME_RENK.border}`,
                      color: muayeneAlti === s.id ? CHROME_RENK.pine : CHROME_RENK.muted,
                      fontWeight: muayeneAlti === s.id ? 700 : 500,
                      borderRadius: 999,
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {muayeneAlti === 'gebelik' && gebelikUygun ? (
              <div style={{ padding: '8px 0 12px' }}>
                <HastaGebelik patientId={patientId} />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0 4px' }}>
                  <button
                    type="button"
                    onClick={() => setArsivGorunum((v) => !v)}
                    style={{ background: 'transparent', border: 'none', color: arsivGorunum ? CHROME_RENK.pine : CHROME_RENK.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {arsivGorunum ? '← Aktif muayeneler' : 'Arşivlenenler ›'}
                  </button>
                </div>
                {seansYukleniyor && <div style={{ padding: '14px 0', color: CHROME_RENK.muted, fontSize: 14 }}>Vizitler yükleniyor…</div>}
                {!seansYukleniyor && seanslar !== null && seanslar.length === 0 && (
                  <div style={{ padding: '18px 0', color: CHROME_RENK.muted, fontSize: 14 }}>{arsivGorunum ? 'Arşivlenmiş muayene yok.' : 'Henüz muayene kaydı yok — ilk muayeneyle birlikte burada görünecek.'}</div>
                )}
                {!seansYukleniyor && (seanslar || []).map((s, idx) => {
                  const n = notCek(s);
                  const onaylandi = Boolean(n?.approved_at);
                  const ozet = String(n?.content_tani || n?.content_subjektif || 'Not bulunamadı').slice(0, 110);
                  return (
                    <div key={s.id} className="dosya-satir" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 6px', borderBottom: idx < (seanslar?.length || 0) - 1 ? `1px solid ${CHROME_RENK.border}` : 'none', borderRadius: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: onaylandi ? '#2E6E4E' : '#B4832F' }} title={onaylandi ? 'Onaylı not' : 'Onay bekliyor'} />
                      <span role={n?.id ? 'button' : undefined} tabIndex={n?.id ? 0 : undefined}
                        onClick={() => { if (n?.id) router.push(`/dashboard/doktor/notlar/${n.id}/yazdir`); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && n?.id) router.push(`/dashboard/doktor/notlar/${n.id}/yazdir`); }}
                        title={n?.id ? 'Raporu aç — düzenlemek için Yeniden Düzenle' : undefined}
                        style={{ minWidth: 0, flex: 1, cursor: n?.id ? 'pointer' : 'default' }}>
                        <span style={{ display: 'block', fontSize: 12, color: CHROME_RENK.muted }}>{trTarih(seansTarihi(s))}</span>
                        <span style={{ display: 'block', fontSize: 13.5, color: CHROME_RENK.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ozet}</span>
                      </span>
                      {n?.id && (
                        <button
                          type="button"
                          onClick={() => window.open(`/dashboard/doktor/notlar/${n.id}/yazdir`, '_blank')}
                          style={{ background: '#F6F0E4', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 999, padding: '5px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                        >
                          🖨️ Yazdır / PDF
                        </button>
                      )}
                      {arsivListesi && (
                        <button
                          type="button"
                          onClick={() => void muayeneArsivdenCikar(s.id)}
                          disabled={arsivleniyor === s.id}
                          title="Arşivden çıkar -- muayene tüm listelerde yeniden görünür"
                          style={{ background: 'rgba(47,67,52,0.08)', border: '1px solid rgba(47,67,52,0.4)', color: CHROME_RENK.pine, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: arsivleniyor === s.id ? 'default' : 'pointer', flexShrink: 0, opacity: arsivleniyor === s.id ? 0.5 : 1 }}
                        >
                          {arsivleniyor === s.id ? 'Çıkarılıyor…' : 'Arşivden çıkar'}
                        </button>
                      )}
                      {arsivListesi ? (
                        <button
                          type="button"
                          onClick={() => void muayeneKaliciSil(s.id)}
                          disabled={silinenSeans === s.id}
                          title="Kalıcı olarak sil -- geri alınamaz"
                          style={{ background: 'rgba(164,69,60,0.10)', border: '1px solid rgba(164,69,60,0.5)', color: '#A4453C', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: silinenSeans === s.id ? 'default' : 'pointer', flexShrink: 0, opacity: silinenSeans === s.id ? 0.5 : 1 }}
                        >
                          {silinenSeans === s.id ? 'Siliniyor…' : 'Kalıcı olarak sil'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void muayeneArsivle(s.id)}
                          disabled={arsivleniyor === s.id}
                          title="Muayeneyi arşivle -- listeden kaldırır, kaydı silmez"
                          style={{ background: 'transparent', border: '1px solid rgba(164,69,60,0.35)', color: '#A4453C', borderRadius: 999, padding: '5px 12px', fontSize: 12, cursor: arsivleniyor === s.id ? 'default' : 'pointer', flexShrink: 0, opacity: arsivleniyor === s.id ? 0.5 : 1 }}
                        >
                          {arsivleniyor === s.id ? 'Arşivleniyor…' : 'Arşivle'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {!loading && !error && pediatriUygun && activeTab === 'buyume' && (
          <HastaBuyumeEgrileri patientId={patientId} hedefBoyGoster={pediatriAraci} />
        )}
        {!loading && !error && activeTab === 'belgeler' && (
          <PatientDocumentVault patientId={patientId} specialtyGeri={vaultSpecialtyGeri} />
        )}
        {!loading && !error && activeTab === 'konsultasyon' && <HastaKonsultasyonlar patientId={patientId} yanitAc={searchParams?.get('yanit') || undefined} />}
        {!loading && !error && activeTab === 'goruntuleme' && (
          <HastaGoruntuler patientId={patientId} />
        )}
        {!loading && !error && activeTab === 'ilaclar' && <HastaIlaclar patientId={patientId} />}
        {!loading && !error && activeTab === 'formu' && <HastaIntake patientId={patientId} />}
        {!loading && !error && activeTab === 'asilar' && (
          <HastaAsilar
            patientId={patientId}
            pediatrikBaglam={pediatrikBaglamMi({ doktorBransi, hastaDogumIso: patient?.dogum_tarihi })}
            veliDili={veliDiliMi({ doktorBransi, hastaDogumIso: patient?.dogum_tarihi })}
            cocukHasta={cocukHastaMi(patient?.dogum_tarihi) || (pediatriAraci && !patient?.dogum_tarihi)}
          />
        )}
        {!loading && !error && pediatriUygun && activeTab === 'mchat' && <HastaMchat patientId={patientId} />}
        {!loading && !error && pediatriUygun && activeTab === 'gelisim' && <HastaGelisimTaramasi patientId={patientId} />}
        {/* Ayşe şeritte — ayrı sekme içeriği yok */}
        {/* BRANS-ALAN-SIZMASI: ?tab=dahiliye / ?tab=deri derin bağlantısı bölüm içeriğini branş kapısı olmadan açıyordu */}
        {!loading && !error && activeTab === 'dahiliye' && dahiliyeUygun && <DahiliyeHome patientId={patientId} />}
        {!loading && !error && activeTab === 'goz' && gozAraci && <GozHome patientId={patientId} />}
        {!loading && !error && activeTab === 'psikiyatri' && psikAraci && <PsikiyatriHome patientId={patientId} />}
        {!loading && !error && activeTab === 'kbb' && kbbAraci && <KbbHome patientId={patientId} />}
        {!loading && !error && activeTab === 'kardiyoloji' && kardioAraci && <KardioHome patientId={patientId} />}
        {!loading && !error && activeTab === 'gogus' && gogusAraci && <GogusHome patientId={patientId} />}
        {!loading && !error && activeTab === 'noroloji' && noroAraci && <NorolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'uroloji' && uroAraci && <UrolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'spor-hekimligi' && sporAraci && <SporHekimligiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'ortopedi' && ortoAraci && <OrtopediHome patientId={patientId} />}
        {!loading && !error && activeTab === 'fizik-tedavi' && ftrAraci && <FtrHome patientId={patientId} />}
        {!loading && !error && activeTab === 'aile' && aileAraci && <AileHome patientId={patientId} />}
        {!loading && !error && activeTab === 'endokrinoloji' && endoAraci && <EndokrinolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'romatoloji' && romaAraci && <RomatolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'enfeksiyon' && enfAraci && <EnfeksiyonHome patientId={patientId} />}
        {!loading && !error && activeTab === 'gastroenteroloji' && gastroAraci && <GastroenterolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'nefroloji' && nefAraci && <NefrolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'onkoloji' && onkoAraci && <OnkolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'gogus-cerrahisi' && gogusCerrahiAraci && <GogusCerrahiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'genel-cerrahi' && gcAraci && <GenelCerrahiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'plastik' && plastikAraci && <PlastikHome patientId={patientId} />}
        {!loading && !error && activeTab === 'beyin' && beyinAraci && <BeyinCerrahisiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'cocuk-cerrahisi' && ccAraci && <CocukCerrahisiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'anestezi' && anesteziAraci && <AnesteziHome patientId={patientId} />}
        {!loading && !error && activeTab === 'radyo' && radyoAraci && <RadyolojiHome patientId={patientId} />}
        {!loading && !error && activeTab === 'kalp-damar' && kdcAraci && <KalpDamarHome patientId={patientId} />}
        {!loading && !error && activeTab === 'acil' && acilAraci && <AcilTipHome patientId={patientId} />}
        {!loading && !error && activeTab === 'deri' && deriAraci && (
          <HastaDermatoloji patientId={patientId} cinsiyet={patient?.cinsiyet} dogumTarihi={patient?.dogum_tarihi} hastaAdi={patient?.ad_soyad} />
        )}
      </div>
    </div>
  );
}
