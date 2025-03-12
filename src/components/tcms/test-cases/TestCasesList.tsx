import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Trash2,
} from "lucide-react";
import { TestCase, TestCasePriority, TestType } from "../types";
import { deleteTestCase } from "../api";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal } from "lucide-react";

interface TestCasesListProps {
  testCases?: TestCase[];
  isLoading?: boolean;
  onSelectTestCase?: (testCase: TestCase) => void;
  onCreateTestCase?: () => void;
  onDeleteTestCase?: (id: string) => void;
  filters?: {
    featureId: string;
    priority: string;
    tagIds: string[];
    status: string;
  };
  onFilterChange?: (filterName: string, value: any) => void;
  filterOptions?: {
    features: Array<{id: string, name: string}>;
    tags: Array<{id: string, name: string}>;
  };
}

const TestCasesList = ({
  testCases = [],
  isLoading = false,
  onSelectTestCase = () => {},
  onCreateTestCase = () => {},
  onDeleteTestCase = () => {},
  filters = { featureId: "", priority: "", tagIds: [], status: "" },
  onFilterChange = () => {},
  filterOptions = { features: [], tags: [] }
}: TestCasesListProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  // Rename from 'filters' to 'localFilters' to avoid naming conflict
  const [localFilters, setLocalFilters] = useState({
    priority: "all",
    type: "all",
    status: "all",
  });

  // Add state for delete confirmation
  const [deletingTestCaseId, setDeletingTestCaseId] = useState<string | null>(null);

  // Filter test cases based on search query and filters
  const filteredTestCases = testCases.filter((testCase) => {
    // Search filter
    const matchesSearch =
      testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testCase.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Priority filter
    const matchesPriority =
      localFilters.priority === "all" || testCase.priority === localFilters.priority;

    // Type filter
    const matchesType =
      localFilters.type === "all" || testCase.test_type === localFilters.type;

    // Status filter
    const matchesStatus =
      localFilters.status === "all" || testCase.status === localFilters.status;

    return matchesSearch && matchesPriority && matchesType && matchesStatus;
  });

  const getPriorityBadge = (priority: TestCasePriority) => {
    switch (priority) {
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            Critical
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: TestType) => {
    switch (type) {
      case "manual":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Manual
          </Badge>
        );
      case "automated":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
            Automated
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-gray-900">
            Test Cases
          </CardTitle>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            New Test Case
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              {/* Added value and onChange to control the input */}
              <Input
                placeholder="Search test cases..."
                className="pl-9 h-10 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select disabled>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                </SelectContent>
              </Select>
              <Select disabled>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                </SelectContent>
              </Select>
              <Select disabled>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="p-4 border border-gray-100 rounded-lg animate-pulse"
              >
                <div className="flex justify-between mb-2">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle delete test case
  const handleDeleteTestCase = async (id: string) => {
    try {
      await deleteTestCase(id);
      toast({
        title: "Test Case Deleted",
        description: "Test case has been successfully deleted",
      });
      // Inform parent component about deletion
      onDeleteTestCase(id);
    } catch (error) {
      console.error("Error deleting test case:", error);
      toast({
        title: "Error",
        description: "Failed to delete test case",
        variant: "destructive",
      });
    } finally {
      setDeletingTestCaseId(null);
    }
  };

  // Count active filters for badge
  const activeFilterCount =
    (filters.featureId ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.status ? 1 : 0) +
    filters.tagIds.length;

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-gray-900">
            Test Cases
          </CardTitle>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors"
            onClick={onCreateTestCase}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Test Case
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search test cases..."
                className="pl-9 h-10 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* Feature Filter */}
              <Select
                value={filters.featureId}
                onValueChange={(value) => onFilterChange("featureId", value)}
              >
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  {filterOptions.features.map(feature => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select
                value={filters.priority}
                onValueChange={(value) => onFilterChange("priority", value)}
              >
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={filters.status}
                onValueChange={(value) => onFilterChange("status", value)}
              >
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>

              {/* Tags Filter - Multi-select dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[120px] h-10 relative">
                    Tags
                    {filters.tagIds.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {filters.tagIds.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filterOptions.tags.length > 0 ? (
                    filterOptions.tags.map(tag => (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        checked={filters.tagIds.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onFilterChange("tagIds", [...filters.tagIds, tag.id]);
                          } else {
                            onFilterChange("tagIds", filters.tagIds.filter(id => id !== tag.id));
                          }
                        }}
                      >
                        {tag.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No tags available</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Reset Filters button - only show if filters are active */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onFilterChange("featureId", "all");
                    onFilterChange("priority", "all");
                    onFilterChange("tagIds", []);
                    onFilterChange("status", "all");
                  }}
                  className="h-10"
                >
                  Clear Filters
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                </Button>
              )}
            </div>
          </div>

          {filteredTestCases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No test cases found. Create a new test case or adjust your
                filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTestCases.map((testCase) => (
                <div
                  key={testCase.id}
                  className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => onSelectTestCase(testCase)}
                >
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {testCase.title}
                    </h3>
                    <div className="flex space-x-2">
                      {getPriorityBadge(testCase.priority)}
                      {getTypeBadge(testCase.test_type)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {testCase.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge
                      variant="outline"
                      className="text-xs font-normal text-gray-500"
                    >
                      Updated {new Date(testCase.updated_at).toLocaleDateString()}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs font-normal ${testCase.status === "ready" ? "bg-green-100 text-green-800" : testCase.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {testCase.status.charAt(0).toUpperCase() +
                          testCase.status.slice(1)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTestCaseId(testCase.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deletingTestCaseId !== null}
        onOpenChange={(open) => !open && setDeletingTestCaseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the test case and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTestCaseId && handleDeleteTestCase(deletingTestCaseId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TestCasesList;
