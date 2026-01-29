declare module '#auth-utils' {
  interface User {
    id: string
    githubId: string
    email: string | null
    name: string | null
    username: string | null
    avatarUrl: string | null
    title: string | null
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
