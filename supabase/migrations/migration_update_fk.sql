-- Migration script: Update foreign key constraints from auth.users to public.users

-- Projects table: Drop and re-add created_by constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE projects
  ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE NO ACTION;

-- Releases table: Drop and re-add created_by constraint
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_created_by_fkey;
ALTER TABLE releases
  ADD CONSTRAINT releases_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE NO ACTION;

-- Test_Cases table: Drop and re-add created_by and updated_by constraints
ALTER TABLE test_cases DROP CONSTRAINT IF EXISTS test_cases_created_by_fkey;
ALTER TABLE test_cases DROP CONSTRAINT IF EXISTS test_cases_updated_by_fkey;
ALTER TABLE test_cases
  ADD CONSTRAINT test_cases_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE NO ACTION;
ALTER TABLE test_cases
  ADD CONSTRAINT test_cases_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE NO ACTION;

-- Test_Runs table: Drop and re-add created_by constraint
ALTER TABLE test_runs DROP CONSTRAINT IF EXISTS test_runs_created_by_fkey;
ALTER TABLE test_runs
  ADD CONSTRAINT test_runs_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE NO ACTION;

-- Automation_Scripts table: Drop and re-add created_by and updated_by constraints
ALTER TABLE automation_scripts DROP CONSTRAINT IF EXISTS automation_scripts_created_by_fkey;
ALTER TABLE automation_scripts DROP CONSTRAINT IF EXISTS automation_scripts_updated_by_fkey;
ALTER TABLE automation_scripts
  ADD CONSTRAINT automation_scripts_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE NO ACTION;
ALTER TABLE automation_scripts
  ADD CONSTRAINT automation_scripts_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE NO ACTION;

-- User_Roles table: Drop and re-add user_id constraint
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Bugs table: Drop and re-add reported_by and assigned_to constraints
ALTER TABLE bugs DROP CONSTRAINT IF EXISTS bugs_reported_by_fkey;
ALTER TABLE bugs DROP CONSTRAINT IF EXISTS bugs_assigned_to_fkey;
ALTER TABLE bugs
  ADD CONSTRAINT bugs_reported_by_fkey
  FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE NO ACTION;
ALTER TABLE bugs
  ADD CONSTRAINT bugs_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE NO ACTION;

-- Bug_Attachments table: Drop and re-add uploaded_by constraint
ALTER TABLE bug_attachments DROP CONSTRAINT IF EXISTS bug_attachments_uploaded_by_fkey;
ALTER TABLE bug_attachments
  ADD CONSTRAINT bug_attachments_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE NO ACTION;

-- ...existing migration steps if any...
