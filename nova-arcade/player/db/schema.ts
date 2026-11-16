import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("app_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  country: text("country").notNull().default("VN"),
  banned: integer("banned").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  tier: text("tier").notNull(),
  period: text("period").notNull(),
  priceCents: integer("price_cents").notNull(),
  multiplierBps: integer("multiplier_bps").notNull(),
  dailyCap: integer("daily_cap").notNull(),
  sessionCap: integer("session_cap").notNull(),
  perksJson: text("perks_json").notNull(),
  active: integer("active").notNull().default(1),
  revision: integer("revision").notNull().default(1),
});

export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull(),
  orderId: text("order_id").notNull().unique(),
  startsAt: integer("starts_at").notNull(),
  endsAt: integer("ends_at").notNull(),
  termsJson: text("terms_json").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  status: text("status").notNull().default("pending"),
  method: text("method").notNull(),
  requestKey: text("request_key").notNull(),
  externalRef: text("external_ref"),
  evidenceNote: text("evidence_note"),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
  settledAt: integer("settled_at"),
}, (t) => [uniqueIndex("order_request_unique").on(t.userId, t.requestKey)]);

export const accounts = sqliteTable("wallet_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  kind: text("kind").notNull(),
  unit: text("unit").notNull(),
  balance: integer("balance").notNull().default(0),
});

export const journals = sqliteTable("journal_transactions", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  reason: text("reason").notNull(),
  userId: text("user_id"),
  unit: text("unit").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at").notNull(),
});

export const lines = sqliteTable("journal_lines", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id").notNull(),
  accountId: text("account_id").notNull(),
  delta: integer("delta").notNull(),
});

export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  gameId: text("game_id").notNull(),
  stateJson: text("state_json").notNull(),
  version: integer("version").notNull().default(0),
  completed: integer("completed").notNull().default(0),
  score: integer("score").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const dailyRewards = sqliteTable("daily_rewards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  day: text("day").notNull(),
  total: integer("total").notNull().default(0),
});

export const rewardClaims = sqliteTable("reward_claims", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: text("user_id").notNull(),
  membershipId: text("membership_id").notNull(),
  coins: integer("coins").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const payouts = sqliteTable("payouts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  coins: integer("coins").notNull(),
  usdCents: integer("usd_cents").notNull(),
  recipient: text("recipient").notNull(),
  method: text("method").notNull(),
  status: text("status").notNull().default("pending"),
  requestKey: text("request_key").notNull(),
  approvedBy: text("approved_by"),
  externalRef: text("external_ref"),
  note: text("note"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [uniqueIndex("payout_request_unique").on(t.userId, t.requestKey)]);

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  category: text("category").notNull(),
  art: text("art").notNull(),
  engine: text("engine"),
  active: integer("active").notNull().default(1),
  baseReward: integer("base_reward").notNull(),
  sort: integer("sort").notNull(),
});

export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  gameId: text("game_id").notNull(),
});

export const settings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const audit = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  detail: text("detail").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const nonces = sqliteTable("bridge_nonces", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at").notNull(),
});

export const tickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  reply: text("reply"),
  createdAt: integer("created_at").notNull(),
});

export const walletTransfers = sqliteTable("wallet_transfers", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  coins: integer("coins").notNull(),
  note: text("note"),
  status: text("status").notNull().default("completed"),
  requestKey: text("request_key").notNull(),
  createdAt: integer("created_at").notNull(),
}, (t) => [uniqueIndex("transfer_request_unique").on(t.senderId, t.requestKey)]);

export const tournaments = sqliteTable("tournaments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  gameId: text("game_id").notNull(),
  entryFeeCoins: integer("entry_fee_coins").notNull(),
  prizePoolCoins: integer("prize_pool_coins").notNull(),
  minPlayers: integer("min_players").notNull().default(2),
  maxPlayers: integer("max_players").notNull().default(100),
  status: text("status").notNull().default("active"),
  prizeRulesJson: text("prize_rules_json").notNull(),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const tournamentEntries = sqliteTable("tournament_entries", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id").notNull(),
  userId: text("user_id").notNull(),
  entryFee: integer("entry_fee").notNull(),
  score: integer("score").notNull().default(0),
  status: text("status").notNull().default("registered"),
  prizeWon: integer("prize_won").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  playedAt: integer("played_at"),
}, (t) => [uniqueIndex("tournament_user_entry_unique").on(t.tournamentId, t.userId)]);

export const countryPolicies = sqliteTable("country_policies", {
  countryCode: text("country_code").primaryKey(),
  name: text("name").notNull(),
  catalogEnabled: integer("catalog_enabled").notNull().default(1),
  gamePlayEnabled: integer("game_play_enabled").notNull().default(1),
  purchaseEnabled: integer("purchase_enabled").notNull().default(1),
  cashDepositEnabled: integer("cash_deposit_enabled").notNull().default(0),
  paidCompetitionEnabled: integer("paid_competition_enabled").notNull().default(0),
  transferEnabled: integer("transfer_enabled").notNull().default(1),
  withdrawalEnabled: integer("withdrawal_enabled").notNull().default(0),
  note: text("note"),
});

export const gameReviews = sqliteTable("game_reviews", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: integer("created_at").notNull(),
});
