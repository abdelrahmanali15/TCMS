import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TestCase, TestCasePriority, TestType, TestCaseStatus } from "../types";
import { createTestCase, updateTestCase } from "../api";
import { supabase } from "../../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TestCaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (testCase: Partial<TestCase>) => void;
  testCase?: TestCase;
  isEditing?: boolean;
}

const TestCaseForm = ({
  isOpen,
  onClose,
  onSubmit,
  testCase,
  isEditing = false,
}: TestCaseFormProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<TestCase>>(
    testCase || {
      title: "",
      description: "",
      preconditions: "",
      test_type: "manual",
      priority: "medium",
      status: "draft",
      feature_id: "", // This would typically be selected from a dropdown
      category: "functional", // Default category
      attachments: "", // For Drive links
    },
  );

  const [steps, setSteps] = useState<
    Array<{ step_number: number; description: string; expected_result: string }>
  >(
    testCase?.steps || [
      { step_number: 1, description: "", expected_result: "" },
    ],
  );

  const [tags, setTags] = useState<string[]>(
    testCase?.tags?.map((tag) => tag.name) || [],
  );
  const [newTag, setNewTag] = useState("");

  // State to store features from the database
  const [features, setFeatures] = useState<Array<{ id: string; name: string }>>(
    [],
  );

  // Load features from the database
  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const { data, error } = await supabase
          .from("features")
          .select("id, name")
          .order("name");

        if (error) throw error;
        setFeatures(data || []);
      } catch (error) {
        console.error("Error loading features:", error);
        toast({
          title: "Error",
          description: "Failed to load features",
          variant: "destructive",
        });
      }
    };

    loadFeatures();
  }, []);

  const handleChange = (field: keyof TestCase, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate form
    if (!form.title?.trim()) {
      toast({
        title: "Error",
        description: "Test case title is required",
        variant: "destructive",
      });
      return;
    }

    if (!form.feature_id) {
      toast({
        title: "Error",
        description: "Feature is required",
        variant: "destructive",
      });
      return;
    }

    // Validate steps
    if (steps.length === 0) {
      toast({
        title: "Error",
        description: "At least one test step is required",
        variant: "destructive",
      });
      return;
    }

    for (const step of steps) {
      if (!step.description.trim()) {
        toast({
          title: "Error",
          description: `Step ${step.step_number} description is required`,
          variant: "destructive",
        });
        return;
      }
      if (!step.expected_result.trim()) {
        toast({
          title: "Error",
          description: `Step ${step.step_number} expected result is required`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Prepare the complete test case object
      const completeTestCase = {
        ...form,
        steps,
        tags: tags.map((name) => ({ name })),
      };

      // Save to database
      if (isEditing && testCase?.id) {
        await updateTestCase(testCase.id, completeTestCase);
      } else {
        await createTestCase(completeTestCase);
      }

      // Submit the form with steps and tags
      onSubmit(completeTestCase);
      onClose();

      toast({
        title: isEditing ? "Test Case Updated" : "Test Case Created",
        description: isEditing
          ? "Test case has been successfully updated"
          : "Test case has been successfully created",
      });
    } catch (error) {
      console.error("Error saving test case:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} test case`,
        variant: "destructive",
      });
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        step_number: steps.length + 1,
        description: "",
        expected_result: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    setSteps(newSteps);
  };

  const updateStep = (
    index: number,
    field: "description" | "expected_result",
    value: string,
  ) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Test Case" : "Create New Test Case"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the test case details."
              : "Add a new test case to your repository."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto pr-2 max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="feature">Feature</Label>
              <Select
                value={form.feature_id}
                onValueChange={(value) => handleChange("feature_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a feature" />
                </SelectTrigger>
                <SelectContent>
                  {features.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  handleChange("status", value as TestCaseStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter test case title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter test case description"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label>Test Steps</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Step
              </Button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto p-1">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md p-3 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">
                      Step {step.step_number}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`step-${index}-desc`} className="text-xs">
                      Description
                    </Label>
                    <Textarea
                      id={`step-${index}-desc`}
                      value={step.description}
                      onChange={(e) =>
                        updateStep(index, "description", e.target.value)
                      }
                      placeholder="What to do in this step"
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor={`step-${index}-expected`}
                      className="text-xs"
                    >
                      Expected Result
                    </Label>
                    <Textarea
                      id={`step-${index}-expected`}
                      value={step.expected_result}
                      onChange={(e) =>
                        updateStep(index, "expected_result", e.target.value)
                      }
                      placeholder="What should happen when this step is executed"
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              ))}

              {steps.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No steps added yet. Click "Add Step" to add test steps.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="preconditions">Preconditions</Label>
            <Textarea
              id="preconditions"
              value={form.preconditions}
              onChange={(e) => handleChange("preconditions", e.target.value)}
              placeholder="Enter test case preconditions"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Test Type</Label>
              <Select
                value={form.test_type}
                onValueChange={(value) =>
                  handleChange("test_type", value as TestType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automated">Automated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  handleChange("priority", value as TestCasePriority)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.category as string}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smoke">Smoke</SelectItem>
                <SelectItem value="regression">Regression</SelectItem>
                <SelectItem value="functional">Functional</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attachments">Attachments (Drive Links)</Label>
            <Textarea
              id="attachments"
              value={form.attachments as string}
              onChange={(e) => handleChange("attachments", e.target.value)}
              placeholder="Enter Google Drive links to datasheets, logs, waveforms, etc. (one per line)"
              rows={2}
            />
            <p className="text-xs text-gray-500">
              Add links to relevant files such as datasheets, logs, or waveforms
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-2 py-1 gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-gray-500">No tags added</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                id="newTag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Update Test Case" : "Create Test Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestCaseForm;
