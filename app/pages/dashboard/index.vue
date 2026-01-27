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
    <!-- Profile Section -->
    <UCard class="mb-8">
      <div class="flex items-center justify-between">
        <UserProfileCard
          :avatar-url="user?.avatarUrl ?? null"
          :name="user?.name ?? null"
          :username="user?.username ?? null"
          :email="user?.email ?? null"
        />
        <UButton
          label="Выйти"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          @click="handleLogout"
        />
      </div>
    </UCard>

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
