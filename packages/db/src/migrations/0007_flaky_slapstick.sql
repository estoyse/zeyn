ALTER TABLE `active_games` ADD `game_type` text DEFAULT 'buzzer' NOT NULL;--> statement-breakpoint
ALTER TABLE `active_games` ADD `config` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
UPDATE `active_games` SET `config` = json_object('subjectIds', json(`subject_ids`)) WHERE `subject_ids` IS NOT NULL AND `subject_ids` != '';--> statement-breakpoint
ALTER TABLE `game_history` ADD `game_type` text DEFAULT 'buzzer' NOT NULL;