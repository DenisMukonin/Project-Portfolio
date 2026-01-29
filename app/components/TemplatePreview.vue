<script setup lang="ts">
import type { TemplateDefinition } from '~~/shared/templates'

const props = defineProps<{
  template: TemplateDefinition
  portfolioData: {
    title?: string
    subtitle?: string
    description?: string
  }
}>()

// Fallback data when portfolio fields are empty
const displayTitle = computed(() => props.portfolioData.title || 'Ваше имя')
const displaySubtitle = computed(() => props.portfolioData.subtitle || 'Ваша профессия')
const displayDescription = computed(() =>
  props.portfolioData.description || 'Здесь будет ваше описание. Расскажите о себе и своих навыках.'
)

// Template-specific styles
const templateStyles = computed(() => {
  switch (props.template.id) {
    case 'minimal':
      return {
        bg: 'bg-white dark:bg-gray-900',
        text: 'text-gray-900 dark:text-white',
        accent: 'text-gray-600 dark:text-gray-400'
      }
    case 'tech':
      return {
        bg: 'bg-gray-900',
        text: 'text-green-400',
        accent: 'text-gray-400'
      }
    case 'creative':
      return {
        bg: 'bg-gradient-to-br from-purple-600 to-pink-500',
        text: 'text-white',
        accent: 'text-white/80'
      }
    default:
      return {
        bg: 'bg-white dark:bg-gray-900',
        text: 'text-gray-900 dark:text-white',
        accent: 'text-gray-600 dark:text-gray-400'
      }
  }
})
</script>

<template>
  <div
    class="w-full aspect-[16/10] rounded-lg overflow-hidden shadow-lg"
    :class="templateStyles.bg"
  >
    <div class="h-full flex flex-col items-center justify-center p-8 text-center">
      <!-- Avatar placeholder -->
      <div
        class="w-20 h-20 rounded-full mb-4 flex items-center justify-center"
        :class="template.id === 'tech' ? 'bg-green-500/20' : 'bg-gray-200 dark:bg-gray-700'"
      >
        <UIcon
          name="i-lucide-user"
          class="w-10 h-10"
          :class="template.id === 'tech' ? 'text-green-400' : 'text-gray-400'"
        />
      </div>

      <!-- Name -->
      <h2
        class="text-2xl font-bold mb-2"
        :class="templateStyles.text"
      >
        {{ displayTitle }}
      </h2>

      <!-- Title -->
      <p
        class="text-lg mb-4"
        :class="templateStyles.accent"
      >
        {{ displaySubtitle }}
      </p>

      <!-- Description -->
      <p
        class="max-w-md text-sm line-clamp-3"
        :class="templateStyles.accent"
      >
        {{ displayDescription }}
      </p>

      <!-- Template indicator -->
      <div
        class="mt-6 px-3 py-1 rounded-full text-xs font-medium"
        :class="template.id === 'tech' ? 'bg-green-500/20 text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'"
      >
        {{ template.name }}
      </div>
    </div>
  </div>
</template>
