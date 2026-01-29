<script setup lang="ts">
import type { SocialLinks } from '~~/shared/types/social-links'

const { user, clear, fetch: refreshSession } = useUserSession()
const toast = useToast()

const displayName = ref(user.value?.name || '')
const professionalTitle = ref(user.value?.title || '')
const bio = ref(user.value?.bio || '')
const socialLinks = reactive<SocialLinks>({
  github: user.value?.socialLinks?.github || '',
  linkedin: user.value?.socialLinks?.linkedin || '',
  twitter: user.value?.socialLinks?.twitter || '',
  website: user.value?.socialLinks?.website || ''
})
const isSaving = ref(false)
const validationError = ref('')
const titleValidationError = ref('')
const bioValidationError = ref('')
const socialLinksErrors = reactive({
  github: '',
  linkedin: '',
  twitter: '',
  website: ''
})

const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)

const MAX_NAME_LENGTH = 100
const MAX_TITLE_LENGTH = 100
const MAX_BIO_LENGTH = 1000
const MAX_URL_LENGTH = 200

const bioCharacterCount = computed(() => bio.value.length)

const hasSocialLinksErrors = computed(() =>
  Object.values(socialLinksErrors).some(error => !!error)
)

function validateName(name: string): boolean {
  if (name.length > MAX_NAME_LENGTH) {
    validationError.value = 'Имя не может быть длиннее 100 символов'
    return false
  }
  validationError.value = ''
  return true
}

function validateTitle(title: string): boolean {
  if (title.length > MAX_TITLE_LENGTH) {
    titleValidationError.value = `Профессия не может быть длиннее ${MAX_TITLE_LENGTH} символов`
    return false
  }
  titleValidationError.value = ''
  return true
}

function validateBio(text: string): boolean {
  if (text.length > MAX_BIO_LENGTH) {
    bioValidationError.value = `Био не может быть длиннее ${MAX_BIO_LENGTH} символов`
    return false
  }
  bioValidationError.value = ''
  return true
}

function validateSocialUrl(field: keyof typeof socialLinksErrors, url: string): boolean {
  if (!url) {
    socialLinksErrors[field] = ''
    return true
  }
  if (url.length > MAX_URL_LENGTH) {
    socialLinksErrors[field] = `URL не может быть длиннее ${MAX_URL_LENGTH} символов`
    return false
  }
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      socialLinksErrors[field] = 'URL должен начинаться с http:// или https://'
      return false
    }
    socialLinksErrors[field] = ''
    return true
  } catch {
    socialLinksErrors[field] = 'Неверный формат URL'
    return false
  }
}

onMounted(() => {
  validateName(displayName.value)
  validateTitle(professionalTitle.value)
  validateBio(bio.value)
  validateSocialUrl('github', socialLinks.github || '')
  validateSocialUrl('linkedin', socialLinks.linkedin || '')
  validateSocialUrl('twitter', socialLinks.twitter || '')
  validateSocialUrl('website', socialLinks.website || '')
})

