<script setup lang="ts">
import type { TemplateDefinition } from '~~/shared/templates'
import type { SocialLinks } from '~~/shared/types/social-links'

const props = defineProps<{
  open: boolean
  template: TemplateDefinition | null
  portfolioData: {
    title?: string
    subtitle?: string
    description?: string
  }
  userTitle?: string | null
  userBio?: string | null
  userSocialLinks?: SocialLinks | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
}>()

// Responsive view mode toggle
const viewMode = ref<'desktop' | 'mobile'>('desktop')

// Container classes for responsive preview
const containerClass = computed(() => {
  return viewMode.value === 'mobile'
    ? 'max-w-[375px] mx-auto transition-all duration-300'
    : 'w-full max-w-5xl mx-auto transition-all duration-300'
})

function handleClose() {
  emit('update:open', false)
  emit('close')
}

// Reset to desktop view when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    viewMode.value = 'desktop'
  }
})
</script>

<template>
  <UModal
    :open="open"
    fullscreen
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-4">
          <h3 class="text-lg font-semibold">
            Предпросмотр портфолио
          </h3>

          <!-- Responsive toggle buttons -->
          <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <UButton
              icon="i-lucide-monitor"
              size="sm"
              :variant="viewMode === 'desktop' ? 'solid' : 'ghost'"
              :color="viewMode === 'desktop' ? 'primary' : 'neutral'"
              aria-label="Предпросмотр на компьютере"
              @click="viewMode = 'desktop'"
            />
            <UButton
              icon="i-lucide-smartphone"
              size="sm"
              :variant="viewMode === 'mobile' ? 'solid' : 'ghost'"
              :color="viewMode === 'mobile' ? 'primary' : 'neutral'"
              aria-label="Предпросмотр на телефоне"
              @click="viewMode = 'mobile'"
            />
          </div>
        </div>

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

    <div
      id="portfolio-preview-content"
      class="p-6 flex flex-col items-center overflow-auto bg-gray-100 dark:bg-gray-950 min-h-full"
      aria-describedby="preview-description"
    >
      <!-- Preview container with dynamic width -->
      <div :class="containerClass">
        <PortfolioPreview
          v-if="template"
          :template="template"
          :portfolio-data="portfolioData"
          :user-title="userTitle"
          :user-bio="userBio"
          :user-social-links="userSocialLinks"
        />
        <!-- Loading skeleton when template is not yet available -->
        <div
          v-else
          class="w-full min-h-[400px] rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-8 h-8 animate-spin text-gray-400"
          />
        </div>
      </div>

      <p
        id="preview-description"
        class="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center"
      >
        Это предварительный просмотр. Так ваше портфолио будет выглядеть для посетителей.
      </p>

      <!-- Mobile indicator -->
      <div
        v-if="viewMode === 'mobile'"
        class="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center"
      >
        Ширина: 375px (iPhone SE)
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="Закрыть"
          color="neutral"
          variant="ghost"
          @click="handleClose"
        />
      </div>
    </template>
  </UModal>
</template>
