<script setup lang="ts">
import type { TemplateDefinition } from '~~/shared/templates'
import type { SocialLinks } from '~~/shared/types/social-links'

const props = defineProps<{
  template: TemplateDefinition
  portfolioData: {
    title?: string
    subtitle?: string
    description?: string
  }
  userTitle?: string | null
  userBio?: string | null
  userSocialLinks?: SocialLinks | null
}>()

// Number of placeholder items to show in future sections (Projects, Experience)
// Kept small (2) to indicate content will appear without cluttering the preview
const PLACEHOLDER_ITEMS_COUNT = 2

// Fallback data when portfolio fields are empty
const displayTitle = computed(() => props.portfolioData.title || 'Ваше имя')
const displaySubtitle = computed(() => props.userTitle || props.portfolioData.subtitle || 'Ваша профессия')
const displayDescription = computed(() =>
  props.userBio || props.portfolioData.description || 'Здесь будет ваше описание. Расскажите о себе и своих навыках.'
)

// Template-specific styles - extended for full portfolio view
// NOTE: 'tech' and 'creative' templates intentionally ignore system dark mode preference
// by design - these templates have their own distinct visual identity that shouldn't change
const templateStyles = computed(() => {
  switch (props.template.id) {
    case 'minimal':
      // Minimal follows system dark/light mode preference
      return {
        bg: 'bg-white dark:bg-gray-900',
        text: 'text-gray-900 dark:text-white',
        accent: 'text-gray-600 dark:text-gray-400',
        sectionBg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700'
      }
    case 'tech':
      // Tech template: Always dark terminal aesthetic (by design)
      return {
        bg: 'bg-gray-900',
        text: 'text-green-400',
        accent: 'text-gray-400',
        sectionBg: 'bg-gray-800',
        border: 'border-green-500/30'
      }
    case 'creative':
      // Creative template: Always vibrant gradient (by design)
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

// Avatar background styles per template
const avatarStyles = computed(() => {
  switch (props.template.id) {
    case 'tech':
      return 'bg-green-500/20'
    case 'creative':
      return 'bg-white/20'
    default:
      return 'bg-gray-200 dark:bg-gray-700'
  }
})

// Avatar icon styles per template
const avatarIconStyles = computed(() => {
  switch (props.template.id) {
    case 'tech':
      return 'text-green-400'
    case 'creative':
      return 'text-white/80'
    default:
      return 'text-gray-400'
  }
})

const hasSocialLinks = computed(() =>
  props.userSocialLinks?.github
  || props.userSocialLinks?.linkedin
  || props.userSocialLinks?.twitter
  || props.userSocialLinks?.website
)
</script>

<template>
  <div
    class="w-full min-h-[600px] rounded-lg overflow-hidden shadow-lg"
    :class="templateStyles.bg"
  >
    <!-- Hero Section -->
    <div class="flex flex-col items-center justify-center p-8 md:p-12 text-center">
      <!-- Avatar placeholder -->
      <div
        class="w-24 h-24 md:w-32 md:h-32 rounded-full mb-6 flex items-center justify-center"
        :class="avatarStyles"
      >
        <UIcon
          name="i-lucide-user"
          class="w-12 h-12 md:w-16 md:h-16"
          :class="avatarIconStyles"
        />
      </div>

      <!-- Name -->
      <h1
        class="text-3xl md:text-4xl font-bold mb-3"
        :class="templateStyles.text"
      >
        {{ displayTitle }}
      </h1>

      <!-- Professional Title -->
      <p
        class="text-xl md:text-2xl mb-6"
        :class="templateStyles.accent"
      >
        {{ displaySubtitle }}
      </p>

      <!-- Description / Bio -->
      <p
        class="max-w-2xl text-base md:text-lg leading-relaxed whitespace-pre-line"
        :class="templateStyles.accent"
      >
        {{ displayDescription }}
      </p>

      <!-- Social Links -->
      <div class="flex gap-4 mt-8">
        <a
          v-if="userSocialLinks?.github"
          :href="userSocialLinks.github"
          target="_blank"
          rel="noopener noreferrer"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
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
          v-if="userSocialLinks?.linkedin"
          :href="userSocialLinks.linkedin"
          target="_blank"
          rel="noopener noreferrer"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
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
          v-if="userSocialLinks?.twitter"
          :href="userSocialLinks.twitter"
          target="_blank"
          rel="noopener noreferrer"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
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
          v-if="userSocialLinks?.website"
          :href="userSocialLinks.website"
          target="_blank"
          rel="noopener noreferrer"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          :class="avatarStyles"
          aria-label="Website"
        >
          <UIcon
            name="i-lucide-globe"
            class="w-5 h-5"
            :class="avatarIconStyles"
          />
        </a>

        <template v-if="!hasSocialLinks">
          <div
            v-for="icon in ['i-simple-icons-github', 'i-simple-icons-linkedin', 'i-simple-icons-x', 'i-lucide-globe']"
            :key="icon"
            class="w-10 h-10 rounded-full flex items-center justify-center opacity-30"
            :class="avatarStyles"
          >
            <UIcon
              :name="icon"
              class="w-5 h-5"
              :class="avatarIconStyles"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Projects Section Placeholder (Future Epic 4) -->
    <div
      class="mx-6 md:mx-12 mb-8 p-6 rounded-lg border"
      :class="[templateStyles.sectionBg, templateStyles.border]"
    >
      <h2
        class="text-xl font-semibold mb-4"
        :class="templateStyles.text"
      >
        Проекты
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="n in PLACEHOLDER_ITEMS_COUNT"
          :key="n"
          class="p-4 rounded-lg border opacity-50"
          :class="templateStyles.border"
        >
          <div
            class="h-4 w-3/4 rounded mb-2"
            :class="templateStyles.sectionBg"
          />
          <div
            class="h-3 w-full rounded mb-1"
            :class="templateStyles.sectionBg"
          />
          <div
            class="h-3 w-2/3 rounded"
            :class="templateStyles.sectionBg"
          />
        </div>
      </div>
      <p
        class="text-sm mt-4 opacity-60"
        :class="templateStyles.accent"
      >
        Проекты будут добавлены позже
      </p>
    </div>

    <!-- Experience Section Placeholder (Future Epic 5) -->
    <div
      class="mx-6 md:mx-12 mb-8 p-6 rounded-lg border"
      :class="[templateStyles.sectionBg, templateStyles.border]"
    >
      <h2
        class="text-xl font-semibold mb-4"
        :class="templateStyles.text"
      >
        Опыт работы
      </h2>
      <div class="space-y-4 opacity-50">
        <div
          v-for="n in PLACEHOLDER_ITEMS_COUNT"
          :key="n"
          class="flex gap-4"
        >
          <div
            class="w-12 h-12 rounded-lg flex-shrink-0"
            :class="templateStyles.sectionBg"
          />
          <div class="flex-1">
            <div
              class="h-4 w-1/2 rounded mb-2"
              :class="templateStyles.sectionBg"
            />
            <div
              class="h-3 w-1/3 rounded"
              :class="templateStyles.sectionBg"
            />
          </div>
        </div>
      </div>
      <p
        class="text-sm mt-4 opacity-60"
        :class="templateStyles.accent"
      >
        Опыт работы будет добавлен позже
      </p>
    </div>

    <!-- Education Section Placeholder (Future Epic 5) -->
    <div
      class="mx-6 md:mx-12 mb-8 p-6 rounded-lg border"
      :class="[templateStyles.sectionBg, templateStyles.border]"
    >
      <h2
        class="text-xl font-semibold mb-4"
        :class="templateStyles.text"
      >
        Образование
      </h2>
      <div class="space-y-4 opacity-50">
        <div class="flex gap-4">
          <div
            class="w-12 h-12 rounded-lg flex-shrink-0"
            :class="templateStyles.sectionBg"
          />
          <div class="flex-1">
            <div
              class="h-4 w-1/2 rounded mb-2"
              :class="templateStyles.sectionBg"
            />
            <div
              class="h-3 w-1/3 rounded"
              :class="templateStyles.sectionBg"
            />
          </div>
        </div>
      </div>
      <p
        class="text-sm mt-4 opacity-60"
        :class="templateStyles.accent"
      >
        Образование будет добавлено позже
      </p>
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
