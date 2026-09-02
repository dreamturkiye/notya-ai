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
  const [kenarRandevular, setKenarRandevular] = useState<Randevu[]>([]);
  const [haftaRandevular, setHaftaRandevular] = useState<Record<string, number>>({});
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

  /** NOTYA-RANDEVU-12: kenar çubuğu ajandası (Bugün/Yarın) — hangi görünüm açık olursa
   * olsun beslenmesi gerektiği için kendi 2 günlük penceresini çeker (ucuz sorgu). */
  const kenarYukle = useCallback(async () => {
    try {
      const b = new Date(); b.setHours(0, 0, 0, 0);
      const s = new Date(b.getTime() + 86400000); s.setHours(23, 59, 59, 999);
      const liste = await araligiCek(b, s);
      if (liste) setKenarRandevular(liste);
    } catch { /* kenar çubuğu kritik değil */ }
  }, [araligiCek]);

  /** NOTYA-RANDEVU-13: Gün görünümündeki hafta şeridi için gün başına randevu sayısı —
   * mobil takvim deseninin (Timepage / Fantastical iOS) üst şerit noktalarını besler. */
  const haftaYukle = useCallback(async () => {
    try {
      const pzt = new Date(gun);
      const idx = (pzt.getDay() + 6) % 7;
      pzt.setDate(pzt.getDate() - idx); pzt.setHours(0, 0, 0, 0);
      const paz = new Date(pzt.getTime() + 6 * 86400000); paz.setHours(23, 59, 59, 999);
      const liste = await araligiCek(pzt, paz);
      if (liste) {
        const g: Record<string, number> = {};
        for (const rv of liste) {
          const k = yerelGunAnahtari(new Date(rv.baslangic));
          g[k] = (g[k] || 0) + 1;
        }
        setHaftaRandevular(g);
      }
    } catch { /* şerit noktaları kritik değil */ }
  }, [gun, araligiCek]);

  const yenile = useCallback(async () => {
    if (gorunum === 'ay') await ayVerisiYukle();
    else if (gorunum === 'gun') { await gunVerisiYukle(); await haftaYukle(); }
    else if (gorunum === 'ajanda') await ajandaYukle();
    else await listeYukle();
    await kenarYukle();
  }, [gorunum, ayVerisiYukle, gunVerisiYukle, haftaYukle, ajandaYukle, listeYukle, kenarYukle]);

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

  const kenarGrup = useMemo(() => {
    const bugunK = yerelGunAnahtari(new Date());
    const yarinK = yerelGunAnahtari(new Date(Date.now() + 86400000));
    const sirala = (l: Randevu[]) => l.sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime());
    return {
      bugun: sirala(kenarRandevular.filter((r) => yerelGunAnahtari(new Date(r.baslangic)) === bugunK)),
      yarin: sirala(kenarRandevular.filter((r) => yerelGunAnahtari(new Date(r.baslangic)) === yarinK)),
    };
  }, [kenarRandevular]);

  const haftaGunleri = useMemo(() => {
    const pzt = new Date(gun);
    const idx = (pzt.getDay() + 6) % 7;
    pzt.setDate(pzt.getDate() - idx); pzt.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => new Date(pzt.getFullYear(), pzt.getMonth(), pzt.getDate() + i));
  }, [gun]);

  /** Ortak araç çubuğu gezinmesi — Fantastical'daki tek ‹ Bugün › grubu. Gün görünümünde
   * gün, diğerlerinde ay kaydırır (ajandada ay kaydırmak kenar çubuğu mini ayını gezdirir). */
  function geri() {
    if (gorunum === 'gun') setGun((g) => new Date(g.getTime() - 86400000));
    else setAy((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1));
  }
  function ileri() {
    if (gorunum === 'gun') setGun((g) => new Date(g.getTime() + 86400000));
    else setAy((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1));
  }
  function bugune() {
    setAy(new Date());
    setGun(new Date());
  }

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
      <style>{`
        @media (max-width: 1023px) { .fv-aside { display: none !important; } }
        @media (max-width: 639px) {
          .fv-wrap { padding: 10px !important; }
          .fv-toolbar { padding: 10px !important; gap: 8px !important; }
          .fv-title { font-size: 14px !important; min-width: 0 !important; }
          .fv-dateinput { display: none !important; }
          .fv-seg-btn { padding: 5px 10px !important; font-size: 12px !important; }
        }
        .fv-cell:hover { background: rgba(255,255,255,0.04); }
        .fv-hrow:hover { background: rgba(255,255,255,0.09) !important; }
        .fv-ev:hover { background: rgba(255,255,255,0.08); }
        .fv-mini:hover { background: rgba(255,255,255,0.12) !important; }
      `}</style>
      <div className="fv-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Randevular</h1>
          {rol === 'sekreter' && (
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(15,155,142,0.2)', color: '#0F9B8E' }}>
              Sekreter olarak bağlısınız
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 44px rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* ——— Kenar çubuğu — koyu iki tonun koyusu: mini ay + Bugün/Yarın ajandası ——— */}
          <aside className="fv-aside" style={{ width: 264, flexShrink: 0, background: '#08111F', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, fontSize: 22, fontWeight: 800, lineHeight: 1.1, textTransform: 'capitalize', color: '#EDF1F7' }}>
                {ay.toLocaleDateString('tr-TR', { month: 'long' })} <span style={{ color: '#0F9B8E' }}>{ay.getFullYear()}</span>
              </div>
              <button type="button" onClick={() => setAy((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1))} style={miniNavBtn}>‹</button>
              <button type="button" onClick={() => setAy((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1))} style={miniNavBtn}>›</button>
            </div>

            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((g, i2) => (
                  <div key={i2} style={{ fontSize: 9, color: '#5F7189', textAlign: 'center', fontWeight: 700 }}>{g}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
                {gridGunleri.map((d, i2) => {
                  const anahtar = yerelGunAnahtari(d);
                  const bugunMu = anahtar === bugunAnahtari;
                  const buAy = d.getMonth() === ay.getMonth();
                  const dolu = (aylikRandevular[anahtar] || []).length > 0;
                  return (
                    <button
                      key={i2}
                      type="button"
                      className="fv-mini"
                      onClick={() => { setGun(d); setGorunum('gun'); }}
                      style={{ background: bugunMu ? '#0F9B8E' : 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '3px 0 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                    >
                      <span style={{ fontSize: 11, fontWeight: bugunMu ? 700 : 500, color: bugunMu ? 'white' : buAy ? '#DCE4EE' : '#4A5A70' }}>{d.getDate()}</span>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: dolu ? (bugunMu ? 'white' : '#0F9B8E') : 'transparent' }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { etiket: `BUGÜN ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' })}`, renk: '#0F9B8E', liste: kenarGrup.bugun, bos: 'Bugün randevu yok' },
                { etiket: 'YARIN', renk: '#8FA0B5', liste: kenarGrup.yarin, bos: 'Yarın randevu yok' },
              ].map((grup) => (
                <div key={grup.etiket}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: grup.renk, marginBottom: 8 }}>{grup.etiket}</div>
                  {grup.liste.length === 0 && <div style={{ fontSize: 12, color: '#4A5A70' }}>{grup.bos}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {grup.liste.map((rv) => {
                      const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                      const iptalMi = rv.durum === 'iptal';
                      return (
                        <div key={rv.id} onClick={() => duzenlemeyeAc(rv)} style={{ display: 'flex', gap: 8, cursor: 'pointer', opacity: iptalMi ? 0.45 : 1 }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 4, flexShrink: 0, boxSizing: 'border-box', background: rv.durum === 'planlandi' ? 'transparent' : turRenk, border: `2px solid ${turRenk}` }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: '#8FA0B5', fontVariantNumeric: 'tabular-nums' }}>{saatStr(rv.baslangic)} – {saatStr(rv.bitis)}</div>
                            <div style={{ fontSize: 13, color: '#EDF1F7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: iptalMi ? 'line-through' : 'none' }}>{rv.hastaAdi}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ——— Ana panel — koyu iki tonun açığı ——— */}
          <div style={{ flex: 1, minWidth: 0, background: '#0D1C33', color: '#EDF1F7', display: 'flex', flexDirection: 'column' }}>

            <div className="fv-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button type="button" onClick={geri} style={panelNavBtn}>‹</button>
                <button type="button" onClick={bugune} style={{ ...panelNavBtn, width: 'auto', padding: '0 12px', fontWeight: 600, fontSize: 13 }}>Bugün</button>
                <button type="button" onClick={ileri} style={panelNavBtn}>›</button>
              </div>
              <div className="fv-title" style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize', minWidth: 130 }}>
                {gorunum === 'gun' ? tarihBaslikStr(gun) : gorunum === 'ajanda' ? 'Önümüzdeki 30 gün' : ayBaslikStr(ay)}
              </div>
              {gorunum === 'gun' && (
                <input
                  className="fv-dateinput"
                  type="date"
                  value={tarihInputStr(gun)}
                  onChange={(e) => { if (e.target.value) setGun(new Date(e.target.value + 'T00:00:00')); }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '6px 8px', fontSize: 13 }}
                />
              )}
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 9, padding: 2 }}>
                {([['ay', 'Ay'], ['gun', 'Gün'], ['ajanda', 'Ajanda'], ['liste', 'Liste']] as const).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    className="fv-seg-btn"
                    onClick={() => setGorunum(k)}
                    style={{ background: gorunum === k ? '#0F9B8E' : 'transparent', boxShadow: gorunum === k ? '0 1px 5px rgba(0,0,0,0.35)' : 'none', border: 'none', color: 'white', fontWeight: gorunum === k ? 700 : 500, borderRadius: 7, padding: '5px 14px', fontSize: 13, cursor: 'pointer', transition: 'background .15s ease, box-shadow .15s ease' }}
                  >{v}</button>
                ))}
              </div>
              <button type="button" onClick={() => yeniRandevuAc(gorunum === 'gun' ? gun : new Date())} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Randevu
              </button>
            </div>

            <div style={{ padding: '12px 16px 0' }}>
              {hata && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 10 }}>{hata}</div>}
              {resmiTatilMi(new Date()) && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 10 }}>
                  🔔 Bugün resmi tatil: <strong>{resmiTatilMi(new Date())?.ad}</strong> — randevu planlarken dikkat edin.
                </div>
              )}
              {basariMesaji && (
                <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.5)', color: '#4ADE80', borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 10 }}>{basariMesaji}</div>
              )}
              {gorunum === 'ay' && (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                  {Object.entries(TUR_ETIKET).map(([k, v]) => (
                    <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8FA0B5' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: TUR_RENK[k] }} /> {v}
                    </span>
                  ))}
                  <span style={{ fontSize: 11, color: '#5F7189' }}>· içi boş nokta = onay bekliyor · sürükleyip bırakarak taşıyın</span>
                </div>
              )}
            </div>

            {gorunum === 'ay' && (
              <div style={{ overflow: 'auto' }}>
                <div style={{ minWidth: 560 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {HAFTA_GUNLERI.map((g) => (
                      <div key={g} style={{ padding: '7px 6px', fontSize: 10, color: '#5F7189', textAlign: 'center', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{g}</div>
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
                      const hedefMi = surukleId && surukleHedef === anahtar;
                      return (
                        <div
                          key={i}
                          className="fv-cell"
                          onClick={() => gunHucresineTikla(d)}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                          onDragEnter={() => { if (surukleId) setSurukleHedef(anahtar); }}
                          onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) tasiRandevu(id, d); }}
                          title={tatil ? tatil.ad : undefined}
                          style={{
                            minHeight: 104,
                            padding: '5px 5px 6px',
                            borderRight: (i + 1) % 7 !== 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                            borderTop: '1px solid rgba(255,255,255,0.07)',
                            background: hedefMi ? 'rgba(15,155,142,0.16)' : buAyIcinde ? 'transparent' : 'rgba(0,0,0,0.18)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: bugunMu ? 700 : 500, color: bugunMu ? 'white' : buAyIcinde ? '#C9D4E3' : '#4A5A70', background: bugunMu ? '#0F9B8E' : 'transparent', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{d.getDate()}</span>
                          </div>
                          {tatil && (
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#FCA5A5', background: 'rgba(239,68,68,0.16)', borderRadius: 4, padding: '1px 5px', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tatil.ad}</div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {gosterilen.map((rv) => {
                              const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                              const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                              const surukleyebilir = rv.durum === 'planlandi' || rv.durum === 'onaylandi';
                              const iptalMi = rv.durum === 'iptal';
                              return (
                                <div
                                  key={rv.id}
                                  className="fv-ev"
                                  draggable={surukleyebilir}
                                  onDragStart={(e) => { e.stopPropagation(); setSurukleId(rv.id); e.dataTransfer.setData('text/plain', rv.id); e.dataTransfer.effectAllowed = 'move'; }}
                                  onDragEnd={() => { setSurukleId(null); setSurukleHedef(null); }}
                                  onClick={(e) => { e.stopPropagation(); duzenlemeyeAc(rv); }}
                                  title={`${saatStr(rv.baslangic)} ${rv.hastaAdi} · ${TUR_ETIKET[rv.tur] || rv.tur} · ${durumBilgi.label}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, lineHeight: '15px', color: iptalMi ? '#5F7189' : '#E7ECF3', padding: '1px 3px', borderRadius: 4, opacity: rv.id === surukleId ? 0.45 : 1, textDecoration: iptalMi ? 'line-through' : 'none', cursor: surukleyebilir ? 'grab' : 'pointer' }}
                                >
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', background: rv.durum === 'planlandi' ? 'transparent' : iptalMi ? '#4A5A70' : turRenk, border: `2px solid ${iptalMi ? '#4A5A70' : turRenk}` }} />
                                  <span style={{ color: '#7C8AA0', fontVariantNumeric: 'tabular-nums', flexShrink: 0, fontSize: 10 }}>{saatStr(rv.baslangic)}</span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rv.hastaAdi}</span>
                                </div>
                              );
                            })}
                            {fazlaSayisi > 0 && <div style={{ fontSize: 10, color: '#7C8AA0', paddingLeft: 15 }}>+{fazlaSayisi} daha</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {gorunum === 'gun' && (
              <div style={{ padding: '4px 16px 20px' }}>
                {/* NOTYA-RANDEVU-13: hafta şeridi — mobil takvim deseni (tüm genişliklerde) */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0 12px', WebkitOverflowScrolling: 'touch' }}>
                  {haftaGunleri.map((d, i) => {
                    const k = yerelGunAnahtari(d);
                    const secili = k === yerelGunAnahtari(gun);
                    const bugunMu = k === bugunAnahtari;
                    const dolu = (haftaRandevular[k] || 0) > 0;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setGun(new Date(d))}
                        style={{ minWidth: 46, flex: 1, background: secili ? '#0F9B8E' : 'rgba(255,255,255,0.05)', border: bugunMu && !secili ? '1px solid #0F9B8E' : '1px solid transparent', borderRadius: 12, padding: '8px 0 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, color: secili ? 'rgba(255,255,255,0.85)' : '#7C8AA0' }}>{HAFTA_GUNLERI[i]}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{d.getDate()}</span>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: dolu ? (secili ? 'white' : '#0F9B8E') : 'transparent' }} />
                      </button>
                    );
                  })}
                </div>

                {yukleniyor && <p style={{ color: '#7C8AA0', fontSize: 14 }}>Yükleniyor…</p>}
                {!yukleniyor && siraliGunlukRandevular.length === 0 && (
                  <p style={{ color: '#7C8AA0', fontSize: 14 }}>Bu güne ait randevu yok.</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {siraliGunlukRandevular.map((rv) => {
                    const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                    const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                    const gecmis = new Date(rv.bitis) < new Date();
                    return (
                      <div
                        key={rv.id}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `3px solid ${turRenk}`, borderRadius: 12, padding: 14, opacity: rv.durum === 'iptal' ? 0.55 : 1 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{saatStr(rv.baslangic)} – {saatStr(rv.bitis)}</div>
                            <div style={{ fontSize: 15, marginTop: 2 }}>{rv.hastaAdi}{!rv.kayitliHasta && <span style={{ fontSize: 11, color: '#F59E0B', marginLeft: 6 }}>kayıtsız</span>}</div>
                            <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 2 }}>{TUR_ETIKET[rv.tur] || rv.tur}{rv.hastaTelefon ? ` · ${rv.hastaTelefon}` : ''}</div>
                            {rv.notlar && <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4, whiteSpace: 'pre-wrap' }}>{rv.notlar}</div>}
                            {rv.durum === 'iptal' && rv.iptalNedeni && <div style={{ fontSize: 12, color: '#FCA5A5', marginTop: 4 }}>İptal: {rv.iptalNedeni}</div>}
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
                              <button type="button" onClick={() => durumDegistir(rv.id, 'onaylandi')} style={{ ...aksiyonBtn, color: '#4ADE80', fontWeight: 600 }}>Onayla</button>
                            )}
                            {gecmis && rv.durum !== 'tamamlandi' && rv.durum !== 'gelmedi' && (
                              <>
                                <button type="button" onClick={() => durumDegistir(rv.id, 'tamamlandi')} style={aksiyonBtn}>Tamamlandı</button>
                                <button type="button" onClick={() => durumDegistir(rv.id, 'gelmedi')} style={{ ...aksiyonBtn, color: '#F59E0B' }}>Gelmedi</button>
                              </>
                            )}
                            <button type="button" onClick={() => setIptalId(rv.id)} style={{ ...aksiyonBtn, color: '#F87171' }}>İptal Et</button>
                            <button type="button" onClick={() => sil(rv.id)} style={{ ...aksiyonBtn, color: '#7C8AA0' }}>Sil</button>
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
                              style={{ ...aksiyonBtn, background: '#EF4444', color: 'white', border: 'none' }}
                            >Onayla</button>
                            <button type="button" onClick={() => { setIptalId(null); setIptalNedeni(''); }} style={aksiyonBtn}>Vazgeç</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {gorunum === 'ajanda' && (
              <div style={{ padding: '4px 16px 20px' }}>
                {yukleniyor && <p style={{ color: '#7C8AA0', fontSize: 14 }}>Yükleniyor…</p>}
                {!yukleniyor && ajandaGunleri.length === 0 && <p style={{ color: '#7C8AA0', fontSize: 14 }}>Önümüzdeki 30 günde randevu yok.</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {ajandaGunleri.map(({ anahtar, tarih, liste }) => {
                    const tatil = resmiTatilMi(tarih);
                    const bugunMu = anahtar === bugunAnahtari;
                    return (
                      <div key={anahtar}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: bugunMu ? '#0F9B8E' : '#EDF1F7', textTransform: 'capitalize' }}>{tarihBaslikStr(tarih)}</span>
                          {tatil && <span style={{ fontSize: 11, color: '#FCA5A5' }}>· {tatil.ad}</span>}
                          <span style={{ fontSize: 11, color: '#5F7189' }}>· {liste.length} randevu</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {liste.map((rv) => {
                            const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                            const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                            return (
                              <div
                                key={rv.id}
                                className="fv-hrow"
                                onClick={() => duzenlemeyeAc(rv)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', opacity: rv.durum === 'iptal' ? 0.5 : 1, flexWrap: 'wrap' }}
                              >
                                <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', background: rv.durum === 'planlandi' ? 'transparent' : turRenk, border: `2px solid ${turRenk}` }} title={TUR_ETIKET[rv.tur] || rv.tur} />
                                <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: '#8FA0B5', minWidth: 92 }}>{saatStr(rv.baslangic)}–{saatStr(rv.bitis)}</span>
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
              </div>
            )}

            {gorunum === 'liste' && (
              <div style={{ padding: '4px 16px 20px' }}>
                {yukleniyor && <p style={{ color: '#7C8AA0', fontSize: 14 }}>Yükleniyor…</p>}
                {!yukleniyor && siraliListe.length === 0 && <p style={{ color: '#7C8AA0', fontSize: 14 }}>Bu ayda randevu yok.</p>}
                {siraliListe.length > 0 && (
                  <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
                    {siraliListe.map((rv, idx) => {
                      const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
                      const turRenk = TUR_RENK[rv.tur] || TUR_RENK.diger;
                      const b = new Date(rv.baslangic);
                      return (
                        <div
                          key={rv.id}
                          className="fv-hrow"
                          onClick={() => duzenlemeyeAc(rv)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', borderTop: idx ? '1px solid rgba(255,255,255,0.06)' : 'none', cursor: 'pointer', opacity: rv.durum === 'iptal' ? 0.5 : 1, flexWrap: 'wrap' }}
                        >
                          <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', background: rv.durum === 'planlandi' ? 'transparent' : turRenk, border: `2px solid ${turRenk}` }} title={TUR_ETIKET[rv.tur] || rv.tur} />
                          <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: '#8FA0B5', minWidth: 108 }}>
                            {b.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })} {HAFTA_GUNLERI[(b.getDay() + 6) % 7]} {saatStr(rv.baslangic)}
                          </span>
                          <span style={{ fontSize: 14, flex: 1, minWidth: 120, textDecoration: rv.durum === 'iptal' ? 'line-through' : 'none' }}>
                            {rv.hastaAdi}{!rv.kayitliHasta && <span style={{ fontSize: 10, color: '#F59E0B', marginLeft: 6 }}>kayıtsız</span>}
                          </span>
                          <span style={{ fontSize: 11, color: '#7C8AA0' }}>{TUR_ETIKET[rv.tur] || rv.tur}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>{durumBilgi.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
                  style={{ background: 'rgba(10,22,40,0.08)', border: 'none', color: '#0A1628', borderRadius: 10, padding: '0 20px' }}
                >Vazgeç</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const miniNavBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  color: 'white',
  borderRadius: 8,
  width: 28,
  height: 28,
  cursor: 'pointer',
  fontSize: 14,
};

const panelNavBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  color: 'white',
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 15,
};

const aksiyonBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  color: '#C9D4E3',
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
