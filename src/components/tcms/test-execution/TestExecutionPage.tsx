import React, { useState, useEffect, useCallback } from "react";
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
} from "../api";
import { ScrollArea } from "@/components/ui/scroll-area";
import TestFilters from "./TestFilters";
import TestCaseList from "./TestCaseList";
import { useTestExecution } from "./hooks/useTestExecution";

// Simple error boundary component
const ErrorFallback = ({ error }) => {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
      <p className="text-red-600 mt-2">{error.message}</p>
    </div>
  );
};

const TestExecutionPage = () => {
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null);
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  const [isReleaseFormOpen, setIsReleaseFormOpen] = useState(false);
  const [newReleaseName, setNewReleaseName] = useState("");
  const [testSteps, setTestSteps] = useState<any[]>([]);

  // Release and test run state
  const [selectedRelease, setSelectedRelease] = useState("");
  const [releases, setReleases] = useState<Array<{ id: string; name: string }>>([]);
  const [testRuns, setTestRuns] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTestRun, setSelectedTestRun] = useState("");
  // NEW state for initial data
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const { toast } = useToast();

  // Setup debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use the custom hook
  const {
    filteredTestCases,
    isLoading,
    loadingExecutions,
    hasMore,
    testExecutions,
    filters,
    features,
    tags,
    loadTestCases,
    loadTestExecutions,
    loadFilterData,
    handleFilterChange,
    handleLoadMore,
    updateTestCaseStatus,
    updateTestExecution
  } = useTestExecution(activeTab, debouncedSearch);

  // Load filter data on mount
  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Load initial data - releases and test runs
  const loadInitialData = useCallback(async () => {
    try {
      // console.log("Loading initial data...");

      // Load releases
      const releasesResponse = await getReleases();
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

      // console.log("Initial data loaded, releases:", releasesResponse.length);

      // We'll let the effect handle initial test case loading
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      });
    } finally {
      // Mark initial data as loaded to prevent intermediate flicker
      setInitialDataLoaded(true);
    }
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load test cases when tab or search changes - ensure we only load once initial state is ready
  useEffect(() => {
    // console.log("Tab/search changed, loading test cases:", { activeTab, debouncedSearch, isLoading });
    // Always load test cases when tab or search changes, regardless of loading state
    loadTestCases(true);
  }, [activeTab, debouncedSearch, loadTestCases]);

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
  }, [toast]);

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

  // Wrap the render in a loading check
  if (!initialDataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading data...</div>
      </div>
    );
  }

  return (
    <TCMSLayout>
      <TCMSHeader title="Test Execution" onSearch={handleSearch} />
      <div className="p-6 flex flex-col h-[calc(100vh-64px)]">
        <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6 flex flex-col flex-grow">
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
                    <ScrollArea className="p-4 pb-12 mb-8 h-[calc(100vh-350px)] w-full rounded-md border border-gray-100 shadow-sm bg-white/60 backdrop-blur-sm">
                      <TestCaseList
                      testCases={filteredTestCases}
                      testExecutions={testExecutions}
                      isLoading={isLoading}
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
                    {/* <ScrollArea className="h-[400px] w-full rounded-md border"> */}
                    <ScrollArea className="p-4 pb-12 mb-8 h-[calc(100vh-350px)] w-full rounded-md border border-gray-100 shadow-sm bg-white/60 backdrop-blur-sm">
                      <TestCaseList
                        testCases={filteredTestCases}
                        testExecutions={testExecutions}
                        isLoading={isLoading}
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
          <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <TestStepExecution
                testCase={selectedTestCase}
                steps={testSteps}
                onComplete={async (results) => {
                  try {
                    let executionId;
                    let targetRunId = selectedTestRun;

                    if (!selectedTestRun) {
                      // Create a new test run for the selected release
                      const newTestRun = await createTestRun({
                        name: `Test Run - ${new Date().toLocaleDateString()}`,
                        status: "in_progress",
                        release_id: selectedRelease,
                      });
                      targetRunId = newTestRun.id;

                      // Update the test runs list
                      setTestRuns(prev => [newTestRun, ...prev]);
                      setSelectedTestRun(newTestRun.id);
                    }

                    // Save the test execution result
                    const execution = await createTestExecution({
                      test_run_id: targetRunId,
                      test_case_id: selectedTestCase.id,
                      status: results.status,
                      notes: results.notes,
                      duration: 0, // In a real app, this would be calculated
                    });

                    executionId = execution.id;

                    // Save the step results if we have a test execution ID
                    if (executionId) {
                      await createTestStepResults(
                        executionId,
                        results.stepResults.map(sr => ({
                          test_step_id: sr.test_step_id,
                          status: sr.status,
                          actual_result: sr.notes
                        }))
                      );
                    }

                    // Update the test case status in the UI using the hook functions
                    updateTestCaseStatus(
                      selectedTestCase.id,
                      selectedTestCase.test_type === "manual" ? "manual" : "automated",
                      results.status
                    );

                    // Update test execution state
                    updateTestExecution(
                      selectedTestCase.id,
                      targetRunId,
                      results.status,
                      results.notes
                    );

                    setIsExecutingTest(false);
                    toast({
                      title: `Test ${results.status === "passed" ? "Passed" : results.status === "failed" ? "Failed" : "Blocked"}`,
                      description: `Test case execution completed with status: ${results.status}`,
                      variant: results.status === "passed" ? "default" : "destructive",
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
      </div>
    </TCMSLayout>
  );
};

export default TestExecutionPage;
