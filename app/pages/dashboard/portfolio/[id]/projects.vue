<script setup lang="ts">
import type { Portfolio } from '~~/server/db/schema/portfolios'
import type { Project } from '~~/server/db/schema/projects'

const route = useRoute()
const toast = useToast()
const { user } = useUserSession()
const portfolioId = route.params.id as string

const { data: portfolio, status: portfolioStatus, error: portfolioError } = await useFetch<Portfolio>(`/api/portfolios/${portfolioId}`)

if (portfolioError.value) {
  throw createError({
    statusCode: portfolioError.value.statusCode || 404,
    message: portfolioError.value.message || 'Портфолио не найдено'
  })
}

const { data: projects, status: projectsStatus } = await useFetch<Project[]>(`/api/portfolios/${portfolioId}/projects`)

const isLoading = computed(() => portfolioStatus.value === 'pending' || projectsStatus.value === 'pending')
const hasProjects = computed(() => projects.value && projects.value.length > 0)

function handleSync() {
  toast.add({
    title: 'Скоро',
    description: 'Синхронизация с GitHub будет доступна в следующем обновлении',
    color: 'warning'
  })
}

function handleManualAdd() {
  toast.add({
    title: 'Скоро',
    description: 'Добавление проектов вручную будет доступно в следующем обновлении',
    color: 'warning'
  })
}

useSeoMeta({
  title: portfolio.value?.title
    ? `Проекты | ${portfolio.value.title}`
    : 'Проекты | Панель управления'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <UButton
          :to="`/dashboard/portfolio/${portfolioId}`"
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          aria-label="Назад к портфолио"
        />
        <h1 class="text-2xl font-bold">
          Проекты
        </h1>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="flex justify-center py-12"
      role="status"
      aria-label="Загрузка проектов"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-gray-400"
      />
      <span class="sr-only">Загрузка...</span>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              GitHub интеграция
            </h2>
            <UBadge
              v-if="user?.username"
              color="success"
              variant="subtle"
            >
              <UIcon
                name="i-simple-icons-github"
                class="w-4 h-4 mr-1"
              />
              Подключено как @{{ user.username }}
            </UBadge>
          </div>
        </template>

        <p class="text-gray-600 dark:text-gray-400">
          Импортируйте репозитории с GitHub или добавьте проекты вручную для отображения в портфолио.
        </p>

        <template #footer>
          <div class="flex gap-2">
            <UButton
              label="Синхронизировать с GitHub"
              icon="i-simple-icons-github"
              @click="handleSync"
            />
            <UButton
              label="Добавить вручную"
              icon="i-lucide-plus"
              variant="outline"
              color="neutral"
              @click="handleManualAdd"
            />
          </div>
        </template>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Мои проекты
          </h2>
        </template>

        <div v-if="hasProjects">
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="project in projects"
              :key="project.id"
              class="py-4 first:pt-0 last:pb-0"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-medium">
                    {{ project.name }}
                  </h3>
                  <p
                    v-if="project.description"
                    class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                  >
                    {{ project.description }}
                  </p>
                  <div class="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span
                      v-if="project.language"
                      class="flex items-center gap-1"
                    >
                      <span class="w-3 h-3 rounded-full bg-blue-500" />
                      {{ project.language }}
                    </span>
                    <span
                      v-if="project.stars != null"
                      class="flex items-center gap-1"
                    >
                      <UIcon
                        name="i-lucide-star"
                        class="w-4 h-4"
                      />
                      {{ project.stars }}
                    </span>
                  </div>
                </div>
                <UBadge
                  :color="project.isVisible ? 'success' : 'neutral'"
                  variant="subtle"
                  :label="project.isVisible ? 'Видимый' : 'Скрытый'"
                />
              </div>
            </div>
          </div>
        </div>

        <ProjectsEmptyState
          v-else
          @sync="handleSync"
          @add-manual="handleManualAdd"
        />
      </UCard>
    </div>
  </div>
</template>
