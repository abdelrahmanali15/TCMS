import { useState, useReducer, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../../../../supabase/supabase";
import { getFeatures, getTags, ensureTestRunHasExecutions, getEmergencyFallbackTestCases } from "../../api";

// Page size for pagination
const PAGE_SIZE = 20;

// Reducer and state types
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

export const useTestExecution = (activeTab: string, searchQuery: string) => {
  const { toast } = useToast();

  // State for filters
  const [filters, setFilters] = useState({
    featureId: "all",
    priority: "all",
    tagIds: [] as string[],
    status: "all",
    result: "all"
  });

  // Data for filters
  const [features, setFeatures] = useState<Array<{id: string, name: string}>>([]);
  const [tags, setTags] = useState<Array<{id: string, name: string}>>([]);

  // Test case state with reducer
  const [testCasesState, dispatch] = useReducer(testCasesReducer, {
    manual: [],
    automated: [],
    loading: true,
    error: null
  });

  // State to store fetched test cases regardless of filtering
  const [allTestCases, setAllTestCases] = useState<{manual: any[]; automated: any[]}>({
    manual: [],
    automated: []
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [testExecutions, setTestExecutions] = useState<Record<string, any>>({});

  // Function to handle filter changes
  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Load features and tags for filters
  const loadFilterData = useCallback(async () => {
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

      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      );

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

      // Use Promise.race to implement a timeout
      const { data: pageTestCases, error } = await Promise.race([
        query,
        timeoutPromise
      ]);

      if (error) throw error;

      // Check if we've reached the end of data
      setHasMore(pageTestCases ? pageTestCases.length === PAGE_SIZE : false);

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

      // Use fallback data if database query fails
      try {
        console.log("Loading fallback test cases");
        const fallbackCases = await getEmergencyFallbackTestCases(activeTab);

        if (activeTab === 'manual') {
          dispatch({
            type: 'FETCH_SUCCESS',
            payload: {
              manual: fallbackCases,
              automated: []
            }
          });
          setAllTestCases(prev => ({
            ...prev,
            manual: fallbackCases
          }));
        } else {
          dispatch({
            type: 'FETCH_SUCCESS',
            payload: {
              manual: [],
              automated: fallbackCases
            }
          });
          setAllTestCases(prev => ({
            ...prev,
            automated: fallbackCases
          }));
        }
      } catch (fallbackErr) {
        console.error("Even fallback failed:", fallbackErr);
        dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err : new Error(String(err)) });
      }
      toast({
        title: "Warning",
        description: "Using cached test cases - database connection issue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, activeTab, filters.featureId, filters.priority, filters.tagIds, filters.status, toast]);

  // Function to load test executions for a specific run
  const loadTestExecutions = useCallback(async (runId) => {
    if (!runId) {
      setTestExecutions({});
      return;
    }

    try {
      setLoadingExecutions(true);

      // Ensure the test run has executions
      await ensureTestRunHasExecutions(runId);

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
  }, [toast]);

  // Update the test case status in the UI
  const updateTestCaseStatus = useCallback((testCaseId: string, testType: "manual" | "automated", status: string) => {
    dispatch({
      type: 'UPDATE_TEST_CASE',
      payload: {
        id: testCaseId,
        type: testType,
        updates: { status }
      }
    });

    // Update allTestCases state
    setAllTestCases(prev => {
      const typeKey = testType === "manual" ? "manual" : "automated";
      return {
        ...prev,
        [typeKey]: prev[typeKey].map(tc =>
          tc.id === testCaseId ? { ...tc, status } : tc
        )
      };
    });
  }, []);

  // Update test executions map
  const updateTestExecution = useCallback((testCaseId: string, testRunId: string, status: string, notes?: string) => {
    setTestExecutions(prev => ({
      ...prev,
      [testCaseId]: {
        test_run_id: testRunId,
        test_case_id: testCaseId,
        status,
        executed_at: new Date().toISOString(),
        notes: notes || ""
      }
    }));
  }, []);

  // Infinite scrolling handler for loading more test cases
  const handleLoadMore = useCallback(() => {
    if (!testCasesState.loading && hasMore) {
      setPage(prevPage => prevPage + 1);
      loadTestCases(false); // false = don't reset pagination
    }
  }, [testCasesState.loading, hasMore, loadTestCases]);

  // Calculate filtered test cases based on executions and result filter
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

  return {
    testCasesState,
    isLoading,
    loadingExecutions,
    testExecutions,
    filteredTestCases,
    features,
    tags,
    filters,
    hasMore,
    handleFilterChange,
    handleLoadMore,
    updateTestCaseStatus,
    updateTestExecution,
    loadFilterData,
    loadTestExecutions,
    loadTestCases
  };
};
