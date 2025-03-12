import React, { useState, useEffect, useCallback } from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import TestCasesList from "./TestCasesList";
import TestCaseForm from "../layout/TestCaseForm";
import { TestCase } from "../types";
import { createTestCase, getTestCasesWithSteps, getTestCaseWithSteps } from "../api";
import { useToast } from "@/components/ui/use-toast";
import { useDebouncedCallback } from "use-debounce";

const TestCasesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(
    null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Debounced search function
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      loadTestCases(query);
    },
    300
  );

  // Load test cases with steps already included
  const loadTestCases = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);

      const data = await getTestCasesWithSteps({
        search: searchTerm || searchQuery,
        limit: 100, // You can make this adjustable
        offset: 0
      });

      setTestCases(data);
    } catch (error) {
      console.error("Error loading test cases:", error);
      toast({
        title: "Error",
        description: "Failed to load test cases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Load test cases when component mounts
  useEffect(() => {
    loadTestCases();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Since steps are now included with the test case, this is much simpler
  const handleSelectTestCase = (testCase: TestCase) => {
    // No need to fetch steps separately - they're already included
    setSelectedTestCase(testCase);
    setIsViewDialogOpen(true);
  };

  const handleCreateTestCase = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateSubmit = async (testCase: Partial<TestCase>) => {
    try {
      // Create the test case in the database
      const newTestCase = await createTestCase(testCase);

      // Refresh the entire list (or we could insert the new case at the top)
      loadTestCases();

      toast({
        title: "Success",
        description: "Test case created successfully",
      });

      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating test case:", error);
      toast({
        title: "Error",
        description: "Failed to create test case",
        variant: "destructive",
      });
    }
  };

  return (
    <TCMSLayout>
      <TCMSHeader title="Test Cases" onSearch={handleSearch} />
      <div className="p-6">
        <TestCasesList
          testCases={testCases}
          isLoading={loading}
          onSelectTestCase={handleSelectTestCase}
          onCreateTestCase={handleCreateTestCase}
        />
      </div>

      {/* Create Test Case Dialog */}
      <TestCaseForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* View/Edit Test Case Dialog */}
      {selectedTestCase && (
        <TestCaseForm
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          onSubmit={async (updatedTestCase) => {
            try {
              // No need to handle steps separately anymore
              // After update, refresh our list or update the test case in state
              await loadTestCases();

              toast({
                title: "Success",
                description: "Test case updated successfully",
              });
              setIsViewDialogOpen(false);
            } catch (error) {
              console.error("Error updating test case:", error);
              toast({
                title: "Error",
                description: "Failed to update test case",
                variant: "destructive",
              });
            }
          }}
          testCase={selectedTestCase}
          isEditing={true}
        />
      )}
    </TCMSLayout>
  );
};

export default TestCasesPage;
