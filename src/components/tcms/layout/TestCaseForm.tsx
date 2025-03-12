import React, { useReducer, useEffect, useMemo, useCallback } from "react";
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
import { FixedSizeList } from 'react-window';
import { useDebouncedCallback } from "use-debounce";

// Define action types for the reducer
type FormAction =
  | { type: 'SET_FORM_DATA'; payload: Partial<TestCase> }
  | { type: 'UPDATE_FIELD'; field: string; value: any }
  | { type: 'SET_STEPS'; payload: any[] }
  | { type: 'ADD_STEP' }
  | { type: 'REMOVE_STEP'; index: number }
  | { type: 'UPDATE_STEP'; index: number; field: string; value: string }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'ADD_TAG'; tag: string }
  | { type: 'REMOVE_TAG'; tag: string }
  | { type: 'RESET_FORM'; payload: Partial<TestCase> };

// Initial form state
const initialFormState = {
  formData: {
    title: "",
    description: "",
    preconditions: "",
    test_type: "manual" as TestType,
    priority: "medium" as TestCasePriority,
    status: "draft" as TestCaseStatus,
    feature_id: "",
    category: "functional",
    attachments: "",
  },
  steps: [{ step_number: 1, description: "", expected_result: "" }],
  tags: [] as string[],
  newTag: "",
};

