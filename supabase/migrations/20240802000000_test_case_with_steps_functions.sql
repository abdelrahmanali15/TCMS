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
