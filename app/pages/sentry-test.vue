<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { $sentry } = useNuxtApp() as unknown as { $sentry: any }

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
        <div
          class="w-3 h-3 rounded-full"
          :class="$sentry ? 'bg-green-500' : 'bg-red-500'"
        />
        <span>Sentry is {{ $sentry ? 'active' : 'inactive' }}</span>
      </div>
    </div>

    <div class="space-y-4">
      <UButton
        color="error"
        label="Throw Unhandled Error"
        @click="triggerError"
      />

      <UButton
        color="primary"
        label="Send Custom Message"
        @click="triggerCustomError"
      />
    </div>

    <p class="mt-8 text-sm text-gray-500">
      Note: Errors will only be sent if NUXT_PUBLIC_SENTRY_DSN is configured.
    </p>
  </div>
</template>
