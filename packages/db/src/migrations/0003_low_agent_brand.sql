ALTER TABLE `active_rooms` RENAME TO `games`;--> statement-breakpoint
DROP TABLE `game_history`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`host_id` text NOT NULL,
	`max_players` integer DEFAULT 10 NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`password` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`subject_ids` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`host_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "name", "host_id", "max_players", "is_public", "password", "status", "subject_ids", "created_at", "updated_at") SELECT "id", "name", "host_id", "max_players", "is_public", "password", "status", "subject_ids", "created_at", "updated_at" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_game_player_results` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`player_name` text NOT NULL,
	`score` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_game_player_results`("id", "game_id", "user_id", "player_name", "score") SELECT "id", "game_id", "user_id", "player_name", "score" FROM `game_player_results`;--> statement-breakpoint
DROP TABLE `game_player_results`;--> statement-breakpoint
ALTER TABLE `__new_game_player_results` RENAME TO `game_player_results`;--> statement-breakpoint
CREATE INDEX `game_player_results_gameId_idx` ON `game_player_results` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_player_results_userId_idx` ON `game_player_results` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_game_question_results` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`correct` integer NOT NULL,
	`points_awarded` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_game_question_results`("id", "game_id", "user_id", "question_id", "correct", "points_awarded") SELECT "id", "game_id", "user_id", "question_id", "correct", "points_awarded" FROM `game_question_results`;--> statement-breakpoint
DROP TABLE `game_question_results`;--> statement-breakpoint
ALTER TABLE `__new_game_question_results` RENAME TO `game_question_results`;--> statement-breakpoint
CREATE INDEX `game_question_results_gameId_idx` ON `game_question_results` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_question_results_userId_idx` ON `game_question_results` (`user_id`);