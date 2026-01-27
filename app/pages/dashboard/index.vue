<script setup lang="ts">
const { user, clear } = useUserSession()

async function handleLogout() {
  await clear()
  await navigateTo('/')
}

useSeoMeta({
  title: 'Панель управления | Портфолио',
  description: 'Управляйте своим портфолио'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <UAvatar
          v-if="user?.avatarUrl"
          :src="user.avatarUrl"
          :alt="user.name || user.username || 'User'"
          size="lg"
        />
        <div>
          <h1 class="text-2xl font-bold">
            Добро пожаловать, {{ user?.name || user?.username || 'Пользователь' }}!
          </h1>
          <p class="text-gray-500 dark:text-gray-400">
            {{ user?.email || `@${user?.username}` }}
          </p>
        </div>
      </div>

      <UButton
        label="Выйти"
        icon="i-lucide-log-out"
        color="neutral"
        variant="ghost"
        @click="handleLogout"
      />
    </div>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Ваше портфолио
        </h2>
      </template>

      <p class="text-gray-600 dark:text-gray-300">
        Здесь вы сможете создавать и редактировать своё портфолио.
        Эта функциональность будет добавлена в следующих историях.
      </p>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            label="Создать портфолио"
            disabled
            icon="i-lucide-plus"
          />
          <UButton
            label="Просмотреть шаблоны"
            disabled
            icon="i-lucide-layout-template"
            variant="outline"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
