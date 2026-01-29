<script setup lang="ts">
import type { Portfolio } from '~~/server/db/schema/portfolios'

const { user, clear } = useUserSession()
const toast = useToast()
const isCreating = ref(false)

const { data: portfolioList, status, error, refresh } = await useFetch<Portfolio[]>('/api/portfolios')

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
          :title="user?.title ?? null"
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

    <!-- Loading State -->
    <UCard v-if="status === 'pending'">
      <div
        class="flex justify-center py-12"
        role="status"
        aria-label="Загрузка портфолио"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-8 h-8 animate-spin text-gray-400"
        />
        <span class="sr-only">Загрузка...</span>
      </div>
    </UCard>

    <!-- Error State -->
    <UCard v-else-if="error">
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-12 h-12 mx-auto text-red-500 mb-4"
        />
        <h3 class="text-lg font-semibold mb-2">
          Не удалось загрузить портфолио
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ error.message || 'Произошла ошибка при загрузке данных' }}
        </p>
        <UButton
          label="Попробовать снова"
          icon="i-lucide-refresh-cw"
          @click="refresh()"
        />
      </div>
    </UCard>

    <!-- Empty State -->
    <UCard v-else-if="!portfolioList?.length">
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-folder-open"
          class="w-12 h-12 mx-auto text-gray-400 mb-4"
        />
        <h3 class="text-lg font-semibold mb-2">
          У вас пока нет портфолио
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Создайте своё первое профессиональное портфолио и поделитесь им с миром.
        </p>
        <UButton
          label="Создать портфолио"
          icon="i-lucide-plus"
          size="lg"
          :loading="isCreating"
          @click="handleCreatePortfolio"
        />
      </div>
    </UCard>

    <!-- Portfolio List -->
    <UCard v-else>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">
            Ваши портфолио
          </h2>
          <UButton
            label="Создать"
            icon="i-lucide-plus"
            size="sm"
            :loading="isCreating"
            @click="handleCreatePortfolio"
          />
        </div>
      </template>

      <div class="space-y-4">
        <PortfolioCard
          v-for="portfolio in portfolioList"
          :key="portfolio.id"
          :portfolio="portfolio"
        />
      </div>
    </UCard>
  </div>
</template>
