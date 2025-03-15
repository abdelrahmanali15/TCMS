import React, { useEffect, useState } from "react";
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
import { Feature } from "../types";
import { createFeature, updateFeature, getAllProfiles } from "../api";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, User } from "lucide-react";
import { supabase } from "../../../../supabase/supabase";

interface FeatureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feature: Feature) => void;
  feature?: Feature;
  isEditing?: boolean;
}

// Replace MOCK_USERS with an empty array - we'll load real data
const MOCK_USERS: User[] = [];

interface User {
  id: string;
  email: string;
  full_name: string;
  role?: string;
}

// Available owner roles
const OWNER_ROLES = [
  "QA Analog",
  "QA Software",
  "SW",
  "R&D",
  "PM",
  "Intern",
  "Other"
];

const FeatureForm = ({
  isOpen,
  onClose,
  onSubmit,
  feature,
  isEditing = false,
}: FeatureFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Feature>>({
    name: "",
    description: "",
    owner: "",
    owner_email: "",
    owner_role: "",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]); // Use state loaded from database
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Load owners from profiles table
  useEffect(() => {
    const fetchOwners = async () => {
      setIsLoading(true);
      try {
        // Load owners from the profiles table
        const profiles = await getAllProfiles();
        if (profiles && profiles.length > 0) {
          setUsers(
            profiles.map(profile => ({
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
            }))
          );
        } else {
          // Fallback to mock data if no real profiles exist
          setUsers([
            { id: 'user-1', email: 'john.doe@example.com', full_name: 'John Doe', role: 'QA Analog' },
            { id: 'user-2', email: 'jane.smith@example.com', full_name: 'Jane Smith', role: 'R&D' }
          ]);
        }
      } catch (error) {
        console.error("Error loading owners:", error);
        // Fall back to mock data on error
        setUsers([
          { id: 'user-1', email: 'john.doe@example.com', full_name: 'John Doe', role: 'QA Analog' },
          { id: 'user-2', email: 'jane.smith@example.com', full_name: 'Jane Smith', role: 'R&D' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchOwners();
    }
  }, [isOpen]);

  // Reset form data when feature changes
  useEffect(() => {
    if (feature && isOpen) {
      setFormData({
        name: feature.name || "",
        description: feature.description || "",
        owner: feature.owner || "",
        owner_email: feature.owner_email || "",
        owner_role: feature.owner_role || "",
      });

      // Try to find the user ID for the owner email
      if (feature.owner_email) {
        const matchingUser = users.find(user => user.email === feature.owner_email);
        setSelectedUserId(matchingUser?.id || null);
      } else {
        setSelectedUserId(null);
      }
    } else if (!isEditing && isOpen) {
      // Reset form for new feature
      setFormData({
        name: "",
        description: "",
        owner: "",
        owner_email: "",
        owner_role: "",
      });
      setSelectedUserId(null);
    }
  }, [feature, isEditing, isOpen, users]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);

    if (userId === "none") {
      // Clear the owner fields when "None" is selected
      setFormData(prev => ({
        ...prev,
        owner: "",
        owner_email: "",
        owner_role: ""
      }));
      return;
    }

    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        owner: selectedUser.full_name,
        owner_email: selectedUser.email,
        owner_role: selectedUser.role || ""
      }));
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, owner_role: role }));
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!formData.name?.trim()) {
        toast({
          title: "Error",
          description: "Feature name is required",
          variant: "destructive",
        });
        return;
      }

      let result;
      if (isEditing && feature?.id) {
        result = await updateFeature(feature.id, formData);
      } else {
        result = await createFeature(formData);
      }

      onSubmit(result);
      onClose();

      toast({
        title: isEditing ? "Feature Updated" : "Feature Created",
        description: isEditing
          ? "Feature has been successfully updated"
          : "Feature has been successfully created",
      });
    } catch (error) {
      console.error("Error saving feature:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} feature`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Feature" : "Create New Feature"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update feature details"
                : "Add a new feature to your project"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Feature name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Enter feature description"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user">Owner (Select User)</Label>
              <Select
                value={selectedUserId || ""}
                onValueChange={handleUserChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} {user.role ? `(${user.role})` : ''} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Selecting a user will auto-fill owner name and email
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="owner">Owner Name</Label>
              <Input
                id="owner"
                name="owner"
                value={formData.owner || ""}
                onChange={handleChange}
                placeholder="Feature owner name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="owner_email">Owner Email</Label>
              <Input
                id="owner_email"
                name="owner_email"
                type="email"
                value={formData.owner_email || ""}
                onChange={handleChange}
                placeholder="owner@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="owner_role">Owner Role</Label>
              <Select
                value={formData.owner_role || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    owner_role: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger id="owner_role">
                  <SelectValue placeholder="Select a role (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {OWNER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {isEditing && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? "Update Feature" : "Create Feature"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the feature and may affect any test cases
              that are associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Handle deletion
                if (feature?.id) {
                  onSubmit({ ...feature, deleted: true } as any);
                  onClose();
                }
                setIsDeleteDialogOpen(false);
              }}
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

export default FeatureForm;
