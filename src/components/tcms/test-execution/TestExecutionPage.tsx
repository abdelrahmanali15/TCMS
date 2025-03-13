import React, { useState, useEffect, useCallback, useReducer, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import TestFilters from "./TestFilters";
import TestCaseList from "./TestCaseList"; // Import the new component

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
  | { type: "APPLY_FILTERS"; payload: { manual: any[]; automated: any[] } };

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
          const status = execution ? execution.status : "not_executed";
          return {
            ...testCase,
            status,
            lastExecuted: execution ? execution.executed_at : null
          };
        }),
        automated: state.automated.map((testCase) => {
          const execution = action.payload[testCase.id];
          const status = execution ? execution.status : "not_executed";
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
    case "APPLY_FILTERS":
      return {
        ...state,
        manual: action.payload.manual,
        automated: action.payload.automated,
      };
    default:
      return state;
  }
};

// Page size for pagination
const PAGE_SIZE = 20;

const TestExecutionPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedRelease, setSelectedRelease] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null);
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  const [isReleaseFormOpen, setIsReleaseFormOpen] = useState(false);
  const [newReleaseName, setNewReleaseName] = useState("");
  const { toast } = useToast();
  const [testSteps, setTestSteps] = useState<any[]>([]);

  // Add filters similar to TestCasesPage
  const [filters, setFilters] = useState({
    featureId: "all",
    priority: "all",
    tagIds: [] as string[],
    status: "all",
    result: "all" // New filter for test execution results
  });

  // Data for filters
  const [features, setFeatures] = useState<Array<{id: string, name: string}>>([]);
  const [tags, setTags] = useState<Array<{id: string, name: string}>>([]);

  // Combined test case state with reducer
  const [testCasesState, dispatch] = useReducer(testCasesReducer, {
    manual: [],
    automated: [],
    loading: true,
    error: null
  });
  // New state to store fetched test cases regardless of filtering
  const [allTestCases, setAllTestCases] = useState<{manual: any[]; automated: any[]}>({manual: [], automated: []});

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

  // Function to handle filter changes
  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Load features and tags for filters
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [featuresData, tagsData] = await Promise.all([
          getFeatures(),
          getTags()
        ]);

        setFeatures(featuresData);
        setTags(tagsData);
      } catch (error) {
        console.error("Error loading filter data:", error);
      }
    };

    loadFilterData();
  }, []);

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
      if (debouncedSearch) {
        query = query.ilike("title", `%${debouncedSearch}%`);
      }

      // Apply feature filter
      if (filters.featureId && filters.featureId !== "all") {
        query = query.eq("feature_id", filters.featureId);
      }

      // Apply priority filter
      if (filters.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      // Apply status filter (draft, ready, deprecated)
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data: pageTestCases, error } = await query;

      if (error) throw error;

      // Check if we've reached the end of data
      setHasMore(pageTestCases.length === PAGE_SIZE);

      // Process test cases
      let processedCases = (pageTestCases || []).map(testCase => ({
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

      // Apply tag filtering if any tags are selected
      if (filters.tagIds && filters.tagIds.length > 0) {
        // We need to get test cases that have these tags
        const { data: taggedCases } = await supabase
          .from('test_case_tags')
          .select('test_case_id')
          .in('tag_id', filters.tagIds);

        if (taggedCases && taggedCases.length > 0) {
          const taggedCaseIds = taggedCases.map(tc => tc.test_case_id);
          processedCases = processedCases.filter(tc => taggedCaseIds.includes(tc.id));
        } else {
          // No cases match the tag filter
          processedCases = [];
        }
      }

      // Update state based on active tab
      if (activeTab === 'manual') {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            manual: reset ? processedCases : [...testCasesState.manual, ...processedCases],
            automated: testCasesState.automated
          }
        });
        setAllTestCases(prev => ({
          ...prev,
          manual: reset ? processedCases : [...prev.manual, ...processedCases]
        }));
      } else {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            manual: testCasesState.manual,
            automated: reset ? processedCases : [...testCasesState.automated, ...processedCases]
          }
        });
        setAllTestCases(prev => ({
          ...prev,
          automated: reset ? processedCases : [...prev.automated, ...processedCases]
        }));
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
  }, [
    page,
    debouncedSearch,
    activeTab,
    filters.featureId,
    filters.priority,
    filters.tagIds,  // Add tagIds to dependency array
    filters.status   // Add status to dependency array
  ]);

  // Load initial data in parallel when component mounts
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load releases first
      const releasesResponse = await getReleases();
      setReleases(releasesResponse);

      // Select first release if available
      if (releasesResponse.length > 0) {
        setSelectedRelease(releasesResponse[0].id);
        // Load test runs for the first release
        const testRunsData = await getTestRunsByReleaseId(releasesResponse[0].id);
        setTestRuns(testRunsData);

        // Select first test run if available
        if (testRunsData.length > 0 && !selectedTestRun) {
          setSelectedTestRun(testRunsData[0].id);
        }
      }

      // Wait until after releases are loaded to call loadTestCases
      await loadTestCases(true);
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
  }, [loadTestCases, toast, selectedTestRun]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Create memoized dependencies for query filters
  const queryDeps = useMemo(() => [activeTab, debouncedSearch], [activeTab, debouncedSearch]);

  useEffect(() => {
    if (!isLoading) {
      loadTestCases(true);
    }
  }, [queryDeps, loadTestCases, isLoading]);

  // Update filteredTestCases to properly handle result filter
  const filteredTestCases = useMemo(() => {
    const base = activeTab === "manual" ? allTestCases.manual : allTestCases.automated;

    // First apply execution status to each test case
    const updatedBase = base.map(tc => {
      const execution = testExecutions[tc.id];
      return {
        ...tc,
        status: execution ? execution.status : "not_executed"
      };
    });

    // Then apply result filter if needed
    if (filters.result && filters.result !== "all") {
      return updatedBase.filter(tc => {
        const execution = testExecutions[tc.id];
        if (filters.result === "not_executed") {
          // Match either no execution or pending status
          return !execution || execution.status === "pending";
        } else {
          // For passed, failed, blocked - explicitly match that status
          return execution && execution.status === filters.result;
        }
      });
    }

    return updatedBase;
  }, [allTestCases, activeTab, filters.result, testExecutions]);

  // Optimized function to load test executions
  const loadTestExecutions = useCallback(async (runId) => {
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
  }, [dispatch, toast]);

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
  }, [selectedTestRun, loadTestExecutions]);

  // Handle executing a test case
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

  // Render test cases with optimized loading states
  const renderTestCases = (testType) => {
    const testCases = testType === 'manual' ? filteredTestCases : filteredTestCases;
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

  // Count active filters for badge display
  const activeFilterCount =
    (filters.featureId !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.result !== "all" ? 1 : 0) +
    filters.tagIds.length;

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
                  <span className="text-sm text-gray-500 mr-2">Test Run:</span>
                  <Select
                    value={selectedTestRun}
                    onValueChange={setSelectedTestRun}
                  >
                    <SelectTrigger className="w-[250px] h-9">
                      <SelectValue placeholder="Select a test run" />
                    </SelectTrigger>
                    <SelectContent>
                      {testRuns.map((testRun) => (
                        <SelectItem key={testRun.id} value={testRun.id}>
                          {testRun.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Tabs defaultValue="manual" className="w-full">
                  <TabsList>
                    <TabsTrigger value="manual" onClick={() => setActiveTab("manual")}>Manual</TabsTrigger>
                    <TabsTrigger value="automated" onClick={() => setActiveTab("automated")}>Automated</TabsTrigger>
                  </TabsList>
                  <TabsContent value="manual">
                    <TestFilters
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      features={features}
                      tags={tags}
                    />
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <TestCaseList
                        testCases={filteredTestCases}
                        testExecutions={testExecutions}
                        isLoading={testCasesState.loading}
                        isLoadingExecutions={loadingExecutions}
                        hasMore={hasMore}
                        onLoadMore={handleLoadMore}
                        onExecuteTest={handleExecuteTest}
                      />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="automated">
                    <TestFilters
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      features={features}
                      tags={tags}
                    />
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <TestCaseList
                        testCases={filteredTestCases}
                        testExecutions={testExecutions}
                        isLoading={testCasesState.loading}
                        isLoadingExecutions={loadingExecutions}
                        hasMore={hasMore}
                        onLoadMore={handleLoadMore}
                        onExecuteTest={handleExecuteTest}
                      />
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </React.Suspense>

        {/* Test Execution Panel */}
        {isExecutingTest && selectedTestCase && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <TestStepExecution
                testCase={selectedTestCase}
                steps={testSteps}
                onComplete={async (results) => {
                  try {
                    if (!selectedTestRun) {
                      // Create a new test run for the selected release
                      const newTestRun = await createTestRun({
                        name: `Test Run - ${new Date().toLocaleDateString()}`,
                        status: "in_progress",
                        release_id: selectedRelease,
                      });

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

                    // Update allTestCases state to reflect the new status
                    setAllTestCases(prev => {
                      const typeKey = selectedTestCase.test_type === "manual" ? "manual" : "automated";
                      return {
                        ...prev,
                        [typeKey]: prev[typeKey].map(tc =>
                          tc.id === selectedTestCase.id ? { ...tc, status: results.status } : tc
                        )
                      };
                    });

                    // Also update testExecutions to include the new execution
                    setTestExecutions(prev => ({
                      ...prev,
                      [selectedTestCase.id]: {
                        // Don't spread the execution object directly as it might be undefined
                        // Instead, create a new object with the properties we know will exist
                        test_run_id: selectedTestRun || "",
                        test_case_id: selectedTestCase.id,
                        status: results.status,
                        executed_at: new Date().toISOString(),
                        notes: results.notes || ""
                      }
                    }));

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
      </div >
    </TCMSLayout>
  );
};

export default TestExecutionPage;
