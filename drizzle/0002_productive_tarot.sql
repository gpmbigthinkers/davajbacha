CREATE TABLE "entry_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"code" varchar(8) NOT NULL,
	"qr_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "entry_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "entry_codes_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
ALTER TABLE "entry_codes" ADD CONSTRAINT "entry_codes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entry_codes_code_idx" ON "entry_codes" USING btree ("code");