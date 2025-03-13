import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";

interface TestStep {
  id: string;
  step_number: number;
  description: string;
  expected_result: string;
}

interface StepResult {
  test_step_id: string;
  status: string;
  notes: string;
}

interface TestStepExecutionProps {
  testCase: {
    id: string;
    title: string;
    description?: string; // Make optional to avoid crashes
    feature?: string;
    priority?: string;
  };
  steps: TestStep[];
  onComplete: (results: {
    status: string;
    notes: string;
    stepResults: StepResult[]
  }) => void;
  onReportBug: () => void;
}

const TestStepExecution = ({
  testCase,
  steps = [], // Provide default empty array
  onComplete,
  onReportBug,
}: TestStepExecutionProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [notes, setNotes] = useState("");

  // Reset state when testCase or steps change
  useEffect(() => {
    setCurrentStepIndex(0);
    // Initialize stepResults with the correct length
    setStepResults(Array.isArray(steps) ?
      steps.map(step => ({
        test_step_id: step.id,
        status: "pending",
        notes: ""
      })) : []);
    setNotes("");
  }, [testCase?.id, steps]);

  // Ensure stepResults is always in sync with steps length
  useEffect(() => {
    if (Array.isArray(steps) && steps.length !== stepResults.length) {
      setStepResults(steps.map((step, i) =>
        stepResults[i] || { test_step_id: step.id, status: "pending", notes: "" }
      ));
    }
  }, [steps, stepResults]);

  if (!Array.isArray(steps) || steps.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-medium text-gray-900">
            Test Execution: {getTitle()}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getPriorityBadge(getPriority())}
            <Badge variant="outline">{getFeature()}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-10">No test steps available for this test case.</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have a valid current step
  const currentStep = steps[currentStepIndex] || {
    step_number: 0,
    description: "No step defined",
    expected_result: "No expected result"
  };

  const handleStepResult = (status: string) => {
    const updatedResults = [...stepResults];
    if (updatedResults[currentStepIndex]) {
      updatedResults[currentStepIndex] = {
        ...updatedResults[currentStepIndex],
        status,
        notes
      };
      setStepResults(updatedResults);
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setNotes("");
    } else {
      // Determine overall result
      const hasFailure = updatedResults.some(
        (result) => result.status === "failed",
      );
      const hasBlocked = updatedResults.some(
        (result) => result.status === "blocked",
      );

      let finalStatus = "passed";
      if (hasFailure) finalStatus = "failed";
      else if (hasBlocked) finalStatus = "blocked";

      // Now pass both the final status and the detailed step results
      onComplete({
        status: finalStatus,
        notes,
        stepResults: updatedResults
      });
    }
  };

  // Update getStatusIcon function to map "pending" to the same icon as "not_executed"
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "blocked":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "pending":
      case "not_executed":
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return null;
    }
  };

  // Safe access functions
  const getTitle = () => testCase?.title || "Untitled Test Case";
  const getDescription = () => testCase?.description || "No description provided";
  const getFeature = () => testCase?.feature || "Unknown Feature";
  const getPriority = () => testCase?.priority || "medium";

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-medium text-gray-900">
          Test Execution: {getTitle()}
        </CardTitle>
        <div className="flex items-center gap-2">
          {getPriorityBadge(getPriority())}
          <Badge variant="outline">{getFeature()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-4">{getDescription()}</p>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <h3 className="font-medium text-gray-900">
              Step {currentStep.step_number}
            </h3>
            <div className="flex items-center gap-2">
              {getStatusIcon(stepResults[currentStepIndex]?.status || "pending")}
              <span className="text-sm capitalize">
                {stepResults[currentStepIndex]?.status || "pending"}
              </span>
            </div>
          </div>
          <p className="text-gray-700 mb-4">{currentStep.description}</p>
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Expected Result:
            </h4>
            <p className="text-sm text-gray-600">
              {currentStep.expected_result}
            </p>
          </div>
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Actual Result / Notes:
            </h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter your observations or notes"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStepIndex > 0) {
                setCurrentStepIndex(currentStepIndex - 1);
                setNotes(stepResults[currentStepIndex - 1].notes);
              }
            }}
            disabled={currentStepIndex === 0}
          >
            Previous Step
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                handleStepResult("failed");
                onReportBug();
              }}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Fail & Report Bug
            </Button>
            <Button
              variant="outline"
              className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
              onClick={() => handleStepResult("blocked")}
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              Blocked
            </Button>
            <Button
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              onClick={() => handleStepResult("passed")}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Pass
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestStepExecution;
