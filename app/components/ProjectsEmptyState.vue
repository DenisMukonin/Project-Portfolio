<script setup lang="ts">
defineProps<{
  isSyncing?: boolean
}>()

const emit = defineEmits<{
  sync: []
  addManual: []
}>()
</script>

<template>
  <div class="text-center py-12">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
      <UIcon
        name="i-lucide-folder-open"
        class="w-8 h-8 text-gray-400"
      />
    </div>

    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
      Проекты ещё не добавлены
    </h3>

    <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
      Импортируйте репозитории с GitHub или добавьте проекты вручную
    </p>

    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      <UButton
        label="Синхронизировать с GitHub"
        icon="i-simple-icons-github"
        :loading="isSyncing"
        :disabled="isSyncing"
        @click="emit('sync')"
      />
      <UButton
        label="Добавить вручную"
        icon="i-lucide-plus"
        variant="outline"
        color="neutral"
        :disabled="isSyncing"
        @click="emit('addManual')"
      />
    </div>
  </div>
</template>
