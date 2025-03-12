import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface MetricsProps {
  totalTestCases: number;
  passRate: number;
  failRate: number;
  pendingRate: number;
  isLoading?: boolean;
}

const defaultMetrics: MetricsProps = {
  totalTestCases: 248,
  passRate: 72,
  failRate: 15,
  pendingRate: 13,
};

const DashboardMetrics = ({
  totalTestCases = defaultMetrics.totalTestCases,
  passRate = defaultMetrics.passRate,
  failRate = defaultMetrics.failRate,
  pendingRate = defaultMetrics.pendingRate,
  isLoading = false,
}: MetricsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, index) => (
          <Card
            key={index}
            className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm h-[120px] animate-pulse"
          >
            <CardHeader className="pb-2">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium text-gray-900">
            Total Test Cases
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-gray-900">
            {totalTestCases}
          </div>
          <p className="text-sm text-gray-500 mt-1">Across all projects</p>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium text-gray-900">
            Pass Rate
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-gray-900">
            {passRate}%
          </div>
          <Progress
            value={passRate}
            className="h-2 mt-2"
            style={{ backgroundColor: "rgb(243, 244, 246)" }}
          />
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium text-gray-900">
            Fail Rate
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-gray-900">
            {failRate}%
          </div>
          <Progress
            value={failRate}
            className="h-2 mt-2 bg-gray-100"
            style={{ backgroundColor: "rgb(243, 244, 246)" }}
          />
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium text-gray-900">
            Pending
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center">
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-gray-900">
            {pendingRate}%
          </div>
          <Progress
            value={pendingRate}
            className="h-2 mt-2 bg-gray-100"
            style={{ backgroundColor: "rgb(243, 244, 246)" }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardMetrics;
