-- Make feature_id nullable in test_cases
ALTER TABLE test_cases ALTER COLUMN feature_id DROP NOT NULL;

-- Make test_case_id nullable in test_steps
ALTER TABLE test_steps ALTER COLUMN test_case_id DROP NOT NULL;

-- Make test_run_id and test_case_id nullable in test_executions
ALTER TABLE test_executions ALTER COLUMN test_run_id DROP NOT NULL;
ALTER TABLE test_executions ALTER COLUMN test_case_id DROP NOT NULL;

-- Add default values for required fields
ALTER TABLE test_cases ALTER COLUMN title SET DEFAULT 'Untitled Test Case';
ALTER TABLE test_runs ALTER COLUMN name SET DEFAULT 'Untitled Test Run';
ALTER TABLE bugs ALTER COLUMN title SET DEFAULT 'Untitled Bug';
ALTER TABLE bugs ALTER COLUMN description SET DEFAULT 'No description provided';

-- Create a default feature if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM features LIMIT 1) THEN
    INSERT INTO projects (id, name) VALUES ('default-project', 'Default Project');
    INSERT INTO modules (id, name, project_id) VALUES ('default-module', 'Default Module', 'default-project');
    INSERT INTO features (id, name, module_id) VALUES ('default-feature', 'Default Feature', 'default-module');
  END IF;
END
$$;

-- Fix any existing NULL values in required fields
UPDATE test_cases SET feature_id = (SELECT id FROM features LIMIT 1) WHERE feature_id IS NULL;
UPDATE test_cases SET title = 'Untitled Test Case' WHERE title IS NULL;
UPDATE test_runs SET name = 'Untitled Test Run' WHERE name IS NULL;
UPDATE bugs SET title = 'Untitled Bug' WHERE title IS NULL;
UPDATE bugs SET description = 'No description provided' WHERE description IS NULL;
