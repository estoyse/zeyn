CREATE TABLE `active_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`host_id` text NOT NULL,
	`max_players` integer DEFAULT 10 NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`password` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`subject_ids` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_player_results` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`player_name` text NOT NULL,
	`score` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game_history`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_player_results_gameId_idx` ON `game_player_results` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_player_results_userId_idx` ON `game_player_results` (`user_id`);--> statement-breakpoint
ALTER TABLE `game_history` ADD `room_id` text DEFAULT 'unknown' NOT NULL;