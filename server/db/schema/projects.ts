import { pgTable, text, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { portfolios } from './portfolios'

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolioId: uuid('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  githubRepoId: text('github_repo_id').unique(), // null for manually added projects, indexed for fast sync lookups
  name: text('name').notNull(),
  description: text('description'),
  url: text('url'),
  language: text('language'),
  stars: integer('stars').default(0),
  isVisible: boolean('is_visible').notNull().default(true),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export const projectsRelations = relations(projects, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [projects.portfolioId],
    references: [portfolios.id]
  })
}))
