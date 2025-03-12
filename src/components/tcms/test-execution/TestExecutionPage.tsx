import React, { useState, useEffect } from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Plus,
} from "lucide-react";
import TestStepExecution from "./TestStepExecution";
import BugForm from "../bugs/BugForm";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../../../supabase/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  getReleases,
  createRelease,
  createTestRun,
  createTestExecution,
  createTestStepResults,
  createBug,
  getTestRunsByReleaseId,
} from "../api";

// Simple error boundary component
const ErrorFallback = ({error}) => {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
      <p className="text-red-600 mt-2">{error.message}</p>
    </div>
  );
};

const TestExecutionPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null);
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  const [isReleaseFormOpen, setIsReleaseFormOpen] = useState(false);
  const [newReleaseName, setNewReleaseName] = useState("");
  const { toast } = useToast();
  const [testSteps, setTestSteps] = useState<any[]>([]);

  // State for test cases
  const [manualTestCases, setManualTestCases] = useState<any[]>([]);
  const [automatedTestCases, setAutomatedTestCases] = useState<any[]>([]);
  const [loadingTestCases, setLoadingTestCases] = useState(true);

  // Add initial safe state values
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [testExecutions, setTestExecutions] = useState<Record<string, any>>({});

  // State for releases
  const [releases, setReleases] = useState<Array<{ id: string; name: string }>>(
    [],
  );

  // State for test runs - MOVE THIS DECLARATION UP BEFORE ANY DEPENDENCIES
  const [testRuns, setTestRuns] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selectedTestRun, setSelectedTestRun] = useState("");

  // Move updateTestCaseStatuses inside the component so it has access to state setters
  const updateTestCaseStatuses = (executionsMap: Record<string, any>) => {
    // Add debugging to see what's in executionsMap
    console.log("Updating test case statuses with executions:", executionsMap);

    setManualTestCases(prevTestCases =>
      prevTestCases.map(testCase => {
        const execution = executionsMap[testCase.id];
        // Map "pending" status to "not_executed" for UI consistency
        let status = execution ? execution.status : 'not_executed';
        if (status === 'pending') status = 'not_executed';

        return {
          ...testCase,
          status: status,
          lastExecuted: execution ? execution.executed_at : null
        };
      })
    );

    setAutomatedTestCases(prevTestCases =>
      prevTestCases.map(testCase => {
        const execution = executionsMap[testCase.id];
        // Map "pending" status to "not_executed" for UI consistency
        let status = execution ? execution.status : 'not_executed';
        if (status === 'pending') status = 'not_executed';

        return {
          ...testCase,
          status: status,
          lastExecuted: execution ? execution.executed_at : null
        };
      })
    );
  };

  // Load test cases whenever component mounts, or when release/test run changes
  useEffect(() => {
    const loadTestCases = async () => {
      try {
        setLoadingTestCases(true);
        setError(null);

        // Start with all test cases
        const { data: allTestCases, error } = await supabase
          .from("test_cases")
          .select("*, features(name)")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Process test cases and separate them by type
        const manual = [];
        const automated = [];

        for (const testCase of allTestCases || []) {
          const processedTestCase = {
            id: testCase.id,
            title: testCase.title || "Untitled Test Case",
            feature: testCase.features?.name || "Unknown Feature",
            feature_id: testCase.feature_id,
            priority: testCase.priority || "medium",
            status: "not_executed", // Default status - will be updated if there's an execution
            assignedTo: "",
            lastExecuted: null,
            description: testCase.description || "",
            test_type: testCase.test_type || "manual",
            script:
              testCase.test_type === "automated"
                ? `${(testCase.title || "untitled").toLowerCase().replace(/\s+/g, "_")}.py`
                : null,
          };

          if (testCase.test_type === "manual") {
            manual.push(processedTestCase);
          } else {
            automated.push(processedTestCase);
          }
        }

        setManualTestCases(manual);
        setAutomatedTestCases(automated);

        // If there's a selected test run, load its executions
        if (selectedTestRun) {
          loadTestExecutions(selectedTestRun);
        }
      } catch (err) {
        console.error("Error loading test cases:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        toast({
          title: "Error",
          description: "Failed to load test cases",
          variant: "destructive",
        });
      } finally {
        setLoadingTestCases(false);
        setIsLoading(false);
      }
    };

    loadTestCases();
  }, [selectedTestRun]); // Add selectedTestRun as dependency to reload when it changes

  // Create a separate function to load test executions
  const loadTestExecutions = async (runId) => {
    if (!runId) {
      setTestExecutions({});
      return;
    }

    try {
      setLoadingExecutions(true);
      console.log("Loading test executions for run:", runId);

      // Load test executions for the selected test run
      const { data, error } = await supabase
        .from("test_executions")
        .select("*")
        .eq("test_run_id", runId);

      if (error) throw error;
      console.log("Loaded test executions:", data);

      if (!data || data.length === 0) {
        // No executions found - we need to create them for all test cases
        await createExecutionsForTestRun(runId);

        // Reload executions after creating them
        const { data: newData, error: newError } = await supabase
          .from("test_executions")
          .select("*")
          .eq("test_run_id", runId);

        if (newError) throw newError;
        console.log("Created and loaded new test executions:", newData);

        // Map executions by test case ID
        const executionsMap = {};
        newData?.forEach(execution => {
          executionsMap[execution.test_case_id] = execution;
        });

        setTestExecutions(executionsMap);
        updateTestCaseStatuses(executionsMap);
      } else {
        // Map executions by test case ID
        const executionsMap = {};
        data.forEach(execution => {
          executionsMap[execution.test_case_id] = execution;
        });

        console.log("Mapped executions by test case ID:", executionsMap);
        setTestExecutions(executionsMap);
        updateTestCaseStatuses(executionsMap);
      }
    } catch (error) {
      console.error("Error loading test executions:", error);
      toast({
        title: "Error",
        description: "Failed to load test executions",
        variant: "destructive",
      });
    } finally {
      setLoadingExecutions(false);
    }
  };

  // New function to create test executions if they don't exist
  const createExecutionsForTestRun = async (runId) => {
    try {
      // Get all test cases
      const { data: testCases, error: testCasesError } = await supabase
        .from("test_cases")
        .select("id");

      if (testCasesError) throw testCasesError;

      // Get current user or use a default ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || "00000000-0000-0000-0000-000000000000";

      // Create test executions for each test case
      if (testCases && testCases.length > 0) {
        const testExecutions = testCases.map(testCase => ({
          test_run_id: runId,
          test_case_id: testCase.id,
          status: "not_executed", // Change from "pending" to "not_executed" for consistency
          executed_by: userId,
          executed_at: new Date().toISOString(), // Set current time so it shows in the UI
        }));

        const { error: executionsError } = await supabase
          .from("test_executions")
          .insert(testExecutions);

        if (executionsError) throw executionsError;

        toast({
          title: "Test Cases Added",
          description: "Test cases have been added to this test run",
        });
      }
    } catch (error) {
      console.error("Error creating test executions:", error);
      throw error;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Load releases on component mount
  useEffect(() => {
    const loadReleases = async () => {
      try {
        const releasesData = await getReleases();
        setReleases(releasesData);
        if (releasesData.length > 0) {
          setSelectedRelease(releasesData[0].id);
          // Load test runs for the first release
          loadTestRuns(releasesData[0].id);
        }
      } catch (error) {
        console.error("Error loading releases:", error);
        toast({
          title: "Error",
          description: "Failed to load releases",
          variant: "destructive",
        });
      }
    };

    loadReleases();
  }, []);

  // Load test runs when selected release changes
  const loadTestRuns = async (releaseId: string) => {
    try {
      const testRunsData = await getTestRunsByReleaseId(releaseId);
      setTestRuns(testRunsData);
      if (testRunsData.length > 0) {
        setSelectedTestRun(testRunsData[0].id);
      } else {
        setSelectedTestRun("");
      }
    } catch (error) {
      console.error("Error loading test runs:", error);
      toast({
        title: "Error",
        description: "Failed to load test runs",
        variant: "destructive",
      });
    }
  };

  // Update test runs when selected release changes
  useEffect(() => {
    if (selectedRelease) {
      loadTestRuns(selectedRelease);
    }
  }, [selectedRelease]);

  // Update test executions when selected test run changes
  useEffect(() => {
    if (selectedTestRun) {
      loadTestExecutions(selectedTestRun);
    }
  }, [selectedTestRun]);

  // Reload test cases and reset state when release changes
  useEffect(() => {
    // Clear selected test run when release changes
    setTestExecutions({});

    // Load test data with updated statuses when release or test run changes
    const loadTestData = async () => {
      if (!selectedRelease) return;

      try {
        setIsLoading(true);
        // Load test cases as before
        const { data, error } = await supabase
          .from("test_cases")
          .select("*, features(name)")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Process test cases as before
        // ...existing code for splitting test cases into manual and automated...
        const manual = [];
        const automated = [];

        // Split test cases as before
        // (using the existing code but now we'll default status to 'not_executed')
        // ...

        // Set state with the loaded test cases
        setManualTestCases(manual);
        setAutomatedTestCases(automated);

      } catch (err) {
        // ...existing error handling...
      } finally {
        setIsLoading(false);
      }
    };

    loadTestData();
  }, [selectedRelease]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "blocked":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "not_executed":
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return null;
    }
  };

  // Fix the execute step button handler to prevent null reference errors
  const handleExecuteTest = async (testCase) => {
    if (!selectedTestRun) {
      toast({
        title: "Error",
        description: "Please select or create a test run first",
        variant: "destructive",
      });
      return;
    }

    // Clear any previous steps so stale data is not reused
    setTestSteps([]);

    try {
      const { data, error } = await supabase
        .from("test_steps")
        .select("*")
        .eq("test_case_id", testCase.id)
        .order("step_number");

      if (error) throw error;

      setTestSteps(
        data && data.length > 0
          ? data
          : [
              {
                id: "step1",
                step_number: 1,
                description: "Set up the test environment with required parameters",
                expected_result: "Environment is set up correctly with all parameters configured",
              },
              {
                id: "step2",
                step_number: 2,
                description: "Apply the test stimulus to the system",
                expected_result: "System receives the stimulus and begins processing",
              },
              {
                id: "step3",
                step_number: 3,
                description: "Measure the system response",
                expected_result: "System responds within expected parameters",
              },
              {
                id: "step4",
                step_number: 4,
                description: "Verify the output matches expected results",
                expected_result: "Output matches the expected values within tolerance",
              },
            ]
      );

      // Update selected test case and show execution panel
      setSelectedTestCase({
        ...testCase,
        feature: testCase.feature,
      });
      setIsExecutingTest(true);
    } catch (error) {
      console.error("Error fetching test steps:", error);
      toast({
        title: "Error",
        description: "Failed to fetch test steps",
        variant: "destructive",
      });
    }
  };

  // Return early if there's an error
  if (error) {
    return (
      <TCMSLayout>
        <TCMSHeader title="Test Execution" onSearch={handleSearch} />
        <div className="p-6">
          <ErrorFallback error={error} />
        </div>
      </TCMSLayout>
    );
  }

  // Return loading state
  if (isLoading) {
    return (
      <TCMSLayout>
        <TCMSHeader title="Test Execution" onSearch={handleSearch} />
        <div className="p-6">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading test execution data...</p>
          </div>
        </div>
      </TCMSLayout>
    );
  }

  // Add a loading indicator in the UI for test execution data
  // Modify the rendering of test cases to show loading state
  const renderTestCases = (testCases, isLoading) => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading test cases...</p>
        </div>
      );
    }

    if (loadingExecutions) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading test execution data...</p>
        </div>
      );
    }

    if (testCases.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No test cases found. Create test cases first.
          </p>
        </div>
      );
    }

    // Map through test cases with updated status
    return testCases.map((testCase) => (
      <div
        key={testCase.id}
        className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          {getStatusIcon(testCase.status)}
          <div>
            <h3 className="font-medium text-gray-900">
              {testCase.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                {testCase.feature}
              </span>
              {getPriorityBadge(testCase.priority)}
              {testCase.test_type === 'automated' && (
                <span className="text-xs text-gray-500">
                  {testCase.script}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {testExecutions[testCase.id] && (
            <div className="text-xs text-gray-500">
              Last executed: {new Date(testExecutions[testCase.id].executed_at).toLocaleString()}
            </div>
          )}
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-8 px-3 shadow-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleExecuteTest(testCase);
            }}
          >
            <Play className="mr-1 h-3 w-3" />
            {testCase.test_type === 'manual' ? 'Execute' : 'Run'}
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <TCMSLayout>
      <TCMSHeader title="Test Execution" onSearch={handleSearch} />
      <div className="p-6">
        {/* Wrap your card content in an error boundary to prevent blank screens */}
        <React.Suspense fallback={<div>Loading...</div>}>
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-medium text-gray-900">
                Test Execution
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 mr-2">Release:</span>
                  <Select
                    value={selectedRelease}
                    onValueChange={setSelectedRelease}
                  >
                    <SelectTrigger className="w-[250px] h-9">
                      <SelectValue placeholder="Select a release" />
                    </SelectTrigger>
                    <SelectContent>
                      {releases.map((release) => (
                        <SelectItem key={release.id} value={release.id}>
                          {release.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="h-9 px-3"
                    onClick={() => setIsReleaseFormOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> New
                  </Button>
                </div>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors"
                  onClick={async () => {
                    try {
                      if (!selectedRelease) {
                        toast({
                          title: "Error",
                          description: "Please select a release first",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Create a new test run for the selected release
                      const testRun = await createTestRun({
                        name: `Test Run - ${new Date().toLocaleDateString()}`,
                        status: "in_progress",
                        release_id: selectedRelease,
                      });

                      // Update the test runs list
                      setTestRuns([testRun, ...testRuns]);
                      setSelectedTestRun(testRun.id);

                      toast({
                        title: "Test Run Created",
                        description: "New test run has been created.",
                      });
                    } catch (error) {
                      console.error("Error creating test run:", error);
                      toast({
                        title: "Error",
                        description: "Failed to create test run",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Test Run
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testRuns.length > 0 && (
                <div className="mb-4">
                  <Label
                    htmlFor="testRun"
                    className="text-sm text-gray-500 mb-2 block"
                  >
                    Test Run:
                  </Label>
                  <Select
                    value={selectedTestRun}
                    onValueChange={setSelectedTestRun}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Select a test run" />
                    </SelectTrigger>
                    <SelectContent>
                      {testRuns.map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          {run.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">
                      Passed:{" "}
                      {manualTestCases.filter((tc) => tc.status === "passed")
                        .length +
                        automatedTestCases.filter((tc) => tc.status === "passed")
                          .length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-700">
                      Failed:{" "}
                      {manualTestCases.filter((tc) => tc.status === "failed")
                        .length +
                        automatedTestCases.filter((tc) => tc.status === "failed")
                          .length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-700">
                      Blocked:{" "}
                      {manualTestCases.filter((tc) => tc.status === "blocked")
                        .length +
                        automatedTestCases.filter((tc) => tc.status === "blocked")
                          .length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm text-gray-700">
                      Not Executed:{" "}
                      {manualTestCases.filter(
                        (tc) => tc.status === "not_executed",
                      ).length +
                        automatedTestCases.filter(
                          (tc) => tc.status === "not_executed",
                        ).length}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Total: {manualTestCases.length + automatedTestCases.length} test
                  cases
                </div>
              </div>

              <Tabs
                defaultValue="manual"
                className="w-full"
                onValueChange={setActiveTab}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="manual">Manual Tests</TabsTrigger>
                  <TabsTrigger value="automated">Automated Tests</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  {renderTestCases(manualTestCases, loadingTestCases)}
                </TabsContent>

                <TabsContent value="automated" className="space-y-4">
                  {renderTestCases(automatedTestCases, loadingTestCases)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </React.Suspense>
      </div>

      {/* Test Execution Panel */}
      {isExecutingTest && selectedTestCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4">
              <TestStepExecution
                key={selectedTestCase.id} // <-- added key prop for remounting when testCase changes
                testCase={selectedTestCase}
                steps={testSteps}
                onComplete={async (results) => {
                  try {
                    // Make sure we have a valid test run ID
                    if (!selectedTestRun) {
                      // Create a new test run if none is selected
                      // Make sure we have a valid release ID
                      let releaseId = selectedRelease;
                      if (!releaseId && releases.length > 0) {
                        releaseId = releases[0].id;
                        setSelectedRelease(releaseId);
                      }

                      const newTestRun = await createTestRun({
                        name: `Auto-created Test Run - ${new Date().toLocaleDateString()}`,
                        status: "in_progress",
                        release_id: releaseId,
                      });
                      setTestRuns([newTestRun, ...testRuns]);
                      setSelectedTestRun(newTestRun.id);

                      // Save the test execution result with the new test run
                      const execution = await createTestExecution({
                        test_run_id: newTestRun.id,
                        test_case_id: selectedTestCase.id,
                        status: results.status,
                        notes: results.notes,
                        duration: 0, // In a real app, this would be calculated
                      });

                      // Save the step results if we have a test execution ID
                      if (execution && execution.id) {
                        await createTestStepResults(
                          execution.id,
                          results.stepResults.map(sr => ({
                            test_step_id: sr.test_step_id,
                            status: sr.status,
                            actual_result: sr.notes
                          }))
                        );
                      }
                    } else {
                      // Save the test execution result with the selected test run
                      const execution = await createTestExecution({
                        test_run_id: selectedTestRun,
                        test_case_id: selectedTestCase.id,
                        status: results.status,
                        notes: results.notes,
                        duration: 0, // In a real app, this would be calculated
                      });

                      // Save the step results if we have a test execution ID
                      if (execution && execution.id) {
                        await createTestStepResults(
                          execution.id,
                          results.stepResults.map(sr => ({
                            test_step_id: sr.test_step_id,
                            status: sr.status,
                            actual_result: sr.notes
                          }))
                        );
                      }
                    }

                    // Update the test case status in the UI
                    if (selectedTestCase.test_type === "manual") {
                      setManualTestCases(
                        manualTestCases.map((tc) =>
                          tc.id === selectedTestCase.id
                            ? { ...tc, status: results.status }
                            : tc,
                        ),
                      );
                    } else {
                      setAutomatedTestCases(
                        automatedTestCases.map((tc) =>
                          tc.id === selectedTestCase.id
                            ? { ...tc, status: results.status }
                            : tc,
                        ),
                      );
                    }

                    setIsExecutingTest(false);
                    toast({
                      title: `Test ${results.status === "passed" ? "Passed" : results.status === "failed" ? "Failed" : "Blocked"}`,
                      description: `Test case execution completed with status: ${results.status}`,
                      variant:
                        results.status === "passed" ? "default" : "destructive",
                    });
                  } catch (error) {
                    console.error("Error saving test execution:", error);
                    toast({
                      title: "Error",
                      description: "Failed to save test execution",
                      variant: "destructive",
                    });
                    setIsExecutingTest(false);
                  }
                }}
                onReportBug={() => {
                  // Only open bug form if we have a selected test case
                  if (selectedTestCase) {
                    setIsBugFormOpen(true);
                  } else {
                    toast({
                      title: "Error",
                      description: "Cannot report bug - no test case selected",
                      variant: "destructive",
                    });
                  }
                }}
              />
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsExecutingTest(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report Form - only show if selectedTestCase exists */}
      {selectedTestCase && (
        <BugForm
          isOpen={isBugFormOpen}
          onClose={() => setIsBugFormOpen(false)}
          onSubmit={async (bug) => {
            try {
              // Save the bug to the database
              await createBug({
                ...bug,
                release_id: selectedRelease,
                test_execution_id: selectedTestRun
                  ? `${selectedTestRun}-${selectedTestCase.id}`
                  : undefined,
              });

              toast({
                title: "Bug Reported",
                description:
                  "Bug has been successfully reported and linked to the test case",
              });
              setIsBugFormOpen(false);
            } catch (error) {
              console.error("Error reporting bug:", error);
              toast({
                title: "Error",
                description: "Failed to report bug",
                variant: "destructive",
              });
            }
          }}
          testExecutionId={
            selectedTestRun && selectedTestCase
              ? `${selectedTestRun}-${selectedTestCase.id}`
              : undefined
          }
          testCase={selectedTestCase}
          failedStep={{
            step_number: 2,
            description: "Apply the test stimulus to the system",
            expected_result: "System receives the stimulus and begins processing",
            actual_result: "System did not respond to the stimulus",
          }}
          release={selectedRelease}
        />
      )}

      {/* New Release Dialog */}
      <Dialog open={isReleaseFormOpen} onOpenChange={setIsReleaseFormOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Release</DialogTitle>
            <DialogDescription>
              Add a new release version to organize your test runs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="releaseName">Release Name</Label>
              <Input
                id="releaseName"
                value={newReleaseName}
                onChange={(e) => setNewReleaseName(e.target.value)}
                placeholder="e.g., v1.1.0 - August Release"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReleaseFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (newReleaseName.trim()) {
                  try {
                    // Create the release in the database
                    const newRelease = await createRelease(newReleaseName);

                    // Update the releases list
                    setReleases([newRelease, ...releases]);
                    setSelectedRelease(newRelease.id);

                    toast({
                      title: "Release Created",
                      description: `New release "${newReleaseName}" has been created.`,
                    });
                    setNewReleaseName("");
                    setIsReleaseFormOpen(false);
                  } catch (error) {
                    console.error("Error creating release:", error);
                    toast({
                      title: "Error",
                      description: "Failed to create release",
                      variant: "destructive",
                    });
                  }
                } else {
                  toast({
                    title: "Error",
                    description: "Release name is required",
                    variant: "destructive",
                  });
                }
              }}
            >
              Create Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TCMSLayout>
  );
};

export default TestExecutionPage;
