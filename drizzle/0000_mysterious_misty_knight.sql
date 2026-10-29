CREATE TABLE "shared_analyses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(160) NOT NULL,
	"dataset_name" varchar(160) NOT NULL,
	"source" varchar(300) NOT NULL,
	"reporting_period" varchar(100) NOT NULL,
	"question" varchar(800),
	"summary" text NOT NULL,
	"evidence" jsonb NOT NULL,
	"limitations" jsonb NOT NULL,
	"owner_token_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shared_analyses_expires_at_idx" ON "shared_analyses" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "shared_analyses_created_at_idx" ON "shared_analyses" USING btree ("created_at");