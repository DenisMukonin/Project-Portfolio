CREATE INDEX "view_events_portfolio_id_idx" ON "view_events" USING btree ("portfolio_id");--> statement-breakpoint
CREATE INDEX "view_events_viewed_at_idx" ON "view_events" USING btree ("viewed_at");