<script setup lang="ts">
import type { Education } from '~~/server/db/schema/education'

interface Props {
  portfolioId: string
  education: Education | null
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'updated', education: Education): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()

const form = reactive({
  school: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: ''
})

const isSubmitting = ref(false)
const errors = reactive({
  school: '',
  degree: '',
  startDate: ''
})

// Pre-fill form when education prop changes
watch(() => props.education, (edu) => {
  if (edu) {
    form.school = edu.school
    form.degree = edu.degree
    form.fieldOfStudy = edu.fieldOfStudy || ''
    form.startDate = edu.startDate
    form.endDate = edu.endDate || ''
    form.isCurrent = edu.isCurrent
    form.description = edu.description || ''
  }
}, { immediate: true })

// Disable endDate when "Currently enrolled" is checked
watch(() => form.isCurrent, (isCurrent) => {
  if (isCurrent) {
    form.endDate = ''
  }
})

function validateForm(): boolean {
  errors.school = ''
  errors.degree = ''
  errors.startDate = ''
  let isValid = true

  if (!form.school.trim()) {
    errors.school = 'Учебное заведение обязательно'
    isValid = false
  }

  if (!form.degree.trim()) {
    errors.degree = 'Степень обязательна'
    isValid = false
  }

  if (!form.startDate) {
    errors.startDate = 'Дата начала обязательна'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm() || !props.education) return

  isSubmitting.value = true

  try {
    const updated = await $fetch<Education>(
      `/api/portfolios/${props.portfolioId}/education/${props.education.id}`,
      {
        method: 'PUT',
        body: {
          school: form.school.trim(),
          degree: form.degree.trim(),
          fieldOfStudy: form.fieldOfStudy.trim() || undefined,
          startDate: form.startDate,
          endDate: form.isCurrent ? undefined : form.endDate || undefined,
          isCurrent: form.isCurrent,
          description: form.description.trim() || undefined
        }
      }
    )

    toast.add({
      title: 'Успешно',
      description: 'Образование обновлено',
      color: 'success'
    })

    emit('updated', updated)
    emit('update:open', false)
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    const message = fetchError.data?.message || 'Не удалось обновить образование'
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
  errors.school = ''
  errors.degree = ''
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
        Редактировать образование
      </h3>
    </template>

    <template #body>
      <form
        class="p-4 space-y-4"
        @submit.prevent="handleSubmit"
      >
        <UFormField
          label="Учебное заведение"
          required
          :error="errors.school"
        >
          <UInput
            v-model="form.school"
            placeholder="Московский государственный университет"
            :disabled="isSubmitting"
            maxlength="100"
          />
        </UFormField>

        <UFormField
          label="Степень"
          required
          :error="errors.degree"
        >
          <UInput
            v-model="form.degree"
            placeholder="Бакалавр"
            :disabled="isSubmitting"
            maxlength="100"
          />
        </UFormField>

        <UFormField label="Специальность">
          <UInput
            v-model="form.fieldOfStudy"
            placeholder="Компьютерные науки"
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
          label="Сейчас учусь"
          :disabled="isSubmitting"
        />

        <UFormField label="Описание">
          <UTextarea
            v-model="form.description"
            placeholder="Дополнительная информация об образовании..."
            :rows="4"
            :disabled="isSubmitting"
            maxlength="1000"
          />
        </UFormField>
      </form>
    </template>

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
