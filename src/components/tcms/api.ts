import { supabase } from "../../../supabase/supabase";
import {
  Project,
  Module,
  Feature,
  TestCase,
  TestStep,
  TestRun,
  TestExecution,
  Bug,
  UserRole,
  Tag,
  TestCaseCategory,
  TestCasePriority,
  TestType,
  TestCaseStatus,
  BugSeverity,
  BugStatus,
} from "./types";

// Projects API
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const createProject = async (
  project: Omit<Project, "id" | "created_at" | "updated_at">,
): Promise<Project> => {
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProject = async (
  id: string,
  updates: Partial<Project>,
): Promise<Project> => {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) throw error;
};

// Modules API
export const getModulesByProjectId = async (
  projectId: string,
): Promise<Module[]> => {
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("project_id", projectId)
    .order("name");

  if (error) throw error;
  return data || [];
};

// Features API
export const getFeaturesByModuleId = async (
  moduleId: string,
): Promise<Feature[]> => {
  const { data, error } = await supabase
    .from("features")
    .select("*")
    .eq("module_id", moduleId)
    .order("name");

  if (error) throw error;
  return data || [];
};

// Test Cases API
export const getTestCasesByFeatureId = async (
  featureId: string,
): Promise<TestCase[]> => {
  const { data, error } = await supabase
    .from("test_cases")
    .select("*")
    .eq("feature_id", featureId)
    .order("title");

  if (error) throw error;
  return data || [];
};

export const getTestCaseById = async (id: string): Promise<TestCase | null> => {
  const { data, error } = await supabase
    .from("test_cases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Creates a test case with steps
 */
export const createTestCase = async (testCase: Partial<TestCase>) => {
  try {
    // Check if a test case with this title already exists
    if (testCase.title) {
      const { data: existingTestCase } = await supabase
        .from("test_cases")
        .select("*")
        .eq("title", testCase.title)
        .maybeSingle();

      if (existingTestCase) {
        console.warn("A test case with this title already exists:", testCase.title);
        // Return the existing test case to prevent duplication
        return existingTestCase;
      }
    }

    // Extract steps, feature, and tags from the test case
    const { steps, feature, tags, ...testCaseData } = testCase;

    // First create the test case (without the invalid properties)
    const { data, error } = await supabase
      .from("test_cases")
      .insert([testCaseData])
      .select()
      .single();

    if (error) throw error;

    // If steps are provided, create them
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const stepsWithTestCaseId = steps.map(step => ({
        ...step,
        test_case_id: data.id
      }));

      const { error: stepsError } = await supabase
        .from("test_steps")
        .insert(stepsWithTestCaseId);

      if (stepsError) throw stepsError;
    }

    // Handle tags if present
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await handleTagsForTestCase(data.id, tags);
    }

    return data;
  } catch (error) {
    console.error("Error creating test case:", error);
    throw error;
  }
};

/**
 * Updates a test case and its steps
 */
export const updateTestCase = async (id: string, testCase: Partial<TestCase>) => {
  try {
    // Extract steps, feature, and tags from the test case
    const { steps, feature, tags, ...testCaseData } = testCase;

    // First update the test case (without the invalid properties)
    const { data, error } = await supabase
      .from("test_cases")
      .update(testCaseData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // If steps are provided, handle them
    if (steps && Array.isArray(steps) && steps.length > 0) {
      // Delete existing steps
      const { error: deleteError } = await supabase
        .from("test_steps")
        .delete()
        .eq("test_case_id", id);

      if (deleteError) throw deleteError;

      // Insert new steps
      const stepsWithTestCaseId = steps.map(step => ({
        ...step,
        test_case_id: id
      }));

      const { error: stepsError } = await supabase
        .from("test_steps")
        .insert(stepsWithTestCaseId);

      if (stepsError) throw stepsError;
    }

    // Handle tags if present
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await handleTagsForTestCase(id, tags);
    }

    return data;
  } catch (error) {
    console.error("Error updating test case:", error);
    throw error;
  }
};