// Form reducer to handle all state changes
const formReducer = (state, action: FormAction) => {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value }
      };
    case 'SET_STEPS':
      return { ...state, steps: action.payload };
    case 'ADD_STEP':
      return {
        ...state,
        steps: [
          ...state.steps,
          {
            step_number: state.steps.length + 1,
            description: "",
            expected_result: "",
          }
        ]
      };
    case 'REMOVE_STEP': {
      const newSteps = [...state.steps];
      newSteps.splice(action.index, 1);
      // Renumber steps
      return {
        ...state,
        steps: newSteps.map((step, i) => ({ ...step, step_number: i + 1 }))
      };
    }
    case 'UPDATE_STEP': {
      const newSteps = [...state.steps];
      newSteps[action.index] = {
        ...newSteps[action.index],
        [action.field]: action.value
      };
      return { ...state, steps: newSteps };
    }
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    case 'ADD_TAG':
      return {
        ...state,
        tags: [...state.tags, action.tag]
      };
    case 'REMOVE_TAG':
      return {
        ...state,
        tags: state.tags.filter(tag => tag !== action.tag)
      };
    case 'RESET_FORM':
      return {
        formData: { ...initialFormState.formData, ...action.payload },
        steps: action.payload.steps?.length > 0
          ? [...action.payload.steps]
          : [...initialFormState.steps],
        tags: action.payload.tags?.length > 0
          ? [...action.payload.tags.map(tag => tag.name)]
          : [],
        newTag: ""
      };
    default:
      return state;
  }
};

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
  const [state, dispatch] = useReducer(formReducer, {
    ...initialFormState,
    formData: testCase || initialFormState.formData,
    steps: testCase?.steps || initialFormState.steps,
    tags: testCase?.tags?.map(tag => tag.name) || initialFormState.tags
  });

  // Memoized features state
  const [features, setFeatures] = React.useState<Array<{ id: string; name: string }>>([]);

  // Reset the form when testCase prop changes
  useEffect(() => {
    if (isOpen) {
      dispatch({
        type: 'RESET_FORM',
        payload: testCase || initialFormState.formData
      });

      // Only fetch steps if needed and we have a test case ID
      if (testCase?.id && (!testCase.steps || testCase.steps.length === 0)) {
        fetchTestSteps(testCase.id);
      }
    }
  }, [testCase?.id, isOpen]);

  // Memoize expensive operations
  const featuresCache = useMemo(() => {
    return features.reduce((acc, feature) => {
      acc[feature.id] = feature;
      return acc;
    }, {} as Record<string, any>);
  }, [features]);

  // Load features from the database once
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

  // Fetch steps for a test case
  const fetchTestSteps = useCallback(async (testCaseId: string) => {
    try {
      const { data, error } = await supabase
        .from("test_steps")
        .select("*")
        .eq("test_case_id", testCaseId)
        .order("step_number");

      if (error) throw error;

      if (data && data.length > 0) {
        dispatch({ type: 'SET_STEPS', payload: data });
      }
    } catch (error) {
      console.error("Error fetching test steps:", error);
      toast({
        title: "Error",
        description: "Failed to load test steps",
        variant: "destructive",
      });
    }
  }, []);

  // Debounced handlers for input changes
  const handleFieldChange = useDebouncedCallback(
    (field: string, value: any) => {
      dispatch({ type: 'UPDATE_FIELD', field, value });
    },
    300 // 300ms delay
  );

  const handleStepChange = useDebouncedCallback(
    (index: number, field: string, value: string) => {
      dispatch({ type: 'UPDATE_STEP', index, field, value });
    },
    300 // 300ms delay
  );

  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!state.formData.title?.trim()) {
      toast({
        title: "Error",
        description: "Test case title is required",
        variant: "destructive",
      });
      return;
    }

    if (!state.formData.feature_id) {
      toast({
        title: "Error",
        description: "Feature is required",
        variant: "destructive",
      });
      return;
    }

    // Validate steps
    if (state.steps.length === 0) {
      toast({
        title: "Error",
        description: "At least one test step is required",
        variant: "destructive",
      });
      return;
    }

    for (const step of state.steps) {
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
      // Make a clean copy of form data without invalid fields
      const cleanFormData = { ...state.formData };

      // Remove properties that aren't columns in the database table
      if ('feature' in cleanFormData) {
        delete cleanFormData.feature;
      }

      // Create tags array with correct format
      const tagObjects = state.tags.map(tag => ({ name: tag }));

      // Combine cleaned form data with steps and tags
      const payload = {
        ...cleanFormData,
        steps: state.steps,
        tags: tagObjects
      };

      if (isEditing && testCase?.id) {
        const result = await updateTestCase(testCase.id, payload);
        if (result && result.statusCode === 409) {
          toast({
            title: "Conflict Detected",
            description:
              "The test case has been updated elsewhere. Please refresh and try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        await createTestCase(payload);
      }

      onSubmit(payload);
      onClose();

      toast({
        title: isEditing ? "Test Case Updated" : "Test Case Created",
        description: isEditing
          ? "Test case has been successfully updated"
          : "Test case has been successfully created",
      });
    } catch (error: any) {
      console.error("Error saving test case:", error);
      if (error.status === 409 || error.message?.includes("409")) {
        toast({
          title: "Conflict Error",
          description:
            "Update failed due to a conflict. Ensure you have the latest data and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to ${isEditing ? "update" : "create"} test case`,
          variant: "destructive",
        });
      }
    }
  }, [state, testCase?.id, isEditing, onSubmit, onClose]);

  // Memoized StepItem component
  const StepItem = React.memo(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const step = state.steps[index];

    return (
      <div style={style}>
        <div className="border border-gray-200 rounded-md p-3 space-y-3 m-1">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">
              Step {step.step_number}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: 'REMOVE_STEP', index })}
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
              defaultValue={step.description}
              onChange={(e) => handleStepChange(index, "description", e.target.value)}
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
              defaultValue={step.expected_result}
              onChange={(e) => handleStepChange(index, "expected_result", e.target.value)}
              placeholder="What should happen when this step is executed"
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      </div>
    );
  });

  // Memoized TagList component
  const TagList = React.memo(() => (
    <div className="flex flex-wrap gap-2 mb-2">
      {state.tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="px-2 py-1 gap-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => dispatch({ type: 'REMOVE_TAG', tag })}
            className="ml-1 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </Badge>
      ))}
      {state.tags.length === 0 && (
        <span className="text-sm text-gray-500">No tags added</span>
      )}
    </div>
  ));

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
                value={state.formData.feature_id}
                onValueChange={(value) => dispatch({ type: 'UPDATE_FIELD', field: 'feature_id', value })}
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
                value={state.formData.status}
                onValueChange={(value) =>
                  dispatch({
                    type: 'UPDATE_FIELD',
                    field: 'status',
                    value: value as TestCaseStatus
                  })
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
              defaultValue={state.formData.title || ""}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Enter test case title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              defaultValue={state.formData.description || ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
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
                onClick={() => dispatch({ type: 'ADD_STEP' })}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Step
              </Button>
            </div>

            <div className="border border-gray-100 rounded-lg">
              {state.steps.length > 0 ? (
                <FixedSizeList
                  height={300}
                  itemCount={state.steps.length}
                  itemSize={220}
                  width="100%"
                >
                  {StepItem}
                </FixedSizeList>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No steps added yet. Click "Add Step" to add test steps.
                </div>
              )}
            </div>
          </div>

          {/* Rest of form fields */}
          <div className="grid gap-2">
            <Label htmlFor="preconditions">Preconditions</Label>
            <Textarea
              id="preconditions"
              defaultValue={state.formData.preconditions || ""}
              onChange={(e) => handleFieldChange("preconditions", e.target.value)}
              placeholder="Enter test case preconditions"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Test Type</Label>
              <Select
                value={state.formData.test_type}
                onValueChange={(value) =>
                  dispatch({
                    type: 'UPDATE_FIELD',
                    field: 'test_type',
                    value: value as TestType
                  })
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
                value={state.formData.priority}
                onValueChange={(value) =>
                  dispatch({
                    type: 'UPDATE_FIELD',
                    field: 'priority',
                    value: value as TestCasePriority
                  })
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
              value={state.formData.category as string}
              onValueChange={(value) => dispatch({ type: 'UPDATE_FIELD', field: 'category', value })}
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
              defaultValue={state.formData.attachments || ""}
              onChange={(e) => handleFieldChange("attachments", e.target.value)}
              placeholder="Enter Google Drive links to datasheets, logs, waveforms, etc. (one per line)"
              rows={2}
            />
            <p className="text-xs text-gray-500">
              Add links to relevant files such as datasheets, logs, or waveforms
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <TagList />
            <div className="flex gap-2">
              <Input
                id="newTag"
                value={state.newTag}
                onChange={(e) => dispatch({ type: 'UPDATE_FIELD', field: 'newTag', value: e.target.value })}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (state.newTag.trim() && !state.tags.includes(state.newTag.trim())) {
                      dispatch({ type: 'ADD_TAG', tag: state.newTag.trim() });
                      dispatch({ type: 'UPDATE_FIELD', field: 'newTag', value: '' });
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (state.newTag.trim() && !state.tags.includes(state.newTag.trim())) {
                    dispatch({ type: 'ADD_TAG', tag: state.newTag.trim() });
                    dispatch({ type: 'UPDATE_FIELD', field: 'newTag', value: '' });
                  }
                }}
              >
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
