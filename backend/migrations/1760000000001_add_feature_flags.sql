-- Up Migration
CREATE TABLE settings (
  key       varchar(50) PRIMARY KEY,
  value     jsonb NOT NULL DEFAULT 'true',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
  ('dish_weight_enabled', 'true'),
  ('place_weight_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Down Migration
-- DROP TABLE settings;
