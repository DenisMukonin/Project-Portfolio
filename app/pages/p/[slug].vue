<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

// Fetch portfolio data via SSR (AC #1 - SEO-friendly)
const { data, error } = await useFetch(`/api/public/${slug}`)

// Handle 404 errors (AC #2, #3)
if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Портфолио не найдено'
  })
}

// SEO meta tags (basic - Story 5.11 will enhance with OpenGraph)
useSeoMeta({
  title: data.value?.portfolio.title || 'Portfolio',
  description: data.value?.user?.bio || data.value?.portfolio.description || ''
})
</script>

<template>
  <PublicPortfolio
    v-if="data"
    :portfolio="data.portfolio"
    :user="data.user"
    :projects="data.projects"
    :experiences="data.experiences"
    :education="data.education"
  />
</template>
