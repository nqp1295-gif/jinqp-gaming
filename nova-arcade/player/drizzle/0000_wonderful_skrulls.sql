CREATE TABLE `wallet_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`kind` text NOT NULL,
	`unit` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`total` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_id` text NOT NULL,
	`state_json` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`category` text NOT NULL,
	`art` text NOT NULL,
	`engine` text,
	`active` integer DEFAULT 1 NOT NULL,
	`base_reward` integer NOT NULL,
	`sort` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journal_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`reason` text NOT NULL,
	`user_id` text,
	`unit` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_transactions_reference_unique` ON `journal_transactions` (`reference`);--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`account_id` text NOT NULL,
	`delta` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`order_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`terms_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_order_id_unique` ON `memberships` (`order_id`);--> statement-breakpoint
CREATE TABLE `bridge_nonces` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`snapshot_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`method` text NOT NULL,
	`request_key` text NOT NULL,
	`external_ref` text,
	`evidence_note` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`settled_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_request_unique` ON `orders` (`user_id`,`request_key`);--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`coins` integer NOT NULL,
	`usd_cents` integer NOT NULL,
	`recipient` text NOT NULL,
	`method` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`request_key` text NOT NULL,
	`approved_by` text,
	`external_ref` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payout_request_unique` ON `payouts` (`user_id`,`request_key`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`tier` text NOT NULL,
	`period` text NOT NULL,
	`price_cents` integer NOT NULL,
	`multiplier_bps` integer NOT NULL,
	`daily_cap` integer NOT NULL,
	`session_cap` integer NOT NULL,
	`perks_json` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reward_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`membership_id` text NOT NULL,
	`coins` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reward_claims_session_id_unique` ON `reward_claims` (`session_id`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`reply` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`country` text DEFAULT 'VN' NOT NULL,
	`banned` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
