<script setup lang="ts">
import { TEMPLATES, type TemplateDefinition } from '../../shared/templates'

defineProps<{
  currentTemplate: string
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [template: TemplateDefinition]
  preview: [template: TemplateDefinition]
}>()

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/templates/placeholder.svg'
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div
      v-for="template in TEMPLATES"
      :key="template.id"
      class="relative group"
    >
      <button
        type="button"
        class="w-full text-left rounded-lg border-2 p-3 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        :class="[
          loading && 'opacity-50 cursor-wait',
          currentTemplate === template.id
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
        ]"
        :disabled="loading"
        @click="emit('select', template)"
      >
        <div class="relative">
          <img
            :src="template.thumbnail"
            :alt="`${template.name} template preview`"
            class="w-full h-32 object-cover rounded mb-2 bg-gray-100 dark:bg-gray-800"
            loading="lazy"
            @error="handleImageError"
          >
          <!-- Preview overlay button - visible on mobile, hover on desktop -->
          <button
            type="button"
            class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded"
            @click.stop="emit('preview', template)"
          >
            <UButton
              label="Предпросмотр"
              icon="i-lucide-eye"
              size="sm"
              color="neutral"
              variant="solid"
            />
          </button>
        </div>
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
  </div>
</template>
