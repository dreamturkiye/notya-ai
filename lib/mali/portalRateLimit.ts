const store = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  let entry = store.get(key)
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

export function getRateLimitKey(tokenSnippet: string, ip: string): string {
  return tokenSnippet + ':' + ip
}
