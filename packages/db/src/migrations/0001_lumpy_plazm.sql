CREATE TABLE `game_history` (
	`id` text PRIMARY KEY NOT NULL,
	`host_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_question_results` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`correct` integer NOT NULL,
	`points_awarded` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game_history`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_question_results_gameId_idx` ON `game_question_results` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_question_results_userId_idx` ON `game_question_results` (`user_id`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`text` text NOT NULL,
	`answer` text NOT NULL,
	`points` integer NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
