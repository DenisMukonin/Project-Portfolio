<script setup lang="ts">
import type { TemplateDefinition } from '~~/shared/templates'

const props = defineProps<{
  open: boolean
  template: TemplateDefinition | null
  portfolioData: {
    title?: string
    subtitle?: string
    description?: string
  }
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'select': [template: TemplateDefinition]
  'close': []
}>()

function handleSelect() {
  if (props.template) {
    emit('select', props.template)
  }
}

function handleClose() {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <UModal
    :open="open"
    fullscreen
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold">
          Предпросмотр: {{ template?.name }}
        </h3>
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label="Закрыть предпросмотр"
          @click="handleClose"
        />
      </div>
    </template>

    <template #body>
      <div class="p-6 flex flex-col items-center">
        <div class="w-full max-w-4xl">
          <TemplatePreview
            v-if="template"
            :template="template"
            :portfolio-data="portfolioData"
          />
        </div>

        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Это приблизительный предпросмотр. Фактический вид может отличаться.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          label="Закрыть"
          color="neutral"
          variant="ghost"
          @click="handleClose"
        />
        <UButton
          label="Выбрать этот шаблон"
          icon="i-lucide-check"
          :loading="loading"
          @click="handleSelect"
        />
      </div>
    </template>
  </UModal>
</template>
