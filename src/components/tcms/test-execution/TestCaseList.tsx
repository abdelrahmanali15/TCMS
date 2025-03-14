import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Clock, Play } from "lucide-react";

type TestCase = {
  id: string;
  title: string;
  feature: string;
  priority: string;
  status: string;
  test_type: string;
  script?: string | null;
};

interface TestCaseListProps {
  testCases: TestCase[];
  testExecutions: Record<string, any>;
  isLoading: boolean;
  isLoadingExecutions: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onExecuteTest: (testCase: TestCase) => void;
}

const TestCaseList = ({
  testCases,
  testExecutions,
  isLoading,
  isLoadingExecutions,
  hasMore,
  onLoadMore,
  onExecuteTest,
}: TestCaseListProps) => {
  // Helper function to get status icon based on status
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

  // Helper function to get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">Critical</span>;
      case "high":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">High</span>;
      case "medium":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Medium</span>;
      case "low":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Low</span>;
      default:
        return null;
    }
  };

  if (isLoading && testCases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading test cases...</p>
      </div>
    );
  }

  if (isLoadingExecutions && testCases.length === 0) {
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
                  onExecuteTest(testCase);
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
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
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

export default TestCaseList;
