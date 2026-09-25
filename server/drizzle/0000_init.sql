CREATE TABLE "cohort_monthly" (
	"cohort_hash" text NOT NULL,
	"month" text NOT NULL,
	"item_id" text NOT NULL,
	"appearances" integer NOT NULL,
	"percentile_sum" double precision NOT NULL,
	"top1" integer NOT NULL,
	"top3" integer NOT NULL,
	"top10" integer NOT NULL,
	CONSTRAINT "cohort_monthly_cohort_hash_month_item_id_pk" PRIMARY KEY("cohort_hash","month","item_id")
);
--> statement-breakpoint
CREATE TABLE "cohort_monthly_stats" (
	"cohort_hash" text NOT NULL,
	"month" text NOT NULL,
	"submissions" integer NOT NULL,
	CONSTRAINT "cohort_monthly_stats_cohort_hash_month_pk" PRIMARY KEY("cohort_hash","month")
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"hash" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"mode" text NOT NULL,
	"filter" jsonb NOT NULL,
	"performance_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_salts" (
	"day" text PRIMARY KEY NOT NULL,
	"salt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_monthly" (
	"kind" text NOT NULL,
	"mode" text NOT NULL,
	"month" text NOT NULL,
	"item_id" text NOT NULL,
	"appearances" integer NOT NULL,
	"percentile_sum" double precision NOT NULL,
	"top1" integer NOT NULL,
	"top3" integer NOT NULL,
	"top10" integer NOT NULL,
	CONSTRAINT "item_monthly_kind_mode_month_item_id_pk" PRIMARY KEY("kind","mode","month","item_id")
);
--> statement-breakpoint
CREATE TABLE "monthly_stats" (
	"kind" text NOT NULL,
	"mode" text NOT NULL,
	"month" text NOT NULL,
	"submissions" integer NOT NULL,
	CONSTRAINT "monthly_stats_kind_mode_month_pk" PRIMARY KEY("kind","mode","month")
);
--> statement-breakpoint
CREATE TABLE "query_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"month" text NOT NULL,
	"value" jsonb NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"ip_hash" text NOT NULL,
	"day" text NOT NULL,
	"kind" text NOT NULL,
	"action" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "rate_limits_ip_hash_day_kind_action_pk" PRIMARY KEY("ip_hash","day","kind","action")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"mode" text NOT NULL,
	"filter" jsonb NOT NULL,
	"performance_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"cohort_hash" text,
	"initial_order" text[] NOT NULL,
	"choices" text NOT NULL,
	"ranking" jsonb NOT NULL,
	"ranking_hash" text NOT NULL,
	"item_count" integer NOT NULL,
	"ip_hash" text NOT NULL,
	"delete_token_hash" text NOT NULL,
	"status" text NOT NULL,
	"review_reason" text,
	"agreement" double precision,
	"month" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"ip_hash" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "cohorts_scope_idx" ON "cohorts" USING btree ("kind","mode");--> statement-breakpoint
CREATE INDEX "query_cache_scope_idx" ON "query_cache" USING btree ("kind","month");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_ticket_id_idx" ON "submissions" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "submissions_scope_idx" ON "submissions" USING btree ("kind","mode","status","month");--> statement-breakpoint
CREATE INDEX "submissions_ranking_hash_idx" ON "submissions" USING btree ("ranking_hash","created_at");--> statement-breakpoint
CREATE INDEX "submissions_ip_hash_idx" ON "submissions" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "submissions_agreement_idx" ON "submissions" USING btree ("kind","mode","status","agreement");--> statement-breakpoint
CREATE INDEX "submissions_initial_order_idx" ON "submissions" USING gin ("initial_order");--> statement-breakpoint
CREATE INDEX "tickets_issued_at_idx" ON "tickets" USING btree ("issued_at");