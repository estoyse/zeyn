PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_game_question_results` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`subject_name` text DEFAULT '' NOT NULL,
	`subject_position` integer DEFAULT 0 NOT NULL,
	`question_position` integer DEFAULT 0 NOT NULL,
	`correct` integer NOT NULL,
	`points_awarded` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game_history`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_game_question_results`("id", "game_id", "user_id", "question_id", "subject_name", "subject_position", "question_position", "correct", "points_awarded") SELECT "id", "game_id", "user_id", "question_id", "subject_name", "subject_position", "question_position", "correct", "points_awarded" FROM `game_question_results`;--> statement-breakpoint
DROP TABLE `game_question_results`;--> statement-breakpoint
ALTER TABLE `__new_game_question_results` RENAME TO `game_question_results`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `game_question_results_gameId_idx` ON `game_question_results` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_question_results_userId_idx` ON `game_question_results` (`user_id`);--> statement-breakpoint
ALTER TABLE `game_history` ADD `subjects` text DEFAULT '[]' NOT NULL;