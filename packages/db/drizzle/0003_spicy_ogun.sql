ALTER TABLE "audit_logs" ALTER COLUMN "occurred_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "occurred_at" SET DEFAULT now();