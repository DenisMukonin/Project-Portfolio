<script setup lang="ts">
const route = useRoute()
const portfolioId = route.params.id as string

const { data: portfolio, status, error } = await useFetch(`/api/portfolios/${portfolioId}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    message: error.value.message || 'Портфолио не найдено'
  })
}

useSeoMeta({
  title: portfolio.value?.title
    ? `${portfolio.value.title} | Редактирование`
    : 'Редактирование портфолио | Панель управления'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center gap-2 mb-6">
      <UButton
        to="/dashboard"
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
      />
      <h1 class="text-2xl font-bold">
        {{ portfolio?.title || 'Редактирование портфолио' }}
      </h1>
    </div>

    <div
      v-if="status === 'pending'"
      class="flex justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-gray-400"
      />
    </div>

    <UCard v-else-if="portfolio">
      <template #header>
        <h2 class="text-lg font-semibold">
          Редактор портфолио
        </h2>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Slug:</span>
            <code class="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ portfolio.slug }}</code>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Шаблон:</span>
            <span class="ml-2">{{ portfolio.template }}</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Опубликовано:</span>
            <span class="ml-2">{{ portfolio.isPublished ? 'Да' : 'Нет' }}</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Создано:</span>
            <span class="ml-2">{{ new Date(portfolio.createdAt).toLocaleDateString('ru-RU') }}</span>
          </div>
        </div>
        <p class="text-gray-600 dark:text-gray-300 pt-4 border-t border-gray-200 dark:border-gray-700">
          Полные возможности редактирования будут добавлены в следующих историях.
        </p>
      </div>
    </UCard>
  </div>
</template>
