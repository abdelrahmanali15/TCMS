import React, { useState } from "react";
import TCMSLayout from "../layout/TCMSLayout";
import TCMSHeader from "../layout/TCMSHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, BarChart2, PieChart } from "lucide-react";
import TestExecutionTrends from "../dashboard/TestExecutionTrends";
import TestCaseDistribution from "../dashboard/TestCaseDistribution";

const ReportsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("all");
  const [dateRange, setDateRange] = useState("last30");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Mock releases data
  const releases = [
    { id: "all", name: "All Releases" },
    { id: "release1", name: "v1.0.0 - July Release" },
    { id: "release2", name: "v0.9.5 - June Beta" },
    { id: "release3", name: "v0.9.0 - May Alpha" },
  ];

  // Mock data for test type distribution
  const testTypeData = [
    { category: "Manual", count: 142, color: "#8b5cf6" },
    { category: "Automated", count: 106, color: "#06b6d4" },
  ];

  // Mock data for test status distribution
  const testStatusData = [
    { category: "Passed", count: 156, color: "#22c55e" },
    { category: "Failed", count: 42, color: "#ef4444" },
    { category: "Blocked", count: 18, color: "#f97316" },
    { category: "Not Executed", count: 32, color: "#9ca3af" },
  ];

  // Mock data for bug severity distribution
  const bugSeverityData = [
    { category: "Critical", count: 8, color: "#ef4444" },
    { category: "High", count: 16, color: "#f97316" },
    { category: "Medium", count: 24, color: "#3b82f6" },
    { category: "Low", count: 12, color: "#22c55e" },
  ];

  return (
    <TCMSLayout>
      <TCMSHeader title="Reports" onSearch={handleSearch} />
      <div className="p-6">
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium text-gray-900">
              Test Reports
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Release:</span>
                <Select
                  value={selectedRelease}
                  onValueChange={setSelectedRelease}
                >
                  <SelectTrigger className="w-[200px] h-9">
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
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Period:</span>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7">Last 7 days</SelectItem>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="last90">Last 90 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="details">Detailed Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <TestCaseDistribution
                    title="Test Status Distribution"
                    data={testStatusData}
                  />
                  <TestCaseDistribution
                    title="Test Type Distribution"
                    data={testTypeData}
                  />
                  <TestCaseDistribution
                    title="Bug Severity Distribution"
                    data={bugSeverityData}
                  />
                </div>

                <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl font-medium text-gray-900">
                      Summary Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Test Cases
                        </div>
                        <div className="text-3xl font-semibold text-gray-900">
                          248
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">
                          Pass Rate
                        </div>
                        <div className="text-3xl font-semibold text-green-600">
                          72%
                        </div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">
                          Fail Rate
                        </div>
                        <div className="text-3xl font-semibold text-red-600">
                          17%
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">
                          Automation Coverage
                        </div>
                        <div className="text-3xl font-semibold text-blue-600">
                          43%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <TestExecutionTrends />

                <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl font-medium text-gray-900">
                      Bug Resolution Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Bug resolution trend chart will be displayed here
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl font-medium text-gray-900">
                      Detailed Test Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      Detailed test reports will be displayed here
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TCMSLayout>
  );
};

export default ReportsPage;
