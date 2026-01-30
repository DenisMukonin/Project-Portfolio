import { eq } from 'drizzle-orm'
import { Octokit } from '@octokit/rest'
import { db } from '~~/server/utils/db'
import { portfolios, projects } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      message: 'Portfolio ID is required'
    })
  }

  const portfolio = await db.query.portfolios.findFirst({
    where: eq(portfolios.id, portfolioId)
  })

  if (!portfolio) {
    throw createError({
      statusCode: 404,
      message: 'Portfolio not found'
    })
  }

  if (portfolio.userId !== session.user.id) {
    throw createError({
      statusCode: 403,
      message: 'Access denied'
    })
  }

  const githubToken = session.githubAccessToken
  if (!githubToken) {
    throw createError({
      statusCode: 401,
      message: 'GitHub token not found. Please re-login with GitHub.'
    })
  }

  const octokit = new Octokit({ auth: githubToken })

  try {
    const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
      type: 'owner',
      sort: 'pushed',
      direction: 'desc',
      per_page: 100
    })

    // OPTIMIZATION: Fetch all existing projects ONCE before the loop
    // This eliminates N+1 query problem (was: 2-3 queries per repo = 200-300 for 100 repos)
    // Now: 1 query + N updates/inserts = 101 queries for 100 repos
    const existingProjects = await db.query.projects.findMany({
      where: eq(projects.portfolioId, portfolioId)
    })

    // Create Map for O(1) lookups by githubRepoId
    const projectsByGithubId = new Map(
      existingProjects
        .filter(p => p.githubRepoId)
        .map(p => [p.githubRepoId, p])
    )

    // Calculate maxOrderIndex ONCE before loop, then increment locally
    let maxOrderIndex = existingProjects.length > 0
      ? Math.max(...existingProjects.map(p => p.orderIndex))
      : -1

    let imported = 0
    let updated = 0

    for (const repo of repos) {
      const repoIdString = String(repo.id)
      const existing = projectsByGithubId.get(repoIdString)

      if (existing) {
        await db.update(projects)
          .set({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            language: repo.language,
            stars: repo.stargazers_count,
            updatedAt: new Date()
          })
          .where(eq(projects.id, existing.id))
        updated++
      } else {
        maxOrderIndex++
        await db.insert(projects).values({
          portfolioId,
          githubRepoId: repoIdString,
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          isVisible: true,
          orderIndex: maxOrderIndex
        })
        imported++
      }
    }

    return {
      success: true,
      imported,
      updated,
      total: repos.length
    }
  } catch (error: unknown) {
    const octokitError = error as { status?: number, message?: string }

    if (octokitError.status === 401) {
      throw createError({
        statusCode: 401,
        message: 'GitHub token expired. Please re-login.'
      })
    }

    if (octokitError.status === 403) {
      const errorMessage = octokitError.message || ''
      if (errorMessage.includes('rate limit')) {
        throw createError({
          statusCode: 429,
          message: 'GitHub API rate limit exceeded. Please try again later.'
        })
      }
      throw createError({
        statusCode: 403,
        message: 'Insufficient permissions. Please re-login to grant repository access.'
      })
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to sync repositories: ' + (octokitError.message || 'Unknown error')
    })
  }
})
