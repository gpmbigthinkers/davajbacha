CREATE TABLE "bundle_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"bundle_id" integer NOT NULL,
	"scenario_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_bundles" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entry_codes" ADD COLUMN "bundle_id" integer;--> statement-breakpoint
ALTER TABLE "bundle_scenarios" ADD CONSTRAINT "bundle_scenarios_bundle_id_scenario_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."scenario_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_scenarios" ADD CONSTRAINT "bundle_scenarios_scenario_id_scenario_templates_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenario_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_bundles" ADD CONSTRAINT "scenario_bundles_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bundle_scenarios_bundle_scenario_idx" ON "bundle_scenarios" USING btree ("bundle_id","scenario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bundles_name_idx" ON "scenario_bundles" USING btree ("class_id","name");--> statement-breakpoint
ALTER TABLE "entry_codes" ADD CONSTRAINT "entry_codes_bundle_id_scenario_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."scenario_bundles"("id") ON DELETE set null ON UPDATE no action;