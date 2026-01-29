<script setup lang="ts">
import { TEMPLATES, type TemplateDefinition } from '~~/shared/templates'

defineProps<{
  currentTemplate: string
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [template: TemplateDefinition]
}>()

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/templates/placeholder.svg'
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <button
      v-for="template in TEMPLATES"
      :key="template.id"
      type="button"
      class="text-left rounded-lg border-2 p-3 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      :class="[
        loading && 'opacity-50 cursor-wait',
        currentTemplate === template.id
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
      ]"
      :disabled="loading"
      @click="emit('select', template)"
    >
      <img
        :src="template.thumbnail"
        :alt="`${template.name} template preview`"
        class="w-full h-32 object-cover rounded mb-2 bg-gray-100 dark:bg-gray-800"
        loading="lazy"
        @error="handleImageError"
      >
      <p class="font-semibold">
        {{ template.name }}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ template.description }}
      </p>
      <UBadge
        v-if="currentTemplate === template.id"
        label="Текущий"
        color="primary"
        class="mt-2"
      />
    </button>
  </div>
</template>
