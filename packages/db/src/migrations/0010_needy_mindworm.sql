ALTER TABLE `user` ADD `username` text;--> statement-breakpoint
ALTER TABLE `user` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `user` ADD `is_profile_public` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `show_stats` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `show_history` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `show_hosted_games` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);