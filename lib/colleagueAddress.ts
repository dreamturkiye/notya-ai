const TITLE_PATTERN = /^(Prof\.\s*Dr\.|Doç\.\s*Dr\.|Uzm\.\s*Dr\.|Uzm\.\s*|Dr\.)\s*/i

/** Strip title → "Ayşe Kaya" */
export function formatColleagueDisplayName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Hocam'

  const withoutTitle = trimmed.replace(TITLE_PATTERN, '').trim()
  const parts = withoutTitle.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Hocam'
  if (parts.length === 1) return parts[0]
  // First + last (handles middle names by keeping first and final surname)
  return `${parts[0]} ${parts[parts.length - 1]}`
}

/** Spoken / header label — e.g. "Ayşe Kaya Hocam" */
export function formatColleagueName(fullName: string): string {
  const display = formatColleagueDisplayName(fullName)
  if (display === 'Hocam') return 'Hocam'
  return `${display} Hocam`
}

/** Tab label for colleague persona picker — e.g. "Ayşe Kaya Hocam" */
export function formatColleagueTabLabel(fullName: string): string {
  return formatColleagueName(fullName)
}
