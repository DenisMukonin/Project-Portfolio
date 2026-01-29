<script setup lang="ts">
defineProps<{
  avatarUrl: string | null
  name: string | null
  username: string | null
  email?: string | null
  title?: string | null
}>()
</script>

<template>
  <div class="flex items-center gap-4">
    <UAvatar
      :src="avatarUrl ?? undefined"
      :alt="name || username || 'User'"
      size="xl"
    />
    <div>
      <h2 class="text-xl font-bold">
        {{ name || username || 'User' }}
      </h2>
      <p
        v-if="title"
        class="text-gray-600 dark:text-gray-300"
      >
        {{ title }}
      </p>
      <p
        v-if="username"
        class="text-gray-500 dark:text-gray-400"
      >
        @{{ username }}
      </p>
      <p
        v-if="email"
        class="text-sm text-gray-400 dark:text-gray-500"
      >
        {{ email }}
      </p>
    </div>
  </div>
</template>
