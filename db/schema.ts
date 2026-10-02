import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// Field notes written from the in-site editor. A row whose slug matches a
// markdown post in content/posts/ overrides that file, so repo posts can be
// edited (or hidden as drafts) without a redeploy.
export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  summary: text().notNull().default(''),
  categories: text().array().notNull().default([]),
  image: text().notNull().default(''),
  date: text().notNull(),
  content: text().notNull().default(''),
  published: boolean().notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
