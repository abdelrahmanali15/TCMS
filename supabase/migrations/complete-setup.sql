-- Complete TCMS Database Setup

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (from initial-setup.sql)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY NOT NULL,
    avatar_url text,
    user_id text UNIQUE,
    token_identifier text NOT NULL,
    subscription text,
    credits text,
    image text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    email text,
    name text,
    full_name text
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create features table
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create releases table
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  preconditions TEXT,
  category VARCHAR,
  attachments TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('manual', 'automated')) DEFAULT 'manual',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'deprecated')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Create test_steps table
CREATE TABLE IF NOT EXISTS test_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_runs table
CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  release_id UUID REFERENCES releases(id),
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'aborted')) DEFAULT 'planned',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  environment TEXT
);

-- Create test_executions table
CREATE TABLE IF NOT EXISTS test_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'passed', 'failed', 'blocked', 'skipped')),
  executed_by UUID REFERENCES public.users(id),
  executed_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  notes TEXT
);

-- Create test_step_results table
CREATE TABLE IF NOT EXISTS test_step_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_execution_id UUID NOT NULL REFERENCES test_executions(id) ON DELETE CASCADE,
  test_step_id UUID NOT NULL REFERENCES test_steps(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'blocked', 'skipped')),
  actual_result TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bugs table
CREATE TABLE IF NOT EXISTS bugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_execution_id UUID REFERENCES test_executions(id),
  release_id UUID REFERENCES releases(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actual_result TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'fixed', 'verified', 'closed', 'reopened')) DEFAULT 'open',
  reported_by UUID REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bug_attachments table
CREATE TABLE IF NOT EXISTS bug_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_id UUID NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id)
);

-- Create automation_scripts table
CREATE TABLE IF NOT EXISTS automation_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  script_type TEXT NOT NULL CHECK (script_type IN ('python', 'tcl', 'perl', 'shell')),
  script_path TEXT NOT NULL,
  parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tester', 'automation_engineer', 'developer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_case_tags junction table
CREATE TABLE IF NOT EXISTS test_case_tags (
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (test_case_id, tag_id)
);

-- Fix foreign key constraints by making them nullable
ALTER TABLE test_runs ALTER COLUMN release_id DROP NOT NULL;
ALTER TABLE bugs ALTER COLUMN test_execution_id DROP NOT NULL;
ALTER TABLE bugs ALTER COLUMN release_id DROP NOT NULL;

-- Disable foreign key constraints for created_by in projects and releases tables
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_created_by_fkey;

-- Enable row level security for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_step_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_case_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables to allow all operations
-- Users policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = user_id);

-- Projects policies
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);

-- Modules
DROP POLICY IF EXISTS "Allow all operations on modules" ON modules;
CREATE POLICY "Allow all operations on modules" ON modules FOR ALL USING (true);

-- Features
DROP POLICY IF EXISTS "Allow all operations on features" ON features;
CREATE POLICY "Allow all operations on features" ON features FOR ALL USING (true);

-- Test Cases
DROP POLICY IF EXISTS "Allow all operations on test_cases" ON test_cases;
CREATE POLICY "Allow all operations on test_cases" ON test_cases FOR ALL USING (true);

-- Test Steps
DROP POLICY IF EXISTS "Allow all operations on test_steps" ON test_steps;
CREATE POLICY "Allow all operations on test_steps" ON test_steps FOR ALL USING (true);

-- Test Runs
DROP POLICY IF EXISTS "Allow all operations on test_runs" ON test_runs;
CREATE POLICY "Allow all operations on test_runs" ON test_runs FOR ALL USING (true);

-- Test Executions
DROP POLICY IF EXISTS "Allow all operations on test_executions" ON test_executions;
CREATE POLICY "Allow all operations on test_executions" ON test_executions FOR ALL USING (true);

-- Test Step Results
DROP POLICY IF EXISTS "Allow all operations on test_step_results" ON test_step_results;
CREATE POLICY "Allow all operations on test_step_results" ON test_step_results FOR ALL USING (true);

-- Bugs
DROP POLICY IF EXISTS "Allow all operations on bugs" ON bugs;
CREATE POLICY "Allow all operations on bugs" ON bugs FOR ALL USING (true);

