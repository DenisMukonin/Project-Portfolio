<script setup lang="ts">
// Proper typing for Sentry client
interface SentryPlugin {
  captureMessage: (message: string, level?: string) => void
  captureException: (error: Error) => void
  setUser: (user: { id: string, email?: string, username?: string } | null) => void
}

const nuxtApp = useNuxtApp()
const $sentry = nuxtApp.$sentry as SentryPlugin | undefined

// SEO Meta (consistent with other pages)
useSeoMeta({
  title: 'Sentry Test',
  description: 'Test page for Sentry error monitoring integration'
})

function triggerError() {
  throw new Error('Sentry Test Error: This is a deliberate error for testing purposes.')
}

function triggerCustomError() {
  if ($sentry) {
    $sentry.captureMessage('Sentry Test Message: Custom captured event', 'info')
    alert('Custom message sent to Sentry (if configured)')
  } else {
    alert('Sentry is not initialized')
  }
}
</script>

<template>
  <div class="container mx-auto p-8 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">
      Sentry Integration Test
    </h1>

    <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-8">
      <h2 class="text-xl font-semibold mb-2">
        Status
      </h2>
      <div class="flex items-center gap-2">
        <UBadge
          :color="$sentry ? 'success' : 'error'"
          :label="$sentry ? 'Active' : 'Inactive'"
        />
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Sentry is {{ $sentry ? 'initialized and ready' : 'not configured (no DSN)' }}
        </span>
      </div>
    </div>

    <div class="space-y-4">
      <UButton
        color="error"
        label="Throw Unhandled Error"
        icon="i-lucide-alert-triangle"
        @click="triggerError"
      />

      <UButton
        color="primary"
        label="Send Custom Message"
        icon="i-lucide-message-square"
        @click="triggerCustomError"
      />
    </div>

    <p class="mt-8 text-sm text-gray-500">
      Note: Errors will only be sent if NUXT_PUBLIC_SENTRY_DSN is configured.
    </p>
  </div>
</template>
