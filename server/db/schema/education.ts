import { pgTable, text, timestamp, uuid, integer, boolean, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { portfolios } from './portfolios'

export const education = pgTable('education', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolioId: uuid('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  school: text('school').notNull(),
  degree: text('degree').notNull(),
  fieldOfStudy: text('field_of_study'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  isCurrent: boolean('is_current').notNull().default(false),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type Education = typeof education.$inferSelect
export type NewEducation = typeof education.$inferInsert

export const educationRelations = relations(education, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [education.portfolioId],
    references: [portfolios.id]
  })
}))
