import React, { useState, useEffect, useCallback } from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import TestCasesList from "./TestCasesList";
import TestCaseForm from "../layout/TestCaseForm";
import { TestCase } from "../types";
import { createTestCase, getTestCasesWithSteps, getFeatures, getTags } from "../api";
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
  const [isEditMode, setIsEditMode] = useState(false);

  // New filter states
  const [filters, setFilters] = useState({
    featureId: "all",
    priority: "all",
    tagIds: [] as string[],
    status: "all",
  });

  // Data for filters
  const [features, setFeatures] = useState<Array<{id: string, name: string}>>([]);
  const [tags, setTags] = useState<Array<{id: string, name: string}>>([]);

  // Debounced search function
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      loadTestCases(query);
    },
    300
  );

  // Load test cases with all filters
  const loadTestCases = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);

      const data = await getTestCasesWithSteps({
        search: searchTerm || searchQuery,
        limit: 100, // You can make this adjustable
        offset: 0,
        featureId: filters.featureId !== "all" ? filters.featureId : undefined,
        priority: filters.priority !== "all" ? filters.priority : undefined,
        tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
        status: filters.status !== "all" ? filters.status : undefined
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
  }, [searchQuery, filters]);

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

  // Load test cases when component mounts or filters change
  useEffect(() => {
    loadTestCases();
  }, [loadTestCases, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Since steps are now included with the test case, this is much simpler
  const handleSelectTestCase = (testCase: TestCase) => {
    // Option to navigate to expanded view directly
    // Uncomment this to always use expanded view
    // navigate(`/test-cases/${testCase.id}`);

    // Or keep dialog-based view as default
    setIsEditMode(false);
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

  // Handle test case deletion from the list
  const handleDeleteTestCase = useCallback((id: string) => {
    setTestCases(prevTestCases => prevTestCases.filter(tc => tc.id !== id));
  }, []);

  return (
    <TCMSLayout>
      <TCMSHeader title="Test Cases" onSearch={handleSearch} />
      <div className="p-6">
        <TestCasesList
          testCases={testCases}
          isLoading={loading}
          onSelectTestCase={handleSelectTestCase}
          onCreateTestCase={handleCreateTestCase}
          onDeleteTestCase={handleDeleteTestCase}
          filters={filters}
          onFilterChange={handleFilterChange}
          filterOptions={{
            features,
            tags
          }}
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
              // Handle deletion
              if (updatedTestCase.deleted) {
                handleDeleteTestCase(selectedTestCase.id);
                setIsViewDialogOpen(false);
                return;
              }

              // Normal update flow
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
          viewOnly={true} // Set to true to open in view mode initially
        />
      )}
    </TCMSLayout>
  );
};

export default TestCasesPage;
