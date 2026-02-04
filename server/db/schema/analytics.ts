import { pgTable, uuid, timestamp, text, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { portfolios } from './portfolios'

export const viewEvents = pgTable('view_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolioId: uuid('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  userAgent: text('user_agent'),
  referrer: text('referrer')
}, table => [
  index('view_events_portfolio_id_idx').on(table.portfolioId),
  index('view_events_viewed_at_idx').on(table.viewedAt)
])

// Relations for query builder (M4 fix)
export const viewEventsRelations = relations(viewEvents, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [viewEvents.portfolioId],
    references: [portfolios.id]
  })
}))

export type ViewEvent = typeof viewEvents.$inferSelect
export type NewViewEvent = typeof viewEvents.$inferInsert
