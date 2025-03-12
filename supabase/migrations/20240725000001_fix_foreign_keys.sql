-- Fix foreign key constraints by making them nullable
ALTER TABLE test_runs ALTER COLUMN release_id DROP NOT NULL;
ALTER TABLE bugs ALTER COLUMN release_id DROP NOT NULL;
ALTER TABLE bugs ALTER COLUMN test_execution_id DROP NOT NULL;

-- Add default values for status fields
ALTER TABLE test_cases ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE test_runs ALTER COLUMN status SET DEFAULT 'planned';
ALTER TABLE bugs ALTER COLUMN status SET DEFAULT 'open';

-- Add default values for priority fields
ALTER TABLE test_cases ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE bugs ALTER COLUMN severity SET DEFAULT 'medium';

-- Add default value for test_type
ALTER TABLE test_cases ALTER COLUMN test_type SET DEFAULT 'manual';

-- Create a test run for each release if none exists
INSERT INTO test_runs (name, status, release_id)
SELECT 'Initial Test Run - ' || r.name, 'in_progress', r.id
FROM releases r
WHERE NOT EXISTS (
  SELECT 1 FROM test_runs tr WHERE tr.release_id = r.id
);

-- Create a default test run if none exists
INSERT INTO test_runs (name, status)
SELECT 'Default Test Run', 'in_progress'
WHERE NOT EXISTS (
  SELECT 1 FROM test_runs LIMIT 1
);
