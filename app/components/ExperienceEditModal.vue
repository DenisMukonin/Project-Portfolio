<script setup lang="ts">
import type { Experience } from '~~/server/db/schema/experiences'

interface Props {
  portfolioId: string
  experience: Experience | null
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'updated', experience: Experience): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()

const form = reactive({
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: ''
})

const isSubmitting = ref(false)
const errors = reactive({
  title: '',
  company: '',
  startDate: ''
})

// Pre-fill form when experience prop changes
watch(() => props.experience, (exp) => {
  if (exp) {
    form.title = exp.title
    form.company = exp.company
    form.location = exp.location || ''
    form.startDate = exp.startDate
    form.endDate = exp.endDate || ''
    form.isCurrent = exp.isCurrent
    form.description = exp.description || ''
  }
}, { immediate: true })

// Disable endDate when "Current job" is checked
watch(() => form.isCurrent, (isCurrent) => {
  if (isCurrent) {
    form.endDate = ''
  }
})

function validateForm(): boolean {
  errors.title = ''
  errors.company = ''
  errors.startDate = ''
  let isValid = true

  if (!form.title.trim()) {
    errors.title = 'Должность обязательна'
    isValid = false
  }

  if (!form.company.trim()) {
    errors.company = 'Компания обязательна'
    isValid = false
  }

  if (!form.startDate) {
    errors.startDate = 'Дата начала обязательна'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm() || !props.experience) return

  isSubmitting.value = true

  try {
    const updated = await $fetch<Experience>(
      `/api/portfolios/${props.portfolioId}/experiences/${props.experience.id}`,
      {
        method: 'PUT',
        body: {
          title: form.title.trim(),
          company: form.company.trim(),
          location: form.location.trim() || undefined,
          startDate: form.startDate,
          endDate: form.isCurrent ? undefined : form.endDate || undefined,
          isCurrent: form.isCurrent,
          description: form.description.trim() || undefined
        }
      }
    )

    toast.add({
      title: 'Успешно',
      description: 'Опыт работы обновлён',
      color: 'success'
    })

    emit('updated', updated)
    emit('update:open', false)
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось обновить опыт работы'
    toast.add({
      title: 'Ошибка',
      description: message,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  emit('update:open', false)
  // Reset errors on close
  errors.title = ''
  errors.company = ''
  errors.startDate = ''
}

// Handle modal state changes - only close when modal is being closed
function onModalUpdate(value: boolean) {
  if (!value) {
    handleClose()
  }
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="onModalUpdate"
  >
    <template #header>
      <h3 class="text-lg font-semibold">
        Редактировать опыт работы
      </h3>
    </template>

    <form
      class="p-4 space-y-4"
      @submit.prevent="handleSubmit"
    >
      <UFormField
        label="Должность"
        required
        :error="errors.title"
      >
        <UInput
          v-model="form.title"
          placeholder="Senior Frontend Developer"
          :disabled="isSubmitting"
          maxlength="100"
        />
      </UFormField>

      <UFormField
        label="Компания"
        required
        :error="errors.company"
      >
        <UInput
          v-model="form.company"
          placeholder="Acme Corporation"
          :disabled="isSubmitting"
          maxlength="100"
        />
      </UFormField>

      <UFormField label="Местоположение">
        <UInput
          v-model="form.location"
          placeholder="Москва, Россия"
          :disabled="isSubmitting"
          maxlength="100"
        />
      </UFormField>

      <div class="grid grid-cols-2 gap-4">
        <UFormField
          label="Дата начала"
          required
          :error="errors.startDate"
        >
          <MonthYearPicker
            v-model="form.startDate"
            placeholder="Выберите дату"
            :disabled="isSubmitting"
          />
        </UFormField>

        <UFormField label="Дата окончания">
          <MonthYearPicker
            v-model="form.endDate"
            :placeholder="form.isCurrent ? 'Настоящее время' : 'Выберите дату'"
            :disabled="isSubmitting || form.isCurrent"
          />
        </UFormField>
      </div>

      <UCheckbox
        v-model="form.isCurrent"
        label="Это моя текущая работа"
        :disabled="isSubmitting"
      />

      <UFormField label="Описание">
        <UTextarea
          v-model="form.description"
          placeholder="Опишите ваши обязанности и достижения..."
          :rows="4"
          :disabled="isSubmitting"
          maxlength="1000"
        />
      </UFormField>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Отмена"
          variant="ghost"
          color="neutral"
          :disabled="isSubmitting"
          @click="handleClose"
        />
        <UButton
          label="Сохранить"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
