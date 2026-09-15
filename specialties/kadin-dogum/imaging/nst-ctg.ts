import type { NstStudyPayload } from '../schema'
import { NST_CATEGORIES } from '../schema'

export const NST_CATEGORY = NST_CATEGORIES

export function nstAction(category: NstStudyPayload['category']): string[] {
  if (category === 'I') return ['continue intermittent or routine']
  if (category === 'II') return ['repeat', 'resuscitative measures', 'uzman review']
  return ['expedite delivery path', 'category III — emergency']
}

export function isNstCategory(v: string): v is NstStudyPayload['category'] {
  return (NST_CATEGORIES as readonly string[]).includes(v)
}
