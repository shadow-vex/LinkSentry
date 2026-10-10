
CREATE TABLE IF NOT EXISTS url_scans (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submitted_url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    risk_status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (risk_status IN ('pending', 'low', 'medium', 'high', 'unknown')),
    source VARCHAR(30) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_url_scans_created_at
ON url_scans (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_url_scans_normalized_url
ON url_scans (normalized_url);