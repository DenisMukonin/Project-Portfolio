<script setup lang="ts">
const { user, clear } = useUserSession()
const toast = useToast()

const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)

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
        <p><strong>Email:</strong> {{ user?.email || 'Не указано' }}</p>
        <p><strong>GitHub:</strong> @{{ user?.username }}</p>
      </div>
    </UCard>

    <!-- Danger Zone -->
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
