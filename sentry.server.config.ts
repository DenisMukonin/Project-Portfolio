import * as Sentry from '@sentry/nuxt'

const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN
const environment = process.env.NODE_ENV || 'development'

if (dsn) {
  Sentry.init({
    dsn,
    environment,

    // Performance monitoring for server
    tracesSampleRate: 1.0
  })
}
