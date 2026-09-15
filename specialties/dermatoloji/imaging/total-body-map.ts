import type { TotalBodyMap } from '../schema'

export function emptyMap(deviceHint: TotalBodyMap['deviceHint'] = 'manual', followUpMonths = 6): TotalBodyMap {
  return { deviceHint, nodeIds: [], followUpMonths }
}

export function pinNode(map: TotalBodyMap, nodeId: string): TotalBodyMap {
  if (map.nodeIds.includes(nodeId)) return map
  return { ...map, nodeIds: [...map.nodeIds, nodeId] }
}

export function dueFollowUp(map: TotalBodyMap, lastMapIso: string, todayIso: string): boolean {
  const last = Date.parse(lastMapIso + 'T00:00:00Z')
  const today = Date.parse(todayIso + 'T00:00:00Z')
  const months = (today - last) / (30.44 * 86_400_000)
  return months >= map.followUpMonths
}
