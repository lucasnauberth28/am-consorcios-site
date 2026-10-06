import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const briefings = sqliteTable('briefings', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
  ciphertext: text('ciphertext').notNull(),
  iv: text('iv').notNull(),
  ipHash: text('ip_hash').notNull(),
  consentVersion: text('consent_version').notNull(),
}, t => [index('idx_briefings_created').on(t.createdAt),index('idx_briefings_ip_created').on(t.ipHash,t.createdAt),index('idx_briefings_expiry').on(t.expiresAt)]);