async function handleSaveProfile() {
  const nameValid = validateName(displayName.value)
  const titleValid = validateTitle(professionalTitle.value)
  const bioValid = validateBio(bio.value)
  const socialValid = validateSocialUrl('github', socialLinks.github || '')
    && validateSocialUrl('linkedin', socialLinks.linkedin || '')
    && validateSocialUrl('twitter', socialLinks.twitter || '')
    && validateSocialUrl('website', socialLinks.website || '')

  if (!nameValid || !titleValid || !bioValid || !socialValid) {
    return
  }

  isSaving.value = true
  try {
    await $fetch<{ id: string }>('/api/users/me', {
      method: 'PUT',
      body: {
        name: displayName.value.trim(),
        title: professionalTitle.value.trim(),
        bio: bio.value.trim(),
        socialLinks: {
          github: socialLinks.github?.trim() || undefined,
          linkedin: socialLinks.linkedin?.trim() || undefined,
          twitter: socialLinks.twitter?.trim() || undefined,
          website: socialLinks.website?.trim() || undefined
        }
      }
    })

    await refreshSession()

    toast.add({
      title: 'Профиль обновлён',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось сохранить изменения',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

async function handleDeleteAccount() {
  isDeleting.value = true
  try {
    await $fetch('/api/users/me', { method: 'DELETE' })
    await clear()
    toast.add({
      title: 'Аккаунт удалён',
      description: 'Ваш аккаунт и все данные были удалены.',
      color: 'success'
    })
    await navigateTo('/')
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось удалить аккаунт. Попробуйте ещё раз.',
      color: 'error'
    })
  } finally {
    isDeleting.value = false
    isDeleteModalOpen.value = false
  }
}

useSeoMeta({
  title: 'Настройки аккаунта | Портфолио',
  description: 'Управление настройками аккаунта'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header with back link -->
    <div class="mb-8">
      <UButton
        to="/dashboard"
        label="Назад"
        icon="i-lucide-arrow-left"
        variant="ghost"
        class="mb-4"
      />
      <h1 class="text-2xl font-bold">
        Настройки аккаунта
      </h1>
    </div>

    <!-- Account Info -->
    <UCard class="mb-8">
      <template #header>
        <h2 class="text-lg font-semibold">
          Информация об аккаунте
        </h2>
      </template>

      <div class="space-y-2">
        <p><strong>Имя:</strong> {{ user?.name || user?.username || 'Не указано' }}</p>
        <p v-if="user?.title">
          <strong>Профессия:</strong> {{ user.title }}
        </p>
        <p v-if="user?.bio">
          <strong>О себе:</strong> {{ user.bio.length > 100 ? user.bio.slice(0, 100) + '...' : user.bio }}
        </p>
        <p><strong>Email:</strong> {{ user?.email || 'Не указано' }}</p>
        <p><strong>GitHub:</strong> @{{ user?.username }}</p>
        <p v-if="user?.socialLinks && Object.values(user.socialLinks).some(v => v)">
          <strong>Соц. сети:</strong>
          {{ [user.socialLinks.github && 'GitHub', user.socialLinks.linkedin && 'LinkedIn', user.socialLinks.twitter && 'Twitter', user.socialLinks.website && 'Сайт'].filter(Boolean).join(', ') }}
        </p>
      </div>
    </UCard>

    <UCard class="mb-8">
      <template #header>
        <h2 class="text-lg font-semibold">
          Редактирование профиля
        </h2>
      </template>

      <div class="space-y-4">
        <UFormField
          label="Отображаемое имя"
          :error="validationError"
          hint="Это имя будет показано на вашем портфолио"
        >
          <UInput
            v-model="displayName"
            :placeholder="user?.username || 'Ваше имя'"
            aria-label="Отображаемое имя"
            @input="validateName(displayName)"
          />
        </UFormField>

        <UFormField
          label="Профессия"
          :error="titleValidationError"
          hint="Ваша должность или специализация"
        >
          <UInput
            v-model="professionalTitle"
            placeholder="Например: Senior Vue Developer"
            aria-label="Профессия"
            @input="validateTitle(professionalTitle)"
          />
        </UFormField>

        <UFormField
          label="О себе"
          :error="bioValidationError"
          :hint="`${bioCharacterCount} / ${MAX_BIO_LENGTH}`"
        >
          <UTextarea
            v-model="bio"
            placeholder="Расскажите о себе, своём опыте и навыках..."
            :rows="4"
            aria-label="О себе"
            @input="validateBio(bio)"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard class="mb-8">
      <template #header>
        <h2 class="text-lg font-semibold">
          Социальные сети
        </h2>
      </template>

      <div class="space-y-4">
        <UFormField
          label="GitHub"
          :error="socialLinksErrors.github"
        >
          <UInput
            v-model="socialLinks.github"
            placeholder="https://github.com/username"
            icon="i-simple-icons-github"
            aria-label="GitHub URL"
            @input="validateSocialUrl('github', socialLinks.github || '')"
          />
        </UFormField>

        <UFormField
          label="LinkedIn"
          :error="socialLinksErrors.linkedin"
        >
          <UInput
            v-model="socialLinks.linkedin"
            placeholder="https://linkedin.com/in/username"
            icon="i-simple-icons-linkedin"
            aria-label="LinkedIn URL"
            @input="validateSocialUrl('linkedin', socialLinks.linkedin || '')"
          />
        </UFormField>

        <UFormField
          label="Twitter / X"
          :error="socialLinksErrors.twitter"
        >
          <UInput
            v-model="socialLinks.twitter"
            placeholder="https://twitter.com/username"
            icon="i-simple-icons-x"
            aria-label="Twitter URL"
            @input="validateSocialUrl('twitter', socialLinks.twitter || '')"
          />
        </UFormField>

        <UFormField
          label="Личный сайт"
          :error="socialLinksErrors.website"
        >
          <UInput
            v-model="socialLinks.website"
            placeholder="https://yoursite.com"
            icon="i-lucide-globe"
            aria-label="Personal website URL"
            @input="validateSocialUrl('website', socialLinks.website || '')"
          />
        </UFormField>
      </div>
    </UCard>

    <div class="flex justify-end mb-8">
      <UButton
        label="Сохранить профиль"
        :loading="isSaving"
        :disabled="!!validationError || !!titleValidationError || !!bioValidationError || hasSocialLinksErrors"
        @click="handleSaveProfile"
      />
    </div>

    <UCard class="border-red-200 dark:border-red-800">
      <template #header>
        <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
          <UIcon name="i-lucide-alert-triangle" />
          <h2 class="text-lg font-semibold">
            Опасная зона
          </h2>
        </div>
      </template>

      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Удаление аккаунта приведёт к безвозвратной потере всех ваших данных.
        Это действие нельзя отменить.
      </p>

      <UButton
        label="Удалить аккаунт"
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        @click="isDeleteModalOpen = true"
      />
    </UCard>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
              <UIcon
                name="i-lucide-alert-triangle"
                class="size-5"
              />
              <span class="font-semibold">Удалить аккаунт?</span>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-300">
            Это действие <strong>нельзя отменить</strong>. Все ваши данные будут
            безвозвратно удалены, включая профиль и все связанные данные.
          </p>

          <template #footer>
            <div class="flex gap-2 justify-end">
              <UButton
                label="Отмена"
                color="neutral"
                variant="ghost"
                @click="isDeleteModalOpen = false"
              />
              <UButton
                label="Удалить аккаунт"
                color="error"
                :loading="isDeleting"
                icon="i-lucide-trash-2"
                @click="handleDeleteAccount"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
