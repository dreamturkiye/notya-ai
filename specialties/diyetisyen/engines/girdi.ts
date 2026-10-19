export function kiloGirdi(kiloKg: number): { kiloKg: number } | { hata: string } {
  if (!(kiloKg >= 30 && kiloKg <= 250)) return { hata: 'Kilo 30–250 kg aralığında olmalı — Notya uydurmaz.' }
  return { kiloKg }
}
