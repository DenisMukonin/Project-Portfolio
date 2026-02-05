<script setup lang="ts">
import type { Project } from '~~/server/db/schema/projects'

interface Props {
  portfolioId: string
  project: Project | null
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'updated', project: Project): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()

// Field length limits (must match server)
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 500
const MAX_URL_LENGTH = 2048

const form = reactive({
  name: '',
  description: '',
  url: ''
})

const isSubmitting = ref(false)
const errors = reactive({
  name: '',
  url: ''
})

// Watch project prop to populate form when modal opens
watch(() => props.project, (newProject) => {
  if (newProject) {
    form.name = newProject.name
    form.description = newProject.description ?? ''
    form.url = newProject.url ?? ''
  }
}, { immediate: true })

// Also reset form when modal opens with a project
watch(() => props.open, (isOpen) => {
  if (isOpen && props.project) {
    form.name = props.project.name
    form.description = props.project.description ?? ''
    form.url = props.project.url ?? ''
    errors.name = ''
    errors.url = ''
  }
})

// URL validation using URL constructor (matches server-side validation)
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validateForm(): boolean {
  errors.name = ''
  errors.url = ''
  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Название проекта обязательно'
    isValid = false
  }

  const trimmedUrl = form.url.trim()
  if (trimmedUrl && !isValidUrl(trimmedUrl)) {
    errors.url = 'Неверный формат URL'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm() || !props.project) return

  isSubmitting.value = true

  try {
    const updatedProject = await $fetch<Project>(
      `/api/portfolios/${props.portfolioId}/projects/${props.project.id}`,
      {
        method: 'PUT',
        body: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          url: form.url.trim() || null
        }
      }
    )

    toast.add({
      title: 'Успешно',
      description: 'Проект обновлён',
      color: 'success'
    })

    emit('updated', updatedProject)
    emit('update:open', false)
    resetForm()
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось обновить проект'
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
  errors.name = ''
  errors.url = ''
}

function handleClose() {
  emit('update:open', false)
  resetForm()
}

// Handle modal state changes - only reset form when modal is being closed
function onModalUpdate(value: boolean) {
  if (!value) {
    handleClose()
  }
}
</script>

<template>
  <UModal
    :open="open"
    title="Редактировать проект"
    @update:open="onModalUpdate"
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
            placeholder="Название проекта"
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
            placeholder="Описание проекта..."
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
            label="Сохранить"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
