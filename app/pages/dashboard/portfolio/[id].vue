<script setup lang="ts">
import type { Portfolio } from '~~/server/db/schema/portfolios'
import { getTemplateById, type TemplateDefinition } from '~~/shared/templates'

const route = useRoute()
const toast = useToast()
const { user } = useUserSession()
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
  description: portfolio.value?.description || '',
  slug: portfolio.value?.slug || ''
})

watch(() => portfolio.value, (newVal) => {
  if (newVal) {
    form.title = newVal.title || ''
    form.subtitle = newVal.subtitle || ''
    form.description = newVal.description || ''
    form.slug = newVal.slug || ''
  }
}, { immediate: true })

const titleError = computed(() => {
  if (!form.title.trim()) {
    return 'Название обязательно'
  }
  return ''
})

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

const slugError = computed(() => {
  const slug = form.slug.trim().toLowerCase()
  if (!slug) {
    return 'URL slug обязателен'
  }
  if (slug.length < 3) {
    return 'Slug должен быть не менее 3 символов'
  }
  if (slug.length > 50) {
    return 'Slug должен быть не более 50 символов'
  }
  if (!SLUG_REGEX.test(slug)) {
    return 'Только строчные буквы, цифры и дефисы'
  }
  return ''
})

const isValid = computed(() => !titleError.value && !slugError.value)

const isSaving = ref(false)
const showDeleteDialog = ref(false)
const isDeleting = ref(false)
const showTemplateModal = ref(false)
const isChangingTemplate = ref(false)
const showPreview = ref(false)
const previewTemplate = ref<TemplateDefinition | null>(null)
const showPortfolioPreview = ref(false)

// Preview data - use current form data (not saved data) for live preview
// Note: Using explicit undefined checks to allow empty strings (user clearing a field)
const portfolioPreviewData = computed(() => ({
  title: form.title !== '' ? form.title : portfolio.value?.title,
  subtitle: form.subtitle !== '' ? form.subtitle : (portfolio.value?.subtitle ?? undefined),
  description: form.description !== '' ? form.description : (portfolio.value?.description ?? undefined)
}))

// Get current template definition for portfolio preview
const currentTemplateDefinition = computed(() => {
  return getTemplateById(portfolio.value?.template ?? 'minimal') ?? null
})

const templateDisplayName = computed(() => {
  return getTemplateById(portfolio.value?.template ?? 'minimal')?.name || portfolio.value?.template
})

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
        description: form.description || null,
        slug: form.slug.trim().toLowerCase()
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

async function handleDelete() {
  isDeleting.value = true
  try {
    await $fetch(`/api/portfolios/${portfolioId}`, { method: 'DELETE' })
    toast.add({
      title: 'Удалено!',
      description: 'Портфолио успешно удалено.',
      color: 'success'
    })
    showDeleteDialog.value = false
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      ? (err.data as { message?: string })?.message
      : 'Не удалось удалить портфолио'
    toast.add({
      title: 'Ошибка',
      description: message || 'Не удалось удалить портфолио',
      color: 'error'
    })
    showDeleteDialog.value = false
  } finally {
    isDeleting.value = false
  }
}

