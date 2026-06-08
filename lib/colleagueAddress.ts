const TITLE_PATTERN = /^(Prof\.\s*Dr\.|Doç\.\s*Dr\.|Uzm\.\s*Dr\.|Dr\.)\s*/i

export function formatColleagueName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Hocam'

  const withoutTitle = trimmed.replace(TITLE_PATTERN, '').trim()
  const parts = withoutTitle.split(/\s+/).filter(Boolean)
  const firstName = parts[0] ?? 'Hocam'

  return `${firstName} Hocam`
}

/** Tab label for colleague persona picker — e.g. "Ayşe Hocam" */
export function formatColleagueTabLabel(fullName: string): string {
  return formatColleagueName(fullName)
}
