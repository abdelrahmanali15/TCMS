-- Create releases table if it doesn't exist
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add release_id to test_runs table if it doesn't exist
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS release_id UUID REFERENCES releases(id);

-- Add actual_result to bugs table if it doesn't exist
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS actual_result TEXT;

-- Add release_id to bugs table if it doesn't exist
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS release_id UUID REFERENCES releases(id);

-- Add category to test_cases table if it doesn't exist
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS category VARCHAR;

-- Add attachments to test_cases table if it doesn't exist
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS attachments TEXT;

-- Enable RLS for releases table
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Create policies for releases table
DROP POLICY IF EXISTS "Public read access for releases" ON releases;
CREATE POLICY "Public read access for releases"
  ON releases FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auth users can create releases" ON releases;
CREATE POLICY "Auth users can create releases"
  ON releases FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth users can update their own releases" ON releases;
CREATE POLICY "Auth users can update their own releases"
  ON releases FOR UPDATE
  USING (auth.uid() = created_by);

-- Add realtime for releases
alter publication supabase_realtime add table releases;

-- Insert some initial releases if none exist
INSERT INTO releases (name, description)
SELECT 'v1.0.0 - July Release', 'Initial production release'
WHERE NOT EXISTS (SELECT 1 FROM releases LIMIT 1);

INSERT INTO releases (name, description)
SELECT 'v0.9.5 - June Beta', 'Beta release with feature freeze'
WHERE NOT EXISTS (SELECT 1 FROM releases WHERE name = 'v0.9.5 - June Beta');

INSERT INTO releases (name, description)
SELECT 'v0.9.0 - May Alpha', 'Alpha release for early testing'
WHERE NOT EXISTS (SELECT 1 FROM releases WHERE name = 'v0.9.0 - May Alpha');
