'use client';

/**
 * NOTYA-RANDEVU-02 — takvim, Google Takvim'in ay görünümü gibi bir ızgara.
 *
 * Önceki sürüm yalnızca gün listesiydi (bkz. git geçmişi, NOTYA-RANDEVU-01). O görünüm hâlâ
 * burada — Google Takvim'de de bir güne tıklayınca ayrıntı listesi açılır, tam olarak aynı
 * ilişki. Ay ızgarası "bu ay nasıl görünüyor" sorusuna, gün listesi "bugün ne var, ne
 * yapacağım" sorusuna cevap verir; biri diğerinin yerini tutmuyor.
 *
 * Ay verisini TEK istekte çekiyoruz (ızgarada görünen 42 günün tamamı, önceki/sonraki aydan
 * taşan günler dahil) ve istemci tarafında tarihe göre grupluyoruz — 42 gün için 42 istek atmak
 * hem yavaş hem gereksiz, randevu hacmi (bir doktor için ayda birkaç yüz kayıt) tek sorguya rahat
 * sığar.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { resmiTatilMi } from '@/lib/randevu/resmiTatiller';

export const dynamic = 'force-dynamic';

interface Randevu {
  id: string;
  baslangic: string;
  bitis: string;
  tur: string;
  durum: string;
  notlar: string | null;
  hastaDurumu: string | null;
  iptalNedeni: string | null;
  patientId: string | null;
  hastaAdi: string;
  hastaTelefon: string;
  kayitliHasta: boolean;
}

interface HastaAramaSonucu {
  id: string;
  name: string;
}

const TUR_ETIKET: Record<string, string> = {
  ilk_muayene: 'İlk Muayene',
  muayene: 'Muayene',
  kontrol: 'Kontrol',
  diger: 'Diğer',
};

/** NOTYA-RANDEVU-11: tür bazlı renk kodlaması — referans tasarımlardaki (Google Takvim /
 * Business Calendar 2 tarzı) "güçlü renkler, temiz çizgiler" yaklaşımı. Ay ızgarasındaki
 * chip'in DOLGUSU türün rengi, SOL KENARLIĞI durumun rengi — tek bakışta iki boyut. */
const TUR_RENK: Record<string, string> = {
  ilk_muayene: '#8B5CF6',
  muayene: '#0F9B8E',
  kontrol: '#3B82F6',
  diger: '#64748B',
};

