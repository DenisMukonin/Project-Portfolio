// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    databaseUrl: '',
    session: {
      maxAge: 60 * 60 * 24 * 7, // NFR-S3: 7-day session expiry
      password: ''
    },
    oauth: {
      github: {
        clientId: '',
        clientSecret: ''
      }
    }
  },

  routeRules: {
    '/': { ssr: true },
    '/dashboard/**': { ssr: true },
    // Public portfolio pages with SWR caching (1 hour)
    '/p/**': { ssr: true, swr: 3600 }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
