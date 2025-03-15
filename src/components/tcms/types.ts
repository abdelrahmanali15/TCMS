export type UserRole = "admin" | "tester" | "automation_engineer" | "developer";

export type TestType = "manual" | "automated";

export type TestCasePriority = "low" | "medium" | "high" | "critical";

export type TestCaseStatus = "draft" | "ready" | "deprecated";

export type TestCaseCategory =
  | "smoke"
  | "regression"
  | "functional"
  | "performance"
  | "security";

export type TestRunStatus = "planned" | "in_progress" | "completed" | "aborted";

export type TestExecutionStatus =
  | "pending"
  | "passed"
  | "failed"
  | "blocked"
  | "skipped";

export type BugSeverity = "low" | "medium" | "high" | "critical";

export type BugStatus =
  | "open"
  | "in_progress"
  | "fixed"
  | "verified"
  | "closed"
  | "reopened";

export type ScriptType = "python" | "tcl" | "perl" | "shell";

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Module {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  module_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner?: string;          // New field for owner's name
  owner_email?: string;    // New field for owner's email
  owner_role?: string;     // Add new field for owner role
}

export interface TestCase {
  id: string;
  feature_id: string;
  title: string;
  description?: string;
  preconditions?: string;
  test_type: TestType;
  priority: TestCasePriority;
  status: TestCaseStatus;
  category?: TestCaseCategory;
  attachments?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  steps?: Array<{
    step_number: number;
    description: string;
    expected_result: string;
  }>;
  tags?: Array<{ name: string }>;
}

export interface TestStep {
  id: string;
  test_case_id: string;
  step_number: number;
  description: string;
  expected_result: string;
  created_at: string;
  updated_at: string;
}

export interface TestRun {
  id: string;
  name: string;
  description?: string;
  status: TestRunStatus;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  created_by: string;
  environment?: string;
}

export interface TestExecution {
  id: string;
  test_run_id: string;
  test_case_id: string;
  status: TestExecutionStatus;
  executed_by?: string;
  executed_at?: string;
  duration?: number; // in seconds
  notes?: string;
}

export interface TestStepResult {
  id: string;
  test_execution_id: string;
  test_step_id: string;
  status: "passed" | "failed" | "blocked" | "skipped";
  actual_result?: string;
  executed_at: string;
}

export interface Bug {
  id: string;
  test_execution_id?: string;
  title: string;
  description: string;
  actual_result?: string;
  severity: BugSeverity;
  status: BugStatus;
  reported_by: string;
  assigned_to?: string;
  release_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BugAttachment {
  id: string;
  bug_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
}

export interface AutomationScript {
  id: string;
  test_case_id: string;
  name: string;
  script_type: ScriptType;
  script_path: string;
  parameters?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface UserRoleMapping {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface TestCaseTag {
  test_case_id: string;
  tag_id: string;
}
