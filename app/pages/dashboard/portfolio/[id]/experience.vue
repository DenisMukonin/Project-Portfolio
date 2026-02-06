<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import type { Experience } from '~~/server/db/schema/experiences'
import type { Portfolio } from '~~/server/db/schema/portfolios'

const route = useRoute()
const toast = useToast()
const portfolioId = route.params.id as string

// Fetch portfolio for context
const { data: portfolio, error: portfolioError } = await useFetch<Portfolio>(`/api/portfolios/${portfolioId}`)

if (portfolioError.value) {
  throw createError({
    statusCode: portfolioError.value.statusCode || 404,
    message: portfolioError.value.message || 'Портфолио не найдено'
  })
}

// Fetch experiences
const { data: experiencesData, status, refresh } = await useFetch<Experience[]>(
  `/api/portfolios/${portfolioId}/experiences`
)

// Local reactive copy for sortable - syncs from server on fetch
const experiences = shallowRef<Experience[]>([])

// Sync from server data when it changes
watch(experiencesData, (newData) => {
  if (newData) {
    experiences.value = [...newData]
  }
}, { immediate: true })

// Drag-and-drop reorder
const experiencesContainer = ref<HTMLElement | null>(null)

useSortable(experiencesContainer, experiences, {
  handle: '.drag-handle',
  animation: 150,
  ghostClass: 'sortable-ghost',
  onUpdate: (evt) => {
    // Manual array reorder (VueUse may not sync correctly)
    const { oldIndex, newIndex } = evt
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      const list = [...experiences.value]
      const movedItem = list[oldIndex]
      if (movedItem) {
        list.splice(oldIndex, 1)
        list.splice(newIndex, 0, movedItem)
        experiences.value = list
        handleReorder()
      }
    }
  }
})

async function handleReorder() {
  const expList = experiences.value
  if (!expList || expList.length <= 1) return

  const orderUpdates = expList.map((exp, index) => ({
    id: exp.id,
    orderIndex: index
  }))

  try {
    await $fetch(`/api/portfolios/${portfolioId}/experiences/reorder`, {
      method: 'POST',
      body: { orders: orderUpdates }
    })

    toast.add({
      title: 'Успешно',
      description: 'Порядок опыта работы сохранён',
      color: 'success'
    })
  } catch (error: unknown) {
    // Revert by refreshing from server
    await refresh()

    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось сохранить порядок'
    toast.add({
      title: 'Ошибка',
      description: message,
      color: 'error'
    })
  }
}

const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const editingExperience = ref<Experience | null>(null)

// Delete state
const isDeleteModalOpen = ref(false)
const deletingExperience = ref<Experience | null>(null)
const isDeleting = ref(false)

function handleExperienceCreated(experience: Experience) {
  // Optimistic update - add to local list at the beginning (newest first)
  experiences.value = [experience, ...experiences.value]
}

function handleEdit(exp: Experience) {
  editingExperience.value = exp
  isEditModalOpen.value = true
}

function handleExperienceUpdated(updated: Experience) {
  // Update local list
  const index = experiences.value.findIndex(e => e.id === updated.id)
  if (index !== -1) {
    const list = [...experiences.value]
    list[index] = updated
    experiences.value = list
  }
}

function handleDelete(exp: Experience) {
  deletingExperience.value = exp
  isDeleteModalOpen.value = true
}

function cancelDelete() {
  isDeleteModalOpen.value = false
  deletingExperience.value = null
}

async function confirmDelete() {
  if (!deletingExperience.value) return

  isDeleting.value = true
  const expToDelete = deletingExperience.value

  try {
    await $fetch(
      `/api/portfolios/${portfolioId}/experiences/${expToDelete.id}`,
      { method: 'DELETE' }
    )

    // Optimistic update - remove from local list
    experiences.value = experiences.value.filter(e => e.id !== expToDelete.id)

    toast.add({
      title: 'Успешно',
      description: 'Опыт работы удалён',
      color: 'success'
    })

    isDeleteModalOpen.value = false
    deletingExperience.value = null
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось удалить опыт работы'
    toast.add({
      title: 'Ошибка',
      description: message,
      color: 'error'
    })
  } finally {
    isDeleting.value = false
  }
}

