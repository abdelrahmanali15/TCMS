-- Migration file to add steps handling functions

-- Create a function to add or update test steps for a test case
CREATE OR REPLACE FUNCTION public.manage_test_steps(
  p_test_case_id UUID,
  p_steps JSONB
)
RETURNS VOID AS $$
DECLARE
  step_record JSONB;
  step_id UUID;
  step_number INTEGER;
  step_description TEXT;
  step_expected TEXT;
BEGIN
  -- Delete existing steps for this test case
  DELETE FROM test_steps WHERE test_case_id = p_test_case_id;

  -- Insert new steps
  FOR step_record IN SELECT * FROM jsonb_array_elements(p_steps)
  LOOP
    step_number := (step_record ->> 'step_number')::INTEGER;
    step_description := step_record ->> 'description';
    step_expected := step_record ->> 'expected_result';

    INSERT INTO test_steps (
      test_case_id,
      step_number,
      description,
      expected_result
    ) VALUES (
      p_test_case_id,
      step_number,
      step_description,
      step_expected
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a secure RPC endpoint to manage test steps
CREATE OR REPLACE FUNCTION public.upsert_test_case_with_steps(
  p_test_case JSONB,
  p_steps JSONB
)
RETURNS UUID AS $$
DECLARE
  v_test_case_id UUID;
  v_feature_id UUID;
  v_title TEXT;
  v_description TEXT;
  v_preconditions TEXT;
  v_category TEXT;
  v_attachments TEXT;
  v_test_type TEXT;
  v_priority TEXT;
  v_status TEXT;
BEGIN
  -- Extract test case data
  v_feature_id := (p_test_case ->> 'feature_id')::UUID;
  v_title := p_test_case ->> 'title';
  v_description := p_test_case ->> 'description';
  v_preconditions := p_test_case ->> 'preconditions';
  v_category := p_test_case ->> 'category';
  v_attachments := p_test_case ->> 'attachments';
  v_test_type := p_test_case ->> 'test_type';
  v_priority := p_test_case ->> 'priority';
  v_status := p_test_case ->> 'status';

  -- Check if test case exists
  IF (p_test_case ->> 'id') IS NOT NULL THEN
    v_test_case_id := (p_test_case ->> 'id')::UUID;

    -- Update existing test case
    UPDATE test_cases SET
      feature_id = v_feature_id,
      title = v_title,
      description = v_description,
      preconditions = v_preconditions,
      category = v_category,
      attachments = v_attachments,
      test_type = v_test_type,
      priority = v_priority,
      status = v_status,
      updated_at = NOW()
    WHERE id = v_test_case_id;
  ELSE
    -- Insert new test case
    INSERT INTO test_cases (
      feature_id,
      title,
      description,
      preconditions,
      category,
      attachments,
      test_type,
      priority,
      status
    ) VALUES (
      v_feature_id,
      v_title,
      v_description,
      v_preconditions,
      v_category,
      v_attachments,
      v_test_type,
      v_priority,
      v_status
    )
    RETURNING id INTO v_test_case_id;
  END IF;

  -- Manage steps
  PERFORM manage_test_steps(v_test_case_id, p_steps);

  RETURN v_test_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for RPC execution
DROP POLICY IF EXISTS "Allow all RPC execution" ON supabase_functions.http_request;
CREATE POLICY "Allow all RPC execution" ON supabase_functions.http_request
  USING (true);
