import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DistributionData {
  category: string;
  count: number;
  color: string;
}

interface TestCaseDistributionProps {
  data?: DistributionData[];
  title?: string;
  isLoading?: boolean;
}

const defaultPriorityData: DistributionData[] = [
  { category: "Critical", count: 24, color: "#ef4444" },
  { category: "High", count: 45, color: "#f97316" },
  { category: "Medium", count: 86, color: "#3b82f6" },
  { category: "Low", count: 32, color: "#22c55e" },
];

const TestCaseDistribution = ({
  data = defaultPriorityData,
  title = "Test Cases by Priority",
  isLoading = false,
}: TestCaseDistributionProps) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
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
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {data.map((item, index) => {
                // Calculate the percentage and angles for the pie slice
                const percentage = (item.count / total) * 100;
                let cumulativePercentage = 0;

                for (let i = 0; i < index; i++) {
                  cumulativePercentage += (data[i].count / total) * 100;
                }

                const startAngle = (cumulativePercentage / 100) * 360;
                const endAngle =
                  ((cumulativePercentage + percentage) / 100) * 360;

                // Convert angles to radians and calculate coordinates
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);

                const x1 = 50 + 50 * Math.cos(startRad);
                const y1 = 50 + 50 * Math.sin(startRad);
                const x2 = 50 + 50 * Math.cos(endRad);
                const y2 = 50 + 50 * Math.sin(endRad);

                // Determine which arc to draw (large or small)
                const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

                // Create the SVG path for the pie slice
                const d = [
                  `M 50 50`,
                  `L ${x1} ${y1}`,
                  `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  `Z`,
                ].join(" ");

                return (
                  <path
                    key={index}
                    d={d}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })}
              <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 rounded-sm mr-2"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 text-sm">{item.category}</div>
              <div className="text-sm font-medium">{item.count}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestCaseDistribution;
