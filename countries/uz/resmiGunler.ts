/**
 * Official rest days. Fixed dates follow the holidays statute on lex.uz (the law on holidays,
 * as amended). The two movable feasts are NOT taken from another country's calendar: each year
 * the Cabinet sets them, and the table below is a draft until that decree is copied in.
 * A lawyer and a clinician have not signed this list.
 */
import { aralikta, yillar } from '@/lib/ulke/tatiller/hesap'
import type { ResmiGun, ResmiGunKaynagi } from '@/lib/ulke/tatiller/tipler'

const SABIT: readonly ResmiGun[] = [
  { tarih: '01-01', ad: 'Yangi yil' },
  { tarih: '03-08', ad: 'Xotin-qizlar kuni' },
  { tarih: '03-21', ad: 'Navroz' },
  { tarih: '05-09', ad: 'Xotira va qadrlash kuni' },
  { tarih: '09-01', ad: 'Mustaqillik kuni' },
  { tarih: '10-01', ad: 'Oqituvchi va murabbiylar kuni' },
  { tarih: '12-08', ad: 'Konstitutsiya kuni' },
]

/**
 * Draft only. Replace from the Cabinet decree for that year.
 * 2026 is the pair of days around the March and May feasts used as a placeholder.
 * Later years step about eleven days earlier. `inceleme` stays on every one of them.
 */
const TASLAK: Record<number, readonly ResmiGun[]> = {
  2026: [
    { tarih: '2026-03-20', ad: 'Ramazon hayiti', inceleme: true },
    { tarih: '2026-03-21', ad: 'Ramazon hayiti', inceleme: true },
    { tarih: '2026-05-27', ad: 'Qurbon hayiti', inceleme: true },
    { tarih: '2026-05-28', ad: 'Qurbon hayiti', inceleme: true },
  ],
  2027: [
    { tarih: '2027-03-10', ad: 'Ramazon hayiti', inceleme: true },
    { tarih: '2027-03-11', ad: 'Ramazon hayiti', inceleme: true },
    { tarih: '2027-05-17', ad: 'Qurbon hayiti', inceleme: true },
    { tarih: '2027-05-18', ad: 'Qurbon hayiti', inceleme: true },
  ],
  2028: [
    { tarih: '2028-02-27', ad: 'Ramazon hayiti', inceleme: true },
    { tarih: '2028-02-28', ad: 'Ramazon hayiti', inceleme: true },
    { tarih: '2028-05-05', ad: 'Qurbon hayiti', inceleme: true },
    { tarih: '2028-05-06', ad: 'Qurbon hayiti', inceleme: true },
  ],
}

function yilGunleri(yil: number): ResmiGun[] {
  return [
    ...SABIT.map((g) => ({ tarih: `${yil}-${g.tarih}`, ad: g.ad })),
    ...(TASLAK[yil] ?? []),
  ]
}

export const UZ_RESMI_GUNLER: ResmiGunKaynagi = {
  bolgeler: [{ kod: 'milliy', ad: 'Milliy' }],
  varsayilan: 'milliy',
  gunler: (_bolge, bas, bit) => aralikta(yillar(bas, bit).flatMap(yilGunleri), bas, bit),
  kaynak: 'Fixed dates: the holidays statute, lex.uz (law on holidays, as amended). Movable feasts: a draft table, to be replaced by the Cabinet decree for the year. Read as a draft on 2026-10-13.',
  inceleme: 'The movable feast dates are a draft. They are not a decree, and a lawyer and a clinician replace them when the decree for that year is published. Fixed dates should be read against the current text of the statute.',
}
