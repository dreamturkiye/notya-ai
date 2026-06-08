// ============================================================
// NOTYA AI — Colleague Address Formatting
// ============================================================

const TITLE_PREFIXES = [
  'Prof. Dr.',
  'Doç. Dr.',
  'Uzm. Dr.',
  'Dr.',
  'Prof.',
  'Doç.',
  'Uzm.',
]

export function formatColleagueName(fullName: string): string {
  let name = fullName.trim()
  for (const prefix of TITLE_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length).trim()
      break
    }
  }

  const firstName = name.split(/\s+/)[0]
  if (!firstName) return 'Hocam'
  return `${firstName} Hocam`
}

export function formatColleagueTabLabel(fullName: string): string {
  let name = fullName.trim()
  for (const prefix of TITLE_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length).trim()
      break
    }
  }
  return name.split(/\s+/)[0] || 'Hocam'
}
