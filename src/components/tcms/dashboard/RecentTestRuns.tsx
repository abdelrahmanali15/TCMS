import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface TestRun {
  id: string;
  name: string;
  status: "planned" | "in_progress" | "completed" | "aborted";
  passRate: number;
  totalTests: number;
  executedBy: {
    name: string;
    avatar: string;
  };
  executedAt: string;
}

interface RecentTestRunsProps {
  testRuns?: TestRun[];
  isLoading?: boolean;
}

const defaultTestRuns: TestRun[] = [
  {
    id: "1",
    name: "Regression Test Suite - v2.4",
    status: "completed",
    passRate: 92,
    totalTests: 45,
    executedBy: {
      name: "Alice Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    },
    executedAt: "2024-07-15T14:30:00Z",
  },
  {
    id: "2",
    name: "Smoke Test - Daily Build",
    status: "completed",
    passRate: 100,
    totalTests: 12,
    executedBy: {
      name: "Bob Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    },
    executedAt: "2024-07-16T09:15:00Z",
  },
  {
    id: "3",
    name: "Feature Test - Signal Processing",
    status: "in_progress",
    passRate: 67,
    totalTests: 24,
    executedBy: {
      name: "Carol Williams",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    },
    executedAt: "2024-07-16T11:45:00Z",
  },
  {
    id: "4",
    name: "Integration Test - API Layer",
    status: "planned",
    passRate: 0,
    totalTests: 18,
    executedBy: {
      name: "David Miller",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
    executedAt: "2024-07-17T13:00:00Z",
  },
];

const getStatusBadge = (status: TestRun["status"]) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          Completed
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          In Progress
        </Badge>
      );
    case "planned":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
          Planned
        </Badge>
      );
    case "aborted":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          Aborted
        </Badge>
      );
    default:
      return null;
  }
};

const RecentTestRuns = ({
  testRuns = defaultTestRuns,
  isLoading = false,
}: RecentTestRunsProps) => {
  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gray-900">
            Recent Test Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between pb-4 border-b border-gray-100 animate-pulse"
              >
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-medium text-gray-900">
          Recent Test Runs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {testRuns.map((run) => (
            <div
              key={run.id}
              className="flex items-start justify-between pb-4 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{run.name}</h4>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <CalendarDays className="h-3.5 w-3.5 mr-1" />
                    {format(new Date(run.executedAt), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center">
                    {run.status === "completed" ? (
                      <>
                        {run.passRate >= 90 ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500 mr-1" />
                        )}
                        {run.passRate}% passed
                      </>
                    ) : run.status === "in_progress" ? (
                      <>
                        <Clock className="h-3.5 w-3.5 text-blue-500 mr-1" />
                        {run.totalTests} tests
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5 text-gray-400 mr-1" />
                        {run.totalTests} tests
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarImage
                    src={run.executedBy.avatar}
                    alt={run.executedBy.name}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-800 font-medium text-xs">
                    {run.executedBy.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {getStatusBadge(run.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTestRuns;
