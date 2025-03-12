import React, { useState, useEffect } from "react";
import DashboardMetrics from "./DashboardMetrics";
import RecentTestRuns from "./RecentTestRuns";
import TestExecutionTrends from "./TestExecutionTrends";
import TestCaseDistribution from "./TestCaseDistribution";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const typeDistributionData = [
  { category: "Manual", count: 142, color: "#8b5cf6" },
  { category: "Automated", count: 106, color: "#06b6d4" },
];

const TCMSDashboard = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading data on initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Function to refresh dashboard data
  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Button
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Metrics Cards */}
      <DashboardMetrics isLoading={loading} />

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TestExecutionTrends isLoading={loading} />
        <RecentTestRuns isLoading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TestCaseDistribution
          title="Test Cases by Priority"
          isLoading={loading}
        />
        <TestCaseDistribution
          title="Test Cases by Type"
          data={typeDistributionData}
          isLoading={loading}
        />
      </div>
    </div>
  );
};

export default TCMSDashboard;
