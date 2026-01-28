<script setup lang="ts">
import type { Portfolio } from '~~/server/db/schema/portfolios'

defineProps<{
  portfolio: Portfolio
}>()
</script>

<template>
  <NuxtLink
    :to="`/dashboard/portfolio/${portfolio.id}`"
    :aria-label="`Редактировать портфолио: ${portfolio.title}`"
  >
    <UCard class="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-lg">
            {{ portfolio.title }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            /{{ portfolio.slug }} · {{ portfolio.template }}
          </p>
        </div>
        <UBadge
          :color="portfolio.isPublished ? 'success' : 'neutral'"
          :label="portfolio.isPublished ? 'Опубликовано' : 'Черновик'"
        />
      </div>
    </UCard>
  </NuxtLink>
</template>
