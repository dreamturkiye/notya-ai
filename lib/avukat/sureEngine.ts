// sureEngine.ts

export interface SureKurali {
  id: string;
  kanun: string;
  madde: string;
  aciklama: string;
  gun?: number;
  hafta?: number;
  ay?: number;
  kritik: boolean;
  tur: 'HMK' | 'CMK' | 'IIK' | 'IYUK' | 'TMK' | 'TTK';
}

export interface DeadlineResult {
  sureId: string;
  aciklama: string;
  sonGun: Date;
  gunKaldi: number;
  kritik: boolean;
  kanun: string;
}

const SURE_KURALLARI: Record<string, SureKurali> = {
  cevap_suresi: {
    id: 'cevap_suresi',
    kanun: 'HMK',
    madde: '127',
    aciklama: 'Cevap süresi',
    hafta: 2,
    kritik: true,
    tur: 'HMK'
  },
  itiraz_suresi: {
    id: 'itiraz_suresi',
    kanun: 'IIK',
    madde: '62',
    aciklama: 'İtiraz süresi',
    gun: 7,
    kritik: true,
    tur: 'IIK'
  },
  istinaf: {
    id: 'istinaf',
    kanun: 'HMK',
    madde: '345',
    aciklama: 'İstinaf süresi',
    hafta: 2,
    kritik: false,
    tur: 'HMK'
  },
  temyiz: {
    id: 'temyiz',
    kanun: 'HMK',
    madde: '361',
    aciklama: 'Temyiz süresi',
    ay: 2,
    kritik: false,
    tur: 'HMK'
  },
  uzlasma_teklifi: {
    id: 'uzlasma_teklifi',
    kanun: 'CMK',
    madde: '253',
    aciklama: 'Uzlaşma teklifi süresi',
    gun: 3,
    kritik: true,
    tur: 'CMK'
  },
  delil_listesi: {
    id: 'delil_listesi',
    kanun: 'HMK',
    madde: '194',
    aciklama: 'Delil listesi süresi',
    gun: 0, // Special case, typically immediate
    kritik: true,
    tur: 'HMK'
  },
  nafaka_itiraz: {
    id: 'nafaka_itiraz',
    kanun: 'TMK',
    madde: '176',
    aciklama: 'Nafa ka itiraz süresi',
    ay: 1,
    kritik: true,
    tur: 'TMK'
  },
  idari_itiraz: {
    id: 'idari_itiraz',
    kanun: 'IYUK',
    madde: '7',
    aciklama: 'İdari itiraz süresi',
    gun: 30,
    kritik: true,
    tur: 'IYUK'
  },
  // Add more rules as needed

  nafaka_itiraz: { id: 'nafaka_itiraz', kanun: 'TMK', madde: '176', aciklama: 'Nafaka itiraz suresi', ay: 1, kritik: true, tur: 'TMK' },
  idari_itiraz_sure: { id: 'idari_itiraz_sure', kanun: 'IYUK', madde: '7', aciklama: 'Idare mahkemesi itiraz', gun: 30, kritik: true, tur: 'IYUK' },
  bosanma_cevap: { id: 'bosanma_cevap', kanun: 'HMK', madde: '127', aciklama: 'Bosanma cevap suresi', hafta: 2, kritik: true, tur: 'HMK' },
  is_davasi_istinaf: { id: 'is_davasi_istinaf', kanun: 'HMK', madde: '345', aciklama: 'Is mahkemesi istinaf', hafta: 2, kritik: true, tur: 'HMK' },
  tuketici_itiraz: { id: 'tuketici_itiraz', kanun: 'IYUK', madde: '7', aciklama: 'Tuketici hakem itiraz', gun: 15, kritik: false, tur: 'IYUK' },
  icra_itiraz_kaldirma: { id: 'icra_itiraz_kaldirma', kanun: 'IIK', madde: '68', aciklama: 'Itiraz kaldirma suresi', gun: 7, kritik: true, tur: 'IIK' },
  menfi_tespit: { id: 'menfi_tespit', kanun: 'IIK', madde: '72', aciklama: 'Menfi tespit davasi', ay: 1, kritik: true, tur: 'IIK' },
  uzlasma_yanit: { id: 'uzlasma_yanit', kanun: 'CMK', madde: '253', aciklama: 'Uzlasma teklifi yaniti', gun: 3, kritik: false, tur: 'CMK' },
  tapu_istinaf: { id: 'tapu_istinaf', kanun: 'HMK', madde: '345', aciklama: 'Tapu iptali istinaf', hafta: 2, kritik: true, tur: 'HMK' },
  ttk_itiraz: { id: 'ttk_itiraz', kanun: 'TTK', madde: '123', aciklama: 'Ticaret sicili itiraz', gun: 30, kritik: false, tur: 'TTK' },
};

function calculateDeadlines(baslangicTarihi: Date, sureIds: string[]): DeadlineResult[] {
  return sureIds.map(sureId => {
    const rule = SURE_KURALLARI[sureId];
    if (!rule) throw new Error(`Rule not found for ID: ${sureId}`);
    
    let sonGun = new Date(baslangicTarihi);
    if (rule.gun) sonGun.setDate(sonGun.getDate() + rule.gun);
    if (rule.hafta) sonGun.setDate(sonGun.getDate() + rule.hafta * 7);
    if (rule.ay) {
      for (let i = 0; i < rule.ay; i++) {
        sonGun.setMonth(sonGun.getMonth() + 1);
      }
    }

    const gunKaldi = Math.ceil((sonGun.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));

    return {
      sureId: rule.id,
      aciklama: rule.aciklama,
      sonGun: sonGun,
      gunKaldi: gunKaldi,
      kritik: rule.kritik,
      kanun: rule.kanun
    };
  });
}

function getSurelerForBranch(branch: string): string[] {
  const branchRules = {
    ceza: ['cevap_suresi', 'itiraz_suresi'],
    aile: ['istinaf', 'temyiz'],
    ticaret: ['uzlasma_teklifi'],
    is: ['delil_listesi'],
    gayrimenkul: ['nafaka_itiraz'],
    icra: ['idari_itiraz'],
    idare: [],
    tuketici: [],
    bilisim: []
  };

  return branchRules[branch] || [];
}

function formatDateTR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 6 || day === 0; // Saturday (6) and Sunday (0)
}

function addWorkingDays(date: Date, days: number): Date {
  let result = new Date(date);
  for (let i = 0; i < days; i++) {
    do {
      result.setDate(result.getDate() + 1);
    } while (isWeekend(result));
  }
  return result;
}

export { SURE_KURALLARI, calculateDeadlines, getSurelerForBranch, formatDateTR, isWeekend, addWorkingDays };