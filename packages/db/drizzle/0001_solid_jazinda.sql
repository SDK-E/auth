ALTER TYPE "public"."verification_purpose" ADD VALUE 'authorization_code';--> statement-breakpoint
CREATE TABLE "signing_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"environment_id" text NOT NULL,
	"kid" text NOT NULL,
	"algorithm" text DEFAULT 'RS256' NOT NULL,
	"public_jwk" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"encrypted_private_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"rotated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "signing_keys" ADD CONSTRAINT "signing_keys_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "signing_keys_kid_idx" ON "signing_keys" USING btree ("kid");--> statement-breakpoint
CREATE INDEX "signing_keys_env_status_idx" ON "signing_keys" USING btree ("environment_id","status");