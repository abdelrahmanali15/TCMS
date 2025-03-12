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
import { Bug, BugSeverity, BugStatus, TestCase } from "../types";
import { createBug, updateBug, getReleases } from "../api";
import { supabase } from "../../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Link2, Upload, AlertCircle } from "lucide-react";

interface BugFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bug: Partial<Bug>) => void;
  bug?: Bug;
  isEditing?: boolean;
  testExecutionId?: string;
  testCase?: {
    id: string;
    title: string;
    description: string;
    steps?: Array<{
      step_number: number;
      description: string;
      expected_result: string;
    }>;
    feature?: string;
    priority?: string;
  };
  failedStep?: {
    step_number: number;
    description: string;
    expected_result: string;
    actual_result?: string;
  };
  release?: string;
}

const BugForm = ({
  isOpen,
  onClose,
  onSubmit,
  bug,
  isEditing = false,
  testExecutionId,
  testCase,
  failedStep,
  release = "v1.0.0 - July Release", // Default release
}: BugFormProps) => {
  const { toast } = useToast();

  // Pre-fill the form with test case details if available
  const initialTitle = testCase ? `Bug: ${testCase.title}` : "";
  const initialDescription =
    testCase && failedStep
      ? `**Failed Step:** ${failedStep.step_number}. ${failedStep.description}\n\n` +
        `**Expected Result:** ${failedStep.expected_result}\n\n` +
        `**Actual Result:** ${failedStep.actual_result || ""}\n\n` +
        `**Test Case Description:** ${testCase.description}`
      : "";

  const [form, setForm] = useState<Partial<Bug>>(
    bug || {
      title: initialTitle,
      description: initialDescription,
      severity:
        testCase?.priority === "critical"
          ? "critical"
          : testCase?.priority === "high"
            ? "high"
            : "medium",
      status: "open",
      test_execution_id: testExecutionId,
      release_id: release,
      actual_result: failedStep?.actual_result || "",
    },
  );

  const [externalLink, setExternalLink] = useState("");

  // Mock users for the assignee dropdown
  const users = [
    { id: "user1", name: "Alice Smith" },
    { id: "user2", name: "Bob Johnson" },
    { id: "user3", name: "Carol Williams" },
    { id: "user4", name: "David Miller" },
    { id: "user5", name: "Eve Johnson" },
  ];

  // State to store releases from the database
  const [releases, setReleases] = useState<Array<{ id: string; name: string }>>(
    [],
  );

  // Load releases from the database
  useEffect(() => {
    const loadReleases = async () => {
      try {
        const { data, error } = await supabase
          .from("releases")
          .select("id, name")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReleases(data || []);
      } catch (error) {
        console.error("Error loading releases:", error);
        toast({
          title: "Error",
          description: "Failed to load releases",
          variant: "destructive",
        });
      }
    };

    loadReleases();
  }, []);

  const handleChange = (field: keyof Bug, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate form
    if (!form.title?.trim()) {
      toast({
        title: "Error",
        description: "Bug title is required",
        variant: "destructive",
      });
      return;
    }

    if (!form.description?.trim()) {
      toast({
        title: "Error",
        description: "Bug description is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Make sure we have a valid release ID
      let releaseId = form.release_id;
      if (!releaseId) {
        // Use the first release from the mock data
        releaseId = releases[0].id;
      }

      // Create the bug with the release ID and ensure all required fields have values
      const bugToSubmit = {
        ...form,
        title: form.title || "Untitled Bug",
        description: form.description || "No description provided",
        severity: form.severity || "medium",
        status: form.status || "open",
        release_id: releaseId,
        actual_result: form.actual_result || "",
      };

      // Save to database
      if (isEditing && bug?.id) {
        await updateBug(bug.id, bugToSubmit);
      } else {
        await createBug(bugToSubmit);
      }

      onSubmit(bugToSubmit);
      onClose();

      toast({
        title: isEditing ? "Bug Updated" : "Bug Reported",
        description: isEditing
          ? "Bug has been successfully updated"
          : "Bug has been successfully reported",
      });
    } catch (error) {
      console.error("Error saving bug:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "report"} bug`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Bug" : "Report New Bug"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the bug details."
              : "Report a new bug with detailed information."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto pr-2 max-h-[calc(90vh-180px)]">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter bug title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter detailed bug description"
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="actual_result">Actual Result</Label>
            <Textarea
              id="actual_result"
              value={form.actual_result as string}
              onChange={(e) => handleChange("actual_result", e.target.value)}
              placeholder="Enter the actual result observed"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="release">Release</Label>
            <Select
              value={form.release_id as string}
              onValueChange={(value) => handleChange("release_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select release" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={form.severity}
                onValueChange={(value) =>
                  handleChange("severity", value as BugSeverity)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  handleChange("status", value as BugStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="reopened">Reopened</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assignee">Assign To</Label>
            <Select
              value={form.assigned_to}
              onValueChange={(value) => handleChange("assigned_to", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="evidence">Evidence (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="evidence"
                  type="text"
                  placeholder="Enter Google Drive link to screenshots, logs, waveforms, etc."
                />
                <Button variant="outline" type="button">
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Add links to screenshots, logs, or waveforms that demonstrate
                the issue
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="externalLink">
                External Issue Link (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="externalLink"
                  type="text"
                  placeholder="GitHub or JIRA issue URL"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    if (externalLink) {
                      window.open(externalLink, "_blank");
                    }
                  }}
                  disabled={!externalLink}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Link to related GitHub or JIRA issue
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Update Bug" : "Report Bug"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BugForm;
