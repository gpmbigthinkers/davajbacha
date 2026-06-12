ALTER TABLE "scenario_responses" ALTER COLUMN "selected_option_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scenario_responses" ADD COLUMN "free_text_answer" text;--> statement-breakpoint
ALTER TABLE "scenario_responses" ADD COLUMN "conversation_log" jsonb;--> statement-breakpoint
ALTER TABLE "scenario_steps" ADD COLUMN "interaction_mode" varchar(24) DEFAULT 'multiple_choice' NOT NULL;--> statement-breakpoint
ALTER TABLE "scenario_steps" ADD COLUMN "chat_config" jsonb;