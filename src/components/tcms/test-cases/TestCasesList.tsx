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
} from "lucide-react";
import { TestCase, TestCasePriority, TestType } from "../types";

interface TestCasesListProps {
  testCases?: TestCase[];
  isLoading?: boolean;
  onSelectTestCase?: (testCase: TestCase) => void;
  onCreateTestCase?: () => void;
}

const TestCasesList = ({
  testCases = [],
  isLoading = false,
  onSelectTestCase = () => {},
  onCreateTestCase = () => {},
}: TestCasesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    priority: "all",
    type: "all",
    status: "all",
  });

  // Mock data for initial development
  const mockTestCases: TestCase[] = [
    {
      id: "1",
      feature_id: "feature1",
      title: "Verify CPU core frequency scaling",
      description: "Test that CPU cores can scale frequency based on workload",
      test_type: "manual",
      priority: "high",
      status: "ready",
      created_at: "2024-06-15T10:30:00Z",
      updated_at: "2024-07-10T14:45:00Z",
      created_by: "user1",
    },
    {
      id: "2",
      feature_id: "feature1",
      title: "Verify memory controller bandwidth",
      description:
        "Test memory controller achieves expected bandwidth under load",
      test_type: "automated",
      priority: "critical",
      status: "ready",
      created_at: "2024-06-16T11:20:00Z",
      updated_at: "2024-07-11T09:30:00Z",
      created_by: "user2",
    },
    {
      id: "3",
      feature_id: "feature2",
      title: "Verify PCIe link training",
      description: "Test PCIe link successfully trains at Gen5 speeds",
      test_type: "automated",
      priority: "high",
      status: "draft",
      created_at: "2024-06-17T14:15:00Z",
      updated_at: "2024-07-09T16:40:00Z",
      created_by: "user1",
    },
    {
      id: "4",
      feature_id: "feature2",
      title: "Verify power state transitions",
      description: "Test all power state transitions work correctly",
      test_type: "manual",
      priority: "medium",
      status: "ready",
      created_at: "2024-06-18T09:45:00Z",
      updated_at: "2024-07-12T11:20:00Z",
      created_by: "user3",
    },
    {
      id: "5",
      feature_id: "feature3",
      title: "Verify thermal throttling",
      description:
        "Test CPU throttles correctly when temperature threshold is reached",
      test_type: "automated",
      priority: "critical",
      status: "ready",
      created_at: "2024-06-19T13:30:00Z",
      updated_at: "2024-07-10T10:15:00Z",
      created_by: "user2",
    },
  ];

  // We're now using the testCases prop passed from the parent component

  // Filter test cases based on search query and filters
  const filteredTestCases = testCases.filter((testCase) => {
    // Search filter
    const matchesSearch =
      testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testCase.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Priority filter
    const matchesPriority =
      filters.priority === "all" || testCase.priority === filters.priority;

    // Type filter
    const matchesType =
      filters.type === "all" || testCase.test_type === filters.type;

    // Status filter
    const matchesStatus =
      filters.status === "all" || testCase.status === filters.status;

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
              <Input
                placeholder="Search test cases..."
                className="pl-9 h-10 bg-gray-50 border-gray-200"
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

  return (
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
            <Select
              value={filters.priority}
              onValueChange={(value) =>
                setFilters({ ...filters, priority: value })
              }
            >
              <SelectTrigger className="w-[130px] h-10">
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
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger className="w-[130px] h-10">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automated">Automated</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }
            >
              <SelectTrigger className="w-[130px] h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
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
                  <Badge
                    className={`text-xs font-normal ${testCase.status === "ready" ? "bg-green-100 text-green-800" : testCase.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {testCase.status.charAt(0).toUpperCase() +
                      testCase.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestCasesList;