/**
 * Helper function to manage tag associations for a test case
 */
async function handleTagsForTestCase(testCaseId: string, tags: Array<{name: string}>): Promise<void> {
  try {
    // First remove all existing tag associations
    const { error: deleteError } = await supabase
      .from("test_case_tags")
      .delete()
      .eq("test_case_id", testCaseId);

    if (deleteError) throw deleteError;

    // Process each tag
    for (const tag of tags) {
      // Check if the tag already exists
      const { data: existingTag, error: tagError } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tag.name)
        .maybeSingle();

      if (tagError) throw tagError;

      let tagId;

      // If tag doesn't exist, create it
      if (!existingTag) {
        const { data: newTag, error: createError } = await supabase
          .from("tags")
          .insert({ name: tag.name })
          .select("id")
          .single();

        if (createError) throw createError;
        tagId = newTag.id;
      } else {
        tagId = existingTag.id;
      }

      // Create the association between test case and tag
      const { error: linkError } = await supabase
        .from("test_case_tags")
        .insert({
          test_case_id: testCaseId,
          tag_id: tagId
        });

      if (linkError) throw linkError;
    }
  } catch (error) {
    console.error("Error handling tags for test case:", error);
    throw error;
  }
}

// Test Steps API
export const getTestStepsByTestCaseId = async (
  testCaseId: string,
): Promise<TestStep[]> => {
  const { data, error } = await supabase
    .from("test_steps")
    .select("*")
    .eq("test_case_id", testCaseId)
    .order("step_number");

  if (error) throw error;
  return data || [];
};

