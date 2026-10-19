export function reaksiyonSonrasiAralik(reaksiyon: boolean, aralikGun: number): { hata: string } | null {
  if (reaksiyon && !(aralikGun >= 7)) return { hata: 'Reaksiyon sonrası 7 günden kısa seans yok. Karışım yazılmaz.' }
  return null
}
