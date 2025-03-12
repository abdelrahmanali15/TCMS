-- Create function to get test cases with steps in a single query
CREATE OR REPLACE FUNCTION get_test_case_with_steps(p_test_case_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT
    json_build_object(
      'test_case', row_to_json(tc),
      'steps', (SELECT json_agg(row_to_json(ts))
                FROM test_steps ts
                WHERE ts.test_case_id = tc.id
                ORDER BY ts.step_number)
    ) INTO result
  FROM test_cases tc
  WHERE tc.id = p_test_case_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all test cases with their steps in a single query
CREATE OR REPLACE FUNCTION get_all_test_cases_with_steps(
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_test_type TEXT DEFAULT NULL,
  p_feature_id UUID DEFAULT NULL
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
      (p_feature_id IS NULL OR tc.feature_id = p_feature_id)
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
        SELECT json_agg(row_to_json(ts) ORDER BY ts.step_number)
        FROM test_steps ts
        WHERE ts.test_case_id = tc.id
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
GRANT EXECUTE ON FUNCTION get_all_test_cases_with_steps(INT, INT, TEXT, TEXT, UUID) TO service_role, anon, authenticated;