function normalizeSlugInput() {
  form.slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

// Shared function to apply template (DRY principle)
async function applyTemplate(template: TemplateDefinition, options: { closePreview?: boolean } = {}) {
  // Skip API call if selecting same template
  if (template.id === portfolio.value?.template) {
    showTemplateModal.value = false
    if (options.closePreview) {
      showPreview.value = false
    }
    return
  }

  isChangingTemplate.value = true
  try {
    await $fetch(`/api/portfolios/${portfolioId}`, {
      method: 'PUT',
      body: {
        title: form.title,
        template: template.id
      }
    })
    toast.add({
      title: 'Шаблон обновлен!',
      description: `Применен шаблон "${template.name}".`,
      color: 'success'
    })
    showTemplateModal.value = false
    if (options.closePreview) {
      showPreview.value = false
    }
    await refresh()
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      ? (err.data as { message?: string })?.message
      : 'Не удалось изменить шаблон'
    toast.add({
      title: 'Ошибка',
      description: message || 'Не удалось изменить шаблон',
      color: 'error'
    })
  } finally {
    isChangingTemplate.value = false
  }
}

async function handleTemplateSelect(template: TemplateDefinition) {
  await applyTemplate(template)
}

function handleTemplatePreview(template: TemplateDefinition) {
  previewTemplate.value = template
  showPreview.value = true
}

async function handlePreviewSelect(template: TemplateDefinition) {
  await applyTemplate(template, { closePreview: true })
}

useSeoMeta({
  title: portfolio.value?.title
    ? `${portfolio.value.title} | Редактирование`
    : 'Редактирование портфолио | Панель управления'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
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
      <UButton
        label="Предпросмотр"
        icon="i-lucide-eye"
        variant="outline"
        @click="showPortfolioPreview = true"
      />
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

            <UFormField
              label="URL Slug"
              :error="slugError"
              required
              hint="Строчные буквы, цифры и дефисы"
            >
              <UInput
                v-model="form.slug"
                placeholder="my-portfolio"
                :color="slugError ? 'error' : undefined"
                @input="normalizeSlugInput"
              />
              <template #description>
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Публичный URL: <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">yoursite.com/{{ form.slug || 'your-slug' }}</code>
                </div>
              </template>
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
            <div class="flex items-center">
              <span class="text-gray-500 dark:text-gray-400">Шаблон:</span>
              <span class="ml-2">{{ templateDisplayName }}</span>
              <UButton
                label="Изменить"
                size="xs"
                variant="link"
                class="ml-2"
                @click="showTemplateModal = true"
              />
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

        <UCard class="border border-red-500 dark:border-red-400">
          <template #header>
            <h2 class="text-lg font-semibold text-red-600 dark:text-red-400">
              Опасная зона
            </h2>
          </template>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Удаление портфолио необратимо. Все данные будут потеряны.
          </p>

          <UButton
            label="Удалить портфолио"
            icon="i-lucide-trash-2"
            color="error"
            variant="outline"
            block
            @click="showDeleteDialog = true"
          />
        </UCard>
      </div>
    </div>

    <UModal v-model:open="showDeleteDialog">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600 dark:text-red-400">
          Удалить портфолио?
        </h3>
      </template>

      <div class="p-4">
        <p class="text-gray-600 dark:text-gray-400">
          Вы уверены, что хотите удалить "{{ portfolio?.title }}"? Это действие необратимо.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click="showDeleteDialog = false"
          />
          <UButton
            label="Удалить"
            icon="i-lucide-trash-2"
            color="error"
            :loading="isDeleting"
            @click="handleDelete"
          />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showTemplateModal">
      <template #header>
        <h3 class="text-lg font-semibold">
          Выберите шаблон
        </h3>
      </template>

      <div class="p-4">
        <TemplateSelector
          :current-template="portfolio?.template ?? 'minimal'"
          :loading="isChangingTemplate"
          @select="handleTemplateSelect"
          @preview="handleTemplatePreview"
        />
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click="showTemplateModal = false"
          />
        </div>
      </template>
    </UModal>

    <TemplatePreviewModal
      v-model:open="showPreview"
      :template="previewTemplate"
      :portfolio-data="{
        title: form.title || portfolio?.title,
        subtitle: form.subtitle || portfolio?.subtitle || undefined,
        description: form.description || portfolio?.description || undefined
      }"
      :loading="isChangingTemplate"
      @select="handlePreviewSelect"
      @close="showPreview = false"
    />

    <!-- Portfolio Preview Modal (Story 2.9) -->
    <PortfolioPreviewModal
      v-model:open="showPortfolioPreview"
      :template="currentTemplateDefinition"
      :portfolio-data="portfolioPreviewData"
      :user-title="user?.title"
      @close="showPortfolioPreview = false"
    />
  </div>
</template>
