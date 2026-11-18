import { describe, expect, it } from 'vitest'

import type { GroupedNode } from '@/services/nodeLibraryGroups'
import { organizeNodeGroups } from '@/services/nodeLibraryGroups'

function node(name: string, group?: string, tags?: string[]): GroupedNode {
  return { name, display_name: name, group, tags }
}

describe('organizeNodeGroups', () => {
  it('puts a node under each of its tags inside its group', () => {
    const groups = organizeNodeGroups(
      [node('Join', 'draw', ['text', 'output'])],
      '其他',
      '全部节点'
    )

    expect(groups.map((group) => group.label)).toEqual(['全部节点', 'draw'])
    expect(groups[0]?.sections.map((section) => section.label)).toEqual([
      'text',
      'output'
    ])
    expect(
      groups[1]?.sections.every((section) => section.nodes[0]?.name === 'Join')
    ).toBe(true)
  })

  it('sends a node with no group and no tags to the other group and tag', () => {
    const groups = organizeNodeGroups([node('Note')], '其他', '全部节点')

    expect(groups).toMatchObject([
      {
        label: '全部节点',
        sections: [{ label: '其他', nodes: [{ name: 'Note' }] }]
      },
      {
        label: '其他',
        sections: [{ label: '其他', nodes: [{ name: 'Note' }] }]
      }
    ])
  })

  it('keeps named groups and tags ahead of the other bucket', () => {
    const groups = organizeNodeGroups(
      [node('Note'), node('Text', 'draw', ['text']), node('Show', 'draw')],
      '其他',
      '全部节点'
    )

    expect(groups.map((group) => group.label)).toEqual([
      '全部节点',
      'draw',
      '其他'
    ])
    expect(groups[0]?.sections.map((section) => section.label)).toEqual([
      'text',
      '其他'
    ])
  })
})
