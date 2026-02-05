<script setup lang="ts">
import type { SocialLinks } from '~~/shared/types/social-links'

// Serialized types (Date becomes string after JSON serialization via useFetch)
interface SerializedProject {
  id: string
  portfolioId: string
  githubRepoId: string | null
  name: string
  description: string | null
  url: string | null
  language: string | null
  stars: number | null
  isVisible: boolean
  orderIndex: number
  createdAt: string
  updatedAt: string
}

interface SerializedExperience {
  id: string
  portfolioId: string
  title: string
  company: string
  location: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string | null
  orderIndex: number
  createdAt: string
  updatedAt: string
}

interface SerializedEducation {
  id: string
  portfolioId: string
  school: string
  degree: string
  fieldOfStudy: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string | null
  orderIndex: number
  createdAt: string
  updatedAt: string
}

const props = defineProps<{
  portfolio: {
    id: string
    title: string
    subtitle: string | null
    description: string | null
    slug: string
    template: string
  }
  user: {
    name: string | null
    title: string | null
    bio: string | null
    avatarUrl: string | null
    socialLinks: SocialLinks | null
  } | null
  projects: SerializedProject[]
  experiences: SerializedExperience[]
  education: SerializedEducation[]
}>()

// Display values with fallbacks
const displayTitle = computed(() => props.portfolio.title || props.user?.name || 'Portfolio')
const displaySubtitle = computed(() => props.user?.title || props.portfolio.subtitle || '')
const displayBio = computed(() => props.user?.bio || props.portfolio.description || '')

// Template-specific styles (from PortfolioPreview.vue)
const templateStyles = computed(() => {
  switch (props.portfolio.template) {
    case 'minimal':
      return {
        bg: 'bg-white dark:bg-gray-900',
        text: 'text-gray-900 dark:text-white',
        accent: 'text-gray-600 dark:text-gray-400',
        sectionBg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700'
      }
    case 'tech':
      return {
        bg: 'bg-gray-900',
        text: 'text-green-400',
        accent: 'text-gray-400',
        sectionBg: 'bg-gray-800',
        border: 'border-green-500/30'
      }
    case 'creative':
      return {
        bg: 'bg-gradient-to-br from-purple-600 to-pink-500',
        text: 'text-white',
        accent: 'text-white/80',
        sectionBg: 'bg-white/10',
        border: 'border-white/20'
      }
    default:
      return {
        bg: 'bg-white dark:bg-gray-900',
        text: 'text-gray-900 dark:text-white',
        accent: 'text-gray-600 dark:text-gray-400',
        sectionBg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700'
      }
  }
})

// Avatar styles per template
const avatarStyles = computed(() => {
  switch (props.portfolio.template) {
    case 'tech':
      return 'bg-green-500/20'
    case 'creative':
      return 'bg-white/20'
    default:
      return 'bg-gray-200 dark:bg-gray-700'
  }
})

const avatarIconStyles = computed(() => {
  switch (props.portfolio.template) {
    case 'tech':
      return 'text-green-400'
    case 'creative':
      return 'text-white/80'
    default:
      return 'text-gray-400'
  }
})

// Check if social links exist
const hasSocialLinks = computed(() =>
  props.user?.socialLinks?.github
  || props.user?.socialLinks?.linkedin
  || props.user?.socialLinks?.twitter
  || props.user?.socialLinks?.website
)

// Avatar error state (Story 6.3 - error handling for image load failure)
const avatarError = ref(false)

function handleAvatarError() {
  avatarError.value = true
}

// Date formatting helper
function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long'
  })
}
</script>

