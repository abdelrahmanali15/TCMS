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

// Enhanced Features API
export const getFeatures = async (): Promise<Array<{id: string, name: string, description?: string, owner?: string, owner_email?: string}>> => {
  try {
    const { data, error } = await supabase
      .from("features")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error loading features:", error);
    return [];
  }
};

export const getFeatureById = async (id: string): Promise<Feature | null> => {
  try {
    const { data, error } = await supabase
      .from("features")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error loading feature:", error);
    return null;
  }
};

export const createFeature = async (feature: Partial<Feature>): Promise<Feature> => {
  try {
    const { data, error } = await supabase
      .from("features")
      .insert(feature)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating feature:", error);
    throw error;
  }
};

export const updateFeature = async (id: string, feature: Partial<Feature>): Promise<Feature> => {
  try {
    const { data, error } = await supabase
      .from("features")
      .update(feature)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating feature:", error);
    throw error;
  }
};

export const deleteFeature = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("features")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting feature:", error);
    throw error;
  }
};

export const getFeaturesByOwner = async (ownerEmail: string): Promise<Feature[]> => {
  try {
    const { data, error } = await supabase
      .from("features")
      .select("*")
      .eq("owner_email", ownerEmail)
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error loading features for owner ${ownerEmail}:`, error);
    return [];
  }
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
 * Deletes a test case and all related data
 */
export const deleteTestCase = async (id: string): Promise<void> => {
  try {
    // Delete test case - cascading will handle steps and tags
    const { error } = await supabase
      .from("test_cases")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting test case:", error);
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

    if (deleteError) {
      console.error("Error deleting existing tag associations:", deleteError);
      throw deleteError;
    }

    // Skip if no tags to add
    if (!tags || tags.length === 0) return;

    console.log("Processing tags for test case:", testCaseId, tags);

    // Process each tag
    for (const tag of tags) {
      if (!tag.name || !tag.name.trim()) {
        console.warn("Skipping empty tag name");
        continue; // Skip empty tag names
      }

      const tagName = tag.name.trim();

      // Check if the tag already exists
      const { data: existingTag, error: tagError } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .maybeSingle();

      if (tagError) {
        console.error("Error checking for existing tag:", tagError);
        throw tagError;
      }

      let tagId;

      // If tag doesn't exist, create it
      if (!existingTag) {
        console.log("Creating new tag:", tagName);
        const { data: newTag, error: createError } = await supabase
          .from("tags")
          .insert({ name: tagName })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating tag:", createError);
          throw createError;
        }

        if (!newTag) {
          console.error("Failed to create tag - no data returned");
          continue;
        }

        tagId = newTag.id;
      } else {
        tagId = existingTag.id;
      }

      console.log("Creating link between test case and tag:", testCaseId, tagId);

      // Create the association between test case and tag
      const { error: linkError } = await supabase
        .from("test_case_tags")
        .insert({
          test_case_id: testCaseId,
          tag_id: tagId
        });

      if (linkError) {
        console.error("Error linking tag to test case:", linkError);
        throw linkError;
      }
    }

    console.log("Successfully processed all tags for test case:", testCaseId);
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

/**
 * Gets the execution history for a specific test case
 */
export const getTestExecutionsHistoryByTestCase = async (testCaseId: string): Promise<TestExecution[]> => {
  try {
    // First, get test executions with test run info, filter out entries with null executed_at dates
    const { data: executions, error } = await supabase
      .from("test_executions")
      .select(`
        *,
        test_run:test_runs(id, name, description, status, release_id)
      `)
      .eq("test_case_id", testCaseId)
      // Only include executions that have actually been executed
      .not("executed_at", "is", null)
      // Order by execution date, most recent first
      .order("executed_at", { ascending: false });

    if (error) throw error;

    // Get the pending/unexecuted entries separately for this test case
    // Don't try to sort by created_at since it doesn't exist in the table
    const { data: pendingExecutions, error: pendingError } = await supabase
      .from("test_executions")
      .select(`
        *,
        test_run:test_runs(id, name, description, status, release_id)
      `)
      .eq("test_case_id", testCaseId)
      .is("executed_at", null);

    if (pendingError) {
      console.warn("Error fetching pending executions:", pendingError);
    }

    // Combine the executed and pending executions
    const allExecutions = [...(executions || []), ...(pendingExecutions || [])];

    // Extract unique user IDs
    const userIds = [...new Set(allExecutions
      .filter(e => e.executed_by)
      .map(e => e.executed_by))];

    // Only attempt to get profiles if we have user IDs
    let profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      try {
        // Get all profiles that match our user IDs
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", userIds);

        // Create a lookup map for quick access
        if (profiles) {
          profilesMap = profiles.reduce((map, profile) => {
            map[profile.id] = profile;
            return map;
          }, {} as Record<string, any>);
        }
      } catch (profileError) {
        console.warn("Could not fetch profiles for test executions:", profileError);
      }
    }

    // Enhance executions with profile data
    const executionsWithProfiles = allExecutions.map(execution => {
      const profile = execution.executed_by ? profilesMap[execution.executed_by] : null;
      return {
        ...execution,
        executed_by_profile: profile || null
      };
    });

    return executionsWithProfiles || [];
  } catch (error) {
    console.error("Error fetching test case execution history:", error);
    return [];
  }
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
  priority?: string;
  tagIds?: string[];
  status?: string;
}): Promise<TestCase[]> => {
  try {
    const { limit = 100, offset = 0, search, testType, featureId, priority, tagIds, status } = options;

    // If we have tag filters, use a more complex query
    if (tagIds && tagIds.length > 0) {
      let query = supabase
        .from('test_cases')
        .select('*, features(name), test_case_tags!inner(tag_id)')
        .in('test_case_tags.tag_id', tagIds);

      // Add other filters
      if (featureId) query = query.eq('feature_id', featureId);
      if (testType) query = query.eq('test_type', testType);
      if (priority) query = query.eq('priority', priority);
      if (status) query = query.eq('status', status);
      if (search) query = query.ilike('title', `%${search}%`);

      // Get data with pagination
      query = query.range(offset, offset + limit - 1)
                  .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Fetch steps for each test case
      const testCasesWithSteps = await Promise.all((data || []).map(async (tc) => {
        const { data: steps } = await supabase
          .from('test_steps')
          .select('*')
          .eq('test_case_id', tc.id)
          .order('step_number');

        return { ...tc, steps: steps || [] };
      }));

      return testCasesWithSteps;
    }

    // If no tags filter, use our RPC function
    const { data, error } = await supabase.rpc('get_all_test_cases_with_steps', {
      p_limit: limit,
      p_offset: offset,
      p_search: search || null,
      p_test_type: testType || null,
      p_feature_id: featureId || null,
      p_priority: priority || null,
      p_status: status || null
    });

    if (error) throw error;
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

    // The updated SQL function now returns the complete test case with steps and tags
    // Make sure tags is always an array, even when null or undefined
    console.log("Raw test case data:", data);

    if (!data.tags) {
      console.warn("No tags returned from database for test case:", testCaseId);
      data.tags = [];
    }

    // Add additional logging to help diagnose tag structure
    if (data.tags) {
      console.log("Tags data structure:", JSON.stringify(data.tags));
    }

    return data;
  } catch (error) {
    console.error("Error fetching test case with steps:", error);
    throw error;
  }
};

// New helper function to get tags with their counts
export const getTagsWithCounts = async (): Promise<Array<{id: string, name: string, count: number}>> => {
  try {
    const { data, error } = await supabase.rpc('get_tags_with_counts');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching tags with counts:", error);
    return [];
  }
};

// Get features with test case counts
export const getFeaturesWithCounts = async (): Promise<Array<{id: string, name: string, count: number}>> => {
  try {
    const { data, error } = await supabase.rpc('get_features_with_counts');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching features with counts:", error);
    return [];
  }
};

// Add a fallback function to get mock test cases if database query fails
export const getEmergencyFallbackTestCases = async (type = 'manual') => {
  console.log("Using emergency fallback test cases");
  const featureId = "default-feature";

  // Create some fallback test cases to show instead of a perpetual loading state
  return [
    {
      id: `fallback-${type}-1`,
      title: `Fallback ${type === 'manual' ? 'Manual' : 'Automated'} Test Case 1`,
      description: "This is a fallback test case when database is unavailable",
      feature_id: featureId,
      test_type: type,
      priority: "medium",
      status: "draft"
    },
    {
      id: `fallback-${type}-2`,
      title: `Fallback ${type === 'manual' ? 'Manual' : 'Automated'} Test Case 2`,
      description: "This is a fallback test case when database is unavailable",
      feature_id: featureId,
      test_type: type,
      priority: "high",
      status: "draft"
    }
  ];
};

// User profile API
export const syncUserProfiles = async (): Promise<void> => {
  try {
    // First check if we have profiles table
    const { error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error("Profiles table not available:", checkError);
      return;
    }

    // Get all existing auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      return;
    }

    // For each auth user, create a profile if one doesn't exist
    for (const user of authUsers.users) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create a new profile
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            role: user.user_metadata?.role || 'user',
            avatar_url: user.user_metadata?.avatar_url
          });
      }
    }

    console.log("User profiles synced successfully");
  } catch (error) {
    console.error("Error syncing user profiles:", error);
  }
};

// Get user profiles with pagination
export const getUserProfiles = async (page = 0, limit = 10): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .range(page * limit, (page + 1) * limit - 1)
      .order('full_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    return [];
  }
};

// Add Profiles API functions
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const getAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return data || [];
};

export const createProfile = async (
  profile: Omit<Profile, "id" | "created_at" | "updated_at">
): Promise<Profile> => {
  const { data, error } = await supabase
    .from("profiles")
    .insert([profile])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteProfile = async (id: string): Promise<void> => {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
};
