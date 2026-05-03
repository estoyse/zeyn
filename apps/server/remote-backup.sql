PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES('00001','0000_long_justin_hammer.sql','2026-05-02 06:24:56');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES('00002','0001_lumpy_plazm.sql','2026-05-02 10:08:08');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES('00003','0002_clammy_alice.sql','2026-05-03 08:32:25');
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "account" ("id","account_id","provider_id","user_id","access_token","refresh_token","id_token","access_token_expires_at","refresh_token_expires_at","scope","password","created_at","updated_at") VALUES('OrA1ahMLom9vaonbDshlG4CEsqxmbpBX','j0ICG793TZJDsJL3rfM1NU4XpZNpeB1Z','credential','j0ICG793TZJDsJL3rfM1NU4XpZNpeB1Z',NULL,NULL,NULL,NULL,NULL,NULL,'$argon2id$v=19$m=65536,t=3,p=4$7ldAXrxIUClbWhbfe7sAbw$o4w5kCeOOKvBW1F6c/x6Fi4UOXbACd0KKce/7x22gvM',1777704364194,1777704364194);
INSERT INTO "account" ("id","account_id","provider_id","user_id","access_token","refresh_token","id_token","access_token_expires_at","refresh_token_expires_at","scope","password","created_at","updated_at") VALUES('2ONa18K77VRINnqDKjMuoRXOnLbiDxYe','TbnMReh5HNsPbPKGIQCv4JNgZISFyZDj','credential','TbnMReh5HNsPbPKGIQCv4JNgZISFyZDj',NULL,NULL,NULL,NULL,NULL,NULL,'$argon2id$v=19$m=65536,t=3,p=4$d92HQ8z5/l9/JR9rG4txAA$CjUxGPryduN5mitUQ2k6Eb6ePgLtgl30B8Q5oMbTtqs',1777818535689,1777818535689);
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "session" ("id","expires_at","token","created_at","updated_at","ip_address","user_agent","user_id") VALUES('hnu6L9ZoyNDp9WVKgAaiFBEqTRTIGz9j',1778310528617,'mPOUMTCh6tE7lL1Zk5T1Uj5jkZAavfbA',1777705728617,1777705728617,'','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','j0ICG793TZJDsJL3rfM1NU4XpZNpeB1Z');
INSERT INTO "session" ("id","expires_at","token","created_at","updated_at","ip_address","user_agent","user_id") VALUES('hjG7SjnaA2aUPAOkP8NmaDl6eAhAdEv8',1778310537131,'7zxNnfd6N2iA2V2F9vj1k2evgs3ZILOE',1777705737131,1777705737131,'','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','j0ICG793TZJDsJL3rfM1NU4XpZNpeB1Z');
INSERT INTO "session" ("id","expires_at","token","created_at","updated_at","ip_address","user_agent","user_id") VALUES('487JINzuLYQNOHU0uzAubVTKScVeWVRc',1778402007052,'O2sDrWtrHcJrMqezoBbazlbQZg7hSJgr',1777797207052,1777797207052,'','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','j0ICG793TZJDsJL3rfM1NU4XpZNpeB1Z');
INSERT INTO "session" ("id","expires_at","token","created_at","updated_at","ip_address","user_agent","user_id") VALUES('6iBHh08CaY63xcsMh05dO7DOxCszJvWL',1778423335731,'lp4JsXqYvqXsWn9xbNZBcdweSGJZxW4G',1777818535731,1777818535731,'','Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0','TbnMReh5HNsPbPKGIQCv4JNgZISFyZDj');
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
INSERT INTO "user" ("id","name","email","email_verified","image","created_at","updated_at") VALUES('j0ICG793TZJDsJL3rfM1NU4XpZNpeB1Z','izzatillo','me.izzatillo@gmail.com',0,NULL,1777704364143,1777704364143);
INSERT INTO "user" ("id","name","email","email_verified","image","created_at","updated_at") VALUES('TbnMReh5HNsPbPKGIQCv4JNgZISFyZDj','vali vali','azimov@azimov.com',0,NULL,1777818535646,1777818535646);
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
CREATE TABLE `game_history` (
	`id` text PRIMARY KEY NOT NULL,
	`host_id` text NOT NULL,
	`created_at` integer NOT NULL, `room_id` text DEFAULT 'unknown' NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
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
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`text` text NOT NULL,
	`answer` text NOT NULL,
	`points` integer NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q1_10','s1','What is the chemical symbol for water?','H2O',10);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q1_20','s1','Which planet is known as the Red Planet?','Mars',20);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q1_30','s1','What is the hardest natural substance on Earth?','Diamond',30);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q1_40','s1','What is the speed of light in a vacuum (approx km/s)?','300000',40);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q1_50','s1','What is the most abundant gas in Earth''s atmosphere?','Nitrogen',50);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q2_10','s2','Who was the first President of the United States?','George Washington',10);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q2_20','s2','In which year did the Titanic sink?','1912',20);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q2_30','s2','Which empire was ruled by Julius Caesar?','Roman Empire',30);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q2_40','s2','Who was the primary author of the Declaration of Independence?','Thomas Jefferson',40);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q2_50','s2','What was the name of the first artificial satellite launched into space?','Sputnik 1',50);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q3_10','s3','What is the largest continent on Earth?','Asia',10);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q3_20','s3','Which river is the longest in the world?','Nile',20);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q3_30','s3','What is the capital city of France?','Paris',30);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q3_40','s3','Which mountain is the highest in the world?','Mount Everest',40);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q3_50','s3','What is the smallest country in the world by land area?','Vatican City',50);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q4_10','s4','Who played Iron Man in the Marvel Cinematic Universe?','Robert Downey Jr',10);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q4_20','s4','What was the first feature-length animated movie ever released?','Snow White',20);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q4_30','s4','Which movie features the line "I''m gonna make him an offer he can''t refuse"?','The Godfather',30);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q4_40','s4','Who directed the 1994 film "Pulp Fiction"?','Quentin Tarantino',40);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q4_50','s4','Which movie holds the record for the highest box office gross of all time?','Avatar',50);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q5_10','s5','How many players are on a standard soccer team on the field?','11',10);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q5_20','s5','In which sport would you perform a "slam dunk"?','Basketball',20);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q5_30','s5','Who has won the most Olympic gold medals of all time?','Michael Phelps',30);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q5_40','s5','Which country has won the most FIFA World Cups?','Brazil',40);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q5_50','s5','What is the distance of a standard marathon in kilometers?','42.195',50);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q6_10','s6','Who is known as the "King of Pop"?','Michael Jackson',10);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q6_20','s6','Which legendary British band featured John Lennon and Paul McCartney?','The Beatles',20);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q6_30','s6','What is the most streamed song on Spotify as of 2024?','Blinding Lights',30);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q6_40','s6','Which female artist is known as the "Queen of Soul"?','Aretha Franklin',40);
INSERT INTO "questions" ("id","subject_id","text","answer","points") VALUES('q6_50','s6','What is the term for a musical composition for four voices or instruments?','Quartet',50);
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
INSERT INTO "subjects" ("id","name") VALUES('s1','Science');
INSERT INTO "subjects" ("id","name") VALUES('s2','History');
INSERT INTO "subjects" ("id","name") VALUES('s3','Geography');
INSERT INTO "subjects" ("id","name") VALUES('s4','Movies');
INSERT INTO "subjects" ("id","name") VALUES('s5','Sports');
INSERT INTO "subjects" ("id","name") VALUES('s6','Music');
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
CREATE TABLE `game_player_results` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`player_name` text NOT NULL,
	`score` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game_history`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
CREATE INDEX `game_question_results_gameId_idx` ON `game_question_results` (`game_id`);
CREATE INDEX `game_question_results_userId_idx` ON `game_question_results` (`user_id`);
CREATE INDEX `game_player_results_gameId_idx` ON `game_player_results` (`game_id`);
CREATE INDEX `game_player_results_userId_idx` ON `game_player_results` (`user_id`);
