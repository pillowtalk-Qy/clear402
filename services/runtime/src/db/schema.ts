export const runtimeSchemaVersion = 1;

export const runtimeSchemaSql = String.raw`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  user_prompt TEXT NOT NULL,
  budget_usd TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'blocked', 'complete', 'failed')),
  caw_wallet_uuid TEXT NOT NULL,
  caw_wallet_address TEXT,
  pact_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_registry (
  provider_id TEXT PRIMARY KEY,
  origin TEXT NOT NULL UNIQUE,
  merchant_address TEXT NOT NULL,
  facilitator_url TEXT,
  chain_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  allowed_resources TEXT NOT NULL DEFAULT '[]',
  caw_allowlist_status TEXT NOT NULL CHECK (caw_allowlist_status IN ('allowed', 'pending', 'blocked')),
  erc8004_agent_id TEXT,
  erc8004_agent_uri TEXT,
  reputation_threshold TEXT,
  validation_tags TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS x402_quotes (
  quote_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES provider_registry(provider_id) ON DELETE RESTRICT,
  resource_url TEXT NOT NULL,
  amount_usd TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'reserved', 'accepted', 'expired', 'spent', 'cancelled')),
  raw_challenge_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE VIEW IF NOT EXISTS quotes AS
  SELECT
    quote_id,
    mission_id,
    provider_id,
    resource_url,
    amount_usd,
    status,
    raw_challenge_hash,
    created_at,
    expires_at
  FROM x402_quotes;

CREATE TABLE IF NOT EXISTS payment_contexts (
  payment_context_hash TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES provider_registry(provider_id) ON DELETE RESTRICT,
  quote_id TEXT NOT NULL REFERENCES x402_quotes(quote_id) ON DELETE RESTRICT,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST')),
  origin TEXT NOT NULL,
  resource_path TEXT NOT NULL,
  canonical_url_hash TEXT NOT NULL,
  body_hash TEXT NOT NULL,
  sanitized_resource_hash TEXT NOT NULL,
  merchant_address TEXT NOT NULL,
  facilitator_url_hash TEXT,
  chain_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  amount TEXT NOT NULL,
  amount_decimals INTEGER NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  quote_terms_hash TEXT NOT NULL,
  pii_policy_hash TEXT NOT NULL,
  clear_sign_digest TEXT,
  caw_pact_id TEXT NOT NULL,
  service_mode TEXT NOT NULL CHECK (service_mode IN ('caw-fetch', 'direct-transfer', 'escrowed-delivery')),
  raw_context_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quote_reservations (
  quote_id TEXT PRIMARY KEY REFERENCES x402_quotes(quote_id) ON DELETE CASCADE,
  payment_context_hash TEXT NOT NULL UNIQUE REFERENCES payment_contexts(payment_context_hash) ON DELETE CASCADE,
  nonce TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'spent', 'released', 'disputed', 'refunded')),
  reserved_budget TEXT NOT NULL,
  reserved_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS budget_ledger (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  amount_usd TEXT NOT NULL,
  balance_after_usd TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'posted', 'void')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  payment_context_hash TEXT NOT NULL UNIQUE REFERENCES payment_contexts(payment_context_hash) ON DELETE CASCADE,
  caw_request_id TEXT UNIQUE,
  caw_wallet_address TEXT NOT NULL,
  pact_id TEXT NOT NULL,
  provider_address TEXT NOT NULL,
  facilitator_url_hash TEXT,
  tx_hash TEXT,
  chain_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  amount TEXT NOT NULL,
  provider_response_hash TEXT NOT NULL,
  provider_signature TEXT NOT NULL,
  response_schema_hash TEXT,
  delivery_timestamp INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'delivered', 'failed', 'refundable', 'refunded', 'paid_but_not_delivered')),
  clearsig_digest TEXT,
  audit_log_ids TEXT NOT NULL,
  redaction_summary_hash TEXT,
  evidence_mode TEXT NOT NULL CHECK (evidence_mode IN ('live', 'fallback', 'mock')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS guard_events (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  layer TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'block', 'require_approval', 'fallback_required')),
  reason TEXT,
  evidence_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_guard_events_mission_id ON guard_events(mission_id);
CREATE INDEX IF NOT EXISTS idx_receipts_mission_id ON receipts(mission_id);
`;
