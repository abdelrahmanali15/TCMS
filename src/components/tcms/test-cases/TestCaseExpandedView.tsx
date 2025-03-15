import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TCMSLayout from "../layout/TCMSLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { getTestCaseWithSteps, getFeatures, deleteTestCase } from "../api";
import { TestCase } from "../types";
import TestCaseForm from "../layout/TestCaseForm";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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

const TestCaseExpandedView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [features, setFeatures] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const loadTestCase = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await getTestCaseWithSteps(id);
        // console.log("Fetched test case data:", data);

        // Extra logging for tags
        if (data.tags) {
          // console.log("Tags data structure in expanded view:", JSON.stringify(data.tags));
        }

        // Make sure tags is always defined
        if (!data.tags) data.tags = [];

        setTestCase(data);

        // Also load features for context
        const featuresData = await getFeatures();
        setFeatures(featuresData);
      } catch (error) {
        console.error("Error loading test case:", error);
        toast({
          title: "Error",
          description: "Failed to load test case",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTestCase();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteTestCase(id);
      toast({
        title: "Success",
        description: "Test case deleted successfully",
      });
      navigate("/tcms/test-cases");
    } catch (error) {
      console.error("Error deleting test case:", error);
      toast({
        title: "Error",
        description: "Failed to delete test case",
        variant: "destructive",
      });
    }
  };

  const getFeatureName = (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    return feature ? feature.name : "Unknown Feature";
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-blue-100 text-blue-800",
      low: "bg-green-100 text-green-800"
    };

    return (
      <Badge className={colors[priority] || "bg-gray-100 text-gray-800"}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-yellow-100 text-yellow-800",
      ready: "bg-green-100 text-green-800",
      deprecated: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <TCMSLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </TCMSLayout>
    );
  }

  if (!testCase) {
    return (
      <TCMSLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-lg font-medium">Test case not found</h2>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/tcms/test-cases")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Test Cases
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TCMSLayout>
    );
  }

  return (
    <TCMSLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/tcms/test-cases")}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Test Case Details</h1>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle className="text-2xl">{testCase.title}</CardTitle>
                <CardDescription className="mt-1">
                  {getFeatureName(testCase.feature_id)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityBadge(testCase.priority)}
                {getStatusBadge(testCase.status)}
                <Badge variant="outline">{testCase.test_type === 'manual' ? 'Manual' : 'Automated'}</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{testCase.description || "No description provided"}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preconditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{testCase.preconditions || "No preconditions specified"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-gray-500">Category:</span>
                      <span className="col-span-2">{testCase.category || "Not specified"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-gray-500">Created:</span>
                      <span className="col-span-2">{new Date(testCase.created_at).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="col-span-2">{new Date(testCase.updated_at).toLocaleString()}</span>
                    </div>
                    {/* Add tags to metadata */}
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-gray-500">Tags:</span>
                      <div className="col-span-2 flex flex-wrap gap-2">
                        {Array.isArray(testCase.tags) && testCase.tags.length > 0 ? (
                          testCase.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">
                              {tag && typeof tag === 'object' && 'name' in tag ? tag.name : String(tag)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500">No tags</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {testCase.attachments && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap">
                    {testCase.attachments.split('\n').map((link, idx) => (
                      <div key={idx}>
                        {link.trim() && (
                          <a
                            href={link.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block mb-1"
                          >
                            {link.trim()}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Steps Tab */}
          <TabsContent value="steps">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Steps</CardTitle>
                <CardDescription>
                  Step-by-step instructions for executing this test case
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testCase.steps && testCase.steps.length > 0 ? (
                  <div className="space-y-6">
                    {testCase.steps.map((step, index) => (
                      <div key={step.id || index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium">Step {step.step_number}</h3>
                        </div>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Action:</h4>
                          <div className="text-gray-800 whitespace-pre-line border border-gray-100 rounded-md p-3 bg-gray-50">
                            {step.description}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Expected Result:</h4>
                          <div className="text-gray-800 whitespace-pre-line border border-gray-100 rounded-md p-3 bg-gray-50">
                            {step.expected_result}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No test steps defined for this test case
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Execution History</CardTitle>
                <CardDescription>
                  Past executions of this test case
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Execution history not available in this view
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        {testCase && (
          <TestCaseForm
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSubmit={async (updatedTestCase) => {
              if (updatedTestCase.deleted) {
                navigate("/tcms/test-cases");
                return;
              }
              setIsEditDialogOpen(false);
              // Refresh the test case data
              const refreshedTestCase = await getTestCaseWithSteps(id as string);
              setTestCase(refreshedTestCase);
              toast({
                title: "Success",
                description: "Test case updated successfully",
              });
            }}
            testCase={testCase}
            isEditing={true}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TCMSLayout>
  );
};

export default TestCaseExpandedView;