const DURUM_ETIKET: Record<string, { label: string; color: string; bg: string }> = {
  planlandi: { label: 'Planlandı', color: '#0F9B8E', bg: 'rgba(15,155,142,0.15)' },
  onaylandi: { label: 'Onaylandı', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  tamamlandi: { label: 'Tamamlandı', color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  iptal: { label: 'İptal', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  gelmedi: { label: 'Gelmedi', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
};

const HAFTA_GUNLERI = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function gunBaslangicBitis(tarih: Date): { baslangic: string; bitis: string } {
  const b = new Date(tarih); b.setHours(0, 0, 0, 0);
  const s = new Date(tarih); s.setHours(23, 59, 59, 999);
  return { baslangic: b.toISOString(), bitis: s.toISOString() };
}

function saatStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function tarihBaslikStr(tarih: Date): string {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const secilen = new Date(tarih); secilen.setHours(0, 0, 0, 0);
  const fark = Math.round((secilen.getTime() - bugun.getTime()) / 86400000);
  const temel = tarih.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (fark === 0) return `Bugün · ${temel}`;
  if (fark === 1) return `Yarın · ${temel}`;
  if (fark === -1) return `Dün · ${temel}`;
  return temel;
}

function tarihInputStr(tarih: Date): string {
  return tarih.toISOString().slice(0, 10);
}

/** Yerel tarih anahtarı (yyyy-mm-dd) — toISOString() UTC'ye kayar, gece yarısına yakın randevuları
 * yanlış güne yerleştirebilir. Bu yüzden local getFullYear/Month/Date kullanıyoruz. */
function yerelGunAnahtari(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}

/** Pazartesi başlangıçlı, tam 6 haftalık (42 günlük) ızgara — Google Takvim'in ay görünümüyle
 * aynı sabit yükseklik, ay ortasında satır sayısı değişip düzen zıplamıyor. */
function ayIzgarasi(ay: Date): Date[] {
  const yil = ay.getFullYear();
  const ayIndex = ay.getMonth();
  const ilkGun = new Date(yil, ayIndex, 1);
  const haftaIcindekiIndex = (ilkGun.getDay() + 6) % 7; // Pazartesi=0 olacak şekilde kaydır
  const izgaraBaslangic = new Date(yil, ayIndex, 1 - haftaIcindekiIndex);
  return Array.from({ length: 42 }, (_, i) => new Date(izgaraBaslangic.getFullYear(), izgaraBaslangic.getMonth(), izgaraBaslangic.getDate() + i));
}

function ayBaslikStr(ay: Date): string {
  return ay.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export default function RandevularPage() {
  const router = useRouter();
  const [gorunum, setGorunum] = useState<'ay' | 'gun' | 'ajanda' | 'liste'>('ay');

  // NOTYA-RANDEVU-10: 640px altı (iPhone dahil tüm telefonlar) için ay ızgarası yerine gün
  // görünümü varsayılan — 7 sütunlu bir ızgara telefon genişliğinde okunaklı olamaz, kullanıcı
  // yine de Ay'a manuel geçebilir (o zaman yatay kaydırma devreye girer).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) setGorunum('gun');
  }, []);
  const [ay, setAy] = useState(() => new Date());
  const [gun, setGun] = useState(() => new Date());

  const [aylikRandevular, setAylikRandevular] = useState<Record<string, Randevu[]>>({});
  const [gunlukRandevular, setGunlukRandevular] = useState<Randevu[]>([]);
  const [ajandaRandevular, setAjandaRandevular] = useState<Randevu[]>([]);
  const [listeRandevular, setListeRandevular] = useState<Randevu[]>([]);
  const [surukleId, setSurukleId] = useState<string | null>(null);
  const [surukleHedef, setSurukleHedef] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basariMesaji, setBasariMesaji] = useState('');
  const [rol, setRol] = useState<'doktor' | 'sekreter' | null>(null);

  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzenlenenRandevu, setDuzenlenenRandevu] = useState<Randevu | null>(null);
  const [saat, setSaat] = useState('09:00');
  const [sureDk, setSureDk] = useState(20);
  const [tur, setTur] = useState('muayene');
  const [notlar, setNotlar] = useState('');
  const [hastaDurumu, setHastaDurumu] = useState<'saglikli' | 'sikayetli' | ''>('');

  const [hastaArama, setHastaArama] = useState('');
  const [hastaSonuclari, setHastaSonuclari] = useState<HastaAramaSonucu[]>([]);
  const [seciliHasta, setSeciliHasta] = useState<HastaAramaSonucu | null>(null);
  const [serbestAd, setSerbestAd] = useState('');
  const [serbestTelefon, setSerbestTelefon] = useState('');

  const [kaydediliyor, setKaydediyor] = useState(false);
  const [iptalId, setIptalId] = useState<string | null>(null);
  const [iptalNedeni, setIptalNedeni] = useState('');
  const [modalIptalAcik, setModalIptalAcik] = useState(false);
  const [modalIptalNedeni, setModalIptalNedeni] = useState('');

  const token = ensureDoctorAccessToken;

  const gridGunleri = useMemo(() => ayIzgarasi(ay), [ay]);

  const ayVerisiYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const grid = ayIzgarasi(ay);
      const baslangic = new Date(grid[0]); baslangic.setHours(0, 0, 0, 0);
      const bitis = new Date(grid[grid.length - 1]); bitis.setHours(23, 59, 59, 999);
      const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic.toISOString())}&bitis=${encodeURIComponent(bitis.toISOString())}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) { setHata('Randevular alınamadı.'); return; }
      const d = await r.json();
      const grup: Record<string, Randevu[]> = {};
      for (const rv of (d.randevular || []) as Randevu[]) {
        const anahtar = yerelGunAnahtari(new Date(rv.baslangic));
        (grup[anahtar] ||= []).push(rv);
      }
      setAylikRandevular(grup);
    } catch {
      setHata('Randevular alınamadı. Bağlantınızı kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }, [ay]);

  const gunVerisiYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const { baslangic, bitis } = gunBaslangicBitis(gun);
      const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic)}&bitis=${encodeURIComponent(bitis)}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) { setHata('Randevular alınamadı.'); return; }
      const d = await r.json();
      setGunlukRandevular(d.randevular || []);
    } catch {
      setHata('Randevular alınamadı. Bağlantınızı kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }, [gun]);

  /** NOTYA-RANDEVU-11: ajanda ve liste görünümleri için ortak aralık çekici. Ajanda
   * "önümüzdeki 30 gün" sabit penceresine bakar (Google Takvim'in Program görünümü gibi),
   * liste ise mevcut `ay` state'inin tamamına bakar ve ay gezinme oklarını paylaşır. */
  const araligiCek = useCallback(async (baslangic: Date, bitis: Date): Promise<Randevu[] | null> => {
    const t = await token();
    if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return null; }
    const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic.toISOString())}&bitis=${encodeURIComponent(bitis.toISOString())}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!r.ok) { setHata('Randevular alınamadı.'); return null; }
    const d = await r.json();
    return (d.randevular || []) as Randevu[];
  }, []);

  const ajandaYukle = useCallback(async () => {
    setYukleniyor(true); setHata('');
    try {
      const b = new Date(); b.setHours(0, 0, 0, 0);
      const s = new Date(b.getTime() + 30 * 86400000); s.setHours(23, 59, 59, 999);
      const liste = await araligiCek(b, s);
      if (liste) setAjandaRandevular(liste);
    } catch { setHata('Randevular alınamadı. Bağlantınızı kontrol edin.'); }
    finally { setYukleniyor(false); }
  }, [araligiCek]);

  const listeYukle = useCallback(async () => {
    setYukleniyor(true); setHata('');
    try {
      const b = new Date(ay.getFullYear(), ay.getMonth(), 1);
      const s = new Date(ay.getFullYear(), ay.getMonth() + 1, 0); s.setHours(23, 59, 59, 999);
      const liste = await araligiCek(b, s);
      if (liste) setListeRandevular(liste);
    } catch { setHata('Randevular alınamadı. Bağlantınızı kontrol edin.'); }
    finally { setYukleniyor(false); }
  }, [ay, araligiCek]);

  const yenile = useCallback(async () => {
    if (gorunum === 'ay') await ayVerisiYukle();
    else if (gorunum === 'gun') await gunVerisiYukle();
    else if (gorunum === 'ajanda') await ajandaYukle();
    else await listeYukle();
  }, [gorunum, ayVerisiYukle, gunVerisiYukle, ajandaYukle, listeYukle]);

  useEffect(() => { yenile(); }, [yenile]);

  useEffect(() => {
    (async () => {
      const t = await token();
      if (!t) return;
      try {
        const r = await fetch('/api/personel/me', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); setRol(d.rol); }
      } catch { /* nav still works without this */ }
    })();
  }, []);

  const [tumHastalar, setTumHastalar] = useState<{ id: string; name: string }[] | null>(null);
  useEffect(() => {
    const q = hastaArama.trim();
    if (q.length < 1) { setHastaSonuclari([]); return; }
    let iptal = false;
    (async () => {
      try {
        let liste = tumHastalar;
        if (!liste) {
          const t = await token();
          if (!t) return;
          const r = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${t}` } });
          const d = await r.json();
          liste = (d.patients || []).map((p: any) => ({ id: p.id, name: p.name }));
          if (!iptal) setTumHastalar(liste);
        }
        const qNorm = q.toLocaleLowerCase('tr-TR');
        const sonuc = (liste || []).filter((p) => p.name.toLocaleLowerCase('tr-TR').includes(qNorm)).slice(0, 8);
        if (!iptal) setHastaSonuclari(sonuc);
      } catch { if (!iptal) setHastaSonuclari([]); }
    })();
    return () => { iptal = true; };
  }, [hastaArama, tumHastalar]);

  function formuSifirla() {
    setDuzenlenenId(null);
    setDuzenlenenRandevu(null);
    setSaat('09:00');
    setSureDk(20);
    setTur('muayene');
    setNotlar('');
    setHastaDurumu('');
    setHastaArama('');
    setHastaSonuclari([]);
    setSeciliHasta(null);
    setSerbestAd('');
    setSerbestTelefon('');
    setModalIptalAcik(false);
    setModalIptalNedeni('');
  }

  function gunHucresineTikla(d: Date) {
    setGun(d);
    setGorunum('gun');
  }

  function yeniRandevuAc(hedefGun?: Date) {
    formuSifirla();
    if (hedefGun) setGun(hedefGun);
    setFormAcik(true);
  }

  function duzenlemeyeAc(rv: Randevu) {
    setDuzenlenenId(rv.id);
    setDuzenlenenRandevu(rv);
    setSaat(saatStr(rv.baslangic));
    setSureDk(Math.round((new Date(rv.bitis).getTime() - new Date(rv.baslangic).getTime()) / 60000));
    setTur(rv.tur);
    setNotlar(rv.notlar || '');
    setHastaDurumu((rv.hastaDurumu as 'saglikli' | 'sikayetli') || '');
    setGun(new Date(rv.baslangic));
    if (rv.kayitliHasta && rv.patientId) {
      setSeciliHasta({ id: rv.patientId, name: rv.hastaAdi });
      setSerbestAd(''); setSerbestTelefon('');
    } else {
      setSeciliHasta(null);
      setSerbestAd(rv.hastaAdi); setSerbestTelefon(rv.hastaTelefon);
    }
    setHastaArama('');
    setFormAcik(true);
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!seciliHasta && !serbestAd.trim()) {
      setHata('Kayıtlı hasta seçin veya hasta adı girin.');
      return;
    }
    setKaydediyor(true);
    setHata('');
    setBasariMesaji('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }

      const [saatH, saatM] = saat.split(':').map(Number);
      const baslangicTarihi = new Date(gun);
      baslangicTarihi.setHours(saatH, saatM, 0, 0);
      const bitisTarihi = new Date(baslangicTarihi.getTime() + sureDk * 60000);

      const govde = {
        patientId: seciliHasta?.id || null,
        hastaAdiSerbest: seciliHasta ? null : serbestAd.trim(),
        hastaTelefonSerbest: seciliHasta ? null : serbestTelefon.trim(),
        baslangic: baslangicTarihi.toISOString(),
        bitis: bitisTarihi.toISOString(),
        tur,
        notlar: notlar.trim() || null,
        hastaDurumu: hastaDurumu || null,
      };

      const url = duzenlenenId ? `/api/doktor/randevular/${duzenlenenId}` : '/api/doktor/randevular';
      const yontem = duzenlenenId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method: yontem,
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setHata(j.error || 'Randevu kaydedilemedi.');
        return;
      }
      formuSifirla();
      setFormAcik(false);
      await yenile();
    } catch {
      setHata('Randevu kaydedilemedi. Bağlantınızı kontrol edin.');
    } finally {
      setKaydediyor(false);
    }
  }

  // NOTYA-RANDEVU-07: dosya açılışı yalnızca onaylandi/tamamlandi/gelmedi geçişinde olur (bkz.
  // API route yorumu). Server bunu yeniHasta olarak döndürünce burada görünür kılıyoruz —
  // "onayla" tıklayıp dosyanın sessizce açılması doktora/sekretere bildirilmeden geçmemeli.
  async function durumDegistir(id: string, durum: string, neden?: string) {
    try {
      const t = await token();
      if (!t) return;
      const r = await fetch(`/api/doktor/randevular/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ durum, iptalNedeni: neden }),
      });
      const sonuc = await r.json().catch(() => ({}));
      if (sonuc?.yeniHasta?.ad) {
        setBasariMesaji(`${sonuc.yeniHasta.ad} için hasta dosyası açıldı.`);
        setTimeout(() => setBasariMesaji(''), 6000);
      }
      await yenile();
    } catch { /* re-fetch will reflect actual state either way */ }
  }

  /** Modal içinden durum değiştirme — randevuyu "açıp" onaylamak/tamamlamak/iptal etmek için
   * ayrıca gün görünümüne geçmeye gerek kalmasın diye. Aynı randevu; ay ızgarasındaki bir
   * chip'e tıklayıp doğrudan buradan onaylayabilmek gerekiyordu — daha önce bu modalde sadece
   * yeniden planlama alanları vardı, durum kontrolü yoktu. */
  async function modalDurumDegistir(durum: string, neden?: string) {
    if (!duzenlenenId) return;
    await durumDegistir(duzenlenenId, durum, neden);
    setFormAcik(false);
    formuSifirla();
  }

  async function modalSil() {
    if (!duzenlenenId) return;
    if (!confirm('Bu randevuyu tamamen silmek istiyor musunuz? (Gerçek bir iptal için "İptal Et" kullanın.)')) return;
    await silIslemi(duzenlenenId);
    setFormAcik(false);
    formuSifirla();
  }

  async function silIslemi(id: string) {
    try {
      const t = await token();
      if (!t) return;
      await fetch(`/api/doktor/randevular/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      await yenile();
    } catch { /* ignore */ }
  }

  async function sil(id: string) {
    if (!confirm('Bu randevuyu tamamen silmek istiyor musunuz? (Gerçek bir iptal için "İptal Et" kullanın.)')) return;
    await silIslemi(id);
  }

  const siraliGunlukRandevular = useMemo(
    () => [...gunlukRandevular].sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime()),
    [gunlukRandevular]
  );

  const ajandaGunleri = useMemo(() => {
    const grup: Record<string, Randevu[]> = {};
    for (const rv of ajandaRandevular) {
      (grup[yerelGunAnahtari(new Date(rv.baslangic))] ||= []).push(rv);
    }
    return Object.entries(grup)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([anahtar, liste]) => ({
        anahtar,
        tarih: new Date(anahtar + 'T00:00:00'),
        liste: [...liste].sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime()),
      }));
  }, [ajandaRandevular]);

  const siraliListe = useMemo(
    () => [...listeRandevular].sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime()),
    [listeRandevular]
  );

  /** NOTYA-RANDEVU-11: sürükle-bırak ile yeniden planlama (yalnız ay ızgarası, masaüstü).
   * Saat ve süre korunur, yalnız gün değişir — saat değiştirmek için modal zaten var.
   * PATCH kısmi gövdeyi destekliyor ve çakışma penceresini yeniden kontrol ediyor; çakışma
   * varsa sunucunun hatası aynen gösterilir, hiçbir şey taşınmaz. HTML5 DnD dokunmatikte
   * çalışmaz — mobil zaten Gün görünümünde açılıyor, oradaki Yeniden Planla akışı geçerli. */
  async function tasiRandevu(id: string, hedefGun: Date) {
    setSurukleId(null); setSurukleHedef(null);
    const rv = Object.values(aylikRandevular).flat().find((r) => r.id === id);
    if (!rv) return;
    const eskiB = new Date(rv.baslangic);
    if (yerelGunAnahtari(eskiB) === yerelGunAnahtari(hedefGun)) return;
    const sure = new Date(rv.bitis).getTime() - eskiB.getTime();
    const yeniB = new Date(hedefGun);
    yeniB.setHours(eskiB.getHours(), eskiB.getMinutes(), 0, 0);
    const yeniS = new Date(yeniB.getTime() + sure);
    try {
      const t = await token();
      if (!t) return;
      const r = await fetch(`/api/doktor/randevular/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ baslangic: yeniB.toISOString(), bitis: yeniS.toISOString() }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setHata(j.error || 'Randevu taşınamadı.');
      } else {
        setHata('');
        setBasariMesaji(`${rv.hastaAdi} — ${yeniB.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ${saatStr(yeniB.toISOString())} olarak taşındı.`);
        setTimeout(() => setBasariMesaji(''), 5000);
      }
    } catch { setHata('Randevu taşınamadı. Bağlantınızı kontrol edin.'); }
    await ayVerisiYukle();
  }

  const bugunAnahtari = yerelGunAnahtari(new Date());

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <h1 style={{ fontSize: 26, margin: 0 }}>Randevular</h1>
          {rol === 'sekreter' && (
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(15,155,142,0.2)', color: '#0F9B8E' }}>
              Sekreter olarak bağlısınız
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3 }}>
            <button
              type="button"
              onClick={() => setGorunum('ay')}
              style={{ background: gorunum === 'ay' ? '#0F9B8E' : 'transparent', border: 'none', color: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
            >Ay</button>
            <button
              type="button"
              onClick={() => setGorunum('gun')}
              style={{ background: gorunum === 'gun' ? '#0F9B8E' : 'transparent', border: 'none', color: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
            >Gün</button>
            <button
              type="button"
              onClick={() => setGorunum('ajanda')}
              style={{ background: gorunum === 'ajanda' ? '#0F9B8E' : 'transparent', border: 'none', color: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
            >Ajanda</button>
            <button
              type="button"
              onClick={() => setGorunum('liste')}
              style={{ background: gorunum === 'liste' ? '#0F9B8E' : 'transparent', border: 'none', color: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
            >Liste</button>
          </div>

          {(gorunum === 'ay' || gorunum === 'liste') ? (
            <>
              <button type="button" onClick={() => setAy((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1))} style={navBtn}>‹</button>
              <div style={{ fontSize: 15, fontWeight: 600, minWidth: 140, textAlign: 'center', textTransform: 'capitalize' }}>{ayBaslikStr(ay)}</div>
              <button type="button" onClick={() => setAy((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1))} style={navBtn}>›</button>
              <button type="button" onClick={() => setAy(new Date())} style={{ ...navBtn, width: 'auto', padding: '0 12px', color: '#94A3B8' }}>Bu ay</button>
            </>
          ) : gorunum === 'gun' ? (
            <>
              <button type="button" onClick={() => setGun((g) => new Date(g.getTime() - 86400000))} style={navBtn}>‹</button>
              <input
                type="date"
                value={tarihInputStr(gun)}
                onChange={(e) => { if (e.target.value) setGun(new Date(e.target.value + 'T00:00:00')); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 14 }}
              />
              <button type="button" onClick={() => setGun((g) => new Date(g.getTime() + 86400000))} style={navBtn}>›</button>
              <button type="button" onClick={() => setGun(new Date())} style={{ ...navBtn, width: 'auto', padding: '0 12px', color: '#94A3B8' }}>Bugün</button>
            </>
          ) : null}

          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => yeniRandevuAc(gorunum === 'gun' ? gun : new Date())} className="ni-btn" style={{ width: 'auto', padding: '0 16px', height: 36 }}>
            + Randevu
          </button>
        </div>

        {hata && <div className="ni-error" style={{ marginBottom: 12 }}>{hata}</div>}

        {resmiTatilMi(new Date()) && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
            🔔 Bugün resmi tatil: <strong>{resmiTatilMi(new Date())?.ad}</strong> — randevu planlarken dikkat edin.
          </div>
        )}
        {basariMesaji && (
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22C55E', color: '#22C55E', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>
            {basariMesaji}
          </div>
        )}

        {gorunum === 'ay' && (
          <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            {Object.entries(TUR_ETIKET).map(([k, v]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#CBD5E1' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: TUR_RENK[k] }} /> {v}
              </span>
            ))}
            <span style={{ fontSize: 11, color: '#64748B' }}>· Randevuları sürükleyip bırakarak başka güne taşıyabilirsiniz</span>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'auto' }}>
            <div style={{ minWidth: 560 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'rgba(255,255,255,0.04)' }}>
              {HAFTA_GUNLERI.map((g) => (
                <div key={g} style={{ padding: '8px 6px', fontSize: 11, color: '#94A3B8', textAlign: 'center', fontWeight: 600 }}>{g}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {gridGunleri.map((d, i) => {
                const anahtar = yerelGunAnahtari(d);
                const buAyIcinde = d.getMonth() === ay.getMonth();
                const bugunMu = anahtar === bugunAnahtari;
                const tatil = resmiTatilMi(d);
                const gunRandevulari = (aylikRandevular[anahtar] || []).sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime());
                const gosterilen = gunRandevulari.slice(0, 3);
                const fazlaSayisi = gunRandevulari.length - gosterilen.length;
                return (
                  <div
                    key={i}
                    onClick={() => gunHucresineTikla(d)}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDragEnter={() => { if (surukleId) setSurukleHedef(anahtar); }}
                    onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) tasiRandevu(id, d); }}
                    title={tatil ? tatil.ad : undefined}
                    style={{
                      minHeight: 92,
                      padding: 6,
                      borderRight: (i + 1) % 7 !== 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      background: surukleId && surukleHedef === anahtar ? 'rgba(139,92,246,0.18)' : bugunMu ? 'rgba(15,155,142,0.08)' : tatil ? 'rgba(239,68,68,0.06)' : 'transparent',
                      opacity: buAyIcinde ? 1 : 0.35,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <div style={{
                        fontSize: 12,
                        color: bugunMu ? '#0A1628' : '#CBD5E1',
                        background: bugunMu ? '#0F9B8E' : 'transparent',
                        width: bugunMu ? 20 : 'auto',
                        height: bugunMu ? 20 : 'auto',
                        borderRadius: bugunMu ? '50%' : 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: bugunMu ? 700 : 400,
                      }}>{d.getDate()}</div>
                      {tatil && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />}
                    </div>
                    {tatil && <div style={{ fontSize: 9, color: '#EF4444', marginBottom: 3, lineHeight: 1.2 }}>{tatil.ad}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {gosterilen.map((rv) => {
                        const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                        const surukleyebilir = rv.durum === 'planlandi' || rv.durum === 'onaylandi';
                        return (
                          <div
                            key={rv.id}
                            draggable={surukleyebilir}
                            onDragStart={(e) => { e.stopPropagation(); setSurukleId(rv.id); e.dataTransfer.setData('text/plain', rv.id); e.dataTransfer.effectAllowed = 'move'; }}
                            onDragEnd={() => { setSurukleId(null); setSurukleHedef(null); }}
                            onClick={(e) => { e.stopPropagation(); duzenlemeyeAc(rv); }}
                            title={`${saatStr(rv.baslangic)} ${rv.hastaAdi} · ${TUR_ETIKET[rv.tur] || rv.tur} · ${durumBilgi.label}`}
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 5px',
                              borderRadius: 4,
                              background: TUR_RENK[rv.tur] || TUR_RENK.diger,
                              color: 'white',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              borderLeft: `3px solid ${durumBilgi.color}`,
                              opacity: rv.durum === 'iptal' ? 0.45 : rv.id === surukleId ? 0.5 : 1,
                              textDecoration: rv.durum === 'iptal' ? 'line-through' : 'none',
                              cursor: surukleyebilir ? 'grab' : 'pointer',
                            }}
                          >
                            {saatStr(rv.baslangic)} {rv.hastaAdi}
                          </div>
                        );
                      })}
                      {fazlaSayisi > 0 && (
                        <div style={{ fontSize: 10, color: '#94A3B8', paddingLeft: 5 }}>+{fazlaSayisi} daha</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
          </>
        )}

        {gorunum === 'gun' && (
          <>
            <div style={{ color: '#94A3B8', fontSize: 14, marginBottom: 12 }}>{tarihBaslikStr(gun)}</div>

            {yukleniyor && <p style={{ color: '#94A3B8' }}>Yükleniyor…</p>}
            {!yukleniyor && siraliGunlukRandevular.length === 0 && (
              <p style={{ color: '#94A3B8' }}>Bu güne ait randevu yok.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {siraliGunlukRandevular.map((rv) => {
                const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                const gecmis = new Date(rv.bitis) < new Date();
                return (
                  <div
                    key={rv.id}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: 14,
                      opacity: rv.durum === 'iptal' ? 0.55 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{saatStr(rv.baslangic)} – {saatStr(rv.bitis)}</div>
                        <div style={{ fontSize: 15, marginTop: 2 }}>{rv.hastaAdi}{!rv.kayitliHasta && <span style={{ fontSize: 11, color: '#F59E0B', marginLeft: 6 }}>kayıtsız</span>}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{TUR_ETIKET[rv.tur] || rv.tur}{rv.hastaTelefon ? ` · ${rv.hastaTelefon}` : ''}</div>
                        {rv.notlar && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, whiteSpace: 'pre-wrap' }}>{rv.notlar}</div>}
                        {rv.durum === 'iptal' && rv.iptalNedeni && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>İptal: {rv.iptalNedeni}</div>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>
                        {durumBilgi.label}
                      </span>
                    </div>

                    {rv.durum !== 'iptal' && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {rv.patientId && (
                          <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${rv.patientId}`)} style={{ ...aksiyonBtn, color: '#0F9B8E', fontWeight: 600 }}>Hasta Dosyasını Aç</button>
                        )}
                        {rv.patientId && (
                          <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${rv.patientId}?tab=formu`)} style={{ ...aksiyonBtn, color: '#0F9B8E' }}>Hasta Formu</button>
                        )}
                        <button type="button" onClick={() => duzenlemeyeAc(rv)} style={aksiyonBtn}>Yeniden Planla</button>
                        {rv.durum === 'planlandi' && (
                          <button type="button" onClick={() => durumDegistir(rv.id, 'onaylandi')} style={aksiyonBtn}>Onayla</button>
                        )}
                        {gecmis && rv.durum !== 'tamamlandi' && rv.durum !== 'gelmedi' && (
                          <>
                            <button type="button" onClick={() => durumDegistir(rv.id, 'tamamlandi')} style={aksiyonBtn}>Tamamlandı</button>
                            <button type="button" onClick={() => durumDegistir(rv.id, 'gelmedi')} style={{ ...aksiyonBtn, color: '#F59E0B' }}>Gelmedi</button>
                          </>
                        )}
                        <button type="button" onClick={() => setIptalId(rv.id)} style={{ ...aksiyonBtn, color: '#EF4444' }}>İptal Et</button>
                        <button type="button" onClick={() => sil(rv.id)} style={{ ...aksiyonBtn, color: '#64748B' }}>Sil</button>
                      </div>
                    )}

                    {iptalId === rv.id && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                        <input
                          value={iptalNedeni}
                          onChange={(e) => setIptalNedeni(e.target.value)}
                          placeholder="İptal nedeni (isteğe bağlı)"
                          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
                        />
                        <button
                          type="button"
                          onClick={async () => { await durumDegistir(rv.id, 'iptal', iptalNedeni); setIptalId(null); setIptalNedeni(''); }}
                          style={{ ...aksiyonBtn, background: '#EF4444', color: 'white' }}
                        >Onayla</button>
                        <button type="button" onClick={() => { setIptalId(null); setIptalNedeni(''); }} style={aksiyonBtn}>Vazgeç</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {gorunum === 'ajanda' && (
          <>
            <div style={{ color: '#94A3B8', fontSize: 13, marginBottom: 12 }}>Önümüzdeki 30 gün</div>
            {yukleniyor && <p style={{ color: '#94A3B8' }}>Yükleniyor…</p>}
            {!yukleniyor && ajandaGunleri.length === 0 && <p style={{ color: '#94A3B8' }}>Önümüzdeki 30 günde randevu yok.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {ajandaGunleri.map(({ anahtar, tarih, liste }) => {
                const tatil = resmiTatilMi(tarih);
                const bugunMu = anahtar === bugunAnahtari;
                return (
                  <div key={anahtar}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: bugunMu ? '#0F9B8E' : 'white', textTransform: 'capitalize' }}>{tarihBaslikStr(tarih)}</span>
                      {tatil && <span style={{ fontSize: 11, color: '#EF4444' }}>· {tatil.ad}</span>}
                      <span style={{ fontSize: 11, color: '#64748B' }}>· {liste.length} randevu</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {liste.map((rv) => {
                        const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                        return (
                          <div
                            key={rv.id}
                            onClick={() => duzenlemeyeAc(rv)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', opacity: rv.durum === 'iptal' ? 0.5 : 1, flexWrap: 'wrap' }}
                          >
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: TUR_RENK[rv.tur] || TUR_RENK.diger, flexShrink: 0 }} title={TUR_ETIKET[rv.tur] || rv.tur} />
                            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: '#CBD5E1', minWidth: 92 }}>{saatStr(rv.baslangic)}–{saatStr(rv.bitis)}</span>
                            <span style={{ fontSize: 14, flex: 1, minWidth: 120, textDecoration: rv.durum === 'iptal' ? 'line-through' : 'none' }}>{rv.hastaAdi}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>{durumBilgi.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {gorunum === 'liste' && (
          <>
            {yukleniyor && <p style={{ color: '#94A3B8' }}>Yükleniyor…</p>}
            {!yukleniyor && siraliListe.length === 0 && <p style={{ color: '#94A3B8' }}>Bu ayda randevu yok.</p>}
            {siraliListe.length > 0 && (
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
                {siraliListe.map((rv, idx) => {
                  const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                  const b = new Date(rv.baslangic);
                  return (
                    <div
                      key={rv.id}
                      onClick={() => duzenlemeyeAc(rv)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderTop: idx ? '1px solid rgba(255,255,255,0.06)' : 'none', cursor: 'pointer', opacity: rv.durum === 'iptal' ? 0.5 : 1, flexWrap: 'wrap' }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: TUR_RENK[rv.tur] || TUR_RENK.diger, flexShrink: 0 }} title={TUR_ETIKET[rv.tur] || rv.tur} />
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: '#94A3B8', minWidth: 104 }}>
                        {b.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })} {HAFTA_GUNLERI[(b.getDay() + 6) % 7]} {saatStr(rv.baslangic)}
                      </span>
                      <span style={{ fontSize: 14, flex: 1, minWidth: 120, textDecoration: rv.durum === 'iptal' ? 'line-through' : 'none' }}>
                        {rv.hastaAdi}{!rv.kayitliHasta && <span style={{ fontSize: 10, color: '#F59E0B', marginLeft: 6 }}>kayıtsız</span>}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{TUR_ETIKET[rv.tur] || rv.tur}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>{durumBilgi.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {formAcik && (
          <div
            role="presentation"
            onClick={() => setFormAcik(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
          >
            <form
              onSubmit={kaydet}
              onClick={(e) => e.stopPropagation()}
              className="ni-card"
              style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', margin: 0 }}
            >
              <h3 className="ni-h3">{duzenlenenId ? 'Randevuyu Düzenle' : 'Yeni Randevu'} — {tarihBaslikStr(gun)}</h3>

              {resmiTatilMi(gun) && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', color: '#B91C1C', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>
                  Bu tarih resmi tatile denk geliyor: <strong>{resmiTatilMi(gun)?.ad}</strong>
                </div>
              )}

              {duzenlenenId && duzenlenenRandevu && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(10,22,40,0.08)' }}>
                  {(() => {
                    const durumBilgi = DURUM_ETIKET[duzenlenenRandevu.durum] || DURUM_ETIKET.planlandi;
                    const gecmis = new Date(duzenlenenRandevu.bitis) < new Date();
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 12, color: 'rgba(10,22,40,0.5)' }}>Mevcut durum:</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg }}>
                            {durumBilgi.label}
                          </span>
                        </div>
                        {duzenlenenRandevu.durum !== 'iptal' && !modalIptalAcik && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {duzenlenenRandevu.patientId && (
                              <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${duzenlenenRandevu.patientId}`)} style={{ ...modalAksiyonBtn, color: '#0F9B8E', fontWeight: 600, borderColor: '#0F9B8E' }}>Hasta Dosyasını Aç</button>
                            )}
                            {duzenlenenRandevu.patientId && (
                              <button type="button" onClick={() => router.push(`/dashboard/doktor/hastalar/${duzenlenenRandevu.patientId}?tab=formu`)} style={{ ...modalAksiyonBtn, color: '#0F9B8E', borderColor: '#0F9B8E' }}>Hasta Formu</button>
                            )}
                            {duzenlenenRandevu.durum === 'planlandi' && (
                              <button type="button" onClick={() => modalDurumDegistir('onaylandi')} style={modalAksiyonBtn}>Onayla</button>
                            )}
                            {gecmis && duzenlenenRandevu.durum !== 'tamamlandi' && duzenlenenRandevu.durum !== 'gelmedi' && (
                              <>
                                <button type="button" onClick={() => modalDurumDegistir('tamamlandi')} style={modalAksiyonBtn}>Tamamlandı</button>
                                <button type="button" onClick={() => modalDurumDegistir('gelmedi')} style={{ ...modalAksiyonBtn, color: '#F59E0B', borderColor: '#F59E0B' }}>Gelmedi</button>
                              </>
                            )}
                            <button type="button" onClick={() => setModalIptalAcik(true)} style={{ ...modalAksiyonBtn, color: '#EF4444', borderColor: '#EF4444' }}>İptal Et</button>
                            <button type="button" onClick={modalSil} style={{ ...modalAksiyonBtn, color: '#64748B' }}>Sil</button>
                          </div>
                        )}
                        {modalIptalAcik && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input
                              className="ni-input"
                              value={modalIptalNedeni}
                              onChange={(e) => setModalIptalNedeni(e.target.value)}
                              placeholder="İptal nedeni (isteğe bağlı)"
                              style={{ flex: 1 }}
                            />
                            <button type="button" onClick={() => modalDurumDegistir('iptal', modalIptalNedeni)} style={{ ...modalAksiyonBtn, background: '#EF4444', color: 'white', borderColor: '#EF4444' }}>Onayla</button>
                            <button type="button" onClick={() => { setModalIptalAcik(false); setModalIptalNedeni(''); }} style={modalAksiyonBtn}>Vazgeç</button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="ni-field">
                <label className="ni-label">Hasta ara</label>
                <input
                  className="ni-input"
                  value={hastaArama}
                  onChange={(e) => { setHastaArama(e.target.value); setSeciliHasta(null); }}
                  placeholder="Ad soyad yazın…"
                  autoComplete="off"
                />
                {hastaSonuclari.length > 0 && !seciliHasta && (
                  <div className="ni-results">
                    {hastaSonuclari.map((h) => (
                      <button
                        type="button"
                        key={h.id}
                        className="ni-result"
                        onClick={() => { setSeciliHasta(h); setHastaArama(''); setHastaSonuclari([]); }}
                      >
                        <span className="ni-result-name">{h.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {seciliHasta && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#0F9B8E' }}>
                    Seçildi: {seciliHasta.name}{' '}
                    <button type="button" onClick={() => setSeciliHasta(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', textDecoration: 'underline' }}>değiştir</button>
                  </div>
                )}
                {!seciliHasta && hastaArama.trim().length === 0 && (
                  <p className="ni-hint">Kayıtlı değilse aşağıya isim ve telefon girerek kayıtsız randevu oluşturabilirsiniz.</p>
                )}
              </div>

              {!seciliHasta && (
                <div className="ni-grid">
                  <div className="ni-field">
                    <label className="ni-label">Hasta adı *</label>
                    <input className="ni-input" value={serbestAd} onChange={(e) => setSerbestAd(e.target.value)} placeholder="Ad Soyad" />
                  </div>
                  <div className="ni-field">
                    <label className="ni-label">Telefon</label>
                    <input className="ni-input" value={serbestTelefon} onChange={(e) => setSerbestTelefon(e.target.value)} placeholder="05xx xxx xx xx" />
                  </div>
                </div>
              )}

              <div className="ni-grid">
                <div className="ni-field">
                  <label className="ni-label">Tarih *</label>
                  <input className="ni-input" type="date" value={tarihInputStr(gun)} onChange={(e) => { if (e.target.value) setGun(new Date(e.target.value + 'T00:00:00')); }} />
                </div>
                <div className="ni-field">
                  <label className="ni-label">Saat *</label>
                  <input className="ni-input" type="time" value={saat} onChange={(e) => setSaat(e.target.value)} />
                </div>
                <div className="ni-field">
                  <label className="ni-label">Süre (dk) *</label>
                  <input className="ni-input" type="number" min={5} step={5} value={sureDk} onChange={(e) => setSureDk(Math.max(5, Number(e.target.value) || 20))} />
                </div>
                <div className="ni-field">
                  <label className="ni-label">Tür</label>
                  <select className="ni-input" value={tur} onChange={(e) => setTur(e.target.value)}>
                    {Object.entries(TUR_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="ni-field">
                <label className="ni-label">Hasta Durumu</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#0A1628' }}>
                    <input
                      type="checkbox"
                      checked={hastaDurumu === 'saglikli'}
                      onChange={() => setHastaDurumu(hastaDurumu === 'saglikli' ? '' : 'saglikli')}
                    />
                    Sağlıklı Hasta
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#0A1628' }}>
                    <input
                      type="checkbox"
                      checked={hastaDurumu === 'sikayetli'}
                      onChange={() => setHastaDurumu(hastaDurumu === 'sikayetli' ? '' : 'sikayetli')}
                    />
                    Hasta Olan Bir Hasta
                  </label>
                </div>
              </div>

              <div className="ni-field">
                <label className="ni-label">Not / Şikayet</label>
                <textarea className="ni-input" value={notlar} onChange={(e) => setNotlar(e.target.value)} placeholder="İsteğe bağlı" rows={3} style={{ resize: 'vertical', minHeight: 64 }} />
              </div>

              {hata && <div className="ni-error">{hata}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="ni-btn" disabled={kaydediliyor} style={{ flex: 1 }}>
                  {kaydediliyor ? 'Kaydediliyor…' : duzenlenenId ? 'Güncelle' : 'Randevuyu Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormAcik(false); formuSifirla(); }}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: 10, padding: '0 20px' }}
                >Vazgeç</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  color: 'white',
  borderRadius: 8,
  width: 36,
  height: 36,
  cursor: 'pointer',
};

const aksiyonBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  color: '#CBD5E1',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 12,
  cursor: 'pointer',
};

const modalAksiyonBtn: React.CSSProperties = {
  background: 'white',
  border: '1px solid rgba(10,22,40,0.15)',
  color: '#0A1628',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 12,
  cursor: 'pointer',
};