// Test Runs API
export const getTestRuns = async (): Promise<TestRun[]> => {
  const { data, error } = await supabase
    .from("test_runs")
    .select("*, releases(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getTestRunsByReleaseId = async (
  releaseId: string,
): Promise<TestRun[]> => {
  const { data, error } = await supabase
    .from("test_runs")
    .select("*")
    .eq("release_id", releaseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTestRun = async (
  testRun: Partial<TestRun>,
): Promise<TestRun> => {
  try {
    // Get current user or use a default ID if not logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Create the test run with safe defaults
    const { data, error } = await supabase
      .from("test_runs")
      .insert({
        name: testRun.name || `Test Run - ${new Date().toISOString()}`,
        description: testRun.description || "",
        status: testRun.status || "planned",
        environment: testRun.environment || "",
        release_id: testRun.release_id,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // After creating the test run, add all test cases to it with "pending" status
    const { data: testCases, error: testCasesError } = await supabase
      .from("test_cases")
      .select("id");

    if (testCasesError) throw testCasesError;

    if (testCases && testCases.length > 0) {
      // Create test executions for each test case
      const testExecutions = testCases.map(testCase => ({
        test_run_id: data.id,
        test_case_id: testCase.id,
        status: "pending", // "pending" status represents "Not executed"
        executed_by: userId,
        executed_at: null, // Not executed yet
      }));

      const { error: executionsError } = await supabase
        .from("test_executions")
        .insert(testExecutions);

      if (executionsError) throw executionsError;
    }

    return data;
  } catch (error) {
    console.error("Error creating test run:", error);
    throw error;
  }
};

// Helper function to ensure a test run has executions for all test cases
export const ensureTestRunHasExecutions = async (runId: string): Promise<void> => {
  try {
    // Check if the test run already has executions
    const { data: existingExecutions, error: existingError } = await supabase
      .from("test_executions")
      .select("id")
      .eq("test_run_id", runId)
      .limit(1);

    if (existingError) throw existingError;

    // If test run already has at least one execution, no need to continue
    if (existingExecutions && existingExecutions.length > 0) {
      return;
    }

    // Get current user or use a default ID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Get all test cases
    const { data: testCases, error: testCasesError } = await supabase
      .from("test_cases")
      .select("id");

    if (testCasesError) throw testCasesError;
    if (!testCases || testCases.length === 0) return;

    // Create executions for each test case
    const executions = testCases.map(testCase => ({
      test_run_id: runId,
      test_case_id: testCase.id,
      status: "pending",
      executed_by: userId
    }));

    // Insert the executions
    const { error: insertError } = await supabase
      .from("test_executions")
      .insert(executions);

    if (insertError) throw insertError;
  } catch (error) {
    console.error("Error ensuring test run has executions:", error);
    throw error;
  }
};

// Test Executions API
export const getTestExecutionsByRunId = async (
  runId: string,
): Promise<TestExecution[]> => {
  const { data, error } = await supabase
    .from("test_executions")
    .select("*, test_cases(title, priority, test_type)")
    .eq("test_run_id", runId);

  if (error) throw error;
  return data || [];
};

// Get a map of test executions by test case ID
export const getTestExecutionMapByRunId = async (
  runId: string
): Promise<Record<string, TestExecution>> => {
  const executions = await getTestExecutionsByRunId(runId);
  const executionMap: Record<string, TestExecution> = {};

  executions.forEach(execution => {
    executionMap[execution.test_case_id] = execution;
  });

  return executionMap;
};

export const createTestExecution = async (
  execution: Partial<TestExecution>,
): Promise<TestExecution> => {
  try {
    // Get current user or use a default ID if not logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Create the test execution with safe defaults
    const { data, error } = await supabase
      .from("test_executions")
      .insert({
        test_run_id: execution.test_run_id,
        test_case_id: execution.test_case_id,
        status: execution.status || "pending",
        executed_by: userId,
        executed_at: new Date().toISOString(),
        duration: execution.duration || 0,
        notes: execution.notes || "",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating test execution:", error);
    throw error;
  }
};

// New function to save test step results
export const createTestStepResults = async (
  executionId: string,
  stepResults: Array<{
    test_step_id: string;
    status: string;
    actual_result?: string;
  }>
): Promise<void> => {
  try {
    // Don't try to save if there are no step results
    if (!stepResults.length) return;

    // Prepare the data to insert
    const dataToInsert = stepResults.map(result => ({
      test_execution_id: executionId,
      test_step_id: result.test_step_id,
      status: result.status,
      actual_result: result.actual_result || "",
      executed_at: new Date().toISOString()
    }));

    // Insert all step results
    const { error } = await supabase
      .from("test_step_results")
      .insert(dataToInsert);

    if (error) throw error;
  } catch (error) {
    console.error("Error creating test step results:", error);
    throw error;
  }
};

export const updateTestExecution = async (
  id: string,
  updates: Partial<TestExecution>,
): Promise<TestExecution> => {
  const { data, error } = await supabase
    .from("test_executions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Bugs API
export const getBugs = async (): Promise<Bug[]> => {
  const { data, error } = await supabase
    .from("bugs")
    .select("*, releases(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getBugsByTestExecutionId = async (
  executionId: string,
): Promise<Bug[]> => {
  const { data, error } = await supabase
    .from("bugs")
    .select("*")
    .eq("test_execution_id", executionId);

  if (error) throw error;
  return data || [];
};

export const getBugsByReleaseId = async (releaseId: string): Promise<Bug[]> => {
  const { data, error } = await supabase
    .from("bugs")
    .select("*")
    .eq("release_id", releaseId);

  if (error) throw error;
  return data || [];
};

export const createBug = async (bug: Partial<Bug>): Promise<Bug> => {
  try {
    // Get current user or use a default ID if not logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Create the bug with safe defaults
    const { data, error } = await supabase
      .from("bugs")
      .insert({
        title: bug.title || "Untitled Bug",
        description: bug.description || "No description provided",
        actual_result: bug.actual_result || "",
        severity: bug.severity || "medium",
        status: bug.status || "open",
        test_execution_id: bug.test_execution_id,
        assigned_to: bug.assigned_to,
        release_id: bug.release_id,
        reported_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating bug:", error);
    throw error;
  }
};

export const updateBug = async (
  id: string,
  updates: Partial<Bug>,
): Promise<Bug> => {
  const { data, error } = await supabase
    .from("bugs")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// User Roles API
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data?.role || null;
};

// Tags API
export const getTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase.from("tags").select("*").order("name");

  if (error) throw error;
  return data || [];
};

export const getTagsByTestCaseId = async (
  testCaseId: string,
): Promise<Tag[]> => {
  const { data, error } = await supabase
    .from("test_case_tags")
    .select("tags(*)") // Join with tags table
    .eq("test_case_id", testCaseId);

  if (error) throw error;
  return data?.map((item) => item.tags) || [];
};

// Releases API
export const getReleases = async () => {
  const { data, error } = await supabase
    .from("releases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createRelease = async (name: string, description?: string) => {
  try {
    // Get current user or use a default ID if not logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Create the release
    const { data, error } = await supabase
      .from("releases")
      .insert({
        name,
        description,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Create a default test run for this release
    await createTestRun({
      name: `Initial Test Run - ${name}`,
      status: "planned",
      release_id: data.id,
    });

    return data;
  } catch (error) {
    console.error("Error creating release:", error);
    throw error;
  }
};

export const getReleaseById = async (id: string) => {
  const { data, error } = await supabase
    .from("releases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get paginated test cases with optional filters
 */
export const getPaginatedTestCases = async (options: {
  page: number;
  pageSize: number;
  testType?: string;
  searchQuery?: string;
  featureId?: string;
  status?: string;
  priority?: string;
}): Promise<{
  data: TestCase[];
  hasMore: boolean;
}> => {
  const { page, pageSize, testType, searchQuery, featureId, status, priority } = options;

  try {
    // Build query with filters
    let query = supabase
      .from("test_cases")
      .select("*, features(name)")
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order("created_at", { ascending: false });

    // Add filters if provided
    if (testType) {
      query = query.eq("test_type", testType);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    if (featureId) {
      query = query.eq("feature_id", featureId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    // Execute query
    const { data, error } = await query;

    if (error) throw error;

    // Determine if there are more results
    const hasMore = data.length === pageSize;

    return { data: data || [], hasMore };
  } catch (error) {
    console.error("Error fetching paginated test cases:", error);
    throw error;
  }
};

/**
 * Batch create test executions for a test run
 */
export const batchCreateTestExecutions = async (
  testRunId: string,
  testCaseIds: string[]
): Promise<void> => {
  try {
    if (!testCaseIds.length) return;

    // Get current user or use a default ID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Create all executions at once
    const executions = testCaseIds.map(testCaseId => ({
      test_run_id: testRunId,
      test_case_id: testCaseId,
      status: "not_executed",
      executed_by: userId,
      executed_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from("test_executions")
      .insert(executions);

    if (error) throw error;
  } catch (error) {
    console.error("Error batch creating test executions:", error);
    throw error;
  }
};

/**
 * Enhanced function to get test cases with their steps in a single query
 */
export const getTestCasesWithSteps = async (options: {
  limit?: number;
  offset?: number;
  search?: string;
  testType?: string;
  featureId?: string;
}): Promise<TestCase[]> => {
  try {
    const { limit = 100, offset = 0, search, testType, featureId } = options;

    const { data, error } = await supabase.rpc('get_all_test_cases_with_steps', {
      p_limit: limit,
      p_offset: offset,
      p_search: search || null,
      p_test_type: testType || null,
      p_feature_id: featureId || null
    });

    if (error) throw error;

    // Data is already in the correct format from our function
    return data || [];
  } catch (error) {
    console.error("Error fetching test cases with steps:", error);
    throw error;
  }
};

/**
 * Get a single test case with its steps
 */
export const getTestCaseWithSteps = async (testCaseId: string): Promise<TestCase> => {
  try {
    const { data, error } = await supabase.rpc('get_test_case_with_steps', {
      p_test_case_id: testCaseId
    });

    if (error) throw error;

    // Combine the test case with its steps from the function result
    const testCase = data.test_case;
    testCase.steps = data.steps || [];

    return testCase;
  } catch (error) {
    console.error("Error fetching test case with steps:", error);
    throw error;
  }
};
