import React, { useState, useEffect } from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import TestCasesList from "./TestCasesList";
import TestCaseForm from "../layout/TestCaseForm";
import { TestCase } from "../types";
import { createTestCase, getTestStepsByTestCaseId } from "../api";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../../../supabase/supabase";

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

  // Load test cases when component mounts
  useEffect(() => {
    const loadTestCases = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("test_cases")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTestCases(data || []);
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
    };

    loadTestCases();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectTestCase = async (testCase: TestCase) => {
    try {
      // First set the test case to show basic info while we load steps
      setSelectedTestCase(testCase);
      setIsViewDialogOpen(true);

      // Fetch steps for this test case
      const steps = await getTestStepsByTestCaseId(testCase.id);

      // Update the test case with steps
      setSelectedTestCase(prevTestCase => {
        if (!prevTestCase) return testCase;
        return {
          ...prevTestCase,
          steps: steps || []
        };
      });
    } catch (error) {
      console.error("Error loading test steps:", error);
      toast({
        title: "Error",
        description: "Failed to load test steps",
        variant: "destructive",
      });
    }
  };

  const handleCreateTestCase = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateSubmit = async (testCase: Partial<TestCase>) => {
    try {
      // Create the test case in the database
      const newTestCase = await createTestCase(testCase);

      // Check if this test case already exists in our state
      const alreadyExists = testCases.some(tc => tc.id === newTestCase.id);

      if (!alreadyExists) {
        // Only add to state if it's not already there
        setTestCases([newTestCase, ...testCases]);
      }

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
          onSubmit={(updatedTestCase) => {
            console.log("Updating test case:", {
              ...selectedTestCase,
              ...updatedTestCase,
            });

            // Update the test case in the list
            setTestCases(
              testCases.map((tc) =>
                tc.id === selectedTestCase.id
                  ? { ...tc, ...updatedTestCase }
                  : tc,
              ),
            );

            toast({
              title: "Success",
              description: "Test case updated successfully",
            });
            setIsViewDialogOpen(false);
          }}
          testCase={selectedTestCase}
          isEditing={true}
        />
      )}
    </TCMSLayout>
  );
};

export default TestCasesPage;
