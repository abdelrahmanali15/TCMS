-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Automation scripts table
CREATE TABLE automation_scripts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    test_case_id uuid NOT NULL,
    name text NOT NULL,
    script_type text NOT NULL CHECK (script_type IN ('python', 'tcl', 'perl', 'shell')),
    script_path text NOT NULL,
    parameters jsonb,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    created_by uuid,
    updated_by uuid
);

-- Bug attachments table
CREATE TABLE bug_attachments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    bug_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    uploaded_at timestamp with time zone DEFAULT NOW(),
    uploaded_by uuid
);

-- Bugs table
CREATE TABLE bugs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    test_execution_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status text NOT NULL CHECK (status IN ('open', 'in_progress', 'fixed', 'verified', 'closed', 'reopened')) DEFAULT 'open',
    reported_by uuid,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    actual_result text,
    release_id uuid
);

-- Features table
CREATE TABLE features (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    owner text,
    owner_email text,
    owner_role text,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Profiles table for users
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    role text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Releases table
CREATE TABLE releases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT NOW(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    name text NOT NULL UNIQUE,
    color text,
    created_at timestamp with time zone DEFAULT NOW()
);

-- Test case tags junction table
CREATE TABLE test_case_tags (
    test_case_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    PRIMARY KEY (test_case_id, tag_id)
);

-- Test cases table
CREATE TABLE test_cases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    feature_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    preconditions text,
    test_type text NOT NULL CHECK (test_type IN ('manual', 'automated')) DEFAULT 'manual',
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status text NOT NULL CHECK (status IN ('draft', 'ready', 'deprecated')) DEFAULT 'draft',
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    created_by uuid,
    updated_by uuid,
    category text,
    attachments text
);

-- Test executions table
CREATE TABLE test_executions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    test_run_id uuid NOT NULL,
    test_case_id uuid NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'passed', 'failed', 'blocked', 'skipped')) DEFAULT 'pending',
    executed_by uuid,
    executed_at timestamp with time zone,
    duration integer, -- in seconds
    notes text
);

-- Test runs table
CREATE TABLE test_runs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    status text NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'aborted')) DEFAULT 'planned',
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    created_by uuid,
    environment text,
    release_id uuid
);

-- Test step results table
CREATE TABLE test_step_results (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    test_execution_id uuid NOT NULL,
    test_step_id uuid NOT NULL,
    status text NOT NULL CHECK (status IN ('passed', 'failed', 'blocked', 'skipped')),
    actual_result text,
    executed_at timestamp with time zone DEFAULT NOW()
);

-- Test steps table
CREATE TABLE test_steps (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    test_case_id uuid NOT NULL,
    step_number integer NOT NULL,
    description text NOT NULL,
    expected_result text NOT NULL,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- User roles table
CREATE TABLE user_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'tester', 'automation_engineer', 'developer')),
    created_at timestamp with time zone DEFAULT NOW()
);

-- Add foreign key constraints (after all tables are created)
ALTER TABLE automation_scripts ADD CONSTRAINT fk_automation_scripts_test_case
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE;

ALTER TABLE bug_attachments ADD CONSTRAINT fk_bug_attachments_bug
    FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE;

ALTER TABLE bugs ADD CONSTRAINT fk_bugs_test_execution
    FOREIGN KEY (test_execution_id) REFERENCES test_executions(id);

ALTER TABLE bugs ADD CONSTRAINT fk_bugs_release
    FOREIGN KEY (release_id) REFERENCES releases(id);

ALTER TABLE test_case_tags ADD CONSTRAINT fk_test_case_tags_test_case
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE;

ALTER TABLE test_case_tags ADD CONSTRAINT fk_test_case_tags_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

ALTER TABLE test_cases ADD CONSTRAINT fk_test_cases_feature
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE;

ALTER TABLE test_executions ADD CONSTRAINT fk_test_executions_test_run
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE;

