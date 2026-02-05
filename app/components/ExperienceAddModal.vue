<script setup lang="ts">
import type { Experience } from '~~/server/db/schema/experiences'

interface Props {
  portfolioId: string
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'created', experience: Experience): void
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
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const experience = await $fetch<Experience>(`/api/portfolios/${props.portfolioId}/experiences`, {
      method: 'POST',
      body: {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim() || undefined,
        startDate: form.startDate,
        endDate: form.isCurrent ? undefined : form.endDate || undefined,
        isCurrent: form.isCurrent,
        description: form.description.trim() || undefined
      }
    })

    toast.add({
      title: 'Успешно',
      description: 'Опыт работы добавлен',
      color: 'success'
    })

    emit('created', experience)
    emit('update:open', false)
    resetForm()
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось добавить опыт работы'
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
  form.title = ''
  form.company = ''
  form.location = ''
  form.startDate = ''
  form.endDate = ''
  form.isCurrent = false
  form.description = ''
  errors.title = ''
  errors.company = ''
  errors.startDate = ''
}

function handleClose() {
  emit('update:open', false)
  resetForm()
}

// Handle modal state changes - only reset form when modal is being closed
function onModalUpdate(value: boolean) {
  if (!value) {
    // Modal is closing - reset the form
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
        Добавить опыт работы
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
          label="Добавить"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
