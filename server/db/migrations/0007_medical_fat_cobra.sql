CREATE TABLE "view_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"referrer" text
);
--> statement-breakpoint
ALTER TABLE "view_events" ADD CONSTRAINT "view_events_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;