-- Bug Attachments
DROP POLICY IF EXISTS "Allow all operations on bug_attachments" ON bug_attachments;
CREATE POLICY "Allow all operations on bug_attachments" ON bug_attachments FOR ALL USING (true);

-- Tags
DROP POLICY IF EXISTS "Allow all operations on tags" ON tags;
CREATE POLICY "Allow all operations on tags" ON tags FOR ALL USING (true);

-- Test Case Tags
DROP POLICY IF EXISTS "Allow all operations on test_case_tags" ON test_case_tags;
CREATE POLICY "Allow all operations on test_case_tags" ON test_case_tags FOR ALL USING (true);

-- User Roles
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON user_roles;
CREATE POLICY "Allow all operations on user_roles" ON user_roles FOR ALL USING (true);

-- Releases
DROP POLICY IF EXISTS "Allow all operations on releases" ON releases;
CREATE POLICY "Allow all operations on releases" ON releases FOR ALL USING (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE modules;
ALTER PUBLICATION supabase_realtime ADD TABLE features;
ALTER PUBLICATION supabase_realtime ADD TABLE test_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE test_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE test_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE test_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE test_step_results;
ALTER PUBLICATION supabase_realtime ADD TABLE bugs;
ALTER PUBLICATION supabase_realtime ADD TABLE bug_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE automation_scripts;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE tags;
ALTER PUBLICATION supabase_realtime ADD TABLE test_case_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE releases;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    full_name,
    avatar_url,
    token_identifier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create default data
DO $$
BEGIN
  -- Create default project if none exists
  INSERT INTO projects (id, name, description)
  SELECT 'default-project', 'Default Project', 'Default project for test cases'
  WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);

  -- Create default module if none exists
  INSERT INTO modules (id, name, description, project_id)
  SELECT 'default-module', 'Default Module', 'Default module for test cases', 'default-project'
  WHERE NOT EXISTS (SELECT 1 FROM modules LIMIT 1);

  -- Create default feature if none exists
  INSERT INTO features (id, name, description, module_id)
  SELECT 'default-feature', 'Default Feature', 'Default feature for test cases', 'default-module'
  WHERE NOT EXISTS (SELECT 1 FROM features LIMIT 1);

  -- Create default release if none exists
  INSERT INTO releases (name, description)
  SELECT 'v1.0.0 - Initial Release', 'Initial release for testing'
  WHERE NOT EXISTS (SELECT 1 FROM releases LIMIT 1);

  -- Create additional releases for testing
  INSERT INTO releases (name, description)
  SELECT 'v0.9.5 - June Beta', 'Beta release with feature freeze'
  WHERE NOT EXISTS (SELECT 1 FROM releases WHERE name = 'v0.9.5 - June Beta');

  INSERT INTO releases (name, description)
  SELECT 'v0.9.0 - May Alpha', 'Alpha release for early testing'
  WHERE NOT EXISTS (SELECT 1 FROM releases WHERE name = 'v0.9.0 - May Alpha');

  -- Create a default test run if none exists
  INSERT INTO test_runs (name, status)
  SELECT 'Default Test Run', 'in_progress'
  WHERE NOT EXISTS (SELECT 1 FROM test_runs LIMIT 1);

  -- Create a test run for each release if none exists
  INSERT INTO test_runs (name, status, release_id)
  SELECT 'Initial Test Run - ' || r.name, 'in_progress', r.id
  FROM releases r
  WHERE NOT EXISTS (
    SELECT 1 FROM test_runs tr WHERE tr.release_id = r.id
  );
END
$$;

-- Fix any existing NULL values in required fields
UPDATE test_cases SET feature_id = (SELECT id FROM features LIMIT 1) WHERE feature_id IS NULL;
UPDATE test_cases SET title = 'Untitled Test Case' WHERE title IS NULL;
UPDATE test_runs SET name = 'Untitled Test Run' WHERE name IS NULL;
UPDATE bugs SET title = 'Untitled Bug' WHERE title IS NULL;
UPDATE bugs SET description = 'No description provided' WHERE description IS NULL;