ALTER TABLE test_executions ADD CONSTRAINT fk_test_executions_test_case
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE;

ALTER TABLE test_runs ADD CONSTRAINT fk_test_runs_release
    FOREIGN KEY (release_id) REFERENCES releases(id);

ALTER TABLE test_step_results ADD CONSTRAINT fk_test_step_results_test_execution
    FOREIGN KEY (test_execution_id) REFERENCES test_executions(id) ON DELETE CASCADE;

ALTER TABLE test_step_results ADD CONSTRAINT fk_test_step_results_test_step
    FOREIGN KEY (test_step_id) REFERENCES test_steps(id) ON DELETE CASCADE;

ALTER TABLE test_steps ADD CONSTRAINT fk_test_steps_test_case
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE;

-- Add foreign key constraint for user_roles.user_id to auth.users.id
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- Create function to get test cases with steps and tags in a single query
CREATE OR REPLACE FUNCTION get_test_case_with_steps(p_test_case_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT
    json_build_object(
      'id', tc.id,
      'title', tc.title,
      'description', tc.description,
      'preconditions', tc.preconditions,
      'category', tc.category,
      'attachments', tc.attachments,
      'test_type', tc.test_type,
      'priority', tc.priority,
      'status', tc.status,
      'feature_id', tc.feature_id,
      'created_at', tc.created_at,
      'updated_at', tc.updated_at,
      'created_by', tc.created_by,
      'updated_by', tc.updated_by,
      'steps', (
        SELECT COALESCE(
          json_agg(row_to_json(ts) ORDER BY ts.step_number),
          '[]'::json
        )
        FROM test_steps ts
        WHERE ts.test_case_id = tc.id
      ),
      'tags', (
        SELECT COALESCE(
          json_agg(json_build_object('id', t.id, 'name', t.name)),
          '[]'::json
        )
        FROM test_case_tags tct
        JOIN tags t ON tct.tag_id = t.id
        WHERE tct.test_case_id = tc.id
      )
    ) INTO result
  FROM test_cases tc
  WHERE tc.id = p_test_case_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Updated function with missing parameters for filters and tags
CREATE OR REPLACE FUNCTION get_all_test_cases_with_steps(
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_test_type TEXT DEFAULT NULL,
  p_feature_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered_test_cases AS (
    SELECT tc.id
    FROM test_cases tc
    WHERE
      -- Apply filters only if they're provided
      (p_search IS NULL OR tc.title ILIKE '%' || p_search || '%') AND
      (p_test_type IS NULL OR tc.test_type = p_test_type) AND
      (p_feature_id IS NULL OR tc.feature_id = p_feature_id) AND
      (p_priority IS NULL OR tc.priority = p_priority) AND
      (p_status IS NULL OR tc.status = p_status)
    ORDER BY tc.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT json_agg(
    json_build_object(
      'id', tc.id,
      'title', tc.title,
      'description', tc.description,
      'preconditions', tc.preconditions,
      'category', tc.category,
      'attachments', tc.attachments,
      'test_type', tc.test_type,
      'priority', tc.priority,
      'status', tc.status,
      'feature_id', tc.feature_id,
      'created_at', tc.created_at,
      'updated_at', tc.updated_at,
      'created_by', tc.created_by,
      'updated_by', tc.updated_by,
      'feature', (SELECT row_to_json(f) FROM features f WHERE f.id = tc.feature_id),
      'steps', (
        SELECT COALESCE(
          json_agg(row_to_json(ts) ORDER BY ts.step_number),
          '[]'::json
        )
        FROM test_steps ts
        WHERE ts.test_case_id = tc.id
      ),
      'tags', (
        SELECT COALESCE(
          json_agg(json_build_object('id', t.id, 'name', t.name)),
          '[]'::json
        )
        FROM test_case_tags tct
        JOIN tags t ON tct.tag_id = t.id
        WHERE tct.test_case_id = tc.id
      )
    )
  )
  INTO result
  FROM filtered_test_cases ftc
  JOIN test_cases tc ON tc.id = ftc.id;

  -- Handle NULL result (when no data is found)
  IF result IS NULL THEN
    result := '[]'::json;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Expose these functions via RPC to make them callable from the client
GRANT EXECUTE ON FUNCTION get_test_case_with_steps(UUID) TO service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_test_cases_with_steps(INT, INT, TEXT, TEXT, UUID, TEXT, TEXT) TO service_role, anon, authenticated;


-- Add indexes to frequently queried columns
CREATE INDEX idx_test_cases_feature_id ON test_cases(feature_id);
CREATE INDEX idx_test_steps_test_case_id ON test_steps(test_case_id);
CREATE INDEX idx_test_case_tags_test_case_id ON test_case_tags(test_case_id);
CREATE INDEX idx_test_case_tags_tag_id ON test_case_tags(tag_id);
CREATE INDEX idx_test_executions_test_run_id ON test_executions(test_run_id);
CREATE INDEX idx_test_executions_test_case_id ON test_executions(test_case_id);
CREATE INDEX idx_bugs_test_execution_id ON bugs(test_execution_id);
CREATE INDEX idx_bugs_release_id ON bugs(release_id);
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE OR REPLACE FUNCTION get_all_test_cases_with_steps(
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_test_type TEXT DEFAULT NULL,
  p_feature_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    WITH test_cases_filtered AS (
      SELECT tc.*
      FROM test_cases tc
      WHERE
        (p_search IS NULL OR tc.title ILIKE '%' || p_search || '%') AND
        (p_test_type IS NULL OR tc.test_type = p_test_type) AND
        (p_feature_id IS NULL OR tc.feature_id = p_feature_id) AND
        (p_priority IS NULL OR tc.priority = p_priority) AND
        (p_status IS NULL OR tc.status = p_status)
      ORDER BY tc.created_at DESC
      LIMIT p_limit OFFSET p_offset
    ),
    test_steps_grouped AS (
      SELECT
        ts.test_case_id,
        COALESCE(json_agg(json_build_object(
          'id', ts.id,
          'step_number', ts.step_number,
          'description', ts.description,
          'expected_result', ts.expected_result
        ) ORDER BY ts.step_number), '[]'::json) AS steps
      FROM test_steps ts
      WHERE ts.test_case_id IN (SELECT id FROM test_cases_filtered)
      GROUP BY ts.test_case_id
    ),
    tags_grouped AS (
      SELECT
        tct.test_case_id,
        COALESCE(json_agg(json_build_object(
          'id', t.id,
          'name', t.name
        )), '[]'::json) AS tags
      FROM test_case_tags tct
      JOIN tags t ON tct.tag_id = t.id
      WHERE tct.test_case_id IN (SELECT id FROM test_cases_filtered)
      GROUP BY tct.test_case_id
    )
    SELECT COALESCE(json_agg(json_build_object(
      'id', tc.id,
      'title', tc.title,
      'description', tc.description,
      'preconditions', tc.preconditions,
      'category', tc.category,
      'attachments', tc.attachments,
      'test_type', tc.test_type,
      'priority', tc.priority,
      'status', tc.status,
      'feature_id', tc.feature_id,
      'created_at', tc.created_at,
      'updated_at', tc.updated_at,
      'created_by', tc.created_by,
      'updated_by', tc.updated_by,
      'feature', (SELECT row_to_json(f) FROM features f WHERE f.id = tc.feature_id),
      'steps', COALESCE(ts.steps, '[]'::json),
      'tags', COALESCE(tg.tags, '[]'::json)
    )), '[]'::json)
    FROM test_cases_filtered tc
    LEFT JOIN test_steps_grouped ts ON tc.id = ts.test_case_id
    LEFT JOIN tags_grouped tg ON tc.id = tg.test_case_id
  );
END;
$$ LANGUAGE plpgsql;
