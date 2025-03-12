import React, { useReducer, useEffect, useMemo, useCallback, useState } from "react";
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
import { createTestCase, updateTestCase, getTags, deleteTestCase } from "../api";
import { supabase } from "../../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FixedSizeList } from 'react-window';
import { useDebouncedCallback } from "use-debounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useNavigate } from "react-router-dom";
import { Expand } from "lucide-react";

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
  newTag: "", // Explicitly initialize newTag
};

// Form reducer to handle all state changes
const formReducer = (state, action: FormAction) => {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'UPDATE_FIELD':
      // Check if the field belongs to formData or is a root-level property
      if (action.field === 'newTag') {
        return {
          ...state,
          newTag: action.value
        };
      } else {
        return {
          ...state,
          formData: { ...state.formData, [action.field]: action.value }
        };
      }
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
      // First log the raw tags data to debug
      console.log("Raw tags in payload:", action.payload.tags);

      // Better handling of tag data that could be in different formats
      const tagsFromPayload = action.payload.tags || [];

      let convertedTags = [];

      // Handle different possible formats of tags
      if (Array.isArray(tagsFromPayload)) {
        convertedTags = tagsFromPayload.map(tag => {
          if (typeof tag === 'string') return tag;
          if (tag && typeof tag === 'object') {
            if (tag.name) return tag.name;
          }
          return '';
        }).filter(Boolean);
      }

      console.log("Converted tags:", convertedTags);

      return {
        formData: { ...initialFormState.formData, ...action.payload },
        steps: action.payload.steps?.length > 0
          ? [...action.payload.steps]
          : [...initialFormState.steps],
        tags: convertedTags,
        newTag: "" // Always reset newTag to empty string
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
  viewOnly?: boolean; // New prop for view-only mode
}

const TestCaseForm = ({
  isOpen,
  onClose,
  onSubmit,
  testCase,
  isEditing = false,
  viewOnly = false, // Default to false
}: TestCaseFormProps) => {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(formReducer, {
    ...initialFormState,
    formData: testCase || initialFormState.formData,
    steps: testCase?.steps || initialFormState.steps,
    tags: testCase?.tags?.map(tag => tag.name) || initialFormState.tags
  });

  const navigate = useNavigate();

  // Add state to track editing mode
  const [isViewMode, setIsViewMode] = useState(viewOnly);

  // Reset view mode when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsViewMode(viewOnly);
    }
  }, [isOpen, viewOnly]);

  // Add states for tag autocomplete
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);

  // Add state for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Memoized features state
  const [features, setFeatures] = React.useState<Array<{ id: string; name: string }>>([]);

  // Fetch steps for a test case - MOVE THIS FUNCTION UP before it's used in useEffect
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

  // Reset the form when testCase prop changes
  useEffect(() => {
    if (isOpen && testCase) {
      console.log("Setting test case in form:", testCase);

      // Better debug logging for tags
      if (testCase.tags) {
        console.log("Raw tags in test case:", JSON.stringify(testCase.tags));

        // Log the structure of the first tag if exists
        if (Array.isArray(testCase.tags) && testCase.tags.length > 0) {
          console.log("First tag structure:", JSON.stringify(testCase.tags[0]));
        }
      } else {
        console.warn("No tags in test case");
      }

      // Create a clean copy to avoid any reference issues
      const testCaseCopy = JSON.parse(JSON.stringify(testCase));

      dispatch({
        type: 'RESET_FORM',
        payload: testCaseCopy || initialFormState.formData
      });

      // Only fetch steps if needed and we have a test case ID
      if (testCase?.id && (!testCase.steps || testCase.steps.length === 0)) {
        fetchTestSteps(testCase.id);
      }
    }
  }, [testCase?.id, isOpen, fetchTestSteps]);

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

  // Load tags from the database
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagsData = await getTags();
        // Extract unique tag names
        setAvailableTags(tagsData.map(tag => tag.name).filter((v, i, a) => a.indexOf(v) === i));
      } catch (error) {
        console.error("Error loading tags:", error);
      }
    };

    loadTags();
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

  // Add a function to handle test case deletion
  const handleDeleteTestCase = async () => {
    if (!testCase?.id) return;

    try {
      await deleteTestCase(testCase.id);

      toast({
        title: "Test Case Deleted",
        description: "Test case has been successfully deleted",
      });

      onClose();
      // Inform the parent component about deletion
      onSubmit({ id: testCase.id, deleted: true } as any);
    } catch (error) {
      console.error("Error deleting test case:", error);
      toast({
        title: "Error",
        description: "Failed to delete test case",
        variant: "destructive",
      });
    }
  };

  // Add a function to handle expanding to full view
  const handleExpandView = () => {
    if (testCase?.id) {
      onClose();
      navigate(`/test-cases/${testCase.id}`);
    }
  };

  // Memoized StepItem component
  const StepItem = React.memo(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const step = state.steps[index];
    // Track input values locally to maintain cursor position
    const [descValue, setDescValue] = useState(step.description);
    const [expValue, setExpValue] = useState(step.expected_result);

    // Update local state when step changes
    useEffect(() => {
      setDescValue(step.description);
      setExpValue(step.expected_result);
    }, [step]);

    // Only update parent state when focus is lost
    const handleBlur = (field: string, value: string) => {
      handleStepChange(index, field, value);
    };

    return (
      <div style={style}>
        <div className="border border-gray-200 rounded-md p-3 space-y-3 m-1">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">
              Step {step.step_number}
            </h4>
            {!isViewMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => dispatch({ type: 'REMOVE_STEP', index })}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`step-${index}-desc`} className="text-xs">
              Description
            </Label>
            <Textarea
              id={`step-${index}-desc`}
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={(e) => handleBlur("description", e.target.value)}
              placeholder="What to do in this step"
              rows={2}
              className="resize-none"
              readOnly={isViewMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`step-${index}-expected`} className="text-xs">
              Expected Result
            </Label>
            <Textarea
              id={`step-${index}-expected`}
              value={expValue}
              onChange={(e) => setExpValue(e.target.value)}
              onBlur={(e) => handleBlur("expected_result", e.target.value)}
              placeholder="What should happen when this step is executed"
              rows={2}
              className="resize-none"
              readOnly={isViewMode}
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
          {!isViewMode && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'REMOVE_TAG', tag })}
              className="ml-1 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </Badge>
      ))}
      {state.tags.length === 0 && (
        <span className="text-sm text-gray-500">No tags added</span>
      )}
    </div>
  ));

  // Filter tags for autocomplete based on input
  const filteredTags = state.newTag
    ? availableTags.filter(tag =>
        tag.toLowerCase().includes(state.newTag.toLowerCase()) &&
        !state.tags.includes(tag))
    : availableTags.filter(tag => !state.tags.includes(tag));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader className="relative pb-2">
            <div className="flex justify-between items-center pr-6">
              <DialogTitle>
                {isEditing && !isViewMode ? "Edit Test Case" : isViewMode ? "View Test Case" : "Create New Test Case"}
              </DialogTitle>
              <div className="flex space-x-2">
                {/* Show Expand button if viewing an existing test case */}
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExpandView}
                    type="button"
                  >
                    <Expand className="h-4 w-4 mr-2" />
                    Expand View
                  </Button>
                )}
                {/* Show Edit button in view mode */}
                {isViewMode && isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsViewMode(false)}
                    type="button"
                  >
                    Edit
                  </Button>
                )}
                {/* Show Delete button only in edit mode */}
                {isEditing && !isViewMode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    tabIndex={0}
                    onClick={() => setIsDeleteDialogOpen(true)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription>
              {isEditing && !isViewMode
                ? "Update the test case details."
                : isViewMode
                ? "View test case details."
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
                  disabled={isViewMode}
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
                  disabled={isViewMode}
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
                readOnly={isViewMode}
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
                readOnly={isViewMode}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Test Steps</Label>
                {!isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: 'ADD_STEP' })}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Step
                  </Button>
                )}
              </div>

              <div className="border border-gray-100 rounded-lg">
                {state.steps.length > 0 ? (
                  <FixedSizeList
                    height={300}
                    itemCount={state.steps.length}
                    itemSize={280} // Increase from 220 to 280 to prevent overlapping
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
                readOnly={isViewMode}
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
                  disabled={isViewMode}
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
                  disabled={isViewMode}
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
                disabled={isViewMode}
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
                readOnly={isViewMode}
              />
              <p className="text-xs text-gray-500">
                Add links to relevant files such as datasheets, logs, or waveforms
              </p>
            </div>

            {/* Replace the tags input section with autocomplete */}
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <TagList />
              {!isViewMode && (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="newTag"
                      value={state.newTag || ''}
                      onChange={(e) => dispatch({ type: 'UPDATE_FIELD', field: 'newTag', value: e.target.value })}
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (state.newTag?.trim() && !state.tags.includes(state.newTag.trim())) {
                            dispatch({ type: 'ADD_TAG', tag: state.newTag.trim() });
                            dispatch({ type: 'UPDATE_FIELD', field: 'newTag', value: '' });
                          }
                        }
                      }}
                    />
                    {state.newTag && filteredTags.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredTags.map((tag) => (
                          <div
                            key={tag}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              dispatch({ type: 'ADD_TAG', tag });
                              dispatch({ type: 'UPDATE_FIELD', field: 'newTag', value: '' });
                            }}
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (state.newTag?.trim() && !state.tags.includes(state.newTag.trim())) {
                        dispatch({ type: 'ADD_TAG', tag: state.newTag.trim() });
                        dispatch({ type: 'UPDATE_FIELD', field: 'newTag', value: '' });
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <Button onClick={handleSubmit}>
                {isEditing ? "Update Test Case" : "Create Test Case"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
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
              onClick={handleDeleteTestCase}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TestCaseForm;
