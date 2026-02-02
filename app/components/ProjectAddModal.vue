<script setup lang="ts">
import type { Project } from '~~/server/db/schema/projects'

interface Props {
  portfolioId: string
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'created', project: Project): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()

// Field length limits (must match server)
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 500
const MAX_URL_LENGTH = 2048

// Common programming languages for dropdown
const languages = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'Vue',
  'HTML',
  'CSS',
  'Other'
]

const form = reactive({
  name: '',
  description: '',
  url: '',
  language: ''
})

const isSubmitting = ref(false)
const errors = reactive({
  name: '',
  url: ''
})

function validateForm(): boolean {
  errors.name = ''
  errors.url = ''
  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Название проекта обязательно'
    isValid = false
  }

  if (form.url.trim() && !/^https?:\/\/.+/i.test(form.url)) {
    errors.url = 'Неверный формат URL'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const project = await $fetch<Project>(`/api/portfolios/${props.portfolioId}/projects`, {
      method: 'POST',
      body: {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        url: form.url.trim() || undefined,
        language: form.language.trim() || undefined
      }
    })

    toast.add({
      title: 'Успешно',
      description: 'Проект добавлен',
      color: 'success'
    })

    emit('created', project)
    emit('update:open', false)
    resetForm()
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось добавить проект'
    toast.add({
      title: 'Ошибка',
      description: message,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.url = ''
  form.language = ''
  errors.name = ''
  errors.url = ''
}

function handleClose() {
  emit('update:open', false)
  resetForm()
}
</script>

<template>
  <UModal
    :open="open"
    title="Добавить проект"
    @update:open="handleClose"
  >
    <template #body>
      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <UFormField
          label="Название"
          name="name"
          required
          :error="errors.name"
        >
          <UInput
            v-model="form.name"
            placeholder="Мой проект"
            :maxlength="MAX_NAME_LENGTH"
            :disabled="isSubmitting"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Описание"
          name="description"
        >
          <UTextarea
            v-model="form.description"
            placeholder="Краткое описание проекта..."
            :rows="3"
            :maxlength="MAX_DESCRIPTION_LENGTH"
            :disabled="isSubmitting"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="URL"
          name="url"
          :error="errors.url"
        >
          <UInput
            v-model="form.url"
            placeholder="https://github.com/user/project"
            :maxlength="MAX_URL_LENGTH"
            :disabled="isSubmitting"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Язык"
          name="language"
        >
          <USelect
            v-model="form.language"
            :items="languages"
            placeholder="Выберите язык..."
            :disabled="isSubmitting"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            label="Отмена"
            variant="ghost"
            color="neutral"
            :disabled="isSubmitting"
            @click="handleClose"
          />
          <UButton
            type="submit"
            label="Добавить"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
