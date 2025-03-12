import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendData {
  month: string;
  passed: number;
  failed: number;
  skipped: number;
}

interface TestExecutionTrendsProps {
  data?: TrendData[];
  isLoading?: boolean;
}

const defaultData: TrendData[] = [
  { month: "Jan", passed: 65, failed: 12, skipped: 8 },
  { month: "Feb", passed: 72, failed: 18, skipped: 5 },
  { month: "Mar", passed: 80, failed: 14, skipped: 6 },
  { month: "Apr", passed: 74, failed: 22, skipped: 4 },
  { month: "May", passed: 85, failed: 10, skipped: 5 },
  { month: "Jun", passed: 90, failed: 8, skipped: 2 },
];

const TestExecutionTrends = ({
  data = defaultData,
  isLoading = false,
}: TestExecutionTrendsProps) => {
  // Find the maximum value to scale the chart
  const maxValue = Math.max(
    ...data.map((item) => item.passed + item.failed + item.skipped),
  );

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gray-900">
            Test Execution Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-medium text-gray-900">
          Test Execution Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <div className="flex h-full">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between text-xs text-gray-500 pr-2 py-4">
              <div>100%</div>
              <div>75%</div>
              <div>50%</div>
              <div>25%</div>
              <div>0%</div>
            </div>

            {/* Chart */}
            <div className="flex-1">
              <div className="flex h-full">
                {data.map((item, index) => {
                  const totalTests = item.passed + item.failed + item.skipped;
                  const passedPercentage = (item.passed / totalTests) * 100;
                  const failedPercentage = (item.failed / totalTests) * 100;
                  const skippedPercentage = (item.skipped / totalTests) * 100;

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col justify-end items-center"
                    >
                      <div className="w-full px-1">
                        <div
                          className="w-full bg-green-500 rounded-t-sm"
                          style={{ height: `${passedPercentage * 0.7}%` }}
                          title={`Passed: ${item.passed} (${passedPercentage.toFixed(1)}%)`}
                        />
                        <div
                          className="w-full bg-red-500"
                          style={{ height: `${failedPercentage * 0.7}%` }}
                          title={`Failed: ${item.failed} (${failedPercentage.toFixed(1)}%)`}
                        />
                        <div
                          className="w-full bg-gray-300 rounded-b-sm"
                          style={{ height: `${skippedPercentage * 0.7}%` }}
                          title={`Skipped: ${item.skipped} (${skippedPercentage.toFixed(1)}%)`}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {item.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center mt-4 space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-sm mr-2" />
              <span>Passed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-sm mr-2" />
              <span>Failed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-sm mr-2" />
              <span>Skipped</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestExecutionTrends;
