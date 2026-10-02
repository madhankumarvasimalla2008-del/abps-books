UPDATE "auth_users" SET "email" = NULL WHERE "email" LIKE '%@phone.abps.internal';--> statement-breakpoint
ALTER TABLE "auth_users" DROP CONSTRAINT "auth_users_email_unique";--> statement-breakpoint
DROP INDEX "idx_auth_users_phone";--> statement-breakpoint
ALTER TABLE "auth_users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_auth_users_active_email" ON "auth_users" USING btree ("email") WHERE "email" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_auth_users_active_phone" ON "auth_users" USING btree ("phone") WHERE "phone" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "auth_users" ADD CONSTRAINT "chk_auth_users_identity_handle" CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL);