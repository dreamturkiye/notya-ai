/**
 * Interaction adapter. No pair is stored. Nothing is called.
 * A commercial database (First Databank, Medscape, or the British National Formulary) needs its own contract.
 * No monograph from any of them is copied here.
 */
export const UZ_ETKILESIM = {
  bagli: false as const,
  juftlar: [] as readonly [],
  sozlesmeGerekli: true,
  okundu: '2026-10-14',
  not: 'No free licensed interaction list was found. Configure a commercial database under its own contract before any pair is stored. This product calls no interaction service.',
}