function formatDateRange(exp: Experience): string {
  const start = new Date(exp.startDate).toLocaleDateString('ru-RU', {
    month: 'short',
    year: 'numeric'
  })
  if (exp.isCurrent) {
    return `${start} — Настоящее время`
  }
  if (exp.endDate) {
    const end = new Date(exp.endDate).toLocaleDateString('ru-RU', {
      month: 'short',
      year: 'numeric'
    })
    return `${start} — ${end}`
  }
  return start
}

useSeoMeta({
  title: portfolio.value?.title
    ? `Опыт работы | ${portfolio.value.title}`
    : 'Опыт работы | Панель управления'
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
          aria-label="Назад к редактированию"
        />
        <h1 class="text-2xl font-bold">
          Опыт работы
        </h1>
      </div>
      <UButton
        label="Добавить опыт"
        icon="i-lucide-plus"
        @click="isAddModalOpen = true"
      />
    </div>

    <!-- Loading state -->
    <div
      v-if="status === 'pending'"
      class="flex justify-center py-12"
      role="status"
      aria-label="Загрузка опыта работы"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-gray-400"
      />
      <span class="sr-only">Загрузка...</span>
    </div>

    <!-- Empty state -->
    <UCard
      v-else-if="experiences.length === 0"
      class="text-center py-12"
    >
      <UIcon
        name="i-lucide-briefcase"
        class="w-12 h-12 mx-auto mb-4 text-gray-400"
      />
      <h3 class="text-lg font-medium mb-2">
        Нет опыта работы
      </h3>
      <p class="text-gray-500 mb-4">
        Добавьте свой профессиональный опыт
      </p>
      <UButton
        label="Добавить опыт"
        icon="i-lucide-plus"
        @click="isAddModalOpen = true"
      />
    </UCard>

    <!-- Experience list -->
    <div
      v-else
      ref="experiencesContainer"
      class="space-y-4"
    >
      <UCard
        v-for="exp in experiences"
        :key="exp.id"
      >
        <div class="flex justify-between items-start">
          <!-- Drag Handle -->
          <div class="drag-handle cursor-grab pr-3 pt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <UIcon
              name="i-lucide-grip-vertical"
              class="w-5 h-5"
            />
          </div>

          <div class="flex-1">
            <h3 class="text-lg font-semibold">
              {{ exp.title }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ exp.company }}
            </p>
            <p
              v-if="exp.location"
              class="text-sm text-gray-500"
            >
              {{ exp.location }}
            </p>
            <p class="text-sm text-gray-500 mt-1">
              {{ formatDateRange(exp) }}
            </p>
            <p
              v-if="exp.description"
              class="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line"
            >
              {{ exp.description }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="sm"
              aria-label="Редактировать"
              @click="handleEdit(exp)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              aria-label="Удалить"
              @click="handleDelete(exp)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Add Experience Modal -->
    <ExperienceAddModal
      v-model:open="isAddModalOpen"
      :portfolio-id="portfolioId"
      @created="handleExperienceCreated"
    />

    <!-- Edit Experience Modal -->
    <ExperienceEditModal
      v-model:open="isEditModalOpen"
      :portfolio-id="portfolioId"
      :experience="editingExperience"
      @updated="handleExperienceUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">
          Удалить опыт работы?
        </h3>
      </template>

      <template #body>
        <div class="p-4">
          <p class="text-gray-600 dark:text-gray-400">
            Вы уверены, что хотите удалить эту запись?
          </p>
          <p
            v-if="deletingExperience"
            class="mt-2 font-medium"
          >
            {{ deletingExperience.title }} — {{ deletingExperience.company }}
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Отмена"
            variant="ghost"
            color="neutral"
            :disabled="isDeleting"
            @click="cancelDelete"
          />
          <UButton
            label="Удалить"
            color="error"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="confirmDelete"
          />
        </div>
      </template>
    </UModal>
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
