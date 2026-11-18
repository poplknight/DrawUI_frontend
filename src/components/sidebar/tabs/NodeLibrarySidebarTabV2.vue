<template>
  <SidebarTabTemplate :title="$t('sideToolbar.nodes')">
    <template #header>
      <div v-if="groups.length" class="overflow-x-auto px-4 pt-2 pb-px">
        <TabList v-model="selectedGroup">
          <Tab v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.label }}
          </Tab>
        </TabList>
      </div>
      <SidebarTopArea>
        <SearchInput
          ref="searchBoxRef"
          v-model="searchQuery"
          :clear-label="$t('g.clear')"
          :accessible-label="
            $t('g.searchPlaceholder', { subject: $t('g.nodes') })
          "
          :placeholder="$t('g.searchPlaceholder', { subject: $t('g.nodes') })"
        />
        <template #actions>
          <Menu>
            <template #trigger>
              <Button
                size="icon"
                :aria-label="$t('g.sort')"
                icon="icon-[lucide--settings-2]"
              />
            </template>
            <MenuRadioGroup v-model="sortOrder" :options="sortingOptions" />
          </Menu>
        </template>
      </SidebarTopArea>
    </template>
    <template #body>
      <div
        data-testid="node-group-list"
        class="scrollbar-custom h-full min-h-0 flex-1 overflow-y-auto pb-2"
      >
        <div
          v-if="hasNoMatches"
          class="flex min-h-0 flex-1 items-center justify-center px-6 py-8 text-center text-sm text-muted-foreground"
        >
          {{
            $t('sideToolbar.nodeLibraryTab.noMatchingNodes', {
              query: searchQuery
            })
          }}
        </div>
        <template v-else>
          <section v-for="section in selectedSections" :key="section.id">
            <div class="flex items-center gap-3 px-4 pt-3 pb-1">
              <span class="shrink-0 text-xs text-muted-foreground">
                {{ section.label }}
              </span>
              <div class="h-px min-w-0 flex-1 bg-border/50" />
            </div>
            <button
              v-for="node in section.nodes"
              :key="`${section.id}/${node.name}`"
              type="button"
              class="flex h-9 w-full items-center gap-2 px-4 text-left text-sm hover:bg-secondary"
              @click="startDrag(node)"
            >
              <i class="icon-[comfy--node] size-4 shrink-0" />
              <span class="truncate">{{ node.display_name }}</span>
            </button>
          </section>
        </template>
      </div>
    </template>
  </SidebarTabTemplate>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, ref, useTemplateRef, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import Tab from '@comfyorg/design-system/tab/Tab'
import TabList from '@comfyorg/design-system/tab/TabList'
import SearchInput from '@comfyorg/design-system/search-input/SearchInput'
import Button from '@comfyorg/design-system/button/Button'
import Menu from '@comfyorg/design-system/menu/Menu'
import MenuRadioGroup from '@comfyorg/design-system/menu/MenuRadioGroup'
import { useNodeDragToCanvas } from '@/composables/node/useNodeDragToCanvas'
import { useSearchQueryTracking } from '@/platform/telemetry/searchQuery/useSearchQueryTracking'
import { organizeNodeGroups } from '@/services/nodeLibraryGroups'
import { useNodeDefStore } from '@/stores/nodeDefStore'

import SidebarTabTemplate from './SidebarTabTemplate.vue'
import SidebarTopArea from '@comfyorg/design-system/navigation/SidebarTopArea'

const { t } = useI18n()
const selectedGroup = useLocalStorage('Comfy.NodeLibrary.Group', '')
const sortOrder = useLocalStorage<'original' | 'alphabetical'>(
  'Comfy.NodeLibrary.Sort',
  'original'
)
const sortingOptions = computed(() => [
  {
    value: 'original' as const,
    label: t('sideToolbar.nodeLibraryTab.sortBy.original')
  },
  {
    value: 'alphabetical' as const,
    label: t('sideToolbar.nodeLibraryTab.sortBy.alphabetical')
  }
])

const searchBoxRef = useTemplateRef('searchBoxRef')
const searchQuery = ref('')
const nodeDefStore = useNodeDefStore()
const { startDrag } = useNodeDragToCanvas()

const filteredNodeDefs = computed(() => {
  if (searchQuery.value.length === 0) return []
  return nodeDefStore.nodeSearchService.searchNode(
    searchQuery.value,
    [],
    { limit: 64 },
    { matchWildcards: false }
  )
})

const activeNodes = computed(() =>
  searchQuery.value.length === 0
    ? nodeDefStore.visibleNodeDefs
    : filteredNodeDefs.value
)

useSearchQueryTracking('node_sidebar', searchQuery, filteredNodeDefs)

const hasNoMatches = computed(
  () => searchQuery.value.length > 0 && filteredNodeDefs.value.length === 0
)

const groups = computed(() =>
  organizeNodeGroups(
    activeNodes.value,
    t('sideToolbar.nodeLibraryTab.other'),
    t('sideToolbar.nodeLibraryTab.allNodes'),
    sortOrder.value === 'alphabetical'
      ? (a, b) => a.display_name.localeCompare(b.display_name)
      : undefined
  )
)

watchEffect(() => {
  if (groups.value.some((group) => group.id === selectedGroup.value)) return
  selectedGroup.value = groups.value[0]?.id ?? ''
})

const selectedSections = computed(
  () =>
    groups.value.find((group) => group.id === selectedGroup.value)?.sections ??
    []
)

onMounted(() => {
  searchBoxRef.value?.focus()
})
</script>
