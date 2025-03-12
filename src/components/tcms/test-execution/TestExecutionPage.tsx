import React, { useState, useEffect, useCallback, useReducer } from "react";
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
  Filter,
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
  getFeatures,
  getTags,
} from "../api";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// Simple error boundary component
const ErrorFallback = ({ error }) => {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
      <p className="text-red-600 mt-2">{error.message}</p>
    </div>
  );
};

// Optimized reducer for test case state management
type TestCasesState = {
  manual: any[];
  automated: any[];
  loading: boolean;
  error: Error | null;
};

type TestCasesAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { manual: any[]; automated: any[] } }
  | { type: "FETCH_ERROR"; payload: Error }
  | { type: "UPDATE_STATUSES"; payload: Record<string, any> }
  | {
      type: "UPDATE_TEST_CASE";
      payload: { id: string; type: "manual" | "automated"; updates: any };
    }
  | { type: "FILTER_BY_RESULT"; payload: string };

const testCasesReducer = (
  state: TestCasesState,
  action: TestCasesAction
): TestCasesState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        manual: action.payload.manual,
        automated: action.payload.automated,
        loading: false,
        error: null,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "UPDATE_STATUSES":
      return {
        ...state,
        manual: state.manual.map((testCase) => {
          const execution = action.payload[testCase.id];
          let status = execution ? execution.status : "not_executed";
          if (status === "pending") status = "not_executed";
          return {
            ...testCase,
            status,
            lastExecuted: execution ? execution.executed_at : null
          };
        }),
        automated: state.automated.map((testCase) => {
          const execution = action.payload[testCase.id];
          let status = execution ? execution.status : "not_executed";
          if (status === "pending") status = "not_executed";
          return {
            ...testCase,
            status,
            lastExecuted: execution ? execution.executed_at : null
          };
        })
      };
    case "UPDATE_TEST_CASE":
      if (action.payload.type === "manual") {
        return {
          ...state,
          manual: state.manual.map(tc =>
            tc.id === action.payload.id ? { ...tc, ...action.payload.updates } : tc
          )
        };
      } else {
        return {
          ...state,
          automated: state.automated.map(tc =>
            tc.id === action.payload.id ? { ...tc, ...action.payload.updates } : tc
          )
        };
      }
    case "FILTER_BY_RESULT":
      return {
        ...state,
        manual: state.manual.filter(tc => {
          const execution = testExecutions[tc.id];
          return execution && execution.status === action.payload;
        }),
        automated: state.automated.filter(tc => {
          const execution = testExecutions[tc.id];
          return execution && execution.status === action.payload;
        })
      };
    default:
      return state;
  }
};

