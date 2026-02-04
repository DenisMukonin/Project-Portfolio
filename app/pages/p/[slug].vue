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

// Get full URL for canonical and og:url
const requestURL = useRequestURL()
const fullUrl = `${requestURL.origin}/p/${slug}`

// Default image for missing avatar (AC #5)
const defaultOgImage = `${requestURL.origin}/og-default.svg`

// Extract display values with fallbacks
const title = data.value?.portfolio.title || data.value?.user?.name || 'Portfolio'
const rawDescription = data.value?.user?.bio || data.value?.portfolio.description || ''
// Truncate description for social platforms (recommended max ~155 chars)
const description = rawDescription.length > 155
  ? rawDescription.substring(0, 152) + '...'
  : rawDescription
const image = data.value?.user?.avatarUrl || defaultOgImage

// SEO meta tags with OpenGraph and Twitter Card (Story 5.11)
useSeoMeta({
  // Basic SEO
  title,
  description,

  // OpenGraph (AC #1, #3)
  ogTitle: title,
  ogDescription: description,
  ogImage: image,
  ogUrl: fullUrl,
  ogType: 'profile',
  ogSiteName: 'Portfolio Hub',
  ogLocale: 'ru_RU',

  // Twitter Card (AC #2, #4)
  twitterCard: 'summary',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image
})

// Canonical URL
useHead({
  link: [
    { rel: 'canonical', href: fullUrl }
  ]
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
