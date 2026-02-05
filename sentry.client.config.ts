import * as Sentry from '@sentry/nuxt'

const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN
const environment = process.env.NODE_ENV || 'development'

if (dsn) {
  Sentry.init({
    dsn,
    environment,

    // Performance monitoring (adjust sample rate for production)
    tracesSampleRate: 1.0,

    // Session replay for debugging user issues
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}
