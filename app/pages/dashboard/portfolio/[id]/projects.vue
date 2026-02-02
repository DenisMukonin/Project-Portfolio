<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import type { Portfolio } from '~~/server/db/schema/portfolios'
import type { Project } from '~~/server/db/schema/projects'

interface SyncResponse {
  success: boolean
  imported: number
  updated: number
  total: number
}

// GitHub language colors - most popular languages
const languageColors: Record<string, string> = {
  'TypeScript': '#3178c6',
  'JavaScript': '#f1e05a',
  'Python': '#3572A5',
  'Java': '#b07219',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'C++': '#f34b7d',
  'C': '#555555',
  'C#': '#178600',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'Swift': '#F05138',
  'Kotlin': '#A97BFF',
  'Dart': '#00B4AB',
  'Vue': '#41b883',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'SCSS': '#c6538c',
  'Shell': '#89e051'
}

function getLanguageColor(language: string | null): string {
  if (!language) return '#8b8b8b'
  return languageColors[language] || '#8b8b8b'
}

const route = useRoute()
const toast = useToast()
const { user } = useUserSession()
const portfolioId = route.params.id as string

const { data: portfolio, status: portfolioStatus, error: portfolioError } = await useFetch<Portfolio>(`/api/portfolios/${portfolioId}`)

if (portfolioError.value) {
  throw createError({
    statusCode: portfolioError.value.statusCode || 404,
    message: portfolioError.value.message || 'Портфолио не найдено'
  })
}

const { data: projectsData, status: projectsStatus, refresh: refreshProjects } = await useFetch<Project[]>(`/api/portfolios/${portfolioId}/projects`)

// Local reactive copy for sortable - syncs from server on fetch
const projects = shallowRef<Project[]>([])

// Sync from server data when it changes
watch(projectsData, (newData) => {
  if (newData) {
    projects.value = [...newData]
  }
}, { immediate: true })

const isLoading = computed(() => portfolioStatus.value === 'pending' || projectsStatus.value === 'pending')
const hasProjects = computed(() => projects.value && projects.value.length > 0)

const isSyncing = ref(false)
const syncMessage = ref('')
const togglingProjects = ref<Set<string>>(new Set())
const isReordering = ref(false)
const isAddModalOpen = ref(false)

// Drag-and-drop sortable setup
const projectsContainer = ref<HTMLElement | null>(null)

useSortable(projectsContainer, projects, {
  handle: '.drag-handle',
  animation: 150,
  ghostClass: 'sortable-ghost',
  onUpdate: (event) => {
    // Manually reorder the array based on drag result
    const { oldIndex, newIndex } = event
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      const arr = [...projects.value]
      const movedItem = arr[oldIndex]
      if (movedItem) {
        arr.splice(oldIndex, 1)
        arr.splice(newIndex, 0, movedItem)
        projects.value = arr
        handleReorder()
      }
    }
  }
})

async function handleReorder() {
  const projectsList = projects.value
  if (!projectsList || isReordering.value) return

  isReordering.value = true

  const orderUpdates = projectsList.map((project, index) => ({
    id: project.id,
    orderIndex: index
  }))

  try {
    await $fetch(`/api/portfolios/${portfolioId}/projects/reorder`, {
      method: 'POST',
      body: { orders: orderUpdates }
    })

    toast.add({
      title: 'Успешно',
      description: 'Порядок проектов сохранён',
      color: 'success'
    })
  } catch (error: unknown) {
    // Revert by refreshing from server
    await refreshProjects()

    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось сохранить порядок проектов'
    toast.add({
      title: 'Ошибка',
      description: message,
      color: 'error'
    })
  } finally {
    isReordering.value = false
  }
}

async function handleToggleVisibility(project: Project) {
  if (togglingProjects.value.has(project.id)) return

  // Check projectsList BEFORE adding to toggling set
  const projectsList = projects.value
  if (!projectsList) return

  const newVisibility = !project.isVisible

  // Add to toggling set and save original state
  togglingProjects.value.add(project.id)
  const originalVisibility = project.isVisible

  // Optimistic update
  const idx = projectsList.findIndex(p => p.id === project.id)
  const projectToUpdate = idx >= 0 ? projectsList[idx] : null
  if (projectToUpdate) {
    projectToUpdate.isVisible = newVisibility
  }

  try {
    await $fetch(`/api/portfolios/${portfolioId}/projects/${project.id}`, {
      method: 'PUT',
      body: { isVisible: newVisibility }
    })

    toast.add({
      title: 'Успешно',
      description: newVisibility ? 'Проект теперь видимый' : 'Проект теперь скрытый',
      color: 'success'
    })
  } catch (error: unknown) {
    // Revert on error
    if (projectToUpdate) {
      projectToUpdate.isVisible = originalVisibility
    }

    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось изменить видимость проекта'
    toast.add({
      title: 'Ошибка',
      description: message,
      color: 'error'
    })
  } finally {
    togglingProjects.value.delete(project.id)
  }
}

async function handleSync() {
  isSyncing.value = true
  syncMessage.value = 'Синхронизация с GitHub...'

  const extendedTimer = setTimeout(() => {
    syncMessage.value = 'Ещё загружаем, подождите...'
  }, 5000)

  try {
    const result = await $fetch<SyncResponse>(`/api/portfolios/${portfolioId}/github/sync`, {
      method: 'POST'
    })

    toast.add({
      title: 'Успешно',
      description: `Импортировано: ${result.imported}, обновлено: ${result.updated}`,
      color: 'success'
    })

    await refreshProjects()
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось синхронизировать репозитории'
    toast.add({
      title: 'Ошибка',
      description: message,
      color: 'error'
    })
  } finally {
    clearTimeout(extendedTimer)
    isSyncing.value = false
    syncMessage.value = ''
  }
}

