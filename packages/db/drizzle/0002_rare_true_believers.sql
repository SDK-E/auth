CREATE TABLE "authorization_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"environment_id" text NOT NULL,
	"application_id" text NOT NULL,
	"user_id" text,
	"session_id" text,
	"redirect_uri" text NOT NULL,
	"scope" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"nonce" text,
	"code_challenge" text NOT NULL,
	"code_challenge_method" text DEFAULT 'S256' NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "authorization_codes" ADD CONSTRAINT "authorization_codes_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorization_codes" ADD CONSTRAINT "authorization_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorization_codes" ADD CONSTRAINT "authorization_codes_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "authorization_codes_hash_idx" ON "authorization_codes" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "authorization_codes_env_user_idx" ON "authorization_codes" USING btree ("environment_id","user_id");