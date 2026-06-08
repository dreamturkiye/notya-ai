import { address, type AddressableUser } from './address'

export function formatNotification(user: AddressableUser, message: string): string {
  const prefix = address(user, 'notification')
  const trimmed = message.trim()
  if (!trimmed) return prefix
  return `${prefix}, ${trimmed}`
}
