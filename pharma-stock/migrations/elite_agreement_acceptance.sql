-- Records that the applicant explicitly accepted the Elite Program Agreement
-- (profit-sharing terms, loss carry-forward, etc.) at the time they applied.
-- agreement_version lets us tell which text a given application was shown,
-- independent of later edits to the agreement content.

ALTER TABLE elite_applications
  ADD COLUMN agreement_accepted_at timestamp with time zone,
  ADD COLUMN agreement_version character varying(20);
