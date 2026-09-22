export function seanslarimHatirlatmalari(due: string | null): Array<{ ad: string; durum: string }> {
  if (!due) return [{ ad: 'Sonraki görüşme tarihi kaydedilince görünür', durum: 'planli' }]
  return [{ ad: 'Sonraki görüşme', durum: 'planli' }, { ad: `Tarih: ${due}`, durum: 'planli' }]
}
