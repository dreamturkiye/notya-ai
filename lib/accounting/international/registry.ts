import type { CountryBillingKit, CountryCode } from './types'
import { US_BILLING_KIT } from './countries/us'
import { GB_BILLING_KIT } from './countries/gb'
import { CA_BILLING_KIT } from './countries/ca'
import { AU_BILLING_KIT } from './countries/au'
import { NZ_BILLING_KIT } from './countries/nz'
import { UZ_BILLING_KIT } from './countries/uz'

const REGISTRY: Record<CountryCode, CountryBillingKit> = {
  US: US_BILLING_KIT,
  GB: GB_BILLING_KIT,
  CA: CA_BILLING_KIT,
  AU: AU_BILLING_KIT,
  NZ: NZ_BILLING_KIT,
  UZ: UZ_BILLING_KIT,
}

export function getCountryBillingKit(countryCode: CountryCode): CountryBillingKit {
  const kit = REGISTRY[countryCode]
  if (!kit) throw new Error(`Unknown country billing kit "${countryCode}"`)
  return kit
}

export function listCountryBillingKits(): CountryBillingKit[] {
  return Object.values(REGISTRY)
}
