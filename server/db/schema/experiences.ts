import { pgTable, text, timestamp, uuid, integer, boolean, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { portfolios } from './portfolios'

export const experiences = pgTable('experiences', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolioId: uuid('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  isCurrent: boolean('is_current').notNull().default(false),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type Experience = typeof experiences.$inferSelect
export type NewExperience = typeof experiences.$inferInsert

export const experiencesRelations = relations(experiences, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [experiences.portfolioId],
    references: [portfolios.id]
  })
}))
