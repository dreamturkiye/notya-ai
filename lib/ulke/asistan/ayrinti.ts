/** Pure helpers (no browser or SDK import) so a plain test can run them. */
/**
 * A short, safe reason for a failed call, shown after the generic message so a failure can be told apart without a debugger
 * (AU-CANLI-03): the step that failed and the provider's own close/error text. Web addresses and long ids are removed (the
 * one-time call address must never reach the screen), the text is one line and at most 90 characters.
 */
export function kisaAyrinti(adim: string, ham?: unknown): string {
  const t = (typeof ham === 'string' ? ham : ham instanceof Error ? `${ham.name}: ${ham.message}` : '')
    .replace(/\b(?:https?|wss?):\/\/\S+/gi, '[url]')
    .replace(/[A-Za-z0-9_-]{24,}/g, '[id]')
    .replace(/\s+/g, ' ')
    .trim()
  return `${adim}${t ? `: ${t}` : ''}`.slice(0, 90)
}
/** The screen's message with the step that failed appended. */
export const hataYazisi = (genel: string, ayrinti: string): string => `${genel} (${ayrinti})`
