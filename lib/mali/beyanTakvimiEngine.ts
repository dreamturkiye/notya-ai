// FILE 1
export interface Müşteri {
  id: string
  sirket_adi: string
  vergi_no?: string
  faaliyet_alani?: string
}

export interface BeyanItem {
  beyanTuru: string
  aciklama: string
  sonGun: string
  daysLeft: number
  risk: 'kritik' | 'uyari' | 'normal'
  kanun: string
  musteriId?: string
  müşteriAdi?: string
}

const AYLIK_BEYANLAR = [
  { beyanTuru: 'KDV-1 Beyannamesi', gun: 26, kanun: 'KDV Kanunu Md.41' },
  { beyanTuru: 'Muhtasar ve Prim Hizmet Beyannamesi', gun: 26, kanun: 'GVK Md.98, SGK' },
  { beyanTuru: 'SGK e-Bildirge', gun: 23, kanun: 'SGK Mevzuati' },
]

const UCAYLIK_BEYANLAR = [
  { beyanTuru: 'Gecici Vergi Beyannamesi', aylar: [2,5,8,11], gun: 17, kanun: 'GVK Md.118' },
]

const YILLIK_BEYANLAR_2026 = [
  { beyanTuru: 'Kurumlar Vergisi Beyannamesi', tarih: '2026-04-30', kanun: 'KVK Md.24' },
  { beyanTuru: 'Gelir Vergisi Beyannamesi', tarih: '2026-03-31', kanun: 'GVK Md.92' },
  { beyanTuru: 'MASAK Uyum Bildirimi', tarih: '2026-01-31', kanun: 'MASAK Md.30' },
  { beyanTuru: 'Yapilandirma Son Gunu', tarih: '2026-08-31', kanun: '7440 Sayili Kanun' },
]

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function getBeyanlarimForMusteri(musteriId: string, müşteriAdi: string, today: Date): BeyanItem[] {
  const items: BeyanItem[] = []
  const endDate = addDays(today, 60)

  // Monthly
  let current = new Date(today.getFullYear(), today.getMonth(), 1)
  while (current <= endDate) {
    for (const b of AYLIK_BEYANLAR) {
      const son = new Date(current.getFullYear(), current.getMonth(), b.gun)
      if (son >= today && son <= endDate) {
        const daysLeft = Math.ceil((son.getTime() - today.getTime()) / (1000 * 3600 * 24))
        const risk = daysLeft <= 3 ? 'kritik' : daysLeft <= 7 ? 'uyari' : 'normal'
        items.push({
          beyanTuru: b.beyanTuru,
          aciklama: `${b.beyanTuru} - ${current.toLocaleString('tr-TR', { month: 'long' })}`,
          sonGun: formatDate(son),
          daysLeft,
          risk,
          kanun: b.kanun,
          musteriId,
          müşteriAdi,
        })
      }
    }
    current.setMonth(current.getMonth() + 1)
  }

  // Quarterly
  for (const q of UCAYLIK_BEYANLAR) {
    for (const ay of q.aylar) {
      const yil = today.getFullYear()
      const son = new Date(yil, ay - 1, q.gun)
      if (son >= today && son <= endDate) {
        const daysLeft = Math.ceil((son.getTime() - today.getTime()) / (1000 * 3600 * 24))
        const risk = daysLeft <= 3 ? 'kritik' : daysLeft <= 7 ? 'uyari' : 'normal'
        items.push({
          beyanTuru: q.beyanTuru,
          aciklama: `${q.beyanTuru} - ${son.toLocaleString('tr-TR', { month: 'long' })}`,
          sonGun: formatDate(son),
          daysLeft,
          risk,
          kanun: q.kanun,
          musteriId,
          müşteriAdi,
        })
      }
    }
  }

  // Annual 2026
  for (const y of YILLIK_BEYANLAR_2026) {
    const son = new Date(y.tarih)
    if (son >= today && son <= endDate) {
      const daysLeft = Math.ceil((son.getTime() - today.getTime()) / (1000 * 3600 * 24))
      const risk = daysLeft <= 3 ? 'kritik' : daysLeft <= 7 ? 'uyari' : 'normal'
      items.push({
        beyanTuru: y.beyanTuru,
        aciklama: y.beyanTuru,
        sonGun: y.tarih,
        daysLeft,
        risk,
        kanun: y.kanun,
        musteriId,
        müşteriAdi,
      })
    }
  }

  items.sort((a, b) => a.sonGun.localeCompare(b.sonGun))
  return items
}

export function getKritikBeyanlar(items: BeyanItem[]): BeyanItem[] {
  return items.filter(i => i.risk === 'kritik')
}

export function formatTelegramAlert(item: BeyanItem): string {
  return `NOTYA AI UYARI\n${item.müşteriAdi} - ${item.beyanTuru}\nSon Gun: ${item.sonGun} (${item.daysLeft} gun kaldi)\nKanun: ${item.kanun}`
}

// FILE 2