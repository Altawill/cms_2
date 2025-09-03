import { OrgUnit, OrgUnitType } from '../models/org'

// In-memory helpers for hierarchy computations. Replace data feeding with backend responses.

export function buildIndex(orgUnits: OrgUnit[]) {
  const byId = new Map<string, OrgUnit>()
  const children = new Map<string, OrgUnit[]>()
  for (const u of orgUnits) {
    byId.set(u.id, u)
    if (u.parentId) {
      if (!children.has(u.parentId)) children.set(u.parentId, [])
      children.get(u.parentId)!.push(u)
    }
  }
  return { byId, children }
}

export function getAncestors(orgUnits: OrgUnit[], unitId: string): OrgUnit[] {
  const idx = buildIndex(orgUnits)
  const result: OrgUnit[] = []
  let cur = idx.byId.get(unitId)
  while (cur && cur.parentId) {
    const p = idx.byId.get(cur.parentId)
    if (!p) break
    result.unshift(p)
    cur = p
  }
  return result
}

export function getDescendants(orgUnits: OrgUnit[], unitId: string): OrgUnit[] {
  const idx = buildIndex(orgUnits)
  const stack = [unitId]
  const result: OrgUnit[] = []
  while (stack.length) {
    const id = stack.pop()!
    const kids = idx.children.get(id) || []
    for (const k of kids) {
      result.push(k)
      stack.push(k.id)
    }
  }
  return result
}

export function getSubtreeIds(orgUnits: OrgUnit[], unitId: string): string[] {
  return [unitId, ...getDescendants(orgUnits, unitId).map(u => u.id)]
}

export function getPath(orgUnits: OrgUnit[], unitId: string): OrgUnit[] {
  const idx = buildIndex(orgUnits)
  const path: OrgUnit[] = []
  let cur = idx.byId.get(unitId)
  while (cur) {
    path.unshift(cur)
    if (!cur.parentId) break
    cur = idx.byId.get(cur.parentId)
  }
  return path
}

export function findRoot(orgUnits: OrgUnit[]): OrgUnit | undefined {
  return orgUnits.find(u => !u.parentId && u.type === 'PMO')
}

export function sortOrgUnits(orgUnits: OrgUnit[]): OrgUnit[] {
  // optional stable sort by type depth then name
  const order: Record<OrgUnitType, number> = { PMO: 0, AREA: 1, PROJECT: 2, ZONE: 3 }
  return [...orgUnits].sort((a, b) => (order[a.type] - order[b.type]) || a.name.localeCompare(b.name))
}

