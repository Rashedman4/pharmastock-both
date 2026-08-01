-- Loss carry-forward for Elite firm-profit-share fee calculation.
-- Fresh start: every portfolio begins at a $0 carried loss balance as of this
-- migration. Historical position_closures_simple / firm_profit_payments rows
-- are left untouched.

ALTER TABLE elite_portfolios_simple
  ADD COLUMN unrecovered_loss_balance numeric(18,2) NOT NULL DEFAULT 0
  CONSTRAINT elite_portfolios_simple_unrecovered_loss_balance_check
  CHECK (unrecovered_loss_balance >= 0);

ALTER TABLE position_closures_simple
  ADD COLUMN loss_offset_applied numeric(18,2) NOT NULL DEFAULT 0
  CONSTRAINT position_closures_simple_loss_offset_applied_check
  CHECK (loss_offset_applied >= 0),
  ADD COLUMN portfolio_loss_balance_after numeric(18,2) NOT NULL DEFAULT 0
  CONSTRAINT position_closures_simple_loss_balance_after_check
  CHECK (portfolio_loss_balance_after >= 0);

COMMENT ON COLUMN elite_portfolios_simple.unrecovered_loss_balance IS
  'Running carried-forward loss for this portfolio. Increases when a trade closes at a loss; decreases when a later profitable trade offsets it before the firm/partner fee is calculated. Reset to 0 whenever the member fully settles all outstanding firm-profit dues.';
COMMENT ON COLUMN position_closures_simple.loss_offset_applied IS
  'How much of this trade''s realized profit was absorbed paying down a prior carried loss, before the firm/partner fee was calculated on the remainder.';
COMMENT ON COLUMN position_closures_simple.portfolio_loss_balance_after IS
  'Snapshot of the portfolio''s unrecovered_loss_balance immediately after this closure was recorded, for audit/debugging.';
