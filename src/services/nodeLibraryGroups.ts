export const ALL_NODES_GROUP_ID = '__all__'
export const OTHER_NODE_GROUP_ID = '__other__'

export interface GroupedNode {
  name: string
  display_name: string
  group?: string
  tags?: string[]
}

export interface NodeTagSection<T> {
  id: string
  label: string
  nodes: T[]
}

export interface NodeGroupTab<T> {
  id: string
  label: string
  sections: NodeTagSection<T>[]
}

function trimmed(value: string | undefined): string {
  return value?.trim() ?? ''
}

function uniqueTags(tags: string[] | undefined): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of tags ?? []) {
    const label = trimmed(tag)
    if (!label || seen.has(label)) continue
    seen.add(label)
    result.push(label)
  }
  return result
}

export function organizeNodeGroups<T extends GroupedNode>(
  nodes: readonly T[],
  otherLabel: string,
  allLabel: string,
  compare?: (a: T, b: T) => number
): NodeGroupTab<T>[] {
  const groupOrder: string[] = []
  const groups = new Map<string, Map<string, T[]>>()

  function bucket(groupId: string, tagId: string): T[] {
    let tags = groups.get(groupId)
    if (!tags) {
      tags = new Map()
      groups.set(groupId, tags)
      groupOrder.push(groupId)
    }
    let nodesInTag = tags.get(tagId)
    if (!nodesInTag) {
      nodesInTag = []
      tags.set(tagId, nodesInTag)
    }
    return nodesInTag
  }

  for (const node of nodes) {
    const tagIds = uniqueTags(node.tags)
    const tagsForNode = tagIds.length > 0 ? tagIds : [OTHER_NODE_GROUP_ID]
    const groupId = trimmed(node.group) || OTHER_NODE_GROUP_ID
    for (const tagId of tagsForNode) {
      bucket(ALL_NODES_GROUP_ID, tagId).push(node)
      bucket(groupId, tagId).push(node)
    }
  }

  const orderedGroupIds = [
    ...(groups.has(ALL_NODES_GROUP_ID) ? [ALL_NODES_GROUP_ID] : []),
    ...groupOrder.filter(
      (id) => id !== ALL_NODES_GROUP_ID && id !== OTHER_NODE_GROUP_ID
    ),
    ...(groups.has(OTHER_NODE_GROUP_ID) ? [OTHER_NODE_GROUP_ID] : [])
  ]

  return orderedGroupIds.map((groupId) => {
    const tags = groups.get(groupId) ?? new Map<string, T[]>()
    const tagOrder = [...tags.keys()]
    const orderedTagIds = [
      ...tagOrder.filter((id) => id !== OTHER_NODE_GROUP_ID),
      ...(tags.has(OTHER_NODE_GROUP_ID) ? [OTHER_NODE_GROUP_ID] : [])
    ]
    return {
      id: groupId,
      label:
        groupId === ALL_NODES_GROUP_ID
          ? allLabel
          : groupId === OTHER_NODE_GROUP_ID
            ? otherLabel
            : groupId,
      sections: orderedTagIds.map((tagId) => {
        const sectionNodes = tags.get(tagId) ?? []
        return {
          id: `${groupId}/${tagId}`,
          label: tagId === OTHER_NODE_GROUP_ID ? otherLabel : tagId,
          nodes: compare ? [...sectionNodes].sort(compare) : sectionNodes
        }
      })
    }
  })
}
