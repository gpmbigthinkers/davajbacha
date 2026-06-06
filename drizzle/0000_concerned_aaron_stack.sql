CREATE TABLE "anon_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" integer,
	"session_token" varchar(96) NOT NULL,
	"presentation_mode" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anon_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"name" varchar(80) NOT NULL,
	"cohort" varchar(40) NOT NULL,
	"pilot_week" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "footprint_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"public_name" varchar(120) NOT NULL,
	"selected_signals" jsonb NOT NULL,
	"risk_score" integer NOT NULL,
	"derived_risks" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"scenario_id" integer NOT NULL,
	"mode" varchar(24) DEFAULT 'demo' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scenario_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"step_id" integer NOT NULL,
	"selected_option_id" varchar(96) NOT NULL,
	"is_safe" boolean NOT NULL,
	"risk_delta" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"step_key" varchar(96) NOT NULL,
	"order" integer NOT NULL,
	"situation" text NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(96) NOT NULL,
	"title" varchar(160) NOT NULL,
	"threat_category" varchar(40) NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"region" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anon_sessions" ADD CONSTRAINT "anon_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "footprint_profiles" ADD CONSTRAINT "footprint_profiles_session_id_anon_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."anon_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_attempts" ADD CONSTRAINT "scenario_attempts_session_id_anon_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."anon_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_attempts" ADD CONSTRAINT "scenario_attempts_scenario_id_scenario_templates_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenario_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_responses" ADD CONSTRAINT "scenario_responses_attempt_id_scenario_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."scenario_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_responses" ADD CONSTRAINT "scenario_responses_step_id_scenario_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."scenario_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_steps" ADD CONSTRAINT "scenario_steps_scenario_id_scenario_templates_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenario_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "classes_school_name_idx" ON "classes" USING btree ("school_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "scenario_steps_scenario_step_idx" ON "scenario_steps" USING btree ("scenario_id","step_key");--> statement-breakpoint
CREATE UNIQUE INDEX "schools_name_idx" ON "schools" USING btree ("name");