<template>
  <div
    class="w-full min-h-screen"
    :class="templateStyles.bg"
  >
    <!-- Hero Section -->
    <div class="flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 text-center">
      <!-- Avatar (Story 6.3 - Optimized with NuxtImg, eager for LCP) -->
      <div
        class="w-24 h-24 md:w-32 md:h-32 rounded-full mb-6 flex items-center justify-center overflow-hidden"
        :class="avatarStyles"
      >
        <NuxtImg
          v-if="user?.avatarUrl && !avatarError"
          :src="user.avatarUrl"
          :alt="displayTitle"
          width="128"
          height="128"
          loading="eager"
          fetchpriority="high"
          format="webp"
          quality="80"
          class="w-full h-full object-cover"
          @error="handleAvatarError"
        />
        <UIcon
          v-else
          name="i-lucide-user"
          class="w-12 h-12 md:w-16 md:h-16"
          :class="avatarIconStyles"
        />
      </div>

      <!-- Name -->
      <h1
        class="text-3xl md:text-4xl lg:text-5xl font-bold mb-3"
        :class="templateStyles.text"
      >
        {{ displayTitle }}
      </h1>

      <!-- Professional Title -->
      <p
        v-if="displaySubtitle"
        class="text-xl md:text-2xl mb-6"
        :class="templateStyles.accent"
      >
        {{ displaySubtitle }}
      </p>

      <!-- Bio -->
      <p
        v-if="displayBio"
        class="max-w-2xl text-base md:text-lg leading-relaxed whitespace-pre-line"
        :class="templateStyles.accent"
      >
        {{ displayBio }}
      </p>

      <!-- Social Links -->
      <div
        v-if="hasSocialLinks"
        class="flex gap-4 mt-8"
      >
        <a
          v-if="user?.socialLinks?.github"
          :href="user.socialLinks.github"
          target="_blank"
          rel="noopener noreferrer"
          class="w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          :class="avatarStyles"
          aria-label="GitHub"
        >
          <UIcon
            name="i-simple-icons-github"
            class="w-5 h-5"
            :class="avatarIconStyles"
          />
        </a>
        <a
          v-if="user?.socialLinks?.linkedin"
          :href="user.socialLinks.linkedin"
          target="_blank"
          rel="noopener noreferrer"
          class="w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          :class="avatarStyles"
          aria-label="LinkedIn"
        >
          <UIcon
            name="i-simple-icons-linkedin"
            class="w-5 h-5"
            :class="avatarIconStyles"
          />
        </a>
        <a
          v-if="user?.socialLinks?.twitter"
          :href="user.socialLinks.twitter"
          target="_blank"
          rel="noopener noreferrer"
          class="w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          :class="avatarStyles"
          aria-label="Twitter"
        >
          <UIcon
            name="i-simple-icons-x"
            class="w-5 h-5"
            :class="avatarIconStyles"
          />
        </a>
        <a
          v-if="user?.socialLinks?.website"
          :href="user.socialLinks.website"
          target="_blank"
          rel="noopener noreferrer"
          class="w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          :class="avatarStyles"
          aria-label="Website"
        >
          <UIcon
            name="i-lucide-globe"
            class="w-5 h-5"
            :class="avatarIconStyles"
          />
        </a>
      </div>
    </div>

    <!-- Projects Section (AC #5 - hide if empty) -->
    <div
      v-if="projects.length > 0"
      class="mx-6 md:mx-12 lg:mx-24 mb-8 p-6 rounded-lg border"
      :class="[templateStyles.sectionBg, templateStyles.border]"
    >
      <h2
        class="text-xl md:text-2xl font-semibold mb-6"
        :class="templateStyles.text"
      >
        Проекты
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="project in projects"
          :key="project.id"
          class="p-4 rounded-lg border overflow-hidden"
          :class="templateStyles.border"
        >
          <div class="flex items-start justify-between mb-2 gap-2">
            <h3
              class="font-semibold break-words min-w-0"
              :class="templateStyles.text"
            >
              {{ project.name }}
            </h3>
            <div
              v-if="project.stars && project.stars > 0"
              class="flex items-center gap-1 text-sm"
              :class="templateStyles.accent"
            >
              <UIcon
                name="i-lucide-star"
                class="w-4 h-4"
              />
              {{ project.stars }}
            </div>
          </div>
          <p
            v-if="project.description"
            class="text-sm mb-3 break-words"
            :class="templateStyles.accent"
          >
            {{ project.description }}
          </p>
          <div class="flex items-center gap-3">
            <span
              v-if="project.language"
              class="text-xs px-2 py-1 rounded"
              :class="templateStyles.sectionBg"
            >
              {{ project.language }}
            </span>
            <a
              v-if="project.url"
              :href="project.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm hover:underline py-2"
              :class="templateStyles.accent"
            >
              Открыть →
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Experience Section (AC #5 - hide if empty) -->
    <div
      v-if="experiences.length > 0"
      class="mx-6 md:mx-12 lg:mx-24 mb-8 p-6 rounded-lg border"
      :class="[templateStyles.sectionBg, templateStyles.border]"
    >
      <h2
        class="text-xl md:text-2xl font-semibold mb-6"
        :class="templateStyles.text"
      >
        Опыт работы
      </h2>
      <div class="space-y-6">
        <div
          v-for="exp in experiences"
          :key="exp.id"
          class="flex gap-4"
        >
          <div
            class="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
            :class="templateStyles.sectionBg"
          >
            <UIcon
              name="i-lucide-briefcase"
              class="w-6 h-6"
              :class="templateStyles.accent"
            />
          </div>
          <div class="flex-1">
            <h3
              class="font-semibold"
              :class="templateStyles.text"
            >
              {{ exp.title }}
            </h3>
            <p
              class="text-sm"
              :class="templateStyles.accent"
            >
              {{ exp.company }}
              <span v-if="exp.location"> • {{ exp.location }}</span>
            </p>
            <p
              class="text-sm mt-1"
              :class="templateStyles.accent"
            >
              {{ formatDate(exp.startDate) }} — {{ exp.isCurrent ? 'Настоящее время' : formatDate(exp.endDate) }}
            </p>
            <p
              v-if="exp.description"
              class="text-sm mt-2 whitespace-pre-line break-words"
              :class="templateStyles.accent"
            >
              {{ exp.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Education Section (AC #5 - hide if empty) -->
    <div
      v-if="education.length > 0"
      class="mx-6 md:mx-12 lg:mx-24 mb-8 p-6 rounded-lg border"
      :class="[templateStyles.sectionBg, templateStyles.border]"
    >
      <h2
        class="text-xl md:text-2xl font-semibold mb-6"
        :class="templateStyles.text"
      >
        Образование
      </h2>
      <div class="space-y-6">
        <div
          v-for="edu in education"
          :key="edu.id"
          class="flex gap-4"
        >
          <div
            class="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
            :class="templateStyles.sectionBg"
          >
            <UIcon
              name="i-lucide-graduation-cap"
              class="w-6 h-6"
              :class="templateStyles.accent"
            />
          </div>
          <div class="flex-1">
            <h3
              class="font-semibold"
              :class="templateStyles.text"
            >
              {{ edu.school }}
            </h3>
            <p
              class="text-sm"
              :class="templateStyles.accent"
            >
              {{ edu.degree }}
              <span v-if="edu.fieldOfStudy">, {{ edu.fieldOfStudy }}</span>
            </p>
            <p
              class="text-sm mt-1"
              :class="templateStyles.accent"
            >
              {{ formatDate(edu.startDate) }} — {{ edu.isCurrent ? 'Настоящее время' : formatDate(edu.endDate) }}
            </p>
            <p
              v-if="edu.description"
              class="text-sm mt-2 whitespace-pre-line break-words"
              :class="templateStyles.accent"
            >
              {{ edu.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="p-6 text-center border-t"
      :class="templateStyles.border"
    >
      <p
        class="text-sm opacity-60"
        :class="templateStyles.accent"
      >
        Создано с Portfolio Hub
      </p>
    </div>
  </div>
</template>
