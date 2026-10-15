/**
 * NOTYA-ACCOUNTING-01 — e-belge adapter registry. See CHECKLIST.md for the real-vs-stub split.
 */
import type { EbelgeVendor } from '../types'
import type { EbelgeAdapter } from './types'
import { createGenericRestEbelgeAdapter } from './generic_rest'
import { createParasutEbelgeAdapter } from './parasut'
import { createStubEbelgeAdapter } from './stub'

const registry = new Map<EbelgeVendor, EbelgeAdapter>()
registry.set('generic_rest', createGenericRestEbelgeAdapter())
registry.set('parasut', createParasutEbelgeAdapter())
registry.set('nes', createStubEbelgeAdapter('nes'))
registry.set('qnb_esolutions', createStubEbelgeAdapter('qnb_esolutions'))
registry.set('logo', createStubEbelgeAdapter('logo'))
registry.set('other', createStubEbelgeAdapter('other'))

export function getEbelgeAdapter(vendor: EbelgeVendor): EbelgeAdapter {
  const adapter = registry.get(vendor)
  if (!adapter) throw new Error(`Unknown e-belge vendor "${vendor}"`)
  return adapter
}

export function listEbelgeAdapters(): EbelgeAdapter[] {
  return Array.from(registry.values())
}
