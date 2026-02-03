<script setup lang="ts">
import type { Education } from '~~/server/db/schema/education'
import type { Portfolio } from '~~/server/db/schema/portfolios'

const route = useRoute()
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
const { data: educationData, status } = await useFetch<Education[]>(
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

const isAddModalOpen = ref(false)

function handleEducationCreated(education: Education) {
  // Optimistic update - add to local list at the beginning (newest first)
  educationList.value = [education, ...educationList.value]
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
      class="space-y-4"
    >
      <UCard
        v-for="edu in educationList"
        :key="edu.id"
      >
        <div class="flex justify-between items-start">
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
          <!-- Edit/Delete buttons will be added in story 5-6 -->
        </div>
      </UCard>
    </div>

    <!-- Add Education Modal -->
    <EducationAddModal
      v-model:open="isAddModalOpen"
      :portfolio-id="portfolioId"
      @created="handleEducationCreated"
    />
  </div>
</template>
