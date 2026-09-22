export function ergomHatirlatmalari(due: string | null): Array<{ ad: string; durum: string }> {
  if (!due) return [{ ad: 'Ev programı / seans tarihi kaydedilince görünür', durum: 'planli' }]
  return [{ ad: 'Ergoterapi seansı', durum: 'planli' }, { ad: `Tarih: ${due}`, durum: 'planli' }]
}
