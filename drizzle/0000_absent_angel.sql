CREATE TABLE `briefings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`ciphertext` text NOT NULL,
	`iv` text NOT NULL,
	`ip_hash` text NOT NULL,
	`consent_version` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_briefings_created` ON `briefings` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_briefings_ip_created` ON `briefings` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_briefings_expiry` ON `briefings` (`expires_at`);