function handleManualAdd() {
  isAddModalOpen.value = true
}

function handleProjectCreated(project: Project) {
  // Add to local projects array
  projects.value = [...projects.value, project]
}

useSeoMeta({
  title: portfolio.value?.title
    ? `Проекты | ${portfolio.value.title}`
    : 'Проекты | Панель управления'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <UButton
          :to="`/dashboard/portfolio/${portfolioId}`"
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          aria-label="Назад к портфолио"
        />
        <h1 class="text-2xl font-bold">
          Проекты
        </h1>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="flex justify-center py-12"
      role="status"
      aria-label="Загрузка проектов"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-gray-400"
      />
      <span class="sr-only">Загрузка...</span>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              GitHub интеграция
            </h2>
            <UBadge
              v-if="user?.username"
              color="success"
              variant="subtle"
            >
              <UIcon
                name="i-simple-icons-github"
                class="w-4 h-4 mr-1"
              />
              Подключено как @{{ user.username }}
            </UBadge>
          </div>
        </template>

        <p class="text-gray-600 dark:text-gray-400">
          Импортируйте репозитории с GitHub или добавьте проекты вручную для отображения в портфолио.
        </p>

        <div
          v-if="isSyncing"
          class="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-4 h-4 animate-spin"
          />
          {{ syncMessage }}
        </div>

        <template #footer>
          <div class="flex gap-2">
            <UButton
              label="Синхронизировать с GitHub"
              icon="i-simple-icons-github"
              :loading="isSyncing"
              :disabled="isSyncing"
              @click="handleSync"
            />
            <UButton
              label="Добавить вручную"
              icon="i-lucide-plus"
              variant="outline"
              color="neutral"
              :disabled="isSyncing"
              @click="handleManualAdd"
            />
          </div>
        </template>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Мои проекты
          </h2>
        </template>

        <div v-if="hasProjects">
          <div
            ref="projectsContainer"
            class="divide-y divide-gray-200 dark:divide-gray-700"
          >
            <div
              v-for="project in projects"
              :key="project.id"
              class="py-4 first:pt-0 last:pb-0 flex items-start gap-3"
            >
              <!-- Drag Handle -->
              <div
                class="drag-handle cursor-grab pt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Перетащите для изменения порядка"
              >
                <UIcon
                  name="i-lucide-grip-vertical"
                  class="w-5 h-5"
                />
              </div>

              <!-- Project content -->
              <div class="flex-1">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-medium">
                      <a
                        v-if="project.url"
                        :href="project.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hover:text-primary-500 hover:underline inline-flex items-center gap-1"
                        :aria-label="`Открыть ${project.name} на GitHub`"
                      >
                        {{ project.name }}
                        <UIcon
                          name="i-lucide-external-link"
                          class="w-4 h-4"
                        />
                      </a>
                      <span v-else>{{ project.name }}</span>
                    </h3>
                    <p
                      v-if="project.description"
                      class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                    >
                      {{ project.description }}
                    </p>
                    <div class="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span
                        v-if="project.language"
                        class="flex items-center gap-1"
                      >
                        <span
                          class="w-3 h-3 rounded-full"
                          :style="{ backgroundColor: getLanguageColor(project.language) }"
                        />
                        {{ project.language }}
                      </span>
                      <span
                        v-if="project.stars != null"
                        class="flex items-center gap-1"
                      >
                        <UIcon
                          name="i-lucide-star"
                          class="w-4 h-4"
                        />
                        {{ project.stars }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <UButton
                      v-if="project.url"
                      :href="project.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      icon="i-simple-icons-github"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      aria-label="Открыть на GitHub"
                      title="Открыть на GitHub"
                    />
                    <UButton
                      :color="project.isVisible ? 'success' : 'neutral'"
                      variant="subtle"
                      size="xs"
                      :loading="togglingProjects.has(project.id)"
                      :disabled="togglingProjects.has(project.id)"
                      :title="project.isVisible ? 'Нажмите, чтобы скрыть' : 'Нажмите, чтобы показать'"
                      :aria-label="project.isVisible ? `Скрыть проект ${project.name}` : `Показать проект ${project.name}`"
                      @click="handleToggleVisibility(project)"
                    >
                      <UIcon
                        :name="project.isVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                        class="w-4 h-4 mr-1"
                      />
                      {{ project.isVisible ? 'Видимый' : 'Скрытый' }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProjectsEmptyState
          v-else
          :is-syncing="isSyncing"
          @sync="handleSync"
          @add-manual="handleManualAdd"
        />
      </UCard>
    </div>

    <!-- Add Project Modal -->
    <ProjectAddModal
      v-model:open="isAddModalOpen"
      :portfolio-id="portfolioId"
      @created="handleProjectCreated"
    />
  </div>
</template>

<style scoped>
.sortable-ghost {
  opacity: 0.5;
  background: var(--ui-primary-50);
  border-radius: 0.5rem;
}

.drag-handle {
  touch-action: none; /* Prevent scroll on mobile */
}
</style>
