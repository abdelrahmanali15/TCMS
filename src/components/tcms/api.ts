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

export const createTestCase = async (
  testCase: Partial<TestCase>,
): Promise<TestCase> => {
  try {
    // Get current user or use a default ID if not logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Get default feature if none provided
    let featureId = testCase.feature_id;
    if (!featureId) {
      // Create a default feature if none exists
      const { data: features } = await supabase
        .from("features")
        .select("id")
        .limit(1);

      if (!features || features.length === 0) {
        // Create a default project first
        const { data: project } = await supabase
          .from("projects")
          .insert({ name: "Default Project", created_by: userId })
          .select()
          .single();

        // Create a default module
        const { data: module } = await supabase
          .from("modules")
          .insert({ name: "Default Module", project_id: project.id })
          .select()
          .single();

        // Create a default feature
        const { data: feature } = await supabase
          .from("features")
          .insert({ name: "Default Feature", module_id: module.id })
          .select()
          .single();

        featureId = feature.id;
      } else {
        featureId = features[0].id;
      }
    }

    // First create the test case
    const { data: testCaseData, error: testCaseError } = await supabase
      .from("test_cases")
      .insert({
        feature_id: featureId,
        title: testCase.title || "Untitled Test Case",
        description: testCase.description || "",
        preconditions: testCase.preconditions || "",
        test_type: testCase.test_type || "manual",
        priority: testCase.priority || "medium",
        status: testCase.status || "draft",
        category: testCase.category || "functional",
        attachments: testCase.attachments || "",
        created_by: userId,
      })
      .select()
      .single();

    if (testCaseError) throw testCaseError;

    // Then add steps if provided
    if (testCase.steps && testCase.steps.length > 0) {
      const stepsToInsert = testCase.steps.map((step) => ({
        test_case_id: testCaseData.id,
        step_number: step.step_number,
        description: step.description,
        expected_result: step.expected_result,
      }));

      const { error: stepsError } = await supabase
        .from("test_steps")
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;
    }

    // Add tags if provided
    if (testCase.tags && testCase.tags.length > 0) {
      for (const tag of testCase.tags) {
        // First check if tag exists
        const { data: existingTag, error: tagError } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tag.name)
          .maybeSingle();

        if (tagError) throw tagError;

        let tagId;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Create new tag
          const { data: newTag, error: newTagError } = await supabase
            .from("tags")
            .insert({ name: tag.name })
            .select()
            .single();

          if (newTagError) throw newTagError;
          tagId = newTag.id;
        }

        // Link tag to test case
        const { error: linkError } = await supabase
          .from("test_case_tags")
          .insert({
            test_case_id: testCaseData.id,
            tag_id: tagId,
          });

        if (linkError) throw linkError;
      }
    }

    return testCaseData;
  } catch (error) {
    console.error("Error creating test case:", error);
    throw error;
  }
};

export const updateTestCase = async (
  id: string,
  updates: Partial<TestCase>,
): Promise<TestCase> => {
  const { data, error } = await supabase
    .from("test_cases")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

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
    return data;
  } catch (error) {
    console.error("Error creating test run:", error);
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
  // Get current user or use a default ID if not logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id || "00000000-0000-0000-0000-000000000000";

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
  return data;
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
