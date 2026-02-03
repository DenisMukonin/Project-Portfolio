<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import type { Education } from '~~/server/db/schema/education'
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

// Fetch education
const { data: educationData, status, refresh } = await useFetch<Education[]>(
  `/api/portfolios/${portfolioId}/education`
)

// Local reactive copy for sortable - syncs from server on fetch
const educationList = shallowRef<Education[]>([])

// Sync from server data when it changes
watch(educationData, (newData) => {
  if (newData) {
    educationList.value = [...newData]
  }
}, { immediate: true })

// Drag-and-drop reorder
const educationContainer = ref<HTMLElement | null>(null)

useSortable(educationContainer, educationList, {
  handle: '.drag-handle',
  animation: 150,
  ghostClass: 'sortable-ghost',
  onUpdate: (evt) => {
    // Manual array reorder (VueUse may not sync correctly)
    const { oldIndex, newIndex } = evt
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      const list = [...educationList.value]
      const movedItem = list[oldIndex]
      if (movedItem) {
        list.splice(oldIndex, 1)
        list.splice(newIndex, 0, movedItem)
        educationList.value = list
        handleReorder()
      }
    }
  }
})

async function handleReorder() {
  const eduList = educationList.value
  if (!eduList || eduList.length <= 1) return

  const orderUpdates = eduList.map((edu, index) => ({
    id: edu.id,
    orderIndex: index
  }))

  try {
    await $fetch(`/api/portfolios/${portfolioId}/education/reorder`, {
      method: 'POST',
      body: { orders: orderUpdates }
    })

    toast.add({
      title: 'Успешно',
      description: 'Порядок записей сохранён',
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
const editingEducation = ref<Education | null>(null)

// Delete state
const isDeleteModalOpen = ref(false)
const deletingEducation = ref<Education | null>(null)
const isDeleting = ref(false)

function handleEducationCreated(education: Education) {
  // Optimistic update - add to local list at the beginning (newest first)
  educationList.value = [education, ...educationList.value]
}

function handleEdit(edu: Education) {
  editingEducation.value = edu
  isEditModalOpen.value = true
}

function handleEducationUpdated(updated: Education) {
  // Update local list
  const index = educationList.value.findIndex(e => e.id === updated.id)
  if (index !== -1) {
    const list = [...educationList.value]
    list[index] = updated
    educationList.value = list
  }
  editingEducation.value = null
}

// Reset editingEducation when modal closes (e.g., via backdrop click or ESC)
watch(isEditModalOpen, (open) => {
  if (!open) {
    editingEducation.value = null
  }
})

function handleDelete(edu: Education) {
  deletingEducation.value = edu
  isDeleteModalOpen.value = true
}

function cancelDelete() {
  isDeleteModalOpen.value = false
  deletingEducation.value = null
}

async function confirmDelete() {
  if (!deletingEducation.value) return

  isDeleting.value = true
  const eduToDelete = deletingEducation.value

  try {
    await $fetch(
      `/api/portfolios/${portfolioId}/education/${eduToDelete.id}`,
      { method: 'DELETE' }
    )

    // Optimistic update - remove from local list
    educationList.value = educationList.value.filter(e => e.id !== eduToDelete.id)

    toast.add({
      title: 'Успешно',
      description: 'Образование удалено',
      color: 'success'
    })

    isDeleteModalOpen.value = false
    deletingEducation.value = null
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось удалить образование'
    toast.add({
      title: 'Ошибка',
      description: message,
      color: 'error'
    })
  } finally {
    isDeleting.value = false
  }
}

function formatDateRange(edu: Education): string {
  const start = new Date(edu.startDate).toLocaleDateString('ru-RU', {
    month: 'short',
    year: 'numeric'
  })
  if (edu.isCurrent) {
    return `${start} — Настоящее время`
  }
  if (edu.endDate) {
    const end = new Date(edu.endDate).toLocaleDateString('ru-RU', {
      month: 'short',
      year: 'numeric'
    })
    return `${start} — ${end}`
  }
  return start
}

useSeoMeta({
  title: computed(() => portfolio.value?.title
    ? `Образование | ${portfolio.value.title}`
    : 'Образование | Панель управления')
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
          Образование
        </h1>
      </div>
      <UButton
        label="Добавить образование"
        icon="i-lucide-plus"
        @click="isAddModalOpen = true"
      />
    </div>

    <!-- Loading state -->
    <div
      v-if="status === 'pending'"
      class="flex justify-center py-12"
      role="status"
      aria-label="Загрузка образования"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-gray-400"
      />
      <span class="sr-only">Загрузка...</span>
    </div>

    <!-- Empty state -->
    <UCard
      v-else-if="educationList.length === 0"
      class="text-center py-12"
    >
      <UIcon
        name="i-lucide-graduation-cap"
        class="w-12 h-12 mx-auto mb-4 text-gray-400"
      />
      <h3 class="text-lg font-medium mb-2">
        Нет образования
      </h3>
      <p class="text-gray-500 mb-4">
        Добавьте своё образование
      </p>
      <UButton
        label="Добавить образование"
        icon="i-lucide-plus"
        @click="isAddModalOpen = true"
      />
    </UCard>

    <!-- Education list -->
    <div
      v-else
      ref="educationContainer"
      class="space-y-4"
    >
      <UCard
        v-for="edu in educationList"
        :key="edu.id"
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
              {{ edu.school }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ edu.degree }}
              <span v-if="edu.fieldOfStudy">• {{ edu.fieldOfStudy }}</span>
            </p>
            <p class="text-sm text-gray-500 mt-1">
              {{ formatDateRange(edu) }}
            </p>
            <p
              v-if="edu.description"
              class="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line"
            >
              {{ edu.description }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="sm"
              aria-label="Редактировать"
              @click="handleEdit(edu)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              aria-label="Удалить"
              @click="handleDelete(edu)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Add Education Modal -->
    <EducationAddModal
      v-model:open="isAddModalOpen"
      :portfolio-id="portfolioId"
      @created="handleEducationCreated"
    />

    <!-- Edit Education Modal -->
    <EducationEditModal
      v-model:open="isEditModalOpen"
      :portfolio-id="portfolioId"
      :education="editingEducation"
      @updated="handleEducationUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">
          Удалить образование?
        </h3>
      </template>

      <div class="p-4">
        <p class="text-gray-600 dark:text-gray-400">
          Вы уверены, что хотите удалить эту запись?
        </p>
        <p
          v-if="deletingEducation"
          class="mt-2 font-medium"
        >
          {{ deletingEducation.school }} — {{ deletingEducation.degree }}
        </p>
      </div>

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
