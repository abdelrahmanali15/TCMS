-- Enable RLS for all tables
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
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_case_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables to allow all operations
-- Projects
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
ALTER PUBLICATION supabase_realtime ADD TABLE tags;
ALTER PUBLICATION supabase_realtime ADD TABLE test_case_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE releases;
