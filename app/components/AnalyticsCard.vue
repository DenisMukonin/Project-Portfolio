<script setup lang="ts">
interface ChartDataPoint {
  date: string
  views: number
}

interface Props {
  totalViews: number
  thirtyDayViews: number
  chartData: ChartDataPoint[]
  loading?: boolean
  error?: boolean
}

const props = defineProps<Props>()

const hasViews = computed(() => props.totalViews > 0)

// Format date for display (e.g., "Пн", "Вт") (AC: #5)
function formatDay(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { weekday: 'short' })
}

// Calculate bar height as percentage of max (AC: #2)
const maxViews = computed(() => Math.max(...props.chartData.map(d => d.views), 1))
function barHeight(views: number): number {
  return (views / maxViews.value) * 100
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-bar-chart-2"
          class="w-5 h-5"
        />
        <h2 class="text-lg font-semibold">
          Аналитика
        </h2>
      </div>
    </template>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-6 h-6 animate-spin text-gray-400"
      />
    </div>

    <!-- Error State (M3 fix) -->
    <div
      v-else-if="error"
      class="text-center py-8"
    >
      <UIcon
        name="i-lucide-alert-circle"
        class="w-12 h-12 mx-auto text-gray-400 mb-4"
      />
      <p class="text-gray-600 dark:text-gray-400 mb-2">
        Не удалось загрузить аналитику
      </p>
      <p class="text-sm text-gray-500">
        Попробуйте обновить страницу
      </p>
    </div>

    <!-- Empty State (AC: #4) -->
    <div
      v-else-if="!hasViews"
      class="text-center py-8"
    >
      <UIcon
        name="i-lucide-eye-off"
        class="w-12 h-12 mx-auto text-gray-400 mb-4"
      />
      <p class="text-gray-600 dark:text-gray-400 mb-2">
        Пока нет просмотров
      </p>
      <p class="text-sm text-gray-500">
        Поделитесь ссылкой на портфолио, чтобы начать отслеживать!
      </p>
    </div>

    <!-- Analytics Data -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Total Views (AC: #1) -->
      <div class="text-center">
        <div class="text-4xl font-bold text-primary-600 dark:text-primary-400">
          {{ totalViews.toLocaleString('ru-RU') }}
        </div>
        <div class="text-sm text-gray-500">
          всего просмотров
        </div>
      </div>

      <!-- 7-day Chart (AC: #2, #5) -->
      <div>
        <h3 class="text-sm font-medium mb-3">
          Последние 7 дней
        </h3>
        <!-- L1 fix: Add aria-label for accessibility -->
        <div
          class="flex items-end justify-between h-24 gap-1"
          role="img"
          aria-label="График просмотров за последние 7 дней"
        >
          <div
            v-for="point in chartData"
            :key="point.date"
            class="flex-1 flex flex-col items-center group"
          >
            <div
              class="w-full bg-primary-500 dark:bg-primary-400 rounded-t transition-all relative"
              :style="{ height: `${barHeight(point.views)}%`, minHeight: point.views > 0 ? '4px' : '0' }"
            >
              <!-- Tooltip (AC: #5) -->
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {{ point.views }} просм.
              </div>
            </div>
            <span class="text-xs text-gray-500 mt-1">{{ formatDay(point.date) }}</span>
          </div>
        </div>
      </div>

      <!-- 30-day Stats (AC: #3) -->
      <div class="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
        <span class="text-gray-500">За 30 дней:</span>
        <span class="font-medium">{{ thirtyDayViews.toLocaleString('ru-RU') }} просмотров</span>
      </div>
    </div>
  </UCard>
</template>
