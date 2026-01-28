<script setup lang="ts">
import type { Portfolio } from '~~/server/db/schema/portfolios'

const route = useRoute()
const toast = useToast()
const portfolioId = route.params.id as string

const { data: portfolio, status, error, refresh } = await useFetch<Portfolio>(`/api/portfolios/${portfolioId}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    message: error.value.message || 'Портфолио не найдено'
  })
}

const form = reactive({
  title: portfolio.value?.title || '',
  subtitle: portfolio.value?.subtitle || '',
  description: portfolio.value?.description || ''
})

watch(() => portfolio.value, (newVal) => {
  if (newVal) {
    form.title = newVal.title || ''
    form.subtitle = newVal.subtitle || ''
    form.description = newVal.description || ''
  }
}, { immediate: true })

const titleError = computed(() => {
  if (!form.title.trim()) {
    return 'Название обязательно'
  }
  return ''
})

const isValid = computed(() => !titleError.value)

const isSaving = ref(false)

async function handleSave() {
  if (!isValid.value) {
    return
  }

  isSaving.value = true
  try {
    await $fetch(`/api/portfolios/${portfolioId}`, {
      method: 'PUT',
      body: {
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null
      }
    })
    toast.add({
      title: 'Сохранено!',
      description: 'Изменения успешно сохранены.',
      color: 'success'
    })
    await refresh()
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      ? (err.data as { message?: string })?.message
      : 'Не удалось сохранить изменения'
    toast.add({
      title: 'Ошибка',
      description: message || 'Не удалось сохранить изменения',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
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
        aria-label="Назад к панели управления"
      />
      <h1 class="text-2xl font-bold">
        {{ portfolio?.title || 'Редактирование портфолио' }}
      </h1>
    </div>

    <div
      v-if="status === 'pending'"
      class="flex justify-center py-12"
      role="status"
      aria-label="Загрузка портфолио"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-gray-400"
      />
      <span class="sr-only">Загрузка...</span>
    </div>

    <div
      v-else-if="portfolio"
      class="grid gap-6 lg:grid-cols-3"
    >
      <div class="lg:col-span-2 space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">
                Основная информация
              </h2>
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                :loading="isSaving"
                :disabled="!isValid"
                @click="handleSave"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UFormField
              label="Название"
              :error="titleError"
              required
            >
              <UInput
                v-model="form.title"
                placeholder="Мое портфолио"
                :color="titleError ? 'error' : undefined"
              />
            </UFormField>

            <UFormField label="Подзаголовок">
              <UInput
                v-model="form.subtitle"
                placeholder="Краткое описание или слоган"
              />
            </UFormField>

            <UFormField label="Описание">
              <UTextarea
                v-model="form.description"
                placeholder="Расскажите о себе и своем портфолио..."
                :rows="4"
              />
            </UFormField>
          </div>
        </UCard>
      </div>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Информация
            </h2>
          </template>

          <div class="space-y-3 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Slug:</span>
              <code class="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ portfolio.slug }}</code>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Шаблон:</span>
              <span class="ml-2">{{ portfolio.template }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Статус:</span>
              <UBadge
                class="ml-2"
                :color="portfolio.isPublished ? 'success' : 'neutral'"
                :label="portfolio.isPublished ? 'Опубликовано' : 'Черновик'"
              />
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Создано:</span>
              <span class="ml-2">{{ new Date(portfolio.createdAt).toLocaleDateString('ru-RU') }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Обновлено:</span>
              <span class="ml-2">{{ new Date(portfolio.updatedAt).toLocaleDateString('ru-RU') }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
