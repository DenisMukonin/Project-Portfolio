<script setup lang="ts">
const { loggedIn, user } = useUserSession()
const route = useRoute()

const authError = computed(() => route.query.error === 'github_auth_failed')
</script>

<template>
  <div>
    <UPageHero
      title="Проект Портфолио"
      description="Разрабатываем проект, позволяющий пользователям создавать собственную страницу-портфолио, где можно оформить и разместить резюме в привлекательном виде и делиться ссылкой на неё в других источниках."
    >
      <template #links>
        <div class="flex flex-wrap justify-center gap-4">
          <template v-if="loggedIn">
            <UButton
              :label="`Привет, ${user?.name || user?.username || 'Пользователь'}`"
              to="/dashboard"
              trailing-icon="i-lucide-arrow-right"
              size="xl"
            />
          </template>
          <template v-else>
            <UButton
              label="Войти через GitHub"
              to="/auth/github"
              icon="i-simple-icons-github"
              size="xl"
              external
            />
          </template>
          <UButton
            label="Перейти на GitHub"
            to="https://github.com/DenisMukonin"
            target="_blank"
            icon="i-simple-icons-github"
            size="xl"
            color="neutral"
            variant="subtle"
          />
        </div>
      </template>
    </UPageHero>

    <UAlert
      v-if="authError"
      title="Ошибка авторизации"
      description="Не удалось войти через GitHub. Пожалуйста, попробуйте еще раз."
      color="error"
      icon="i-lucide-alert-circle"
      class="mx-auto max-w-md mt-8"
    />
  </div>
</template>