// Page size for pagination
const PAGE_SIZE = 20;

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

  // Combined test case state with reducer
  const [testCasesState, dispatch] = useReducer(testCasesReducer, {
    manual: [],
    automated: [],
    loading: true,
    error: null
  });

  // Add pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Add initial safe state values
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

  // Add back the getStatusIcon function that was removed during optimization
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
    // ...existing code...
  };

  // Memoized function to load test cases with pagination and filtering
  const loadTestCases = useCallback(async (reset = false) => {
    try {
      // If resetting pagination, start from page 0
      const currentPage = reset ? 0 : page;
      if (reset) {
        setPage(0);
        setHasMore(true);
      }

      dispatch({ type: 'FETCH_START' });

      // Build query with filters and pagination
      let query = supabase
        .from("test_cases")
        .select("*, features(name)")
        .eq("test_type", activeTab) // Filter by current tab
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)
        .order("created_at", { ascending: false });

      // Add search filter if present
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data: pageTestCases, error } = await query;

      if (error) throw error;

      // Check if we've reached the end of data
      setHasMore(pageTestCases.length === PAGE_SIZE);

      // Process test cases
      const processedCases = (pageTestCases || []).map(testCase => ({
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
        script: testCase.test_type === "automated"
          ? `${(testCase.title || "untitled").toLowerCase().replace(/\s+/g, "_")}.py`
          : null,
      }));

      // Update state based on active tab
      if (activeTab === 'manual') {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            manual: reset ? processedCases : [...testCasesState.manual, ...processedCases],
            automated: testCasesState.automated
          }
        });
      } else {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            manual: testCasesState.manual,
            automated: reset ? processedCases : [...testCasesState.automated, ...processedCases]
          }
        });
      }

      // If there's a selected test run, load its executions
      if (selectedTestRun && reset) {
        loadTestExecutions(selectedTestRun);
      }
    } catch (err) {
      console.error("Error loading test cases:", err);
      dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err : new Error(String(err)) });
      toast({
        title: "Error",
        description: "Failed to load test cases",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, activeTab, selectedTestRun]);

  // Load initial data in parallel when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Load releases and test cases in parallel
        const [releasesResponse] = await Promise.all([
          getReleases(),
          loadTestCases(true) // true = reset pagination
        ]);

        setReleases(releasesResponse);

        // Select first release if available
        if (releasesResponse.length > 0) {
          setSelectedRelease(releasesResponse[0].id);
          // Load test runs for the first release
          const testRunsData = await getTestRunsByReleaseId(releasesResponse[0].id);
          setTestRuns(testRunsData);

          // Select first test run if available
          if (testRunsData.length > 0) {
            setSelectedTestRun(testRunsData[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Reload test cases when tab or search changes
  useEffect(() => {
    loadTestCases(true); // Reset pagination
  }, [activeTab, searchQuery]);

  // Optimized function to load test executions
  const loadTestExecutions = async (runId) => {
    if (!runId) {
      setTestExecutions({});
      return;
    }

    try {
      setLoadingExecutions(true);

      // Load test executions for the selected test run
      const { data, error } = await supabase
        .from("test_executions")
        .select("*")
        .eq("test_run_id", runId);

      if (error) throw error;

      // Create a map of executions by test case ID
      const executionsMap = {};

      if (data && data.length > 0) {
        data.forEach(execution => {
          executionsMap[execution.test_case_id] = execution;
        });

        setTestExecutions(executionsMap);
        dispatch({ type: 'UPDATE_STATUSES', payload: executionsMap });
      } else {
        // No executions found - create them in batch and avoid re-fetching
        await createExecutionsForTestRun(runId);
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

  // Optimized function to create test executions with a single request
  const createExecutionsForTestRun = async (runId) => {
    try {
      // Get current user or use a default ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "00000000-0000-0000-0000-000000000000";

      // Get all test cases IDs needed for this test run
      const testCaseIds = [
        ...testCasesState.manual.map(tc => tc.id),
        ...testCasesState.automated.map(tc => tc.id)
      ];

      if (testCaseIds.length === 0) return;

      // Create execution records
      const executionsMap = {};
      const testExecutions = testCaseIds.map(testCaseId => {
        const execution = {
          test_run_id: runId,
          test_case_id: testCaseId,
          status: "not_executed",
          executed_by: userId,
          executed_at: new Date().toISOString()
        };

        // Also store in our local map to avoid refetching
        executionsMap[testCaseId] = execution;
        return execution;
      });

      // Create all executions in a single request
      const { error: executionsError } = await supabase
        .from("test_executions")
        .insert(testExecutions);

      if (executionsError) throw executionsError;

      // Update UI state without requiring a refetch
      setTestExecutions(executionsMap);
      dispatch({ type: 'UPDATE_STATUSES', payload: executionsMap });

      toast({
        title: "Test Cases Added",
        description: "Test cases have been added to this test run",
      });
    } catch (error) {
      console.error("Error creating test executions:", error);
      throw error;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Load test runs when selected release changes
  const loadTestRuns = useCallback(async (releaseId: string) => {
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
  }, []);

  // Update test runs when selected release changes
  useEffect(() => {
    if (selectedRelease) {
      loadTestRuns(selectedRelease);
    }
  }, [selectedRelease, loadTestRuns]);

  // Update test executions when selected test run changes
  useEffect(() => {
    if (selectedTestRun) {
      loadTestExecutions(selectedTestRun);
    }
  }, [selectedTestRun]);

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

  // Infinite scrolling handler for loading more test cases
  const handleLoadMore = useCallback(() => {
    if (!testCasesState.loading && hasMore) {
      setPage(prevPage => prevPage + 1);
      loadTestCases(false); // false = don't reset pagination
    }
  }, [testCasesState.loading, hasMore, loadTestCases]);

  // Return early if there's an error
  if (testCasesState.error) {
    return (
      <TCMSLayout>
        <TCMSHeader title="Test Execution" onSearch={handleSearch} />
        <div className="p-6">
          <ErrorFallback error={testCasesState.error} />
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

  // Render test cases with optimized loading states
  const renderTestCases = (testType) => {
    const testCases = testType === 'manual' ? testCasesState.manual : testCasesState.automated;
    const isLoading = testCasesState.loading;

    if (isLoading && testCases.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading test cases...</p>
        </div>
      );
    }

    if (loadingExecutions && testCases.length === 0) {
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

    return (
      <>
        {/* Test case list */}
        <div className="space-y-4">
          {testCases.map((testCase) => (
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
                {testExecutions[testCase.id] && testExecutions[testCase.id].executed_at && (
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
          ))}
        </div>

        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={testCasesState.loading}
            >
              {testCasesState.loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </>
    );
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
                      {testCasesState.manual.filter((tc) => tc.status === "passed")
                        .length +
                        testCasesState.automated.filter((tc) => tc.status === "passed")
                          .length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-700">
                      Failed:{" "}
                      {testCasesState.manual.filter((tc) => tc.status === "failed")
                        .length +
                        testCasesState.automated.filter((tc) => tc.status === "failed")
                          .length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-700">
                      Blocked:{" "}
                      {testCasesState.manual.filter((tc) => tc.status === "blocked")
                        .length +
                        testCasesState.automated.filter((tc) => tc.status === "blocked")
                          .length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm text-gray-700">
                      Not Executed:{" "}
                      {testCasesState.manual.filter(
                        (tc) => tc.status === "not_executed",
                      ).length +
                        testCasesState.automated.filter(
                          (tc) => tc.status === "not_executed",
                        ).length}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Total: {testCasesState.manual.length + testCasesState.automated.length} test
                  cases
                </div>
              </div>

              <Tabs
                defaultValue="manual"
                className="w-full"
                onValueChange={(value) => {
                  setActiveTab(value);
                  // Reset pagination when tab changes
                  setPage(0);
                }}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="manual">Manual Tests</TabsTrigger>
                  <TabsTrigger value="automated">Automated Tests</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  {renderTestCases('manual')}
                </TabsContent>

                <TabsContent value="automated" className="space-y-4">
                  {renderTestCases('automated')}
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
                      dispatch({
                        type: 'UPDATE_TEST_CASE',
                        payload: {
                          id: selectedTestCase.id,
                          type: 'manual',
                          updates: { status: results.status }
                        }
                      });
                    } else {
                      dispatch({
                        type: 'UPDATE_TEST_CASE',
                        payload: {
                          id: selectedTestCase.id,
                          type: 'automated',
                          updates: { status: results.status }
                        }
                      });
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
