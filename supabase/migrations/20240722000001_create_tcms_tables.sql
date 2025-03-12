-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
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

-- Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  preconditions TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('manual', 'automated')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'deprecated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
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
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'aborted')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  environment TEXT
);

-- Create test_executions table
CREATE TABLE IF NOT EXISTS test_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'passed', 'failed', 'blocked', 'skipped')),
  executed_by UUID REFERENCES auth.users(id),
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
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'fixed', 'verified', 'closed', 'reopened')),
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
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
  uploaded_by UUID REFERENCES auth.users(id)
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
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable row level security
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

-- Create basic policies
-- Projects policies
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert projects" ON projects;
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = created_by);

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