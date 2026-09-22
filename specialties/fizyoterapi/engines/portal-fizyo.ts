export function fizyomHatirlatmalari(due: string | null): Array<{ ad: string; durum: string }> {
  if (!due) return [{ ad: 'Ev egzersizi / seans tarihi kaydedilince görünür', durum: 'planli' }]
  return [{ ad: 'Sonraki fizyoterapi seansı', durum: 'planli' }, { ad: `Tarih: ${due}`, durum: 'planli' }]
}
