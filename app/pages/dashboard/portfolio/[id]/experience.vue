<script setup lang="ts">
import type { Experience } from '~~/server/db/schema/experiences'
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

// Fetch experiences
const { data: experiences, status } = await useFetch<Experience[]>(
  `/api/portfolios/${portfolioId}/experiences`
)

const isAddModalOpen = ref(false)

function handleExperienceCreated(experience: Experience) {
  // Optimistic update - add to local list at the beginning (newest first)
  if (experiences.value) {
    experiences.value = [experience, ...experiences.value]
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
      v-else-if="!experiences?.length"
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
      class="space-y-4"
    >
      <UCard
        v-for="exp in experiences"
        :key="exp.id"
      >
        <div class="flex justify-between items-start">
          <div>
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
            <!-- Edit/Delete buttons will be added in Story 5.2/5.3 -->
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
  </div>
</template>
