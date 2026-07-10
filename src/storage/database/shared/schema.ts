import { pgTable, serial, integer, timestamp, varchar, text } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	username: varchar("username", { length: 255 }).notNull(),
	password_hash: varchar("password_hash", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const gameRecords = pgTable("game_records", {
	id: serial("id").primaryKey(),
	user_id: integer("user_id").notNull(),
	scenario: varchar("scenario", { length: 255 }).notNull(),
	final_score: integer("final_score").notNull(),
	result: varchar("result", { length: 10 }).notNull(),
	played_at: timestamp("played_at", { withTimezone: true }).defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
	id: serial("id").primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	summary: text("summary").notNull(),
	content: text("content").notNull(),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});