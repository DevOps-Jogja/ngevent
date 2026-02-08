ALTER TABLE "events" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_uuid_unique" UNIQUE("uuid");