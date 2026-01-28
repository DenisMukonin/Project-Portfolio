<script setup lang="ts">
const { user, clear } = useUserSession()
const toast = useToast()
const isCreating = ref(false)

async function handleLogout() {
  await clear()
  await navigateTo('/')
}

async function handleCreatePortfolio() {
  isCreating.value = true
  try {
    const portfolio = await $fetch('/api/portfolios', { method: 'POST' })
    toast.add({
      title: 'Портфолио создано!',
      description: 'Начните настройку своего портфолио.',
      color: 'success'
    })
    if (portfolio?.id) {
      await navigateTo(`/dashboard/portfolio/${portfolio.id}`)
    }
  } catch (error: unknown) {
    const message = error && typeof error === 'object' && 'data' in error
      ? (error.data as { message?: string })?.message
      : 'Не удалось создать портфолио'
    toast.add({
      title: 'Ошибка',
      description: message || 'Не удалось создать портфолио',
      color: 'error'
    })
  } finally {
    isCreating.value = false
  }
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
        <div class="flex items-center gap-2">
          <UButton
            to="/dashboard/settings"
            icon="i-lucide-settings"
            color="neutral"
            variant="ghost"
            square
          />
          <UButton
            label="Выйти"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            @click="handleLogout"
          />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Ваше портфолио
        </h2>
      </template>

      <p class="text-gray-600 dark:text-gray-300">
        Создайте своё профессиональное портфолио и поделитесь им с миром.
      </p>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            label="Создать портфолио"
            icon="i-lucide-plus"
            :loading="isCreating"
            @click="handleCreatePortfolio"
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
