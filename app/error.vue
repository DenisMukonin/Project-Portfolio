<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })

// Determine message based on status code
const errorMessage = computed(() => {
  if (props.error.statusCode === 404) {
    return 'Портфолио не найдено'
  }
  return props.error.message || 'Произошла ошибка'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center px-4">
      <h1 class="text-6xl md:text-8xl font-bold text-gray-300 dark:text-gray-700 mb-4">
        {{ error.statusCode }}
      </h1>
      <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8">
        {{ errorMessage }}
      </p>
      <UButton
        label="На главную"
        icon="i-lucide-home"
        size="lg"
        @click="handleError"
      />
    </div>
  </div>
</template>
