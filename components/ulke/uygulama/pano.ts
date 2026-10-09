/**
 * Copies text for the doctor to paste elsewhere (a reminder, a patient's link, a PIN). true = it is on the
 * clipboard. Nothing is sent anywhere.
 */
export async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(metin); return true }
  } catch { /* fall through to the older way */ }
  try {
    const alan = document.createElement('textarea')
    alan.value = metin; alan.setAttribute('readonly', ''); alan.style.position = 'fixed'; alan.style.opacity = '0'
    document.body.appendChild(alan); alan.select()
    const tamam = document.execCommand('copy')
    document.body.removeChild(alan)
    return tamam
  } catch { return false }
}
